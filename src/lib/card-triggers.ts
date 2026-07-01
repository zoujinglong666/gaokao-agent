// 智能卡片触发规则配置
export interface CardTriggerRule {
  id: string;
  // 触发条件：检测AI回复内容中的关键词（精确短语匹配）
  keywords: string[];
  // 卡片类型
  type: "province" | "score" | "subject" | "interest" | "city";
  // 优先级（数字越大越优先）
  priority: number;
}

export interface StudentProfile {
  province: string;
  score: number | null;
  subjects: string[];
  interests: string;
  cityPreference: string;
}

// 卡片触发规则列表 - 使用精确短语匹配，避免误触发
export const CARD_TRIGGERS: CardTriggerRule[] = [
  {
    id: "province-selector",
    keywords: ["你是哪个省份的考生", "请问你来自哪个省", "你来自哪个省份", "你是哪一省的考生"],
    type: "province",
    priority: 90,
  },
  {
    id: "score-input",
    keywords: ["你的高考分数是多少", "你考了多少分", "你的分数是多少", "你的高考分数是"],
    type: "score",
    priority: 85,
  },
  {
    id: "subject-selector",
    keywords: ["你的选科是什么", "你的选科情况", "你的3门选科", "你选了哪几门", "你的选科组合"],
    type: "subject",
    priority: 80,
  },
  {
    id: "interest-selector",
    keywords: ["你的兴趣方向", "你感兴趣的专业方向", "你想学什么专业", "你擅长什么"],
    type: "interest",
    priority: 70,
  },
  {
    id: "city-selector",
    keywords: ["你的城市偏好", "你希望去哪里读书", "你对城市有什么要求", "你希望去哪个城市"],
    type: "city",
    priority: 65,
  },
];

// 检测应该显示哪个卡片
// 只在AI明确询问且用户未提供信息时才触发
export function detectCardToDisplay(
  replyContent: string,
  profile: StudentProfile,
  existingCards?: string[]
): CardTriggerRule | null {
  // 按优先级排序
  const sorted = [...CARD_TRIGGERS].sort((a, b) => b.priority - a.priority);

  for (const rule of sorted) {
    // 跳过已经显示过的卡片（基于卡片类型）
    if (existingCards?.includes(rule.type)) continue;

    // 检查用户是否已经提供了相关信息
    if (rule.type === "province" && profile.province) continue;
    if (rule.type === "score" && profile.score !== null) continue;
    if (rule.type === "subject" && profile.subjects?.length > 0) continue;
    if (rule.type === "interest" && profile.interests) continue;
    if (rule.type === "city" && profile.cityPreference) continue;

    // 检查关键词（精确短语匹配）
    if (rule.keywords.length > 0) {
      const matched = rule.keywords.some((kw) => replyContent.includes(kw));
      if (matched) return rule;
    }
  }

  return null;
}