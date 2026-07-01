"use client";
import { motion } from "framer-motion";
import { MapPin, Target, BookOpen, CheckCircle } from "lucide-react";

interface CardSummaryProps {
  type: "province" | "score" | "subject";
  value: string;
}

const cardConfig = {
  province: {
    icon: MapPin,
    label: "省份",
    color: "var(--blue)",
    bg: "var(--blue-50)",
  },
  score: {
    icon: Target,
    label: "分数",
    color: "var(--gold)",
    bg: "var(--gold-50)",
  },
  subject: {
    icon: BookOpen,
    label: "选科",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.08)",
  },
};

export default function CardSummary({ type, value }: CardSummaryProps) {
  const config = cardConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-2 px-3 py-2 rounded-xl"
      style={{
        background: config.bg,
        border: `1px solid ${config.color}20`,
      }}
    >
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: config.color }}
      >
        <Icon size={12} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs" style={{ color: "var(--ink-muted)" }}>
            {config.label}
          </span>
          <CheckCircle size={10} style={{ color: config.color }} />
        </div>
        <div className="text-sm font-semibold truncate" style={{ color: "var(--ink)" }}>
          {value}
        </div>
      </div>
    </motion.div>
  );
}