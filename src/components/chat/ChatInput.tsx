"use client";
import { useState, useRef } from "react";
import { motion } from "framer-motion";

interface ChatInputProps {
  loading: boolean;
  onSend: (text: string) => void;
}

export default function ChatInput({ loading, onSend }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-card p-2.5 sm:p-3 flex gap-2"
    >
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="问我任何志愿问题..."
          className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl text-sm focus:outline-none resize-none"
          style={{
            background: "rgba(19,35,58,0.03)",
            color: "var(--ink)",
            minHeight: "44px",
            maxHeight: "120px",
          }}
          rows={1}
        />
        <div className="hidden sm:block absolute right-3 bottom-2.5 text-xs" style={{ color: "var(--ink-muted)" }}>
          Enter 发送
        </div>
      </div>
      <motion.button
        onClick={handleSend}
        disabled={!input.trim() || loading}
        className="btn-primary px-4 py-2.5 text-sm flex items-center gap-1"
        whileHover={{ scale: !input.trim() || loading ? 1 : 1.02 }}
        whileTap={{ scale: !input.trim() || loading ? 1 : 0.98 }}
      >
        {loading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
          />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M22 2H12l-2 10 4-4 4 4-2 10h10V2z" />
          </svg>
        )}
      </motion.button>
    </motion.div>
  );
}