"use client";
import { useState, useMemo } from "react";
import Navbar from "@/components/ui/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import universitiesRaw from "@/lib/data/universities.json";
import portalsRaw from "@/lib/data/province-portals.json";
import { useAppStore } from "@/lib/store";
import Encouragement from "@/components/ui/Encouragement";

const universities = (universitiesRaw as any).universities;
const portals = (portalsRaw as any).portals as Array<{
  province: string;
  examInstituteUrl: string;
  scoreCheckUrl: string;
  volunteerSystemUrl: string;
  scoreTableUrl: string;
  scoreCheckDate?: string;
  volunteerFillDate?: string;
}>;

const allProvinces = [
  "北京", "天津", "河北", "山西", "内蒙古", "辽宁", "吉林", "黑龙江",
  "上海", "江苏", "浙江", "安徽", "福建", "江西", "山东", "河南",
  "湖北", "湖南", "广东", "广西", "海南", "重庆", "四川", "贵州",
  "云南", "西藏", "陕西", "甘肃", "青海", "宁夏", "新疆"
];

type Step = "province" | "score" | "recommending" | "results";

export default function JourneyPage() {
  const { profile, setProfile, shortlist, toggleShortlist } = useAppStore();
  const [step, setStep] = useState<Step>("province");
  const [scoreInput, setScoreInput] = useState("");
  const [recs, setRecs] = useState<{ reach: any[]; match: any[]; safety: any[] }>({ reach: [], match: [], safety: [] });
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);

  const portal = useMemo(() => portals.find((p: any) => p.province === profile.province), [profile.province]);

  const handleProvinceSelect = (province: string) => {
    setProfile({ province });
    setStep("score");
  };

  const generate = () => {
    const s = parseInt(scoreInput);
    if (!s || s < 0 || s > 750) return;
    setProfile({ score: s });
    setStep("recommending");
    setTimeout(() => {
      const reach: any[] = [], match: any[] = [], safety: any[] = [];

      // 极低分数（<150分）：无法推荐任何常规院校
      if (s < 150) {
        setRecs({ reach: [], match: [], safety: [] });
        setStep("results");
        return;
      }

      universities.forEach((u: any) => {
        const is9 = u.tags.includes("985"), is2 = u.tags.includes("211"), isD = u.tags.includes("双一流");
        if (s >= 650) {
          is9 ? (s >= 680 ? reach.push(u) : match.push(u)) : is2 ? safety.push(u) : null;
        } else if (s >= 600) {
          is9 ? reach.push(u) : is2 ? match.push(u) : isD ? safety.push(u) : null;
        } else if (s >= 550) {
          is2 ? reach.push(u) : isD ? match.push(u) : safety.push(u);
        } else if (s >= 500) {
          isD ? reach.push(u) : match.push(u);
        } else if (s >= 400) {
          // 400-499分：普通本科
          (!is9 && !is2 && !isD) ? match.push(u) : isD ? reach.push(u) : null;
        } else if (s >= 300) {
          // 300-399分：仅推荐非重点院校作为保底
          (!is9 && !is2 && !isD) ? safety.push(u) : null;
        } else if (s >= 200) {
          // 200-299分：专科层次，极少院校可推荐
          (!is9 && !is2 && !isD) ? safety.push(u) : null;
        }
        // 150-199分：不推荐任何院校
      });
      const sh = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);
      setRecs({ reach: sh(reach).slice(0, 5), match: sh(match).slice(0, 5), safety: sh(safety).slice(0, 5) });
      setStep("results");
    }, 2000);
  };

  const steps: { key: Step; label: string }[] = [
    { key: "province", label: "选择省份" },
    { key: "score", label: "输入分数" },
    { key: "results", label: "查看推荐" }
  ];
  const stepIdx = step === "recommending" ? 2 : steps.findIndex(s => s.key === step);

  return (
    <div className="min-h-dvh">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 mb-8"
        >
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <motion.div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all`}
                style={{
                  background: i === stepIdx ? "var(--blue)" : i < stepIdx ? "rgba(107,155,122,0.12)" : "rgba(19,35,58,0.04)",
                  color: i === stepIdx ? "#fff" : i < stepIdx ? "var(--success)" : "var(--ink-muted)",
                }}
                whileHover={i < stepIdx ? { scale: 1.05 } : {}}
              >
                {i < stepIdx ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px]">
                    {i + 1}
                  </span>
                )}
                <span className="hidden sm:inline">{s.label}</span>
              </motion.div>
              {i < 2 && (
                <motion.svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--ink-muted)"
                  strokeWidth="2"
                  opacity={i < stepIdx ? 0.6 : 0.3}
                >
                  <path d="M9 18l6-6-6-6" />
                </motion.svg>
              )}
            </div>
          ))}
        </motion.div>

        {/* Province Select */}
        <AnimatePresence mode="wait">
          {step === "province" && (
            <motion.div
              key="province"
              initial={{ opacity: 0, scale: 0.98, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -20 }}
              className="paper-card p-8 text-center"
            >
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl sm:text-3xl font-bold mb-2"
                style={{ color: "var(--ink)" }}
              >
                你来自哪个省份？
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-sm mb-8"
                style={{ color: "var(--ink-muted)" }}
              >
                选择后我帮你找到查分入口，然后推荐适合的院校
              </motion.p>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {allProvinces.map((p) => (
                  <motion.button
                    key={p}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: allProvinces.indexOf(p) * 0.02 }}
                    onClick={() => handleProvinceSelect(p)}
                    className="px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: hoveredProvince === p ? "var(--blue)" : "var(--blue-50)",
                      color: hoveredProvince === p ? "#fff" : "var(--ink-light)",
                    }}
                    onMouseEnter={() => setHoveredProvince(p)}
                    onMouseLeave={() => setHoveredProvince(null)}
                    whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(74, 111, 165, 0.2)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {p}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Score Input */}
          {step === "score" && portal && (
            <motion.div
              key="score"
              initial={{ opacity: 0, scale: 0.98, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -20 }}
              className="space-y-4"
            >
              <div className="paper-card p-8 text-center">
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl sm:text-3xl font-bold mb-1"
                  style={{ color: "var(--ink)" }}
                >
                  {profile.province}考生
                </motion.h2>
                {portal.scoreCheckDate && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full tag-gold text-xs mb-4"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    查分时间：{portal.scoreCheckDate}
                  </motion.div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-wrap justify-center gap-3 mb-6"
                >
                  <a
                    href={portal.scoreCheckUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-xs flex items-center gap-1"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 7h6M11 17h6M7 12h10" />
                    </svg>
                    前往查分入口
                  </a>
                  <a
                    href={portal.scoreTableUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-xs flex items-center gap-1"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    查看一分一段表
                  </a>
                </motion.div>
                {portal.volunteerFillDate && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-xs mb-4"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    填报时间：{portal.volunteerFillDate}
                  </motion.p>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="max-w-xs mx-auto"
                >
                  <label className="block text-xs font-medium mb-2 text-left" style={{ color: "var(--ink-muted)" }}>
                    高考分数 / 估分
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--ink-muted)" }}>
                      分
                    </span>
                    <input
                      type="number"
                      value={scoreInput}
                      onChange={(e) => setScoreInput(e.target.value)}
                      placeholder="如：620"
                      className="w-full px-8 py-3 text-xl text-center rounded-xl border-2 focus:outline-none transition-all"
                      style={{
                        borderColor: "rgba(74,111,165,0.2)",
                        background: "var(--blue-50)",
                        color: "var(--ink)",
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = "var(--blue)"}
                      onBlur={(e) => e.currentTarget.style.borderColor = "rgba(74,111,165,0.2)"}
                      max={750}
                      min={0}
                    />
                  </div>
                  {scoreInput && (parseInt(scoreInput) < 0 || parseInt(scoreInput) > 750) && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs mt-2 text-left"
                      style={{ color: "var(--danger)" }}
                    >
                      请输入有效的分数（0-750）
                    </motion.p>
                  )}
                </motion.div>
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  onClick={generate}
                  disabled={!scoreInput || parseInt(scoreInput) < 0 || parseInt(scoreInput) > 750}
                  className="btn-primary mt-6 w-full max-w-xs"
                  whileHover={{ scale: scoreInput && parseInt(scoreInput) >= 0 && parseInt(scoreInput) <= 750 ? 1.02 : 1 }}
                  whileTap={{ scale: scoreInput && parseInt(scoreInput) >= 0 && parseInt(scoreInput) <= 750 ? 0.98 : 1 }}
                >
                  开始智能匹配
                </motion.button>
              </div>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setStep("province")}
                className="btn-secondary mx-auto block text-xs"
              >
                重新选择省份
              </motion.button>
            </motion.div>
          )}

          {/* Loading */}
          {step === "recommending" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="paper-card p-16 text-center"
            >
              <motion.div
                className="relative w-16 h-16 mx-auto mb-6"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: "rgba(19,35,58,0.06)" }} />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-t-[var(--blue)] border-r-[var(--gold)]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-2 rounded-full border border-[var(--gold)] opacity-50"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl sm:text-2xl font-bold gradient-text mb-2"
              >
                正在匹配院校...
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm"
                style={{ color: "var(--ink-muted)" }}
              >
                {profile.province} {scoreInput}分 的最佳选择
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex justify-center gap-1 mt-6"
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ background: "var(--blue)" }}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* Results */}
          {step === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Encouragement score={profile.score || parseInt(scoreInput)} province={profile.province} />

              {/* 查分入口 & 官方链接 */}
              {portal && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="paper-card p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--blue-50)" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--blue)" }}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm" style={{ color: "var(--ink)" }}>{profile.province}高考官方入口</h3>
                      {portal.scoreCheckDate && (
                        <p className="text-[10px]" style={{ color: "var(--gold)" }}>查分时间：{portal.scoreCheckDate}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={portal.scoreCheckUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors"
                      style={{ background: "rgba(194,91,86,0.08)", color: "var(--danger)" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      查分入口
                    </a>
                    <a
                      href={portal.volunteerSystemUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors"
                      style={{ background: "var(--blue-50)", color: "var(--blue)" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                      志愿填报
                    </a>
                    <a
                      href={portal.scoreTableUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors"
                      style={{ background: "rgba(107,155,122,0.08)", color: "var(--success)" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                      一分一段表
                    </a>
                    <a
                      href={portal.examInstituteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors"
                      style={{ background: "var(--gold-50)", color: "var(--gold)" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      考试院官网
                    </a>
                  </div>
                  {portal.volunteerFillDate && (
                    <p className="text-[10px] mt-2" style={{ color: "var(--ink-muted)" }}>
                      📅 填报时间：{portal.volunteerFillDate}
                    </p>
                  )}
                </motion.div>
              )}

              <div className="paper-card p-6">
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl sm:text-2xl font-bold mb-1"
                  style={{ color: "var(--ink)" }}
                >
                  你的专属志愿方案
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm"
                  style={{ color: "var(--ink-muted)" }}
                >
                  {profile.province} &middot; {scoreInput}分 &middot; 共推荐{" "}
                  {recs.reach.length + recs.match.length + recs.safety.length}所院校
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex gap-3 mt-4"
                >
                  {[
                    { key: "reach", label: "冲刺", count: recs.reach.length, color: "var(--danger)", bg: "rgba(194,91,86,0.08)" },
                    { key: "match", label: "稳妥", count: recs.match.length, color: "var(--gold)", bg: "var(--gold-50)" },
                    { key: "safety", label: "保底", count: recs.safety.length, color: "var(--success)", bg: "rgba(107,155,122,0.08)" },
                  ].map((item) => (
                    <motion.div
                      key={item.key}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + ["reach", "match", "safety"].indexOf(item.key) * 0.1 }}
                      className="flex-1 text-center px-4 py-2 rounded-xl"
                      style={{ background: item.bg }}
                    >
                      <div className="text-xl font-bold font-mono" style={{ color: item.color }}>
                        {item.count}
                      </div>
                      <div className="text-[10px]" style={{ color: "var(--ink-muted)" }}>
                        {item.label}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {recs.reach.length + recs.match.length + recs.safety.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="paper-card p-8 text-center"
                >
                  <div className="text-4xl mb-4">📚</div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: "var(--ink)" }}>
                    暂无可推荐院校
                  </h3>
                  <p className="text-sm mb-4" style={{ color: "var(--ink-muted)" }}>
                    {parseInt(scoreInput) < 150
                      ? `您的分数（${scoreInput}分）低于常规院校录取最低分数线，系统无法生成有效的志愿推荐方案。`
                      : `当前分数段可匹配的院校较少，建议咨询当地招生考试机构或学校老师获取更精准的指导。`}
                  </p>
                  <div className="text-xs p-4 rounded-lg" style={{ background: "var(--blue-50)", color: "var(--ink-muted)" }}>
                    <p className="font-medium mb-2" style={{ color: "var(--ink)" }}>建议：</p>
                    <ul className="text-left space-y-1.5">
                      <li>• 考虑专科（高职）院校，许多优质专科院校就业前景良好</li>
                      <li>• 关注各省招生考试院官网，了解补录和征集志愿机会</li>
                      <li>• 考虑职业技能培训、继续教育等多元发展路径</li>
                      <li>• 如有升学意愿，可关注成人教育、自学考试等方式</li>
                    </ul>
                  </div>
                  {portal && (
                    <div className="mt-4">
                      <a
                        href={portal.scoreCheckUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium"
                        style={{ background: "var(--blue)", color: "#fff" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        前往{profile.province}查分入口
                      </a>
                    </div>
                  )}
                </motion.div>
              ) : (
                <>
              {([
                ["reach", "冲刺院校", "var(--danger)", "有挑战但值得尝试"],
                ["match", "稳妥院校", "var(--gold)", "最匹配你的选择"],
                ["safety", "保底院校", "var(--success)", "确保有学可上"]
              ] as const).map(([key, title, color, sub]) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                    <h3 className="font-bold" style={{ color: "var(--ink)" }}>{title}</h3>
                    <span className="text-xs" style={{ color: "var(--ink-muted)" }}>{sub}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(recs as any)[key].map((u: any, i: number) => (
                      <motion.div
                        key={u.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="paper-card p-4 glass-card-hover"
                        whileHover={{ y: -2 }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-sm" style={{ color: "var(--ink)" }}>
                              {u.name}
                            </div>
                            <div className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>
                              {u.city} &middot; {u.type}
                            </div>
                          </div>
                          <motion.button
                            onClick={() => toggleShortlist(u.id)}
                            className="text-sm transition-colors"
                            style={{ color: shortlist.includes(u.id) ? "var(--danger)" : "var(--ink-muted)" }}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {shortlist.includes(u.id) ? "❤️" : "🤍"}
                          </motion.button>
                        </div>
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {u.tags.filter((t: string) => t && t.trim()).map((t: string) => (
                            <span key={t} className="tag tag-blue text-[10px]">{t}</span>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
                </>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center gap-3 pb-8"
              >
                <motion.button
                  onClick={() => {
                    setStep("score");
                    setRecs({ reach: [], match: [], safety: [] });
                  }}
                  className="btn-secondary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  修改分数重新推荐
                </motion.button>
                <motion.a href="/chat" className="btn-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  进入 AI 深度咨询
                </motion.a>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}