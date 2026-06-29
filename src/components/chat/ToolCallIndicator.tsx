"use client";
import { motion } from "framer-motion";
import { Search, CheckCircle2 } from "lucide-react";
import { type ToolCall } from "@/lib/store";

const toolIcons: Record<string, any> = {
  search_universities: Search,
  get_university_detail: Search,
  get_score_lines: Search,
  analyze_major_fit: Search,
  get_career_prospects: Search,
  get_province_portal: Search,
  compare_universities: Search,
  get_city_living_cost: Search,
  estimate_equivalent_score: Search,
  generate_risk_assessment: Search,
  get_personality_analysis: Search,
  recommend_volunteer_list: Search,
  get_major_ranking: Search,
  get_same_score_destinations: Search,
  generate_volunteer_table: Search,
};

const toolNames: Record<string, string> = {
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
};

export default function ToolCallIndicator({ toolCalls }: { toolCalls?: ToolCall[] }) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {toolCalls.map((tc, i) => {
        const Icon = toolIcons[tc.name] || Search;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
            style={{
              background: tc.status === "done" ? "var(--blue-50)" : "rgba(74,111,165,0.1)",
              color: "var(--blue)",
            }}
          >
            {tc.status === "done" ? (
              <CheckCircle2 size={12} />
            ) : (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Icon size={12} />
              </motion.div>
            )}
            <span>{toolNames[tc.name] || tc.name}</span>
          </motion.div>
        );
      })}
    </div>
  );
}