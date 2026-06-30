import { NextRequest, NextResponse } from "next/server";
import { runAgent, ChatMessage, AgentOptions } from "@/lib/agent/agent-runner";
import { validateMessages } from "@/lib/security/input-validator";
import { rateLimiter, getUserId } from "@/lib/security/rate-limiter";

const API_KEY = process.env.OPENAI_API_KEY;
const IS_CONFIGURED = API_KEY && !API_KEY.includes("your-key");

// 速率限制配置（可通过环境变量调整）
const RATE_LIMIT_CONFIG = {
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "30"),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"), // 默认 1 分钟
  maxTokens: parseInt(process.env.RATE_LIMIT_MAX_TOKENS || "50000"),
};

export async function POST(req: NextRequest) {
  try {
    if (!IS_CONFIGURED) {
      return NextResponse.json(
        { error: "AI 服务尚未配置。请在 .env.local 文件中设置有效的 OPENAI_API_KEY，然后重启服务器。" },
        { status: 503 }
      );
    }

    // 1. 获取用户 ID
    const userId = getUserId(req);

    // 2. 速率限制检查
    const rateLimit = rateLimiter.check(userId, RATE_LIMIT_CONFIG);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "请求过于频繁，请稍后再试",
          remaining: 0,
          resetIn: rateLimit.resetIn,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(RATE_LIMIT_CONFIG.maxRequests),
            "X-RateLimit-Remaining": "0",
            "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)),
          },
        }
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

    // 3. 输入安全校验
    const validation = validateMessages(
      messages.map((m) => ({ role: m.role, content: m.content || "" }))
    );

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "输入内容包含不安全的内容",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // 4. 记录请求
    rateLimiter.record(userId);

    const opts: AgentOptions = { universityId, universityName, profile };
    const result = await runAgent(messages, opts);

    // 计算实际使用的 token 数（估算）
    const estimatedTokens = (result.reply?.length || 0) / 4;
    rateLimiter.record(userId, estimatedTokens);

    return NextResponse.json(
      {
        reply: result.reply,
        toolResults: result.toolResults,
        sessionId: result.sessionId,
        reasoning: result.reasoning,
      },
      {
        headers: {
          "X-RateLimit-Limit": String(RATE_LIMIT_CONFIG.maxRequests),
          "X-RateLimit-Remaining": String(rateLimiter.getRemaining(userId, RATE_LIMIT_CONFIG)),
        },
      }
    );
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