"use client";
import { motion } from "framer-motion";

interface ToolSkeletonProps {
  toolName?: string;
  count?: number;
  type?: "card" | "table" | "list" | "text";
}

const TOOL_LABELS: Record<string, string> = {
  search_universities: "正在搜索院校",
  get_university_detail: "正在查询院校详情",
  get_score_lines: "正在查询录取分数线",
  analyze_major_fit: "正在分析专业匹配度",
  get_career_prospects: "正在查询就业前景",
  get_major_ranking: "正在查询专业排名",
  recommend_volunteer_list: "正在智能推荐志愿",
  generate_risk_assessment: "正在评估方案风险",
  get_same_score_destinations: "正在查询同分去向",
  compare_universities: "正在对比院校",
  get_city_living_cost: "正在查询城市生活成本",
  estimate_equivalent_score: "正在估算等效分",
  get_province_portal: "正在获取官方网址",
  check_subject_compatibility: "正在校验选科可报范围",
  get_province_score_lines: "正在获取真实批次线",
  score_rank_convert: "正在换算位次",
  search_major_groups: "正在搜索院校专业组",
  analyze_major_group: "正在深度分析专业组",
  get_personality_analysis: "正在分析人格类型",
  generate_volunteer_table: "正在生成志愿表",
};

function Shimmer({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`relative overflow-hidden rounded ${className}`}
      style={{ background: "rgba(19,35,58,0.06)", ...style }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
        }}
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

export default function ToolSkeleton({ toolName, count = 1, type = "card" }: ToolSkeletonProps) {
  const label = toolName ? TOOL_LABELS[toolName] || "正在思考" : "AI 正在思考";

  return (
    <div className="space-y-2 my-2">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="rounded-xl p-3"
          style={{ background: "rgba(19,35,58,0.03)", border: "1px solid rgba(19,35,58,0.05)" }}
        >
          {/* 工具标签 */}
          <div className="flex items-center gap-2 mb-2.5">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="w-3 h-3 rounded-full border-2 border-t-transparent"
              style={{ borderColor: "var(--blue)", borderTopColor: "transparent" }}
            />
            <span className="text-xs" style={{ color: "var(--blue)" }}>
              {label}…
            </span>
          </div>

          {/* 内容骨架 */}
          {type === "card" && (
            <>
              <Shimmer className="h-3.5 mb-2" style={{ width: "65%" }} />
              <Shimmer className="h-3 mb-1.5" style={{ width: "90%" }} />
              <Shimmer className="h-3 mb-2" style={{ width: "78%" }} />
              <div className="flex gap-1.5 mt-2">
                <Shimmer className="h-5 rounded-md" style={{ width: "48px" }} />
                <Shimmer className="h-5 rounded-md" style={{ width: "56px" }} />
                <Shimmer className="h-5 rounded-md" style={{ width: "40px" }} />
              </div>
            </>
          )}

          {type === "table" && (
            <>
              <div className="flex gap-2 mb-2">
                <Shimmer className="h-3" style={{ width: "20%" }} />
                <Shimmer className="h-3" style={{ width: "30%" }} />
                <Shimmer className="h-3" style={{ width: "25%" }} />
                <Shimmer className="h-3" style={{ width: "15%" }} />
              </div>
              {[0, 1, 2, 3].map((r) => (
                <div key={r} className="flex gap-2 mb-1.5">
                  <Shimmer className="h-2.5" style={{ width: "20%" }} />
                  <Shimmer className="h-2.5" style={{ width: "30%" }} />
                  <Shimmer className="h-2.5" style={{ width: "25%" }} />
                  <Shimmer className="h-2.5" style={{ width: "15%" }} />
                </div>
              ))}
            </>
          )}

          {type === "list" && (
            <>
              {[0, 1, 2, 3, 4].map((r) => (
                <div key={r} className="flex items-center gap-2 mb-1.5">
                  <Shimmer className="w-3.5 h-3.5 rounded-full" />
                  <Shimmer className="h-3 flex-1" />
                </div>
              ))}
            </>
          )}

          {type === "text" && (
            <>
              <Shimmer className="h-3 mb-1.5" style={{ width: "100%" }} />
              <Shimmer className="h-3 mb-1.5" style={{ width: "95%" }} />
              <Shimmer className="h-3" style={{ width: "70%" }} />
            </>
          )}
        </motion.div>
      ))}
    </div>
  );
}
