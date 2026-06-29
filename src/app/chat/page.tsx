"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Navbar from "@/components/ui/Navbar";
import { motion } from "framer-motion";
import { useAppStore, type ChatMessage as Msg } from "@/lib/store";
import { Download } from "lucide-react";
import ExportDialog from "@/components/ui/ExportDialog";
import VirtualMessageList from "@/components/chat/VirtualMessageList";
import QuickQuestions from "@/components/chat/QuickQuestions";
import ChatInput from "@/components/chat/ChatInput";

export default function ChatPage() {
  const { profile, addMessage, clearChat, volunteerList, addToVolunteerList } = useAppStore();
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "1",
      role: "assistant",
      content: profile.province && profile.score
        ? `你好！我是你的 AI 志愿顾问。我注意到你是 **${profile.province}** 考生，分数 **${profile.score}** 分。\n\n我可以帮你：\n- 🔍 推荐适合的院校（冲刺/稳妥/保底）\n- 📊 分析专业和就业前景\n- ⚖️ 评估志愿方案风险\n- 🧠 结合你的人格类型给出建议\n\n你想从哪方面开始了解？`
        : `你好！我是你的 AI 志愿顾问 🌟\n\n为了给你更精准的建议，可以先告诉我：\n1. 你是哪个省份的考生？\n2. 你的高考分数（或模考分数）是多少？\n3. 选科是什么？\n\n当然，你也可以直接问我任何志愿填报的问题！`,
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const lastSendRef = useRef<number>(0);
  const [exportOpen, setExportOpen] = useState(false);

  const simulateToolCalls = (toolResults?: any[]): any[] => {
    if (!toolResults || toolResults.length === 0) return [];
    return toolResults.map((tr: any) => ({
      name: tr.tool || "unknown",
      status: "done" as const,
      result: tr.result ? JSON.stringify(tr.result).slice(0, 50) + "..." : undefined,
    }));
  };

  const extractUniversitiesFromToolResults = (toolResults: any[]) => {
    const out: Array<{ id: string; name: string; province: string; city: string; tags: string[]; tier?: any; note?: string }> = [];
    const seen = new Set<string>();
    for (const tr of toolResults) {
      const result = tr.result || {};
      if (Array.isArray(result.universities)) {
        for (const u of result.universities) {
          if (u && u.id && !seen.has(u.id)) {
            seen.add(u.id);
            out.push({ id: u.id, name: u.name, province: u.province || "", city: u.city || "", tags: u.tags || [] });
          }
        }
      }
      if (Array.isArray(result.list)) {
        for (const tier of result.list) {
          for (const u of tier.universities || []) {
            if (u && u.id && !seen.has(u.id)) {
              seen.add(u.id);
              out.push({ id: u.id, name: u.name, province: u.province || "", city: u.city || "", tags: u.tags || [], tier: tier.tier });
            }
          }
        }
      }
      if (Array.isArray(result.groups)) {
        for (const g of result.groups) {
          const id = g.groupId || g.universityId;
          if (id && !seen.has(id)) {
            seen.add(id);
            out.push({
              id,
              name: g.university || id,
              province: "",
              city: "",
              tags: [g.groupName, g.adjustmentRisk ? `调剂风险:${g.adjustmentRisk}` : ""].filter(Boolean),
              tier: g.category,
              note: g.groupName,
            });
          }
        }
      }
    }
    return out;
  };

  const send = async (text?: string) => {
    const userMsg = text || "";
    if (!userMsg || loading) return;
    const now = Date.now();
    if (now - lastSendRef.current < 500) return;
    lastSendRef.current = now;

    setShowQuickQuestions(false);

    const userMessage: Msg = {
      id: Date.now().toString(),
      role: "user",
      content: userMsg,
      timestamp: new Date(),
    };

    setMessages((m) => [...m, userMessage]);
    addMessage({ ...userMessage, toolResults: [] });

    setLoading(true);

    const thinkingId = (Date.now() + 1).toString();
    setMessages((m) => [
      ...m,
      {
        id: thinkingId,
        role: "thinking",
        content: "正在思考...",
        timestamp: new Date(),
        toolCalls: [],
      },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages.filter(m => m.role !== "thinking"), { role: "user", content: userMsg }],
          profile,
        }),
      });

      if (!res.ok) throw new Error("API error");
      const data = await res.json();

      setMessages((m) => m.filter((msg) => msg.id !== thinkingId));

      const assistantMessage: Msg = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: data.reply || "抱歉，我暂时无法回答这个问题。请稍后再试。",
        timestamp: new Date(),
        toolCalls: simulateToolCalls(data.toolResults),
      };

      setMessages((m) => [...m, assistantMessage]);
      addMessage({ ...assistantMessage, toolResults: data.toolResults || [] });

      const extracted = extractUniversitiesFromToolResults(data.toolResults || []);
      if (extracted.length > 0) addToVolunteerList(extracted);

      setStreamingId(assistantMessage.id);
      setTimeout(() => setStreamingId(null), (data.reply?.length || 0) * 15 + 500);
    } catch {
      setMessages((m) => m.filter((msg) => msg.id !== thinkingId));
      const errorMessage: Msg = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: "抱歉，服务暂时出了点问题 😅 请稍后再试，或者换个方式提问。",
        timestamp: new Date(),
      };
      setMessages((m) => [...m, errorMessage]);
    }

    setLoading(false);
  };

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  }, []);

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "var(--paper)" }}>
      <Navbar />
      {volunteerList.length > 0 && (
        <motion.button
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onClick={() => setExportOpen(true)}
          className="fixed top-16 sm:top-20 right-3 sm:right-6 z-30 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium shadow-lg active:scale-95"
          style={{
            background: "var(--blue)",
            color: "#fff",
            boxShadow: "0 4px 16px rgba(59,85,122,0.3)",
          }}
        >
          <Download size={14} />
          <span>志愿表 {volunteerList.length}</span>
        </motion.button>
      )}
      <main className="flex-1 max-w-2xl mx-auto w-full px-3 sm:px-4 pb-4 flex flex-col">
        <VirtualMessageList
          messages={messages}
          streamingId={streamingId}
          formatTime={formatTime}
        />

        <QuickQuestions
          show={showQuickQuestions && messages.length === 1 && !loading}
          onSend={send}
        />

        <ChatInput loading={loading} onSend={send} />

        {messages.length > 1 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => {
              if (confirm("确定要清空对话吗？")) {
                setMessages([messages[0]]);
                clearChat();
                setShowQuickQuestions(true);
              }
            }}
            className="text-xs text-center mt-2"
            style={{ color: "var(--ink-muted)" }}
          >
            清空对话
          </motion.button>
        )}
      </main>

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        items={volunteerList}
        studentInfo={{
          province: profile.province,
          score: profile.score,
          subjects: profile.subjects,
        }}
      />
    </div>
  );
}