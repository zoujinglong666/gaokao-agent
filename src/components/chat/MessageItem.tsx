"use client";
import { memo, useState } from "react";
import { motion } from "framer-motion";
import MemoizedMarkdown from "@/components/chat/MemoizedMarkdown";
import ToolCallIndicator from "@/components/chat/ToolCallIndicator";
import DataWatermark from "@/components/ui/DataWatermark";
import CopyButton from "@/components/chat/CopyButton";
import ReasoningPanel from "@/components/chat/ReasoningPanel";
import { ChatMessage } from "@/lib/store";
import SubjectCard from "@/components/chat/SubjectCard";
import ProvinceCard from "@/components/chat/ProvinceCard";
import ScoreCard from "@/components/chat/ScoreCard";
import { useAppStore } from "@/lib/store";

interface MessageItemProps {
  msg: ChatMessage;
  streamingId?: string | null;
  formatTime: (date: Date) => string;
}

export default memo(function MessageItem({ msg, streamingId, formatTime }: MessageItemProps) {
  const [hovered, setHovered] = useState(false);
  const { setProfile } = useAppStore();

  // 渲染智能卡片
  const renderCard = (cardType: string) => {
    switch (cardType) {
      case "subject":
        return (
          <SubjectCard
            onSelect={(subjects) => {
              setProfile({ subjects });
              // 自动发送选科信息
              fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  messages: [{ role: "user", content: `我的选科是：${subjects.join(" + ")}` }],
                  profile: useAppStore.getState().profile,
                }),
              });
            }}
            onDismiss={() => {}}
          />
        );
      case "province":
        return (
          <ProvinceCard
            onSelect={(province) => {
              setProfile({ province });
              fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  messages: [{ role: "user", content: `我是${province}的考生` }],
                  profile: useAppStore.getState().profile,
                }),
              });
            }}
            onDismiss={() => {}}
          />
        );
      case "score":
        return (
          <ScoreCard
            onSelect={(score) => {
              setProfile({ score });
              fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  messages: [{ role: "user", content: `我的分数是：${score}分` }],
                  profile: useAppStore.getState().profile,
                }),
              });
            }}
            onDismiss={() => {}}
          />
        );
      default:
        return null;
    }
  };

  if (msg.role === "thinking") {
    return <div data-region="thinking-card" key={msg.id} />;
  }

  return (
    <motion.div
      key={msg.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {msg.role === "assistant" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: hovered ? 1 : 0.7, scale: hovered ? 1 : 0.9 }}
          transition={{ duration: 0.2 }}
          className="w-7 h-7 rounded-2xl flex items-center justify-center flex-shrink-0 mr-2 mt-1"
          style={{
            background: "linear-gradient(135deg, var(--blue) 0%, var(--gold) 100%)",
            boxShadow: "0 2px 6px rgba(74,111,165,0.25)",
          }}
        >
          <span className="text-[10px] font-bold text-white">AI</span>
        </motion.div>
      )}
      <div className="flex flex-col gap-2 max-w-[88%] sm:max-w-[85%]">
        <div
          className={`rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm leading-relaxed group ${
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
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <DataWatermark level="ai_generated" source="AI 生成" size="sm" />
              <span style={{ fontSize: "10px", color: "var(--ink-muted)", opacity: 0.6 }}>
                · 请结合官方信息核实
              </span>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: hovered ? 1 : 0 }}
                transition={{ duration: 0.15 }}
              >
                <CopyButton content={msg.content} />
              </motion.div>
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

        {/* 推理过程面板 */}
        {msg.role === "assistant" && msg.reasoning && (
          <ReasoningPanel reasoning={msg.reasoning} />
        )}

        {/* 智能卡片 - 作为消息的一部分自然显示 */}
        {msg.card && renderCard(msg.card.type)}
      </div>
    </motion.div>
  );
});