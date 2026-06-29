"use client";
import { memo } from "react";
import { motion } from "framer-motion";
import MemoizedMarkdown from "@/components/chat/MemoizedMarkdown";
import ToolCallIndicator from "@/components/chat/ToolCallIndicator";
import DataWatermark from "@/components/ui/DataWatermark";
import CopyButton from "@/components/chat/CopyButton";
import { ChatMessage } from "@/lib/store";

interface MessageItemProps {
  msg: ChatMessage;
  index: number;
  streamingId?: string | null;
  formatTime: (date: Date) => string;
}

export default memo(function MessageItem({ msg, index, streamingId, formatTime }: MessageItemProps) {
  if (msg.role === "thinking") {
    return <div data-region="thinking-card" key={msg.id} />;
  }

  return (
    <motion.div
      key={msg.id}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[88%] sm:max-w-[85%] rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm leading-relaxed ${
          msg.role === "user" ? "text-white" : "glass-card"
        }`}
        style={
          msg.role === "user"
            ? { background: "var(--blue)" }
            : { color: "var(--ink)" }
        }
      >
        {msg.role === "assistant" && msg.toolCalls && msg.toolCalls.length > 0 && (
          <ToolCallIndicator toolCalls={msg.toolCalls} />
        )}
        {msg.role === "assistant" && (
          <div className="flex items-center gap-1.5 mt-2 mb-1 flex-wrap">
            <DataWatermark level="ai_generated" source="AI 生成" size="sm" />
            <span style={{ fontSize: "10px", color: "var(--ink-muted)", opacity: 0.6 }}>
              · 请结合官方信息核实
            </span>
            <CopyButton content={msg.content} />
          </div>
        )}
        <div className="whitespace-pre-wrap mt-1">
          <MemoizedMarkdown content={msg.content} />
        </div>
        <div
          className="text-xs mt-1 opacity-60"
          style={{ textAlign: "right" }}
        >
          {formatTime(msg.timestamp)}
        </div>
      </div>
    </motion.div>
  );
});