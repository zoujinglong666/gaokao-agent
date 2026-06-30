"use client";
import { useRef, useCallback, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChatMessage } from "@/lib/store";
import MessageItem from "@/components/chat/MessageItem";
import ThinkingCard from "@/components/chat/ThinkingCard";

interface VirtualMessageListProps {
  messages: ChatMessage[];
  streamingId?: string | null;
  formatTime: (date: Date) => string;
}

export default function VirtualMessageList({ messages, streamingId, formatTime }: VirtualMessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });

  const scrollToBottom = useCallback(() => {
    if (parentRef.current) {
      virtualizer.scrollToIndex(messages.length - 1, { align: "end" });
    }
  }, [messages.length, virtualizer]);

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  return (
    <div
      ref={parentRef}
      className="flex-1 overflow-y-auto py-3 sm:py-4"
      style={{ contain: "strict" }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const msg = messages[virtualItem.index];
          if (!msg) return null;

          if (msg.role === "thinking") {
            return (
              <div
                key={virtualItem.key}
                data-region="thinking-card"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                  padding: "8px 0",
                }}
              >
                <ThinkingCard />
              </div>
            );
          }

          return (
            <div
              key={virtualItem.key}
              data-region="message"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
                padding: "8px 0",
              }}
            >
              <MessageItem
                msg={msg}
                streamingId={streamingId}
                formatTime={formatTime}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}