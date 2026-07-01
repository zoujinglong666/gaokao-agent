"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Send } from "lucide-react";

interface SubjectCardProps {
  onSelect: (subjects: string[]) => void;
  onDismiss: () => void;
}

const SUBJECTS = {
  priority: ["物理", "历史"],
  optional: ["化学", "生物", "政治", "地理"],
};

export default function SubjectCard({ onSelect, onDismiss }: SubjectCardProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [mode, setMode] = useState<"3+1+2" | "3+3">("3+1+2");
  const [sending, setSending] = useState(false);

  const toggleSubject = (subject: string) => {
    setSelected((prev) => {
      const isPriority = SUBJECTS.priority.includes(subject);
      const isOptional = SUBJECTS.optional.includes(subject);

      if (isPriority) {
        return prev.filter((s) => !SUBJECTS.priority.includes(s)).concat(subject);
      }

      if (isOptional) {
        const filtered = prev.filter((s) => s !== subject);
        if (filtered.filter((s) => SUBJECTS.optional.includes(s)).length >= 2) {
          return prev;
        }
        return [...filtered, subject];
      }

      return prev;
    });
  };

  const handleConfirm = async () => {
    if (mode === "3+1+2" && selected.length !== 3) return;
    if (mode === "3+3" && selected.length < 3) return;
    
    setSending(true);
    onSelect(selected);
  };

  const canConfirm = mode === "3+1+2" ? selected.length === 3 : selected.length >= 3;

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
          <span className="text-sm font-medium" style={{ color: "var(--blue)" }}>
            选择你的科目
          </span>
        </div>
        <button onClick={onDismiss} className="p-1 rounded-full hover:bg-white/50 transition-colors">
          <X size={14} style={{ color: "var(--ink-muted)" }} />
        </button>
      </div>

      {/* Mode Toggle */}
      <div className="px-3 py-2 flex gap-1.5">
        <button
          onClick={() => setMode("3+1+2")}
          className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: mode === "3+1+2" ? "var(--blue)" : "rgba(19, 35, 58, 0.04)",
            color: mode === "3+1+2" ? "#fff" : "var(--ink-muted)",
          }}
        >
          3+1+2
        </button>
        <button
          onClick={() => setMode("3+3")}
          className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: mode === "3+3" ? "var(--blue)" : "rgba(19, 35, 58, 0.04)",
            color: mode === "3+3" ? "#fff" : "var(--ink-muted)",
          }}
        >
          3+3
        </button>
      </div>

      {/* Priority Subjects */}
      <div className="px-3 py-2">
        <p className="text-xs mb-1.5" style={{ color: "var(--ink-muted)" }}>首选科目（必选1门）</p>
        <div className="flex gap-1.5">
          {SUBJECTS.priority.map((subject) => (
            <button
              key={subject}
              onClick={() => toggleSubject(subject)}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all"
              style={{
                background: selected.includes(subject)
                  ? "linear-gradient(135deg, var(--blue) 0%, var(--blue-light) 100%)"
                  : "rgba(19, 35, 58, 0.04)",
                color: selected.includes(subject) ? "#fff" : "var(--ink)",
              }}
            >
              {selected.includes(subject) && <Check size={10} />}
              {subject}
            </button>
          ))}
        </div>
      </div>

      {/* Optional Subjects */}
      <div className="px-3 py-2">
        <p className="text-xs mb-1.5" style={{ color: "var(--ink-muted)" }}>再选科目（选2门）</p>
        <div className="grid grid-cols-2 gap-1.5">
          {SUBJECTS.optional.map((subject) => (
            <button
              key={subject}
              onClick={() => toggleSubject(subject)}
              className="py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all"
              style={{
                background: selected.includes(subject)
                  ? "linear-gradient(135deg, var(--blue) 0%, var(--blue-light) 100%)"
                  : "rgba(19, 35, 58, 0.04)",
                color: selected.includes(subject) ? "#fff" : "var(--ink)",
              }}
            >
              {selected.includes(subject) && <Check size={10} />}
              {subject}
            </button>
          ))}
        </div>
      </div>

      {/* Confirm */}
      {selected.length > 0 && (
        <div className="px-3 pb-3">
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || sending}
            className="w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
            style={{
              background: canConfirm && !sending
                ? "linear-gradient(135deg, var(--blue) 0%, var(--blue-light) 100%)"
                : "rgba(19, 35, 58, 0.1)",
              color: canConfirm && !sending ? "#fff" : "var(--ink-muted)",
              boxShadow: canConfirm && !sending ? "0 2px 8px rgba(74, 111, 165, 0.3)" : "none",
            }}
          >
            {sending ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full"
                />
                发送中...
              </>
            ) : canConfirm ? (
              <>
                <Send size={12} />
                确认：{selected.join(" + ")}
              </>
            ) : (
              `还需选择${mode === "3+1+2" ? 3 - selected.length : 0}门`
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
}