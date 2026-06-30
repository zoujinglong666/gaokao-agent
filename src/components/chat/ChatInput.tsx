"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

const MAX_LENGTH = 2000;

interface ChatInputProps {
  loading: boolean;
  onSend: (text: string) => void;
}

export default function ChatInput({ loading, onSend }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length > MAX_LENGTH) return;
    setInput(value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  };

  const charCount = input.length;
  const isNearLimit = charCount > MAX_LENGTH * 0.85;
  const canSend = input.trim().length > 0 && !loading;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`rounded-2xl transition-all duration-200 ${
        focused ? "shadow-lg" : "shadow-sm"
      }`}
      style={{
        background: focused
          ? "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))"
          : "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(20px) saturate(1.5)",
        WebkitBackdropFilter: "blur(20px) saturate(1.5)",
        border: focused
          ? "1.5px solid rgba(74, 111, 165, 0.4)"
          : "1px solid rgba(19, 35, 58, 0.08)",
      }}
    >
      <div className="flex items-end gap-2 p-2.5">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="问我任何志愿问题..."
            className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none resize-none"
            style={{
              background: "transparent",
              color: "var(--ink)",
              minHeight: "44px",
              maxHeight: "120px",
              lineHeight: "1.5",
            }}
            rows={1}
          />
          {charCount > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute right-2 bottom-1.5 text-[10px] font-mono"
              style={{
                color: isNearLimit ? "var(--danger)" : "var(--ink-muted)",
              }}
            >
              {charCount}
            </motion.div>
          )}
        </div>
        <motion.button
          onClick={handleSend}
          disabled={!canSend}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
            canSend ? "active:scale-95" : ""
          }`}
          style={{
            background: canSend
              ? "linear-gradient(135deg, var(--blue) 0%, var(--blue-light) 100%)"
              : "rgba(19, 35, 58, 0.06)",
            color: canSend ? "#fff" : "var(--ink-muted)",
            boxShadow: canSend
              ? "0 4px 12px rgba(74, 111, 165, 0.3)"
              : "none",
          }}
          whileHover={canSend ? { scale: 1.05 } : {}}
          whileTap={canSend ? { scale: 0.95 } : {}}
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}