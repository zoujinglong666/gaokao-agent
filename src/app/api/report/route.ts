import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agent/agent-runner";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile } = body;

    if (!profile) {
      return NextResponse.json(
        { error: "请提供学生信息" },
        { status: 400 }
      );
    }

    const prompt = `请根据以下学生信息生成一份完整的志愿推荐报告：
- 省份：${profile.province}
- 分数：${profile.score}
- 选科：${profile.subjects?.join(", ") || "未提供"}
- 兴趣方向：${profile.interests || "未提供"}
- 城市偏好：${profile.cityPreference || "无特殊偏好"}

请分冲刺、稳妥、保底三档推荐院校，每档推荐3-5所。对每所院校提供详细信息。`;

    const result = await runAgent([
      { role: "user", content: prompt },
    ]);

    return NextResponse.json({
      report: result.reply,
      toolResults: result.toolResults,
    });
  } catch (error) {
    console.error("[Report API Error]", error);
    return NextResponse.json(
      { error: "报告生成失败，请稍后重试" },
      { status: 500 }
    );
  }
}
