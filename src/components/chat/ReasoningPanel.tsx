"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Brain, Search, CheckCircle2, Clock, Globe, BarChart3, GraduationCap, Award, Settings, List, Shield, TrendingUp, DollarSign, Users, Zap, MapPin, FileText } from "lucide-react";
import { ReasoningStep } from "@/lib/store";

const TOOL_ICONS: Record<string, any> = {
  get_current_time: Clock,
  web_search: Globe,
  search_universities: Search,
  get_university_detail: FileText,
  get_score_lines: BarChart3,
  analyze_major_fit: GraduationCap,
  get_career_prospects: TrendingUp,
  get_province_portal: MapPin,
  compare_universities: Users,
  get_city_living_cost: DollarSign,
  estimate_equivalent_score: Zap,
  generate_risk_assessment: Shield,
  get_personality_analysis: Brain,
  recommend_volunteer_list: Award,
  get_major_ranking: Award,
  get_same_score_destinations: Search,
  generate_volunteer_table: FileText,
  search_major_groups: List,
  analyze_major_group: Brain,
  get_province_score_lines: BarChart3,
  check_subject_compatibility: Settings,
  score_rank_convert: BarChart3,
};

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

export default function ReasoningPanel({ reasoning }: { reasoning?: ReasoningStep[] }) {
  const [expanded, setExpanded] = useState(false);

  if (!reasoning || reasoning.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-2 rounded-xl overflow-hidden"
      style={{
        background: "rgba(19, 35, 58, 0.03)",
        border: "1px solid rgba(19, 35, 58, 0.08)",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs"
        style={{ color: "var(--ink-muted)" }}
      >
        <div className="flex items-center gap-1.5">
          <Brain size={12} />
          <span>思考过程</span>
          <span className="opacity-60">({reasoning.length}步)</span>
        </div>
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {/* Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2 space-y-1.5">
              {reasoning.map((step, i) => {
                const Icon = step.toolName ? (TOOL_ICONS[step.toolName] || Search) : Brain;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs"
                    style={{ color: "var(--ink)" }}
                  >
                    <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5" style={{ background: "rgba(19, 35, 58, 0.08)" }}>
                      <span className="text-[9px] font-bold" style={{ color: "var(--ink-muted)" }}>
                        {i + 1}
                      </span>
                    </span>
                    <div className="flex-1">
                      {step.type === "thinking" && (
                        <div className="flex items-start gap-1.5">
                          <Brain size={11} className="mt-0.5 flex-shrink-0" style={{ color: "var(--blue)" }} />
                          <span className="opacity-80">{step.content.slice(0, 100)}...</span>
                        </div>
                      )}
                      {step.type === "tool_call" && (
                        <div className="flex items-start gap-1.5">
                          <Icon size={11} className="mt-0.5 flex-shrink-0" style={{ color: "var(--blue)" }} />
                          <span>
                            正在调用 <strong>{TOOL_NAMES[step.toolName!] || step.toolName}</strong>
                          </span>
                        </div>
                      )}
                      {step.type === "tool_result" && (
                        <div className="flex items-start gap-1.5">
                          <CheckCircle2 size={11} className="mt-0.5 flex-shrink-0" style={{ color: "var(--green)" }} />
                          <span>
                            <strong>{TOOL_NAMES[step.toolName!] || step.toolName}</strong> 完成 ({step.duration}ms)
                          </span>
                        </div>
                      )}
                      {step.type === "final" && (
                        <div className="flex items-start gap-1.5">
                          <CheckCircle2 size={11} className="mt-0.5 flex-shrink-0" style={{ color: "var(--blue)" }} />
                          <span className="font-medium">生成最终回答</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}