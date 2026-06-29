"use client";
import { motion } from "framer-motion";

export type DataTrustLevel = "verified" | "estimated" | "demo" | "ai_generated";

interface DataWatermarkProps {
  level: DataTrustLevel;
  source?: string;
  size?: "sm" | "md";
  inline?: boolean;
}

const TRUST_CONFIG: Record<DataTrustLevel, { label: string; color: string; bg: string; icon: string; tip: string }> = {
  verified: {
    label: "官方数据",
    color: "#1a7a3a",
    bg: "rgba(26,122,58,0.08)",
    icon: "✓",
    tip: "数据来源于教育考试院/高校官方公布，可信度高",
  },
  estimated: {
    label: "估算数据",
    color: "#a86a00",
    bg: "rgba(168,106,0,0.10)",
    icon: "~",
    tip: "由 AI 基于官方数据推算，可能与实际有偏差",
  },
  demo: {
    label: "演示数据",
    color: "#a04040",
    bg: "rgba(160,64,64,0.10)",
    icon: "!",
    tip: "仅供演示，不代表真实情况，请勿用于实际填报",
  },
  ai_generated: {
    label: "AI 生成",
    color: "#5a5a8a",
    bg: "rgba(90,90,138,0.10)",
    icon: "✦",
    tip: "由 AI 生成的内容，仅供参考",
  },
};

export default function DataWatermark({ level, source, size = "sm", inline = false }: DataWatermarkProps) {
  const cfg = TRUST_CONFIG[level];
  const padding = size === "sm" ? "2px 6px" : "4px 10px";
  const fontSize = size === "sm" ? "10px" : "12px";
  const iconSize = size === "sm" ? "9px" : "11px";

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      title={`${cfg.tip}${source ? `\n来源: ${source}` : ""}`}
      style={{
        display: inline ? "inline-flex" : "inline-flex",
        alignItems: "center",
        gap: "3px",
        padding,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.color}30`,
        borderRadius: "3px",
        fontSize,
        fontWeight: "500",
        lineHeight: 1.2,
        cursor: "help",
        whiteSpace: "nowrap",
        verticalAlign: "middle",
      }}
    >
      <span style={{ fontSize: iconSize, fontWeight: "700" }}>{cfg.icon}</span>
      <span>{cfg.label}</span>
      {source && size === "md" && (
        <span style={{ opacity: 0.7, marginLeft: "2px" }}>· {source}</span>
      )}
    </motion.span>
  );
}

export function WatermarkText({ level }: { level: DataTrustLevel }) {
  return <DataWatermark level={level} size="sm" inline />;
}