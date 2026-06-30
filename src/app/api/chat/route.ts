import { NextRequest, NextResponse } from "next/server";
import { runAgent, ChatMessage, AgentOptions } from "@/lib/agent/agent-runner";

const API_KEY = process.env.OPENAI_API_KEY;
const IS_CONFIGURED = API_KEY && !API_KEY.includes("your-key");

export async function POST(req: NextRequest) {
  try {
    if (!IS_CONFIGURED) {
      return NextResponse.json(
        { error: "AI 服务尚未配置。请在 .env.local 文件中设置有效的 OPENAI_API_KEY，然后重启服务器。" },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { messages, universityId, universityName, profile } = body as {
      messages: ChatMessage[];
      universityId?: string;
      universityName?: string;
      profile?: Record<string, unknown>;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "请提供对话消息" },
        { status: 400 }
      );
    }

    const opts: AgentOptions = { universityId, universityName, profile };
    const result = await runAgent(messages, opts);

    return NextResponse.json({
      reply: result.reply,
      toolResults: result.toolResults,
      sessionId: result.sessionId,
      reasoning: result.reasoning,
    });
  } catch (error: any) {
    console.error("[Chat API Error]", error);
    const msg = error?.message || "";
    if (msg.includes("API key") || msg.includes("auth") || msg.includes("401")) {
      return NextResponse.json(
        { error: "API Key 无效或已过期，请检查 .env.local 中的 OPENAI_API_KEY 配置。" },
        { status: 401 }
      );
    }
    if (msg.includes("quota") || msg.includes("billing") || msg.includes("429")) {
      return NextResponse.json(
        { error: "API 调用额度不足，请检查账户余额或稍后再试。" },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "服务暂时不可用，请稍后重试" },
      { status: 500 }
    );
  }
}
