"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Target, X } from "lucide-react";

interface ScoreCardProps {
  onSelect: (score: number) => void;
  onDismiss: () => void;
}

export default function ScoreCard({ onSelect, onDismiss }: ScoreCardProps) {
  const [score, setScore] = useState("");

  const handleConfirm = () => {
    const num = parseInt(score);
    if (!isNaN(num) && num >= 0 && num <= 750) {
      onSelect(num);
      setScore("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 4px 20px rgba(19, 35, 58, 0.08)",
        border: "1px solid rgba(19, 35, 58, 0.06)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: "var(--blue-50)" }}>
        <div className="flex items-center gap-2">
          <Target size={16} style={{ color: "var(--blue)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--blue)" }}>
            输入你的分数
          </span>
        </div>
        <button onClick={onDismiss} className="p-1 rounded-full hover:bg-white/50 transition-colors">
          <X size={14} style={{ color: "var(--ink-muted)" }} />
        </button>
      </div>

      {/* Input */}
      <div className="p-3">
        <div className="relative mb-2">
          <input
            type="number"
            placeholder="0-750"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm font-bold text-center"
            style={{
              background: "rgba(19, 35, 58, 0.04)",
              border: "1px solid rgba(19, 35, 58, 0.08)",
              color: "var(--ink)",
            }}
            min="0"
            max="750"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "var(--ink-muted)" }}>
            分
          </span>
        </div>

        {/* Quick Select */}
        <div className="flex gap-1.5">
          {[450, 500, 550, 600, 650].map((s) => (
            <button
              key={s}
              onClick={() => setScore(s.toString())}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: score === s.toString() ? "var(--blue)" : "rgba(19, 35, 58, 0.04)",
                color: score === s.toString() ? "#fff" : "var(--ink)",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Confirm */}
      {score && (
        <div className="px-3 pb-3">
          <button
            onClick={handleConfirm}
            disabled={parseInt(score) < 0 || parseInt(score) > 750}
            className="w-full py-2 rounded-lg text-xs font-bold transition-all"
            style={{
              background: parseInt(score) >= 0 && parseInt(score) <= 750
                ? "linear-gradient(135deg, var(--blue) 0%, var(--blue-light) 100%)"
                : "rgba(19, 35, 58, 0.1)",
              color: parseInt(score) >= 0 && parseInt(score) <= 750 ? "#fff" : "var(--ink-muted)",
              boxShadow: parseInt(score) >= 0 && parseInt(score) <= 750
                ? "0 2px 8px rgba(74, 111, 165, 0.3)"
                : "none",
            }}
          >
            确认：{score}分
          </button>
        </div>
      )}
    </motion.div>
  );
}