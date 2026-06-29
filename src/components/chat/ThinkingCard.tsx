"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import ToolSkeleton from "@/components/ui/ToolSkeleton";

const THINKING_STEPS = [
  "正在理解你的问题…",
  "正在检索相关数据…",
  "正在分析并组织回答…",
];

export default function ThinkingCard() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % THINKING_STEPS.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div className="max-w-[88%] sm:max-w-[85%]">
        {/* 状态行 */}
        <div className="flex items-center gap-2 mb-2 px-1">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles size={14} style={{ color: "var(--blue)" }} />
          </motion.div>
          <AnimatePresence mode="wait">
            <motion.span
              key={step}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-xs"
              style={{ color: "var(--blue)" }}
            >
              {THINKING_STEPS[step]}
            </motion.span>
          </AnimatePresence>
        </div>
        {/* 骨架屏 */}
        <div className="glass-card p-3.5">
          <ToolSkeleton type="text" />
          <div className="h-2" />
          <ToolSkeleton type="card" />
        </div>
      </div>
    </motion.div>
  );
}