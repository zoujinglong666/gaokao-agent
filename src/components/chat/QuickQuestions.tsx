"use client";
import { motion, AnimatePresence } from "framer-motion";

const quickQuestions = [
  { text: "我是山东考生，600分，推荐一些学校", icon: "🎯" },
  { text: "计算机和电子信息怎么选？", icon: "💻" },
  { text: "分析一下我的志愿方案风险", icon: "📊" },
  { text: "我模考580分，大概相当于高考多少？", icon: "📈" },
  { text: "北京有哪些211院校？", icon: "🏫" },
];

interface QuickQuestionsProps {
  show: boolean;
  onSend: (text: string) => void;
}

export default function QuickQuestions({ show, onSend }: QuickQuestionsProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="glass-card p-4 mb-3"
        >
          <div className="text-xs font-medium mb-3" style={{ color: "var(--ink-muted)" }}>
            💡 快速提问
          </div>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => onSend(q.text)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs"
                style={{ background: "var(--blue-50)", color: "var(--blue)" }}
                whileHover={{ scale: 1.02, background: "var(--blue)", color: "#fff" }}
                whileTap={{ scale: 0.98 }}
              >
                <span>{q.icon}</span>
                <span>{q.text}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}