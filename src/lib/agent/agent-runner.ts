import OpenAI from "openai";
import { AGENT_TOOLS } from "./tools";
import { SYSTEM_PROMPT } from "./system-prompt";
import { executeTool } from "./tool-executor";
import type { ReasoningStep } from "../store";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

const MODEL = process.env.OPENAI_MODEL || "deepseek-v4-pro";
const IS_DEEPSEEK = MODEL.includes("deepseek");
const IS_THINKING_MODEL = MODEL.includes("v4-pro") || MODEL.includes("reasoner");

function buildChatParams(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[], opts?: { stream?: boolean }) {
  const params: any = {
    model: MODEL,
    messages,
    tools: AGENT_TOOLS,
    max_tokens: 4096,
    temperature: 0.7,
  };
  if (IS_DEEPSEEK && IS_THINKING_MODEL) {
    params.thinking = { type: "enabled" };
    params.reasoning_effort = "high";
  }
  if (opts?.stream) {
    params.stream = true;
  }
  return params;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface AgentOptions {
  universityId?: string;
  universityName?: string;
  profile?: Record<string, unknown>;
}

const MAX_ITERATIONS = 10;
const MAX_CONTEXT_MESSAGES = 16;

function getCurrentDateStr() {
  const now = new Date();
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
}

// ====== Context Engineering: 对话历史压缩 ======
function compressHistory(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= MAX_CONTEXT_MESSAGES) return messages;

  const systemMsgs = messages.filter((m) => m.role === "system");
  const nonSystem = messages.filter((m) => m.role !== "system");
  const keep = 8;
  const toCompress = nonSystem.slice(0, nonSystem.length - keep);
  const recent = nonSystem.slice(-keep);

  const summaryParts: string[] = [];
  for (const m of toCompress) {
    if (m.role === "user" && m.content) {
      summaryParts.push(`用户: ${m.content.slice(0, 50)}`);
    } else if (m.role === "assistant" && m.content) {
      summaryParts.push(`助手: ${m.content.slice(0, 50)}`);
    }
  }

  const summary = summaryParts.length > 0
    ? `[历史摘要]\n${summaryParts.join("\n")}`
    : "";

  if (summary) {
    return [
      ...systemMsgs,
      { role: "system", content: summary },
      ...recent,
    ];
  }
  return [...systemMsgs, ...recent];
}

// ====== Context Engineering: 构建上下文感知 prompt ======
function buildContextPrompt(opts?: {
  universityId?: string;
  universityName?: string;
  profile?: Record<string, unknown>;
}): string {
  const dateStr = getCurrentDateStr();
  let prompt = `【重要】当前真实时间是：${dateStr}。请严格以此时间为准回答所有涉及时间、年份、日期的问题。如果你不知道时间，不要猜测。\n\n${SYSTEM_PROMPT}`;

  // 注入用户画像
  if (opts?.profile) {
    const p = opts.profile;
    const parts: string[] = [];
    if (p.province) parts.push(`省份: ${p.province}`);
    if (p.score) parts.push(`分数: ${p.score}分`);
    if (p.subjects && Array.isArray(p.subjects) && p.subjects.length > 0) parts.push(`选科: ${p.subjects.join(", ")}`);
    if (p.interests) parts.push(`兴趣: ${p.interests}`);
    if (p.personalityType) parts.push(`人格类型: ${p.personalityType}`);
    if (parts.length > 0) {
      prompt += `\n\n【当前用户画像】\n${parts.join("\n")}`;
    }
  }

  // 注入大学上下文
  if (opts?.universityId && opts?.universityName) {
    prompt += `\n\n【当前查看的大学】用户正在浏览「${opts.universityName}」（ID: ${opts.universityId}）的详情页，请优先针对这所大学回答问题。`;
  }

  return prompt;
}

// ====== Observability: 结构化日志 ======
interface ToolLog {
  tool: string;
  args: Record<string, unknown>;
  result?: Record<string, unknown>;
  duration: number;
  success: boolean;
  retried: boolean;
}

function generateSessionId(): string {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ====== Task Planning: 工具调用进度追踪 ======
interface TaskStep {
  step: number;
  tool: string;
  status: "running" | "done" | "error";
  summary: string;
}

function buildTaskProgress(toolLogs: ToolLog[], currentTool?: string): TaskStep[] {
  const steps: TaskStep[] = toolLogs.map((log, i) => ({
    step: i + 1,
    tool: log.tool,
    status: log.success ? "done" : "error",
    summary: `${log.tool} (${log.duration}ms)`,
  }));
  if (currentTool) {
    steps.push({ step: steps.length + 1, tool: currentTool, status: "running", summary: `${currentTool}...` });
  }
  return steps;
}

// ====== 工具名称映射 ======
const TOOL_NAMES: Record<string, string> = {
  get_current_time: "获取当前时间",
  web_search: "联网搜索",
  search_universities: "搜索院校",
  get_university_detail: "查询院校详情",
  get_score_lines: "查询分数线",
  analyze_major_fit: "分析专业匹配度",
  get_career_prospects: "查询就业前景",
  get_province_portal: "查询官方入口",
  compare_universities: "对比院校",
  get_city_living_cost: "查询生活成本",
  estimate_equivalent_score: "估算等效分数",
  generate_risk_assessment: "风险评估",
  get_personality_analysis: "人格分析",
  recommend_volunteer_list: "智能推荐志愿",
  get_major_ranking: "专业排名",
  get_same_score_destinations: "同分去向",
  generate_volunteer_table: "生成志愿表",
  search_major_groups: "查询专业组",
  analyze_major_group: "分析专业组",
  get_province_score_lines: "查询省份分数线",
  check_subject_compatibility: "校验选科",
  score_rank_convert: "换算位次",
};

export async function runAgent(
  messages: ChatMessage[],
  opts?: AgentOptions
): Promise<{ reply: string; toolResults: Record<string, unknown>[]; sessionId: string; reasoning?: ReasoningStep[] }> {
  const sessionId = generateSessionId();
  console.log(`[Agent:${sessionId}] Start`, { universityId: opts?.universityId, msgCount: messages.length });

  const systemPrompt = buildContextPrompt(opts);
  const allMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...compressHistory(messages),
  ];

  const toolResults: Record<string, unknown>[] = [];
  const toolLogs: ToolLog[] = [];
  const reasoningSteps: ReasoningStep[] = [];
  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    let response;
    try {
      response = await openai.chat.completions.create(
        buildChatParams(allMessages as OpenAI.Chat.Completions.ChatCompletionMessageParam[])
      );
    } catch (err: any) {
      console.error(`[Agent:${sessionId}] API error:`, err.message);
      if (err?.status === 429 || err?.message?.includes('rate')) {
        return { reply: "当前咨询人数较多，请稍后再试～", toolResults, sessionId };
      }
      return { reply: "服务暂时不可用，请稍后重试。", toolResults, sessionId };
    }

    const choice = response.choices[0];
    const assistantMessage = choice.message;

    const reasoningContent = (assistantMessage as any).reasoning_content;
    if (reasoningContent) {
      // 添加思考步骤
      reasoningSteps.push({
        type: "thinking",
        content: reasoningContent.slice(0, 200),
        step: reasoningSteps.length + 1,
      });
      console.log(`[Agent:${sessionId}] Reasoning:`, reasoningContent.slice(0, 200));
    }

    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      // 获取回复内容：优先使用 assistantMessage.content，否则从 reasoning 中提取 final 内容
      let reply = assistantMessage.content;
      if (!reply) {
        const finalStep = reasoningSteps.findLast((s) => s.type === "final");
        reply = finalStep?.content || "抱歉，我暂时无法回答这个问题。";
      }
      
      // 添加最终结论
      reasoningSteps.push({
        type: "final",
        content: reply,
        step: reasoningSteps.length + 1,
      });
      console.log(`[Agent:${sessionId}] Done in ${iterations} iterations, tools: ${toolLogs.length}`);
      return {
        reply,
        toolResults,
        sessionId,
        reasoning: reasoningSteps,
      };
    }

    allMessages.push({
      role: "assistant",
      content: assistantMessage.content,
      tool_calls: assistantMessage.tool_calls,
    });

    for (const toolCall of assistantMessage.tool_calls) {
      const fnName = (toolCall as any).function.name;
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse((toolCall as any).function.arguments);
      } catch {
        args = {};
      }

      const t0 = Date.now();
      console.log(`[Agent:${sessionId}] Calling: ${fnName}`, args);

      // 添加工具调用步骤
      reasoningSteps.push({
        type: "tool_call",
        content: `正在调用 ${TOOL_NAMES[fnName] || fnName}...`,
        toolName: fnName,
        toolArgs: args,
        step: reasoningSteps.length + 1,
      });

      // Error Recovery: 工具调用 try/catch + 仅失败时重试
      let result: Record<string, unknown>;
      let success = true;
      let retried = false;
      try {
        result = await executeTool(fnName, args);
      } catch (err: any) {
        success = false;
        retried = true;
        try {
          result = await executeTool(fnName, args);
        } catch (err2: any) {
          result = { error: `工具执行失败: ${err.message || '未知错误'}`, fallback: true };
        }
      }

      const duration = Date.now() - t0;
      toolLogs.push({ tool: fnName, args, result, duration, success, retried });
      console.log(`[Agent:${sessionId}] ${fnName} ${success ? '✓' : '✗'} ${duration}ms`);

      // 添加工具结果步骤
      reasoningSteps.push({
        type: "tool_result",
        content: `${TOOL_NAMES[fnName] || fnName} 完成 (${duration}ms)`,
        toolName: fnName,
        toolResult: result,
        duration,
        step: reasoningSteps.length + 1,
      });

      toolResults.push({ tool: fnName, args, result });
      allMessages.push({
        role: "tool",
        content: JSON.stringify(result),
        tool_call_id: toolCall.id,
        name: fnName,
      });
    }
  }

  return {
    reply: "抱歉，我在处理你的问题时遇到了一些困难。请换个方式问我吧！",
    toolResults,
    sessionId,
    reasoning: reasoningSteps,
  };
}

export async function runAgentStream(
  messages: ChatMessage[],
  onChunk: (chunk: string) => void,
  opts?: AgentOptions
): Promise<{ reply: string; toolResults: Record<string, unknown>[]; sessionId: string; reasoning?: ReasoningStep[] }> {
  const sessionId = generateSessionId();
  console.log(`[Stream:${sessionId}] Start`, { universityId: opts?.universityId, msgCount: messages.length });

  const systemPrompt = buildContextPrompt(opts);
  const allMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...compressHistory(messages),
  ];

  const toolResults: Record<string, unknown>[] = [];
  const reasoningSteps: ReasoningStep[] = [];
  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const streamParams: any = {
      model: MODEL,
      messages: allMessages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      tools: AGENT_TOOLS,
      temperature: 0.7,
      max_tokens: 4096,
      stream: true,
      stream_options: { include_usage: true },
    };
    if (IS_DEEPSEEK && IS_THINKING_MODEL) {
      streamParams.thinking = { type: "enabled" };
      streamParams.reasoning_effort = "high";
    }

    // Error Recovery: stream API 调用降级
    let stream;
    try {
      stream = (await openai.chat.completions.create(streamParams)) as any;
    } catch (err: any) {
      console.error(`[Stream:${sessionId}] API error:`, err.message);
      if (err?.status === 429) {
        onChunk("当前咨询人数较多，请稍后再试～");
        return { reply: "当前咨询人数较多，请稍后再试～", toolResults, sessionId };
      }
      onChunk("服务暂时不可用，请稍后重试。");
      return { reply: "服务暂时不可用", toolResults, sessionId };
    }

    let fullReply = "";
    let toolCallsMap: Record<number, { id: string; name: string; arguments: string }> = {};
    let hasToolCall = false;
    let finishReason: string | null = null;

    for await (const chunk of stream) {
      const choice = chunk.choices?.[0];
      if (!choice) continue;
      finishReason = choice.finish_reason || finishReason;

      const deltaToolCalls = (choice.delta as any)?.tool_calls;
      if (deltaToolCalls && Array.isArray(deltaToolCalls)) {
        hasToolCall = true;
        for (const tc of deltaToolCalls) {
          const idx = tc.index ?? 0;
          if (!toolCallsMap[idx]) {
            toolCallsMap[idx] = { id: tc.id || "", name: tc.function?.name || "", arguments: "" };
          }
          if (tc.id) toolCallsMap[idx].id = tc.id;
          if (tc.function?.name) toolCallsMap[idx].name = tc.function.name;
          if (tc.function?.arguments) toolCallsMap[idx].arguments += tc.function.arguments;
        }
      }

      const delta = choice.delta?.content || "";
      if (delta) {
        fullReply += delta;
        onChunk(delta);
      }
    }

    if (!hasToolCall) {
      // 添加最终结论
      reasoningSteps.push({
        type: "final",
        content: fullReply,
        step: reasoningSteps.length + 1,
      });
      console.log(`[Stream:${sessionId}] Done in ${iterations} iterations`);
      return { reply: fullReply, toolResults, sessionId, reasoning: reasoningSteps };
    }

    const toolCallsList = Object.values(toolCallsMap).map((tc, i) => ({
      id: tc.id || `call_${i}`,
      type: "function" as const,
      function: { name: tc.name, arguments: tc.arguments },
    }));

    allMessages.push({
      role: "assistant",
      content: fullReply || null,
      tool_calls: toolCallsList as any,
    });

    for (const tc of toolCallsList) {
      const fnName = tc.function.name;
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(tc.function.arguments);
      } catch {
        args = {};
      }

      // 添加工具调用步骤
      reasoningSteps.push({
        type: "tool_call",
        content: `正在调用 ${TOOL_NAMES[fnName] || fnName}...`,
        toolName: fnName,
        toolArgs: args,
        step: reasoningSteps.length + 1,
      });

      const t0 = Date.now();
      console.log(`[Stream:${sessionId}] Calling: ${fnName}`);

      let result: Record<string, unknown>;
      try {
        result = await executeTool(fnName, args);
      } catch (err: any) {
        result = { error: `工具执行失败: ${err.message || '未知错误'}`, fallback: true };
      }
      const duration = Date.now() - t0;
      console.log(`[Stream:${sessionId}] ${fnName} ${duration}ms`);

      // 添加工具结果步骤
      reasoningSteps.push({
        type: "tool_result",
        content: `${TOOL_NAMES[fnName] || fnName} 完成 (${duration}ms)`,
        toolName: fnName,
        toolResult: result,
        duration,
        step: reasoningSteps.length + 1,
      });

      toolResults.push({ tool: fnName, args, result });
      allMessages.push({
        role: "tool",
        content: JSON.stringify(result),
        tool_call_id: tc.id,
        name: fnName,
      });
    }
  }

  return { reply: "处理超时，请重试。", toolResults, sessionId, reasoning: reasoningSteps };
}
