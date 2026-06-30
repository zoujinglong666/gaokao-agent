import universitiesData from "../data/universities.json";
import admissionData from "../data/admission-data.json";
import portalsData from "../data/province-portals.json";
import majorsData from "../data/majors.json";
import cityCostData from "../data/city-cost.json";
import personalitiesData from "../data/personalities.json";
import scoreLinesRealData from "../data/score-lines-real.json";
import subjectConstraintsData from "../data/subject-constraints.json";
import majorGroupsData from "../data/major-groups.json";

const scoreLinesReal = (scoreLinesRealData as any).provinces;
const subjectConstraints = (subjectConstraintsData as any);
const majorGroups = (majorGroupsData as any).majorGroups;

const { universities } = universitiesData as any;
const { admissionData: admissions } = admissionData as any;
const { portals } = portalsData as any;
const { majors } = majorsData as any;
const { cities } = cityCostData as any;
const { personalities, dimensions } = personalitiesData as any;

type ToolArgs = Record<string, unknown>;

// ====== 联网搜索 ======
const SEARCH_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const searchCache = new Map<string, { ts: number; result: Record<string, unknown> }>();

async function webSearch(args: ToolArgs): Promise<Record<string, unknown>> {
  const query = (args.query as string)?.trim();
  if (!query) return { error: "请提供搜索关键词" };

  // 检查搜索缓存
  const cached = searchCache.get(query);
  if (cached && Date.now() - cached.ts < SEARCH_CACHE_TTL) {
    return cached.result;
  }

  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return {
      error: "搜索服务未配置",
      tip: "请在 .env.local 中配置 TAVILY_API_KEY 以启用联网搜索功能（https://tavily.com）",
      query,
    };
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        max_results: 8,
        include_answer: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`搜索 API 错误: ${response.status}`);
    }

    const data = await response.json();
    const results = (data.results || []).map((item: any, i: number) => ({
      position: i + 1,
      title: item.title || "",
      url: item.url || "",
      content: item.content || "",
    }));

    // Tavily 会返回 AI 生成的摘要答案
    const aiAnswer = data.answer || "";

    // 提取文本内容供 agent 使用
    const textContent = results
      .map((r: any) => `【${r.title}】\n${r.content}\n来源: ${r.url}`)
      .join("\n\n");

    const result = {
      query,
      resultCount: results.length,
      results,
      aiAnswer,
      summary: textContent,
    };

    searchCache.set(query, { ts: Date.now(), result });
    return result;
  } catch (err: any) {
    console.error("[web_search] Error:", err.message);
    return {
      error: `搜索失败: ${err.message}`,
      query,
      tip: "请稍后重试，或尝试不同的关键词",
    };
  }
}

// ====== 工具结果 LRU 缓存（5 分钟 TTL） ======
const CACHE_TTL = 5 * 60 * 1000;
const CACHE_MAX = 200;
const toolCache = new Map<string, { ts: number; result: Record<string, unknown> }>();

function getCacheKey(name: string, args: ToolArgs): string {
  const sortedKeys = Object.keys(args).sort();
  const sortedObj: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    sortedObj[key] = args[key];
  }
  return name + "::" + JSON.stringify(sortedObj);
}

export function getCachedToolResult(name: string, args: ToolArgs): Record<string, unknown> | null {
  const k = getCacheKey(name, args);
  const hit = toolCache.get(k);
  if (!hit) return null;
  if (Date.now() - hit.ts > CACHE_TTL) {
    toolCache.delete(k);
    return null;
  }
  return hit.result;
}

function setCachedToolResult(name: string, args: ToolArgs, result: Record<string, unknown>) {
  const k = getCacheKey(name, args);
  if (toolCache.size >= CACHE_MAX) {
    const firstKey = toolCache.keys().next().value;
    if (firstKey) toolCache.delete(firstKey);
  }
  toolCache.set(k, { ts: Date.now(), result });
}

export function clearToolCache() {
  toolCache.clear();
}

// ====== 工具注册中心 ======
export async function executeTool(
  name: string,
  args: ToolArgs
): Promise<Record<string, unknown>> {
  // 查缓存
  const cached = getCachedToolResult(name, args);
  if (cached) return cached;

  let result: Record<string, unknown>;
  switch (name) {
    case "web_search":
      result = await webSearch(args); break;
    case "search_universities":
      result = searchUniversities(args); break;
    case "get_university_detail":
      result = getUniversityDetail(args); break;
    case "get_score_lines":
      result = getScoreLines(args); break;
    case "analyze_major_fit":
      result = analyzeMajorFit(args); break;
    case "get_career_prospects":
      result = getCareerProspects(args); break;
    case "get_province_portal":
      result = getProvincePortal(args); break;
    case "compare_universities":
      result = compareUniversities(args); break;
    case "get_city_living_cost":
      result = getCityLivingCost(args); break;
    case "estimate_equivalent_score":
      result = estimateEquivalentScore(args); break;
    case "generate_risk_assessment":
      result = generateRiskAssessment(args); break;
    case "get_personality_analysis":
      result = getPersonalityAnalysis(args); break;
    case "recommend_volunteer_list":
      result = recommendVolunteerList(args); break;
    case "get_major_ranking":
      result = getMajorRanking(args); break;
    case "get_same_score_destinations":
      result = getSameScoreDestinations(args); break;
    case "generate_volunteer_table":
      result = generateVolunteerTable(args); break;
    case "check_subject_compatibility":
      result = checkSubjectCompatibility(args); break;
    case "get_province_score_lines":
      result = getProvinceScoreLines(args); break;
    case "score_rank_convert":
      result = scoreRankConvert(args); break;
    case "search_major_groups":
      result = searchMajorGroups(args); break;
    case "analyze_major_group":
      result = analyzeMajorGroup(args); break;
    default:
      result = { error: `未知工具: ${name}` };
  }
  setCachedToolResult(name, args, result);
  return result;
}

// ====== 专业组搜索（按分数+选科+省份） ======
function searchMajorGroups(args: ToolArgs): Record<string, unknown> {
  const { province, score, subjects, tolerance = 30 } = args;
  const subjectList = Array.isArray(subjects) ? (subjects as string[]) : [];

  let results = majorGroups.map((g: any) => {
    const uni = universities.find((u: any) => u.id === g.universityId);
    // 选科匹配检查
    const required = g.requireSubjects || [];
    const missing = required.filter((s: string) => !subjectList.includes(s));
    const subjectMatch = missing.length === 0;

    // 按省份查找录取数据
    const admission = (g.admissionData || []).find((a: any) => a.province === province) || (g.admissionData || [])[0];

    // 计算分数差
    const scoreNum = (score as number) || 0;
    const groupMin = admission?.minScore || g.groupMinScore;
    const diff = scoreNum - groupMin;

    // 推荐类型
    let category = "match";
    if (diff > 15) category = "safe";
    else if (diff < -15) category = "reach";
    else if (diff < -5) category = "ambitious";

    return {
      groupId: g.groupId,
      university: uni?.name,
      groupName: g.groupName,
      requireSubjects: required,
      subjectMatch,
      missingSubjects: missing,
      groupMinScore: groupMin,
      groupAvgScore: g.groupAvgScore,
      diff,
      category,
      scoreGap: g.adjustmentRisk?.scoreGap || 0,
      adjustmentRisk: g.adjustmentRisk?.level || "medium",
      admission,
      majorCount: g.majors.length,
    };
  });

  // 选科过滤
  if (subjectList.length > 0) {
    results = results.filter((r: any) => r.subjectMatch);
  }

  // 分数过滤（±tolerance）
  if (score) {
    results = results.filter((r: any) => Math.abs(r.diff) <= (tolerance as number) + 30);
  }

  // 按与目标分数差距排序
  results.sort((a: any, b: any) => Math.abs(a.diff) - Math.abs(b.diff));

  return {
    province,
    score,
    subjects: subjectList,
    totalCount: results.length,
    groups: results.slice(0, 30),
    summary: `在 ${province || "全国"} 共找到 ${results.length} 个符合选科和分数要求的院校专业组。`,
  };
}

// ====== 专业组深度分析（含调剂风险） ======
function analyzeMajorGroup(args: ToolArgs): Record<string, unknown> {
  const { groupId, studentScore, acceptAdjustment = true } = args;
  const group = majorGroups.find((g: any) => g.groupId === groupId);
  if (!group) return { error: `未找到专业组: ${groupId}` };

  const uni = universities.find((u: any) => u.id === group.universityId);
  const scoreNum = (studentScore as number) || 0;
  const groupMin = group.groupMinScore;
  const diff = scoreNum - groupMin;

  // 预测录取概率
  let admitProb: string;
  if (diff > 30) admitProb = "极高(>90%)";
  else if (diff > 10) admitProb = "较高(70-90%)";
  else if (diff > -10) admitProb = "中等(40-70%)";
  else if (diff > -30) admitProb = "较低(10-40%)";
  else admitProb = "极低(<10%)";

  // 调剂风险分析
  const adjustment = group.adjustmentRisk || { level: "medium", description: "", scoreGap: 15 };
  let adjustmentScenario: string;
  if (acceptAdjustment) {
    if (adjustment.level === "high") {
      adjustmentScenario = `⚠️ 高风险：组内分差 ${adjustment.scoreGap} 分，你的分数 (${studentScore}) 接近投档线 (${groupMin})，被调剂到冷门专业（如${group.majors[group.majors.length - 1]?.majorName}）的概率较高。`;
    } else if (adjustment.level === "medium") {
      adjustmentScenario = `ℹ️ 中等风险：组内分差 ${adjustment.scoreGap} 分，根据你的分数可能被调剂到组内中下游专业。`;
    } else {
      adjustmentScenario = `✅ 低风险：组内分差较小，调剂冲击有限。`;
    }
  } else {
    adjustmentScenario = `❌ 极高风险：你未勾选服从调剂。一旦投档但未录取到所填专业，将被直接退档到下一批次！强烈建议勾选服从调剂。`;
  }

  // 热门专业 vs 冷门专业
  const hotMajors = group.majors.filter((m: any) => (group.popularMajors || []).includes(m.majorId));
  const coldMajors = group.majors.filter((m: any) => !(group.popularMajors || []).includes(m.majorId));

  return {
    groupId,
    university: uni?.name,
    groupName: group.groupName,
    requireSubjects: group.requireSubjects,
    groupMinScore: groupMin,
    groupAvgScore: group.groupAvgScore,
    studentScore: scoreNum,
    scoreDiff: diff,
    admitProbability: admitProb,
    adjustmentRisk: adjustment,
    adjustmentScenario,
    acceptAdjustment,
    majors: group.majors.map((m: any) => ({
      name: m.majorName,
      minScoreInGroup: m.minScoreInGroup,
      tuition: m.tuition,
      isHot: (group.popularMajors || []).includes(m.majorId),
    })),
    hotMajors: hotMajors.map((m: any) => m.majorName),
    coldMajors: coldMajors.map((m: any) => m.majorName),
    advice: diff < 0
      ? `你的分数低于投档线 ${Math.abs(diff)} 分，建议作为冲刺志愿，并确保勾选服从调剂。`
      : diff < 15
        ? `你的分数仅高于投档线 ${diff} 分，建议作为稳妥志愿，必须勾选服从调剂以避免退档。`
        : `你的分数高于投档线 ${diff} 分，作为保底志愿较稳妥。`,
  };
}

// ====== 选科兼容性校验（教育部3+1+2硬性约束） ======
function checkSubjectCompatibility(args: ToolArgs): Record<string, unknown> {
  const { subjects, majorId, province } = args;
  if (!Array.isArray(subjects)) {
    return { error: "请提供选科科目列表" };
  }
  const studentSubjects = subjects as string[];

  // 查询指定专业
  if (majorId && typeof majorId === "string") {
    const major = majors.find((m: any) => m.id === majorId);
    if (!major) return { error: `未找到专业: ${majorId}` };
    const required = major.requireSubjects || [];
    const missing = required.filter((s: string) => !studentSubjects.includes(s));
    const compatible = missing.length === 0;
    return {
      major: major.name,
      category: major.category,
      requiredSubjects: required,
      studentSubjects,
      compatible,
      missingSubjects: missing,
      suggestion: compatible
        ? `你的选科(${studentSubjects.join("、")})符合 ${major.name} 的报考要求。`
        : `重要提示：${major.name} 要求选考 ${required.join("、")}，你的选科(${studentSubjects.join("、")})缺少 ${missing.join("、")}，无法报考！请重新考虑目标专业。`,
      severity: compatible ? "ok" : "critical",
    };
  }

  // 列出所有可报专业
  const compatibleList: any[] = [];
  const incompatibleList: any[] = [];
  for (const m of majors) {
    const required = m.requireSubjects || [];
    const missing = required.filter((s: string) => !studentSubjects.includes(s));
    if (missing.length === 0) {
      compatibleList.push({ id: m.id, name: m.name, category: m.category, requiredSubjects: required });
    } else {
      incompatibleList.push({ id: m.id, name: m.name, category: m.category, requiredSubjects: required, missingSubjects: missing });
    }
  }

  // 应用选科约束规则
  const hasPhysics = studentSubjects.includes("物理");
  const hasChemistry = studentSubjects.includes("化学");
  const hasHistory = studentSubjects.includes("历史");

  const ruleWarnings: string[] = [];
  if (hasPhysics && !hasChemistry) {
    ruleWarnings.push("⚠️ 你选了物理但没选化学，根据教育部规定，工科、医学、理学等专业几乎都无法报考，可选专业范围大幅缩小（仅剩 30% 左右）。");
  }
  if (hasHistory && !studentSubjects.includes("地理") && !studentSubjects.includes("政治")) {
    ruleWarnings.push("ℹ️ 选考历史+化学/生物是较小众的组合，部分专业组可能没有招生计划。");
  }

  return {
    studentSubjects,
    mode: scoreLinesReal[province as string]?.mode || "未知",
    compatibleCount: compatibleList.length,
    incompatibleCount: incompatibleList.length,
    compatible: compatibleList,
    incompatible: incompatibleList,
    ruleWarnings,
    _trustLevel: "verified",
    _source: "教育部3+1+2选科要求指引",
    summary: `你的选科(${studentSubjects.join("、")})共可报 ${compatibleList.length} 个常见本科专业，${incompatibleList.length} 个专业无法报考。${ruleWarnings.join(" ")}`,
  };
}

// ====== 真实分数线查询（基于30+省考试院数据） ======
function getProvinceScoreLines(args: ToolArgs): Record<string, unknown> {
  const { province, year } = args;
  if (!province || typeof province !== "string") {
    return { error: "请提供省份名称" };
  }
  const data = scoreLinesReal[province];
  if (!data) {
    return { error: `未找到 ${province} 的分数线数据。请检查省份名称。` };
  }
  const targetYear = (year as number)?.toString() || "2024";
  const yearData = data[targetYear] || data["2024"];
  if (!yearData) {
    return { error: `未找到 ${province} ${targetYear} 年的数据` };
  }

  const mode = data.mode || "未知";
  const isNewMode = mode === "3+1+2" || mode === "3+3";

  return {
    province,
    year: targetYear,
    mode,
    scoreLines: yearData,
    _trustLevel: "verified",
    _source: `${province}省教育考试院`,
    summary: `${province} ${targetYear} 年高考采用 ${mode} 模式。${isNewMode ? "新高考不再分文理科，按选科组合分别划线。" : ""}`,
  };
}

// ====== 分数 ↔ 位次 换算（基于一分布表） ======
function scoreRankConvert(args: ToolArgs): Record<string, unknown> {
  const { province, score, direction } = args;
  if (!province || typeof province !== "string") {
    return { error: "请提供省份" };
  }
  const data = scoreLinesReal[province];
  if (!data) {
    return { error: `未找到 ${province} 的位次数据` };
  }
  const yearData = data["2024"];

  // 找到合适的批次线作为锚点
  const lines = Object.entries(yearData) as [string, any][];
  let anchorLine: any = null;
  let anchorName = "";
  for (const [name, line] of lines) {
    if (line.rank && line.score) {
      // 选择离目标分数最近的批次线作为锚点
      if (!anchorLine || Math.abs(line.score - (score as number)) < Math.abs(anchorLine.score - (score as number))) {
        anchorLine = line;
        anchorName = name;
      }
    }
  }
  if (!anchorLine) {
    return { error: `${province} 数据不完整，无法换算位次` };
  }

  // 简化换算逻辑：1分 ≈ 500-2000 位次（按分数段不同）
  // 高分段密集，低分段稀疏
  const scoreDiff = (score as number) - anchorLine.score;
  let rankDiff: number;
  if (scoreDiff > 0) {
    // 高于线：每多1分位次前进
    rankDiff = scoreDiff * (anchorLine.rank > 100000 ? 800 : 300);
  } else {
    // 低于线：每少1分位次后退
    rankDiff = scoreDiff * (anchorLine.rank > 100000 ? 1500 : 500);
  }
  const estimatedRank = anchorLine.rank - rankDiff;

  // 计算等效分（2023年）：位次不变，映射到2023年同位次的分数
  const y2023 = data["2023"];
  let equivalent2023: number | null = null;
  if (y2023) {
    for (const [name, line] of Object.entries(y2023) as [string, any][]) {
      if (line.rank && line.score) {
        // 简单线性插值
        equivalent2023 = line.score + ((estimatedRank - line.rank) / 5000) * (score as number - anchorLine.score) * 0.3;
        break;
      }
    }
  }

  return {
    province,
    score,
    estimatedRank: Math.max(1, Math.round(estimatedRank)),
    anchorLine: anchorName,
    anchorScore: anchorLine.score,
    anchorRank: anchorLine.rank,
    yearEquivalent2023: equivalent2023 ? Math.round(equivalent2023) : null,
    _trustLevel: "estimated",
    _source: "基于2024年本省批次线估算",
    note: "位次和等效分均为基于批次线的估算值，精确数据请以一分一段表为准。",
    warning: "⚠️ 估算结果仅供参考。实际志愿填报必须查询官方一分一段表。",
  };
}

// ====== 1. 院校搜索 ======
function searchUniversities(args: ToolArgs): Record<string, unknown> {
  const { province, minScore, maxScore, tags, cityPreference, typePreference, majorPreference } = args;
  let results = [...universities];

  if (province && typeof province === "string") {
    results = results.filter((u: any) => u.province === province || u.city === province);
  }

  if (tags && Array.isArray(tags) && tags.length > 0) {
    results = results.filter((u: any) =>
      (tags as string[]).some((t) => u.tags.includes(t))
    );
  }

  if (cityPreference && typeof cityPreference === "string") {
    const city = cityPreference as string;
    results = results.filter(
      (u: any) => u.city.includes(city) || u.province.includes(city)
    );
  }

  if (typePreference && typeof typePreference === "string") {
    results = results.filter((u: any) => u.type === typePreference);
  }

  if (majorPreference && typeof majorPreference === "string") {
    const major = majorPreference as string;
    results = results.filter((u: any) => {
      const uniAdmissions = admissions.find((a: any) => a.universityId === u.id);
      if (!uniAdmissions?.majors) return false;
      return uniAdmissions.majors.some((m: any) =>
        m.majorName.includes(major) || m.majorId.includes(major)
      );
    });
  }

  // 如果提供了分数范围，按录取分数筛选
  if ((minScore || maxScore) && province) {
    results = results.filter((u: any) => {
      const uniAdmissions = admissions.find((a: any) => a.universityId === u.id);
      if (!uniAdmissions?.majors) return false;
      return uniAdmissions.majors.some((m: any) => {
        const latest = m.history?.[0];
        if (!latest) return true; // 没有数据默认保留
        const min = minScore ? (minScore as number) : 0;
        const max = maxScore ? (maxScore as number) : 999;
        return latest.score >= min && latest.score <= max;
      });
    });
  }

  return {
    total: results.length,
    universities: results.slice(0, 15).map((u: any) => ({
      id: u.id,
      name: u.name,
      province: u.province,
      city: u.city,
      type: u.type,
      tags: u.tags,
      website: u.website,
    })),
  };
}

// ====== 2. 院校详情 ======
function getUniversityDetail(args: ToolArgs): Record<string, unknown> {
  const { universityId } = args;
  const uni = universities.find((u: any) => u.id === universityId);
  if (!uni) return { error: "未找到该院校信息" };

  const uniAdmissions = admissions.find((a: any) => a.universityId === universityId);
  const majors = uniAdmissions?.majors?.map((m: any) => ({
    majorId: m.majorId,
    majorName: m.majorName,
    latestScore: m.history?.[0]?.score,
    latestRank: m.history?.[0]?.rank,
  })) || [];

  return {
    university: uni,
    majors,
    majorCount: majors.length,
  };
}

// ====== 3. 分数线查询 ======
function getScoreLines(args: ToolArgs): Record<string, unknown> {
  const { universityId, province, year } = args;
  const uniAdmissions = admissions.find((a: any) => a.universityId === universityId);
  if (!uniAdmissions) {
    return { error: "未找到该院校录取数据" };
  }

  const targetYear = year || 2024;
  const results = uniAdmissions.majors.map((m: any) => {
    const record = m.history?.find((h: any) => h.year === targetYear && h.province === province);
    return {
      majorName: m.majorName,
      majorId: m.majorId,
      score: record?.score,
      rank: record?.rank,
      year: targetYear,
      province,
    };
  }).filter((r: any) => r.score);

  return {
    universityName: uniAdmissions.universityName,
    year: targetYear,
    province,
    majors: results,
    count: results.length,
  };
}

// ====== 4. 专业匹配分析 ======
function analyzeMajorFit(args: ToolArgs): Record<string, unknown> {
  const { majorId, studentInterests, careerGoals, personalityType } = args;
  const major = majors.find((m: any) => m.id === majorId);
  if (!major) return { error: "未找到该专业信息" };

  // 基于人格类型的匹配度计算
  let fitScore = 50;
  const interestText = (studentInterests as string) || "";
  const careerText = (careerGoals as string) || "";
  const personality = (personalityType as string) || "";

  // 关键词匹配
  const keywords = [...major.directions, major.name, major.category];
  const matchCount = keywords.filter((k) =>
    interestText.includes(k) || careerText.includes(k)
  ).length;
  fitScore += matchCount * 10;

  // 人格类型匹配
  const personalityMap: Record<string, string[]> = {
    analyst: ["计算机", "数据", "金融", "统计", "数学"],
    strategist: ["计算机", "金融", "法律", "管理", "经济"],
    explorer: ["生物", "化学", "地理", "环境", "天文"],
    creator: ["设计", "艺术", "建筑", "媒体", "文学"],
    connector: ["教育", "心理", "社会", "语言", "管理"],
    guardian: ["医学", "护理", "教育", "社工", "公共管理"],
    mystic: ["哲学", "历史", "文学", "艺术", "宗教"],
    pragmatist: ["机械", "土木", "电气", "材料", "自动化"],
  };

  if (personality && personalityMap[personality]) {
    const matched = personalityMap[personality].some((k) =>
      major.name.includes(k) || major.directions.some((d: string) => d.includes(k))
    );
    if (matched) fitScore += 20;
  }

  return {
    major,
    fitScore: Math.min(100, fitScore),
    studentInterests,
    careerGoals,
    personalityType,
    suggestion: fitScore >= 80
      ? "高度匹配，建议优先考虑"
      : fitScore >= 60
      ? "较为匹配，可作为备选"
      : "匹配度一般，建议多了解后再决定",
  };
}

// ====== 5. 就业前景 ======
function getCareerProspects(args: ToolArgs): Record<string, unknown> {
  const { majorId } = args;
  const major = majors.find((m: any) => m.id === majorId);
  if (!major) return { error: "未找到该专业信息" };

  const prospects: Record<string, any> = {
    cs: { salaryRange: "20-50万", demand: "极高", trend: "持续上升", topCities: ["北京", "上海", "深圳", "杭州"] },
    se: { salaryRange: "18-45万", demand: "极高", trend: "稳定", topCities: ["北京", "上海", "深圳", "杭州"] },
    ai: { salaryRange: "25-60万", demand: "极高", trend: "快速上升", topCities: ["北京", "上海", "深圳", "杭州"] },
    ee: { salaryRange: "15-35万", demand: "高", trend: "稳定", topCities: ["北京", "上海", "深圳", "南京"] },
    me: { salaryRange: "12-30万", demand: "中高", trend: "智能制造升级中", topCities: ["上海", "深圳", "苏州", "武汉"] },
    ce: { salaryRange: "15-35万", demand: "高", trend: "新基建带动", topCities: ["北京", "上海", "深圳", "成都"] },
    fin: { salaryRange: "15-40万", demand: "中高", trend: "金融科技转型", topCities: ["北京", "上海", "深圳", "香港"] },
    eco: { salaryRange: "12-35万", demand: "中", trend: "稳定", topCities: ["北京", "上海", "深圳", "广州"] },
    law: { salaryRange: "15-50万", demand: "中高", trend: "稳定", topCities: ["北京", "上海", "深圳", "广州"] },
    med: { salaryRange: "12-40万", demand: "高", trend: "稳定", topCities: ["北京", "上海", "广州", "成都"] },
    edu: { salaryRange: "8-25万", demand: "中", trend: "教师编竞争激烈", topCities: ["北京", "上海", "南京", "武汉"] },
    art: { salaryRange: "8-30万", demand: "中", trend: "创意产业增长", topCities: ["北京", "上海", "深圳", "杭州"] },
  };

  const prospect = prospects[majorId as string] || {
    salaryRange: "10-30万",
    demand: "中",
    trend: "需关注行业动态",
    topCities: ["北京", "上海", "广州", "深圳"],
  };

  return {
    majorName: major.name,
    category: major.category,
    directions: major.directions,
    ...prospect,
  };
}

// ====== 6. 省份入口 ======
function getProvincePortal(args: ToolArgs): Record<string, unknown> {
  const { province } = args;
  const portal = portals.find((p: any) => p.province === province);
  if (!portal) return { error: `未找到${province}的相关入口信息` };
  return portal;
}

// ====== 7. 院校对比 ======
function compareUniversities(args: ToolArgs): Record<string, unknown> {
  const { universityIds } = args;
  if (!Array.isArray(universityIds)) return { error: "请提供院校ID列表" };

  const unis = (universityIds as string[])
    .map((id) => {
      const uni = universities.find((u: any) => u.id === id);
      const uniAdmissions = admissions.find((a: any) => a.universityId === id);
      if (!uni) return null;
      return {
        ...uni,
        majorCount: uniAdmissions?.majors?.length || 0,
        topMajors: uniAdmissions?.majors?.slice(0, 3).map((m: any) => m.majorName) || [],
      };
    })
    .filter(Boolean);

  return { comparison: unis, count: unis.length };
}

// ====== 8. 城市生活成本 ======
function getCityLivingCost(args: ToolArgs): Record<string, unknown> {
  const { city } = args;
  const cost = cities.find((c: any) => c.city === city);
  if (!cost) return { message: `暂无${city}的生活成本数据` };
  return cost;
}

// ====== 9. 等效分数估算 ======
function estimateEquivalentScore(args: ToolArgs): Record<string, unknown> {
  const { mockScore, province, mockType } = args;
  const score = mockScore as number;
  const type = (mockType as string) || "";

  // 根据省份和模考类型给出更精确的估算
  // 注：模考通常比高考难，系数 > 1 表示模考分数需要上调才能估算高考分数
  // 不同省份模考难度差异较大，以下系数为经验值
  const provinceFactors: Record<string, number> = {
    "北京": 1.02, "上海": 1.02, "天津": 1.02,
    "江苏": 1.05, "浙江": 1.05, "山东": 1.03,
    "河南": 1.08, "河北": 1.06, "广东": 1.03,
  };

  const mockFactors: Record<string, number> = {
    "一模": 1.05, "二模": 1.02, "三模": 1.0,
    "期中": 1.08, "期末": 1.03,
  };

  const provinceFactor = provinceFactors[province as string] || 1.0;
  const mockFactor = mockFactors[type] || 1.0;
  const estimated = Math.round(score * provinceFactor * mockFactor);

  return {
    mockScore: score,
    mockType: type,
    province,
    estimatedGaokaoScore: estimated,
    estimatedRange: `${estimated - 10} - ${estimated + 15}`,
    note: "此为基于历史数据的粗略估算，实际请以省排名为准",
    warning: "⚠️ 估算结果仅供参考，模考分数与高考分数存在差异，请以官方一分一段表为准。",
  };
}

// ====== 10. 风险评估 ======
function generateRiskAssessment(args: ToolArgs): Record<string, unknown> {
  const { selectedUniversities, studentScore, province } = args;
  if (!Array.isArray(selectedUniversities)) return { error: "请提供院校列表" };

  const uniList = selectedUniversities as string[];
  const score = studentScore as number;

  // 获取每个院校的录取数据
  const uniData = uniList.map((id) => {
    const uni = universities.find((u: any) => u.id === id);
    const uniAdmissions = admissions.find((a: any) => a.universityId === id);
    const avgScore = uniAdmissions?.majors?.reduce((sum: number, m: any) => {
      const latest = m.history?.[0]?.score || 0;
      return sum + latest;
    }, 0) / (uniAdmissions?.majors?.length || 1);

    return {
      id,
      name: uni?.name || id,
      avgScore: Math.round(avgScore),
      diff: score - avgScore,
    };
  });

  // diff = 考生分数 - 院校平均分
  // diff < 0 → 考生分数低于院校平均 → 冲刺
  // diff > 0 → 考生分数高于院校平均 → 稳妥/保底
  const reach = uniData.filter((u) => u.diff < 0); // 冲刺（院校分数高于考生）
  const match = uniData.filter((u) => u.diff >= 0 && u.diff <= 30); // 稳妥（院校分数接近考生）
  const safe = uniData.filter((u) => u.diff > 30); // 保底（院校分数明显低于考生）

  return {
    assessment: {
      reach: reach.map((u) => u.name),
      match: match.map((u) => u.name),
      safe: safe.map((u) => u.name),
    },
    details: uniData,
    suggestions: [
      reach.length > 3 ? "冲刺院校过多，建议减少至 1-2 所" : null,
      match.length < 3 ? "稳妥院校偏少，建议增加 2-3 所" : null,
      safe.length < 2 ? "保底院校不足，务必增加保底" : null,
      "建议志愿梯度：冲刺:稳妥:保底 = 2:4:2",
    ].filter(Boolean),
  };
}

// ====== 11. 人格分析 ======
function getPersonalityAnalysis(args: ToolArgs): Record<string, unknown> {
  const { personalityId, dims } = args;

  if (personalityId) {
    const p = personalities.find((per: any) => per.id === personalityId);
    if (!p) return { error: "未找到该人格类型" };
    return { personality: p, dimensions };
  }

  if (dims && Array.isArray(dims)) {
    // 根据四个维度值匹配最接近的人格类型
    const dimValues = dims as number[];
    let bestMatch = personalities[0];
    let minDiff = Infinity;

    personalities.forEach((p: any) => {
      const diff = p.dims.reduce((sum: number, d: number, i: number) =>
        sum + Math.abs(d - (dimValues[i] || 50)), 0
      );
      if (diff < minDiff) {
        minDiff = diff;
        bestMatch = p;
      }
    });

    return {
      personality: bestMatch,
      dimensions,
      matchConfidence: Math.round((1 - minDiff / 400) * 100),
    };
  }

  return { personalities, dimensions };
}

// ====== 12. 志愿列表推荐 ======
function recommendVolunteerList(args: ToolArgs): Record<string, unknown> {
  const { province, score, subjects, interests, personalityType, riskPreference } = args;

  const scoreNum = score as number;
  const risk = (riskPreference as string) || "balanced";

  // 根据风险偏好确定分数浮动范围（阶梯式递减，确保高分考生能匹配到名校）
  // 区间设计：reach > match > safe，互不重叠，形成合理梯度
  // 注：数据库院校平均分普遍在550-690之间，高分考生(750+)需要较大区间才能匹配到名校
  const ranges: Record<string, { reach: number; match: number; safe: number }> = {
    aggressive: { reach: 200, match: 150, safe: 100 },
    balanced: { reach: 150, match: 120, safe: 80 },
    conservative: { reach: 100, match: 80, safe: 60 },
  };

  const range = ranges[risk] || ranges.balanced;

  // 筛选院校
  const candidates = universities.map((u: any) => {
    const uniAdmissions = admissions.find((a: any) => a.universityId === u.id);
    const avgScore = uniAdmissions?.majors?.reduce((sum: number, m: any) => {
      const latest = m.history?.[0]?.score || 0;
      return sum + latest;
    }, 0) / (uniAdmissions?.majors?.length || 1);

    return { ...u, avgScore: Math.round(avgScore) };
  }).filter((u: any) => u.avgScore > 0);

  // 阶梯式分类（互不重叠）
  // 冲刺（reach）：分数接近考生但略低（考生有把握但需要努力）
  const reachList = candidates
    .filter((u: any) => u.avgScore > scoreNum - range.reach && u.avgScore <= scoreNum)
    .sort((a: any, b: any) => b.avgScore - a.avgScore)
    .slice(0, 3);

  // 稳妥（match）：分数明显低于考生（考生有较大概率录取）
  const matchList = candidates
    .filter((u: any) => u.avgScore > scoreNum - range.reach - range.match && u.avgScore <= scoreNum - range.reach)
    .sort((a: any, b: any) => b.avgScore - a.avgScore)
    .slice(0, 5);

  // 保底（safe）：分数远低于考生（考生基本稳录）
  const safeList = candidates
    .filter((u: any) => u.avgScore > scoreNum - range.reach - range.match - range.safe && u.avgScore <= scoreNum - range.reach - range.match)
    .sort((a: any, b: any) => b.avgScore - a.avgScore)
    .slice(0, 3);

  return {
    score: scoreNum,
    province,
    personalityType,
    riskPreference: risk,
    recommendations: {
      reach: reachList,
      match: matchList,
      safe: safeList,
    },
    totalCount: reachList.length + matchList.length + safeList.length,
    strategy: `${risk === "aggressive" ? "激进" : risk === "conservative" ? "保守" : "均衡"}策略，建议冲刺${reachList.length}所、稳妥${matchList.length}所、保底${safeList.length}所`,
  };
}

// ====== 13. 专业排名查询 ======
function getMajorRanking(args: ToolArgs): Record<string, unknown> {
  const { majorId, category } = args;

  if (category) {
    const catMajors = majors.filter((m: any) => m.category === category);
    return {
      category,
      majors: catMajors.map((m: any, i: number) => ({
        rank: i + 1,
        ...m,
      })),
    };
  }

  const major = majors.find((m: any) => m.id === majorId);
  if (!major) return { error: "未找到该专业" };

  // 模拟专业排名数据（基于学科评估结果）
  const rankings: Record<string, Array<{ universityId: string; universityName: string; rank: number; level: string }>> = {
    cs: [
      { universityId: "tsinghua", universityName: "清华大学", rank: 1, level: "A+" },
      { universityId: "pku", universityName: "北京大学", rank: 2, level: "A+" },
      { universityId: "zju", universityName: "浙江大学", rank: 3, level: "A+" },
      { universityId: "sjtu", universityName: "上海交通大学", rank: 4, level: "A" },
      { universityId: "fudan", universityName: "复旦大学", rank: 5, level: "A" },
    ],
    ai: [
      { universityId: "tsinghua", universityName: "清华大学", rank: 1, level: "A+" },
      { universityId: "pku", universityName: "北京大学", rank: 2, level: "A+" },
      { universityId: "zju", universityName: "浙江大学", rank: 3, level: "A+" },
      { universityId: "sjtu", universityName: "上海交通大学", rank: 4, level: "A" },
      { universityId: "fudan", universityName: "复旦大学", rank: 5, level: "A" },
    ],
    med: [
      { universityId: "pku", universityName: "北京大学", rank: 1, level: "A+" },
      { universityId: "fudan", universityName: "复旦大学", rank: 2, level: "A+" },
      { universityId: "sjtu", universityName: "上海交通大学", rank: 3, level: "A+" },
      { universityId: "zhongshan", universityName: "中山大学", rank: 4, level: "A" },
      { universityId: "xiamen", universityName: "厦门大学", rank: 5, level: "A" },
    ],
  };

  return {
    major,
    rankings: rankings[majorId as string] || rankings.cs,
    note: "以上排名基于教育部第四轮学科评估结果，仅供参考。",
  };
}

// ====== 14. 同分去向查询 ======
function getSameScoreDestinations(args: ToolArgs): Record<string, unknown> {
  const { score, province, year } = args;
  const targetYear = (year as number) || 2024;
  const targetScore = score as number;
  const tolerance = 5; // ±5分

  const results: any[] = [];

  admissions.forEach((a: any) => {
    a.majors.forEach((m: any) => {
      const record = m.history?.find((h: any) =>
        h.year === targetYear && h.province === province &&
        Math.abs(h.score - targetScore) <= tolerance
      );
      if (record) {
        results.push({
          universityName: a.universityName,
          universityId: a.universityId,
          majorName: m.majorName,
          majorId: m.majorId,
          score: record.score,
          rank: record.rank,
          diff: record.score - targetScore,
        });
      }
    });
  });

  return {
    score: targetScore,
    province,
    year: targetYear,
    tolerance,
    results: results.sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff)).slice(0, 20),
    count: results.length,
  };
}

// ====== 15. 生成志愿表 ======
function generateVolunteerTable(args: ToolArgs): Record<string, unknown> {
  const { selections, studentInfo } = args;

  if (!Array.isArray(selections)) return { error: "请提供志愿选择" };

  // 1. 选科校验
  const subjects = (studentInfo as any)?.subjects || [];
  const subjectWarnings: Array<Record<string, unknown>> = [];
  if (subjects.length > 0) {
    for (let i = 0; i < (selections as any[]).length; i++) {
      const s = (selections as any[])[i];
      const major = majors.find((m: any) => m.id === s.majorId);
      if (major && major.requireSubjects && major.requireSubjects.length > 0) {
        const missing = major.requireSubjects.filter((sub: string) => !subjects.includes(sub));
        if (missing.length > 0) {
          subjectWarnings.push({
            order: i + 1,
            university: universities.find((u: any) => u.id === s.universityId)?.name,
            major: major.name,
            requiredSubjects: major.requireSubjects,
            missingSubjects: missing,
            severity: "critical",
            message: `❌ 选科不符：${major.name} 要求 ${major.requireSubjects.join("、")}，你的选科(${subjects.join("、")})缺少 ${missing.join("、")}，投档后即使分数足够也会被退档！`,
          });
        }
      }
    }
  }

  // 2. 投档风险评估（每个志愿）
  const table = (selections as any[]).map((s, i) => {
    const uni = universities.find((u: any) => u.id === s.universityId);
    const major = majors.find((m: any) => m.id === s.majorId);

    // 计算调剂风险
    const adjustmentRisk = s.category === "reach" ? "high" : s.category === "match" ? "medium" : "low";

    return {
      order: i + 1,
      university: uni?.name || s.universityId,
      major: major?.name || s.majorId,
      category: s.category || "match",
      adjustmentRisk,
      acceptAdjustment: s.acceptAdjustment !== false,
      notes: s.notes || "",
    };
  });

  // 3. 整体风险评估
  const criticalWarnings = subjectWarnings.filter((w: any) => w.severity === "critical");
  const totalSelections = table.length;
  const safeCount = table.filter((t) => t.category === "safe").length;
  const matchCount = table.filter((t) => t.category === "match").length;
  const reachCount = table.filter((t) => t.category === "reach").length;
  const noAdjustmentCount = table.filter((t) => !t.acceptAdjustment).length;

  const overallRisk = {
    level: criticalWarnings.length > 0 ? "critical" : safeCount === 0 ? "high" : noAdjustmentCount > 2 ? "medium" : "low",
    tips: [
      "**新高考投档原则**：按「院校专业组」投档，组内所有专业共享一个投档线",
      "**调剂重要性**：不勾「服从专业调剂」→ 退档风险极高（直接掉到下一批次）",
      "**志愿顺序**：按冲-稳-保梯度排列，系统检索时是从第1个志愿开始",
      criticalWarnings.length > 0 ? `❌ 发现 ${criticalWarnings.length} 个选科不符的志愿，必须立即修正！` : null,
    ].filter(Boolean),
  };

  return {
    studentInfo,
    volunteerTable: table,
    subjectWarnings,
    summary: {
      total: totalSelections,
      reach: reachCount,
      match: matchCount,
      safe: safeCount,
      noAdjustment: noAdjustmentCount,
    },
    overallRisk,
    tips: [
      '志愿顺序很重要，建议按"冲-稳-保"梯度排列',
      '务必勾选"服从专业调剂"，避免退档',
      "关注院校的招生章程，了解单科成绩要求",
      "保底志愿要确保 100% 能录取",
      "新高考每个院校专业组是一个投档单位",
    ],
  };
}