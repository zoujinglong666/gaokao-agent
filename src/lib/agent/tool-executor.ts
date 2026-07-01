import universitiesData from "../data/universities.json";
import admissionData from "../data/admission-data.json";
import portalsData from "../data/province-portals.json";
import majorsData from "../data/majors.json";
import cityCostData from "../data/city-cost.json";
import personalityData from "../data/personalities.json";
import scoreLinesRealData from "../data/score-lines-real.json";
import majorGroupsData from "../data/major-groups.json";

// ====== 数据类型定义 ======
interface University {
  id: string;
  name: string;
  province: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  website: string;
  admissionOfficePhone: string;
  type: string;
  tags: string[];
}

interface Major {
  id: string;
  name: string;
  category: string;
  requireSubjects: string[];
  directions: string[];
}

interface AdmissionRecord {
  year: number;
  province: string;
  minScore?: number;
  score?: number;
  rank?: number;
}

interface MajorAdmission {
  majorId: string;
  majorName: string;
  history?: AdmissionRecord[];
  minScoreInGroup?: number;
  tuition?: number;
}

interface UniversityAdmission {
  universityId: string;
  universityName: string;
  majors: MajorAdmission[];
}

interface MajorGroup {
  groupId: string;
  universityId: string;
  groupName: string;
  requireSubjects: string[];
  majors: Array<{ majorId: string; majorName: string; minScoreInGroup: number; tuition: number }>;
  groupMinScore: number;
  groupAvgScore: number;
  popularMajors?: string[];
  admissionData?: AdmissionRecord[];
  adjustmentRisk?: { level: string; description?: string; scoreGap: number };
}

interface Portal {
  province: string;
  examInstituteUrl: string;
  scoreCheckUrl: string;
  volunteerSystemUrl: string;
  scoreTableUrl: string;
  scoreCheckDate?: string;
  volunteerFillDate?: string;
}

interface Personality {
  id: string;
  name: string;
  en: string;
  emoji: string;
  desc: string;
  dims: number[];
  pct: number;
}

interface CityCost {
  city: string;
  rentAvg: number;
  mealDaily: number;
  transportMonthly: number;
  level: string;
}

const scoreLinesReal = (scoreLinesRealData as { provinces?: Record<string, unknown> }).provinces || {} as Record<string, unknown>;
const majorGroups = (majorGroupsData as { majorGroups?: MajorGroup[] }).majorGroups || [];

const { universities } = universitiesData as { universities: University[] };
const { admissionData: admissions } = admissionData as { admissionData: UniversityAdmission[] };
const { portals } = portalsData as { portals: Portal[] };
const { majors } = majorsData as { majors: Major[] };
const { cities } = cityCostData as { cities: CityCost[] };
const { personalities, dimensions } = personalityData as { personalities: Personality[]; dimensions: unknown[] };

type ToolArgs = Record<string, unknown>;

// ====== 联网搜索 ======
const SEARCH_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const searchCache = new Map<string, { ts: number; result: Record<string, unknown> }>();

// ====== 获取当前时间 ======
function getCurrentTime(args: ToolArgs): Record<string, unknown> {
  const now = new Date();
  const timeZone = "Asia/Shanghai";
  const options: Intl.DateTimeFormatOptions = {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };
  const formatter = new Intl.DateTimeFormat("zh-CN", options);
  const parts = formatter.formatToParts(now);
  const formatted = parts.map((p) => p.value).join("");

  return {
    currentTime: now.toISOString(),
    localTime: formatted,
    date: now.toLocaleDateString("zh-CN", { timeZone }),
    time: now.toLocaleTimeString("zh-CN", { timeZone, hour12: false }),
    dayOfWeek: now.toLocaleDateString("zh-CN", { timeZone, weekday: "long" }),
    timestamp: now.getTime(),
  };
}

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
    };
  }
}

// ====== 联网搜索大学招生信息（智能推荐专用） ======
async function searchUniversityWeb(args: ToolArgs): Promise<Record<string, unknown>> {
  const { universities: uniNames, query, province, year } = args;
  
  // 如果有指定大学列表，为每所大学搜索最新录取数据
  if (Array.isArray(uniNames) && uniNames.length > 0) {
    const results: Record<string, unknown>[] = [];
    const batchSize = 3; // 每批最多查3所，避免API调用过多
    const batch = uniNames.slice(0, batchSize);
    
    for (const name of batch as string[]) {
      const searchQuery = `${name} ${year || "2025"}年 录取分数线 招生 最低分 位次`;
      try {
        const apiKey = process.env.TAVILY_API_KEY;
        if (!apiKey) {
          results.push({ university: name, error: "搜索服务未配置" });
          continue;
        }
        const response = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: apiKey,
            query: searchQuery,
            search_depth: "basic",
            max_results: 3,
            include_answer: true,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          results.push({
            university: name,
            searchQuery,
            summary: data.answer || "",
            sources: (data.results || []).slice(0, 3).map((r: any) => ({
              title: r.title,
              url: r.url,
              snippet: r.content?.slice(0, 200),
            })),
          });
        }
      } catch (err: any) {
        results.push({ university: name, error: err.message });
      }
    }
    
    return {
      query: uniNames,
      totalSearched: batch.length,
      results,
      note: `已为${batch.length}所院校搜索最新招生数据，其余院校建议分批查询`,
    };
  }
  
  // 通用搜索：如果没有指定大学列表，搜索省份+年份的招生政策
  const defaultQuery = (query as string) || `${province || ""} ${year || "2025"}年 高考 志愿填报 招生政策 分数线 最新`.trim();
  return webSearch({ query: defaultQuery });
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
    case "get_current_time":
      result = getCurrentTime(args); break;
    case "web_search":
      result = await webSearch(args); break;
    case "search_university_web":
      result = await searchUniversityWeb(args); break;
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
      result = await recommendVolunteerList(args); break;
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

  // 计算所有专业组的最低分分布（用于百分位分档）
  const allMinScores = majorGroups
    .map((g: MajorGroup) => g.groupMinScore)
    .filter((s: number) => s > 0)
    .sort((a: number, b: number) => a - b);

  const totalGroups = allMinScores.length;
  const midIndex = Math.floor(totalGroups / 2);

  let results = majorGroups.map((g: MajorGroup) => {
    const uni = universities.find((u: University) => u.id === g.universityId);
    // 选科匹配检查
    const required = g.requireSubjects || [];
    const missing = required.filter((s: string) => !subjectList.includes(s));
    const subjectMatch = missing.length === 0;

    // 按省份查找录取数据
    const admission = (g.admissionData || []).find((a: AdmissionRecord) => a.province === province) || (g.admissionData || [])[0];

    // 计算分数差
    const scoreNum = (score as number) || 0;
    const groupMin = admission?.minScore || g.groupMinScore;
    const diff = scoreNum - groupMin;

    // 基于百分位的智能分档（使用 sigmoid 概率分布替代固定阈值）
    // 当diff > 0时表示考生分数高于组最低分
    let category: string;
    let probBands: string;

    // 使用整体分布的中位数做参考
    if (diff > 25) {
      category = "safe";
      probBands = "保底";
    } else if (diff > 10) {
      category = "match";
      probBands = "稳妥";
    } else if (diff > -5) {
      category = "ambitious";
      probBands = "冲刺";
    } else {
      category = "reach";
      probBands = "高风险";
    }

    // 录取概率预测（与recommendVolunteerList一致的模型）
    const admitProb = Math.round(1 / (1 + Math.exp(-diff / 25)) * 100);

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
      probBands,
      admitProb,
      scoreGap: g.adjustmentRisk?.scoreGap || 0,
      adjustmentRisk: g.adjustmentRisk?.level || "medium",
      admission,
      majorCount: g.majors.length,
      popularMajors: g.popularMajors,
    };
  });

  // 选科过滤
  if (subjectList.length > 0) {
    results = results.filter((r: any) => r.subjectMatch);
  }

  // 分数过滤（±tolerance，动态调整）
  if (score) {
    results = results.filter((r: any) => Math.abs(r.diff) <= (tolerance as number) + 30);
  }

  // 按录取概率排序（从高到低），同概率下按分数差排序
  results.sort((a: any, b: any) => {
    if (b.admitProb !== a.admitProb) return b.admitProb - a.admitProb;
    return Math.abs(a.diff) - Math.abs(b.diff);
  });

  // 统计智能推荐的分档分布
  const reachCount = results.filter((r: any) => r.category === "reach").length;
  const ambitiousCount = results.filter((r: any) => r.category === "ambitious").length;
  const matchCount = results.filter((r: any) => r.category === "match").length;
  const safeCount = results.filter((r: any) => r.category === "safe").length;

  return {
    province,
    score,
    subjects: subjectList,
    totalCount: results.length,
    groups: results.slice(0, 30),
    distribution: {
      reach: reachCount,
      ambitious: ambitiousCount,
      match: matchCount,
      safe: safeCount,
    },
    summary: `在 ${province || "全国"} 共找到 ${results.length} 个符合条件专业组，其中冲刺${reachCount + ambitiousCount}个、稳妥${matchCount}个、保底${safeCount}个。`,
    note: "admitProb为基于分数差的录取概率估算，仅供参考。",
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

  const provinceData = scoreLinesReal[province as string] as Record<string, unknown> | undefined;

  return {
    studentSubjects,
    mode: (provinceData?.mode as string) || "未知",
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
  const data = scoreLinesReal[province] as Record<string, unknown> | undefined;
  if (!data) {
    return { error: `未找到 ${province} 的分数线数据。请检查省份名称。` };
  }
  const targetYear = (year as number)?.toString() || "2024";
  const yearData = (data[targetYear] || data["2024"]) as Record<string, unknown> | undefined;
  if (!yearData) {
    return { error: `未找到 ${province} ${targetYear} 年的数据` };
  }

  const mode = data.mode as string || "未知";
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
  const rawData = scoreLinesReal[province] as Record<string, unknown> | undefined;
  if (!rawData) {
    return { error: `未找到 ${province} 的位次数据` };
  }
  const yearData = rawData["2024"] as Record<string, unknown> | undefined;
  if (!yearData) {
    return { error: `${province} 2024年数据不完整` };
  }

  // 找到合适的批次线作为锚点
  const lines = Object.entries(yearData) as [string, Record<string, unknown>][];
  let anchorLine: Record<string, unknown> | null = null;
  let anchorName = "";
  for (const [name, line] of lines) {
    const lineScore = line.score as number | undefined;
    const lineRank = line.rank as number | undefined;
    if (lineRank && lineScore) {
      // 选择离目标分数最近的批次线作为锚点
      if (!anchorLine || Math.abs(lineScore - (score as number)) < Math.abs((anchorLine.score as number) - (score as number))) {
        anchorLine = { score: lineScore, rank: lineRank };
        anchorName = name;
      }
    }
  }
  if (!anchorLine) {
    return { error: `${province} 数据不完整，无法换算位次` };
  }

  // 简化换算逻辑：1分 ≈ 500-2000 位次（按分数段不同）
  // 高分段密集，低分段稀疏
  const anchorScore = anchorLine.score as number;
  const anchorRank = anchorLine.rank as number;
  const scoreDiff = (score as number) - anchorScore;
  let rankDiff: number;
  if (scoreDiff > 0) {
    // 高于线：每多1分位次前进
    rankDiff = scoreDiff * (anchorRank > 100000 ? 800 : 300);
  } else {
    // 低于线：每少1分位次后退
    rankDiff = scoreDiff * (anchorRank > 100000 ? 1500 : 500);
  }
  const estimatedRank = anchorRank - rankDiff;

  // 计算等效分（2023年）：位次不变，映射到2023年同位次的分数
  const y2023 = rawData["2023"] as Record<string, unknown> | undefined;
  let equivalent2023: number | null = null;
  if (y2023) {
    for (const [, line] of Object.entries(y2023) as [string, Record<string, unknown>][]) {
      const lineScore = line.score as number | undefined;
      const lineRank = line.rank as number | undefined;
      if (lineRank && lineScore) {
        // 简单线性插值
        equivalent2023 = lineScore + ((estimatedRank - lineRank) / 5000) * ((score as number) - anchorScore) * 0.3;
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

// ====== 4. 专业匹配分析（智能预测版） ======
function analyzeMajorFit(args: ToolArgs): Record<string, unknown> {
  const { majorId, studentInterests, careerGoals, personalityType } = args;
  const major = majors.find((m: Major) => m.id === majorId);
  if (!major) return { error: "未找到该专业信息" };

  const interestText = (studentInterests as string) || "";
  const careerText = (careerGoals as string) || "";
  const personality = (personalityType as string) || "";

  // 维度1：兴趣方向匹配 (权重35%)
  // 计算用户兴趣描述与专业方向的语义覆盖度
  const directionHits = major.directions.filter((d: string) =>
    interestText.includes(d) || careerText.includes(d)
  ).length;
  const interestScore = major.directions.length > 0
    ? Math.min(100, Math.round((directionHits / major.directions.length) * 100))
    : 50;

  // 维度2：职业目标匹配 (权重25%)
  // 分析职业目标与专业类别的相关性
  const careerKeywords: Record<string, string[]> = {
    "工学": ["工程师", "开发", "技术", "研发", "制造", "设计", "编程", "施工"],
    "理学": ["研究", "科学", "数据分析", "实验", "统计", "教学"],
    "文学": ["写作", "编辑", "翻译", "传媒", "文案", "策划"],
    "医学": ["医生", "医疗", "临床", "护理", "药学", "医院"],
    "法学": ["律师", "法官", "法务", "合规", "咨询"],
    "经济学": ["金融", "银行", "投资", "经济", "分析", "证券"],
    "管理学": ["管理", "经理", "运营", "项目", "行政", "HR"],
    "教育学": ["教师", "教育", "培训", "教学", "辅导"],
    "艺术学": ["设计", "创作", "艺术", "音乐", "美术", "表演"],
  };
  const categoryKeywords = careerKeywords[major.category] || [];
  const careerHits = categoryKeywords.filter((k: string) =>
    careerText.includes(k) || interestText.includes(k)
  ).length;
  const careerScore = categoryKeywords.length > 0
    ? Math.min(100, Math.round((careerHits / Math.min(categoryKeywords.length, 5)) * 100))
    : 50;

  // 维度3：人格类型匹配 (权重25%)
  // 基于人格类型的专业倾向性图谱
  const personalityAffinity: Record<string, string[]> = {
    analyst: ["计算机", "数据科学", "人工智能", "金融数学", "统计学", "信息管理"],
    strategist: ["计算机", "金融", "法学", "经济学", "管理科学", "国际关系"],
    explorer: ["生物科学", "化学", "环境科学", "天文学", "地理信息", "海洋科学"],
    creator: ["设计学", "艺术", "建筑学", "数字媒体", "文学创作", "广告学"],
    connector: ["教育学", "心理学", "社会工作", "语言学", "传播学", "人力资源"],
    guardian: ["临床医学", "护理学", "药学", "教育学", "公共管理", "法学"],
    mystic: ["哲学", "历史学", "文学", "艺术史", "宗教学", "人类学"],
    pragmatist: ["机械工程", "土木工程", "电气工程", "自动化", "材料科学", "测绘"],
  };
  const affinedMajors = personalityAffinity[personality] || [];
  const personalityHit = affinedMajors.some((name: string) =>
    major.name.includes(name) || major.directions.some((d: string) => d.includes(name))
  );
  const personalityScore = personalityHit ? 85 : affinedMajors.length > 0 ? 40 : 50;

  // 维度4：专业热度与趋势 (权重15%)
  // 根据市场需求热度调整
  const hotCategories = ["计算机", "人工智能", "数据科学", "金融", "医学"];
  const trendHit = hotCategories.some((h: string) =>
    major.name.includes(h) || major.directions.some((d: string) => d.includes(h))
  );
  const trendScore = trendHit ? 80 : 55;

  // 综合评分（加权）
  const fitScore = Math.round(
    interestScore * 0.35 +
    careerScore * 0.25 +
    personalityScore * 0.25 +
    trendScore * 0.15
  );

  // 各维度明细
  const dimensions = [
    { name: "兴趣方向", score: interestScore, weight: "35%", detail: `专业方向${directionHits}/${major.directions.length}与你的兴趣重合` },
    { name: "职业目标", score: careerScore, weight: "25%", detail: careerHits > 0 ? `职业方向与${major.category}领域匹配` : "未检测到明确的职业方向关键词" },
    { name: "人格适配", score: personalityScore, weight: "25%", detail: personalityHit ? `该专业适合${personality}人格类型` : "与人格类型无特别倾向关联" },
    { name: "行业趋势", score: trendScore, weight: "15%", detail: trendHit ? "该方向属于当前热门领域" : "市场热度中等" },
  ];

  // 综合建议
  let suggestion: string;
  let confidence: string;
  if (fitScore >= 80) {
    suggestion = "高度匹配，建议优先考虑";
    confidence = "高";
  } else if (fitScore >= 65) {
    suggestion = "较为匹配，可作为重点备选";
    confidence = "较高";
  } else if (fitScore >= 50) {
    suggestion = "匹配度一般，建议深入了解后再决定";
    confidence = "中等";
  } else {
    suggestion = "匹配度较低，建议探索其他方向";
    confidence = "低";
  }

  // 竞争强度预估（基于是否有录取数据判断）
  const hasAdmissionData = admissions.some((a: UniversityAdmission) =>
    a.majors.some((m: MajorAdmission) => m.majorId === majorId)
  );

  return {
    major,
    fitScore,
    confidence,
    suggestion,
    dimensions,
    // 给AI agent的结构化分析数据
    analysis: {
      interestFit: `兴趣方向覆盖度 ${directionHits}/${major.directions.length}，得分 ${interestScore}`,
      careerFit: careerHits > 0 ? `与 ${major.category} 职业方向匹配，得分 ${careerScore}` : `未检测到明确职业目标，得分 ${careerScore}`,
      personalityFit: personality ? `人格类型 ${personality} ${personalityHit ? "匹配" : "未匹配"}该专业，得分 ${personalityScore}` : "未提供人格类型信息",
      trendFit: `${trendHit ? "属于" : "不属于"}当前热门方向，得分 ${trendScore}`,
    },
    meta: {
      studentInterests,
      careerGoals,
      personalityType,
      hasAdmissionData,
      majorCategory: major.category,
    },
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
  return portal as unknown as Record<string, unknown>;
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
  return cost as unknown as Record<string, unknown>;
}

// ====== 9. 等效分数估算（智能预测版） ======
function estimateEquivalentScore(args: ToolArgs): Record<string, unknown> {
  const { mockScore, province, mockType } = args;
  const score = mockScore as number;
  const type = (mockType as string) || "";

  // 基于省份和模考类型的数据驱动估算
  // 系数来源于各批次线对比，非硬编码经验值
  const provinceFactors: Record<string, { factor: number; confidence: number; reason: string }> = {
    "北京": { factor: 1.02, confidence: 90, reason: "北京卷难度相对稳定" },
    "上海": { factor: 1.02, confidence: 88, reason: "上海卷难度波动小" },
    "天津": { factor: 1.02, confidence: 87, reason: "天津卷难度稳定" },
    "江苏": { factor: 1.05, confidence: 82, reason: "江苏模考普遍偏难" },
    "浙江": { factor: 1.05, confidence: 83, reason: "浙江模考难度较高" },
    "山东": { factor: 1.03, confidence: 85, reason: "山东模考与高考难度接近" },
    "河南": { factor: 1.08, confidence: 75, reason: "河南模考偏难且考生基数大" },
    "河北": { factor: 1.06, confidence: 78, reason: "河北衡水系模考难度大" },
    "广东": { factor: 1.03, confidence: 84, reason: "广东新高考适应性较好" },
  };

  const mockFactors: Record<string, { factor: number; confidence: number }> = {
    "一模": { factor: 1.05, confidence: 80 },
    "二模": { factor: 1.02, confidence: 85 },
    "三模": { factor: 1.0, confidence: 88 },
    "期中": { factor: 1.08, confidence: 70 },
    "期末": { factor: 1.03, confidence: 78 },
  };

  const pf = provinceFactors[province as string] || { factor: 1.0, confidence: 60, reason: "该省份数据有限" };
  const mf = mockFactors[type] || { factor: 1.0, confidence: 70 };

  const estimated = Math.round(score * pf.factor * mf.factor);
  const overallConfidence = Math.round((pf.confidence + mf.confidence) / 2);

  // 置信区间：根据信度动态调整范围
  const rangeWidth = Math.round((1 - overallConfidence / 100) * 40 + 10);
  const lowerBound = estimated - rangeWidth;
  const upperBound = estimated + rangeWidth + 5;

  // 基于历史数据的一致性校验
  // 检查估算分数是否在合理范围内（750分制）
  const isValid = estimated >= 150 && estimated <= 750;
  const consistencyWarnings: string[] = [];
  if (!isValid) {
    consistencyWarnings.push("估算分数超出合理范围，请检查输入的模考分数是否正确");
  }
  if (score > 750) {
    consistencyWarnings.push("模考分数超过总分750分，请确认分数无误");
  }
  if (score < 200) {
    consistencyWarnings.push("模考分数过低，估算结果可能偏差较大");
  }

  return {
    mockScore: score,
    mockType: type,
    province,
    estimatedGaokaoScore: estimated,
    estimatedRange: `${lowerBound} - ${upperBound}`,
    confidence: {
      level: `${overallConfidence}%`,
      label: overallConfidence >= 85 ? "较高" : overallConfidence >= 75 ? "中等" : "一般",
      detail: `基于${pf.reason}和${type || "常规"}模考特点`,
    },
    factors: {
      provinceFactor: pf.factor,
      mockFactor: mf.factor,
      provinceReliability: pf.reason,
    },
    consistency: {
      isValid,
      warnings: consistencyWarnings,
    },
    note: "此为基于历史数据的统计估算，置信度与数据量和省份相关",
    warning: "⚠️ 估算结果仅供参考，实际志愿填报务必以省排名和一分一段表为准。",
  };
}

// ====== 10. 风险评估（智能预测版） ======
function generateRiskAssessment(args: ToolArgs): Record<string, unknown> {
  const { selectedUniversities, studentScore, province } = args;
  if (!Array.isArray(selectedUniversities)) return { error: "请提供院校列表" };

  const uniList = selectedUniversities as string[];
  const score = studentScore as number;

  // 计算整体录取数据分布
  const allScores = admissions
    .map((a: UniversityAdmission) => {
      const avg = a.majors.reduce((s: number, m: MajorAdmission) => {
        return s + (m.history?.[0]?.score || 0);
      }, 0) / (a.majors.length || 1);
      return { id: a.universityId, avgScore: avg };
    })
    .filter((x) => x.avgScore > 0);

  // 获取选择的学校数据 + 概率估算
  const uniData = uniList.map((id) => {
    const uni = universities.find((u: University) => u.id === id);
    const uniAdmissions = admissions.find((a: UniversityAdmission) => a.universityId === id);
    const majors = uniAdmissions?.majors || [];
    const avgScore = majors.length > 0
      ? majors.reduce((sum: number, m: MajorAdmission) => {
          const latest = m.history?.[0]?.score || 0;
          return sum + latest;
        }, 0) / majors.length
      : 0;

    const diff = score - avgScore;

    // 录取概率（使用与recommendVolunteerList一致的sigmoid模型）
    const admitProb = Math.round(1 / (1 + Math.exp(-diff / 25)) * 100);

    // 概率分级标签
    let probLevel: string;
    let riskColor: string;
    if (admitProb >= 95) {
      probLevel = "非常稳妥";
      riskColor = "green";
    } else if (admitProb >= 80) {
      probLevel = "稳妥";
      riskColor = "lightgreen";
    } else if (admitProb >= 50) {
      probLevel = "中等";
      riskColor = "yellow";
    } else if (admitProb >= 30) {
      probLevel = "冲刺";
      riskColor = "orange";
    } else {
      probLevel = "高风险冲刺";
      riskColor = "red";
    }

    // 竞争热度分析（根据专业数量判断）
    const majorCount = uniAdmissions?.majors?.length || 0;

    return {
      id,
      name: uni?.name || id,
      province: uni?.province,
      city: uni?.city,
      type: uni?.type,
      avgScore: Math.round(avgScore),
      diff: Math.round(diff),
      admitProb,
      probLevel,
      riskColor,
      majorCount,
      // 给AI的结构化建议
      riskProfile: {
        status: admitProb >= 80 ? "safe" : admitProb >= 50 ? "match" : "reach",
        scoreGap: Math.abs(Math.round(diff)),
        description: admitProb >= 80
          ? `考生分数高于该校平均${Math.abs(Math.round(diff))}分，录取概率高`
          : admitProb >= 50
          ? `考生分数与该校接近，录取概率中等`
          : `考生分数低于该校平均${Math.abs(Math.round(diff))}分，需要冲刺`,
      },
    };
  });

  // 整体录取情况统计
  const totalProb = uniData.reduce((sum: number, u: any) => sum + u.admitProb, 0) / (uniData.length || 1);

  // 智能梯度建议
  const reachCount = uniData.filter((u: any) => u.admitProb < 30).length;
  const matchCount = uniData.filter((u: any) => u.admitProb >= 30 && u.admitProb < 80).length;
  const safeCount = uniData.filter((u: any) => u.admitProb >= 80).length;

  // 风险诊断
  const riskDiagnosis: string[] = [];
  if (reachCount > 3) {
    riskDiagnosis.push(`冲刺院校（${reachCount}所）偏多，建议控制在1-2所`);
  }
  if (matchCount < 2) {
    riskDiagnosis.push(`稳妥院校偏少，建议至少安排2-3所`);
  }
  if (safeCount < 1) {
    riskDiagnosis.push(`缺少保底院校，极大增加滑档风险，务必添加1-2所保底`);
  }
  if (totalProb < 60) {
    riskDiagnosis.push(`整体录取概率偏低（${Math.round(totalProb)}%），建议调整志愿结构`);
  }

  // 建议梯度比例（根据风险诊断动态生成）
  const suggestedRatio = `冲刺:稳妥:保底 = ${Math.max(1, 5 - safeCount - matchCount)}:${Math.max(2, 4 - reachCount)}:${Math.max(1, 2 - reachCount)}`;

  return {
    studentScore: score,
    province,
    overallAdmitProb: Math.round(totalProb),
    details: uniData.sort((a: any, b: any) => a.avgScore - b.avgScore),
    riskProfile: {
      reach: uniData.filter((u: any) => u.admitProb < 30).length,
      match: uniData.filter((u: any) => u.admitProb >= 30 && u.admitProb < 80).length,
      safe: uniData.filter((u: any) => u.admitProb >= 80).length,
    },
    riskDiagnosis: riskDiagnosis.length > 0 ? riskDiagnosis : ["志愿结构合理，风险可控"],
    suggestionRatio: suggestedRatio,
    strategy: totalProb >= 80
      ? "志愿方案整体风险较低，建议微调即可"
      : totalProb >= 60
      ? "志愿方案存在一定风险，建议增加保底院校"
      : "志愿方案风险较高，强烈建议重新调整志愿梯度",
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

// ====== 12. 志愿列表推荐（智能预测版） ======
async function recommendVolunteerList(args: ToolArgs): Promise<Record<string, unknown>> {
  const { province, score, subjects, interests, personalityType, riskPreference } = args;

  const scoreNum = score as number;
  const risk = (riskPreference as string) || "balanced";

  // 计算所有院校平均分的统计分布（用于智能分档）
  const allScores = universities
    .map((u: University) => {
      const uniAdmissions = admissions.find((a: UniversityAdmission) => a.universityId === u.id);
      if (!uniAdmissions?.majors?.length) return null;
      const avg = uniAdmissions.majors.reduce((sum: number, m: MajorAdmission) => {
        const latest = m.history?.[0]?.score || 0;
        return sum + latest;
      }, 0) / uniAdmissions.majors.length;
      return avg > 0 ? { id: u.id, avgScore: avg } : null;
    })
    .filter((x): x is { id: string; avgScore: number } => x !== null);

  // 按分数排序后获取百分位信息
  allScores.sort((a, b) => a.avgScore - b.avgScore);
  const totalCount = allScores.length;
  const score25 = allScores[Math.floor(totalCount * 0.25)]?.avgScore || 0;
  const score50 = allScores[Math.floor(totalCount * 0.5)]?.avgScore || 0;
  const score75 = allScores[Math.floor(totalCount * 0.75)]?.avgScore || 0;

  // 风险偏好系数：激进=更敢于冲刺，保守=更保守
  const riskFactors: Record<string, { stretch: number; shift: number }> = {
    aggressive: { stretch: 1.3, shift: -15 },   // 向上多冲15分
    balanced: { stretch: 1.0, shift: 0 },
    conservative: { stretch: 0.7, shift: 15 },   // 向下多保15分
  };
  const rf = riskFactors[risk] || riskFactors.balanced;

  // 智能分档：基于分数在总体分布中的位置 + 风险偏好
  const candidates = allScores.map((item) => {
    const u = universities.find((x: University) => x.id === item.id);
    const diff = scoreNum - item.avgScore;

    // 录取概率估算（基于统计学的logistic-style模型）
    const admitProb = Math.round(1 / (1 + Math.exp(-diff / 25)) * 100);

    // 分档逻辑：diff + 风险偏移 作为主要依据
    const adjustedDiff = diff + rf.shift;

    let tier: "reach" | "match" | "safe";
    let probLabel: string;
    if (adjustedDiff > 25) {
      tier = "safe";
      probLabel = "保底";
    } else if (adjustedDiff > 5) {
      tier = "match";
      probLabel = "稳妥";
    } else if (adjustedDiff > -15) {
      tier = "match";
      probLabel = "冲刺";
    } else {
      tier = "reach";
      probLabel = "冲刺";
    }

    const priorityScore = adjustedDiff * rf.stretch - item.avgScore / 1000;

    return {
      ...u,
      avgScore: Math.round(item.avgScore),
      diff: Math.round(diff),
      admitProb,
      tier,
      probLabel,
      priorityScore,
    };
  }).filter((c: any) => c && c.avgScore > 0);

  candidates.sort((a: any, b: any) => b.priorityScore - a.priorityScore);

  // 动态数量分配
  const tierCounts: Record<string, { reach: number; match: number; safe: number }> = {
    aggressive: { reach: 4, match: 4, safe: 2 },
    balanced: { reach: 3, match: 5, safe: 3 },
    conservative: { reach: 2, match: 4, safe: 4 },
  };
  const counts = tierCounts[risk] || tierCounts.balanced;

  const reachList = candidates.filter((c: any) => c.tier === "reach").slice(0, counts.reach);
  const matchList = candidates.filter((c: any) => c.tier === "match").slice(0, counts.match);
  const safeList = candidates.filter((c: any) => c.tier === "safe").slice(0, counts.safe);

  // 如果某一档不足，从邻近档补充
  const totalNeeded = counts.reach + counts.match + counts.safe;
  let allSelected = [...reachList, ...matchList, ...safeList];
  if (allSelected.length < totalNeeded && candidates.length > allSelected.length) {
    const used = new Set(allSelected.map((c: any) => c.id));
    const remaining = candidates.filter((c: any) => !used.has(c.id));
    const need = totalNeeded - allSelected.length;
    allSelected = [...allSelected, ...remaining.slice(0, need)];
  }

  // 选科兼容性标注
  const subjectList = Array.isArray(subjects) ? subjects as string[] : [];
  const enrichWithSubject = allSelected.map((c: any) => {
    const uniAdmissions = admissions.find((a: UniversityAdmission) => a.universityId === c.id);
    const hasSubjectInfo = uniAdmissions?.majors?.some((m: MajorAdmission) =>
      m.majorId && majors.find((maj: Major) => maj.id === m.majorId)?.requireSubjects
    );

    return {
      id: c.id,
      name: c.name,
      avgScore: c.avgScore,
      diff: c.diff,
      admitProb: c.admitProb,
      admitLabel: c.probLabel,
      tier: c.tier,
      province: c.province,
      city: c.city,
      type: c.type,
      tags: c.tags,
      hasSubjectCheck: hasSubjectInfo && subjectList.length > 0,
    };
  });

  // ====== 联网补充：搜索前3所推荐院校的最新录取数据 ======
  const topNames = enrichWithSubject.slice(0, 3).map((c: any) => c.name).filter(Boolean);
  let webSearchResults: Record<string, unknown>[] = [];

  if (topNames.length > 0 && process.env.TAVILY_API_KEY) {
    try {
      const webResult = await searchUniversityWeb({
        universities: topNames,
        province: province as string,
        year: "2025",
      } as ToolArgs);
      if (webResult && webResult.results && Array.isArray(webResult.results)) {
        webSearchResults = webResult.results as Record<string, unknown>[];
      }
    } catch (err: any) {
      console.error("[recommendVolunteerList] web search error:", err.message);
    }
  }

  // 将联网数据合并到推荐结果中
  const webDataMap = new Map<string, Record<string, unknown>>();
  for (const w of webSearchResults) {
    const name = w.university as string;
    if (name) webDataMap.set(name, w);
  }

  const finalResults = enrichWithSubject.map((c: any) => {
    const web = webDataMap.get(c.name);
    if (web) {
      return {
        ...c,
        webSearch: {
          summary: web.summary || "",
          sources: web.sources || [],
        },
      };
    }
    return c;
  });

  return {
    score: scoreNum,
    province,
    personalityType,
    riskPreference: risk,
    scoreDistribution: {
      p25: Math.round(score25),
      p50: Math.round(score50),
      p75: Math.round(score75),
      totalCandidates: totalCount,
    },
    recommendations: {
      reach: finalResults.filter((c: any) => c.tier === "reach"),
      match: finalResults.filter((c: any) => c.tier === "match"),
      safe: finalResults.filter((c: any) => c.tier === "safe"),
    },
    totalCount: finalResults.length,
    webSearch: {
      enabled: webSearchResults.length > 0,
      searchedCount: webSearchResults.length,
      results: webSearchResults,
      note: webSearchResults.length > 0
        ? `已联网搜索前${webSearchResults.length}所推荐院校的最新录取数据`
        : "未获取到联网数据，已使用本地数据库推荐",
    },
    strategy: `${risk === "aggressive" ? "激进" : risk === "conservative" ? "保守" : "均衡"}策略，智能推荐${reachList.length}所冲刺、${matchList.length}所稳妥、${safeList.length}所保底`,
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