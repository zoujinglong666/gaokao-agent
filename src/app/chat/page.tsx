"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Navbar from "@/components/ui/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import MemoizedMarkdown from "@/components/chat/MemoizedMarkdown";
import DataWatermark from "@/components/ui/DataWatermark";
import ToolSkeleton from "@/components/ui/ToolSkeleton";
import ThinkingCard from "@/components/chat/ThinkingCard";
import ToolCallIndicator from "@/components/chat/ToolCallIndicator";
import CopyButton from "@/components/chat/CopyButton";
import { useAppStore, type ChatMessage as Msg, type ToolCall } from "@/lib/store";
import { Search, Building2, TrendingUp, Calculator, Lightbulb, FileText, MapPin, Sparkles, Brain, CheckCircle2, Download } from "lucide-react";
import ExportDialog from "@/components/ui/ExportDialog";

const toolIcons: Record<string, any> = {
  search_universities: Search,
  get_university_detail: Building2,
  get_score_lines: TrendingUp,
  analyze_major_fit: Brain,
  get_career_prospects: TrendingUp,
  get_province_portal: MapPin,
  compare_universities: Building2,
  get_city_living_cost: MapPin,
  estimate_equivalent_score: Calculator,
  generate_risk_assessment: FileText,
  get_personality_analysis: Brain,
  recommend_volunteer_list: Lightbulb,
  get_major_ranking: TrendingUp,
  get_same_score_destinations: Search,
  generate_volunteer_table: FileText,
};

const toolNames: Record<string, string> = {
  search_universities: "搜索院校",
  get_university_detail: "查询院校详情",
  get_score_lines: "查询分数线",
  analyze_major_fit: "分析专业匹配度",
  get_career_prospects: "查询就业前景",
  get_province_portal: "查询官方入口",
  compare_universities: "对比院校",
  get_city_living_cost: "查询生活成本",
  estimate_equivalent_score: "估算等效分数",
  generate_risk_assessment: "风险评估",
  get_personality_analysis: "人格分析",
  recommend_volunteer_list: "智能推荐志愿",
  get_major_ranking: "专业排名",
  get_same_score_destinations: "同分去向",
  generate_volunteer_table: "生成志愿表",
};

const quickQuestions = [
  { text: "我是山东考生，600分，推荐一些学校", icon: "🎯" },
  { text: "计算机和电子信息怎么选？", icon: "💻" },
  { text: "分析一下我的志愿方案风险", icon: "📊" },
  { text: "我模考580分，大概相当于高考多少？", icon: "📈" },
  { text: "北京有哪些211院校？", icon: "🏫" },
];

function TypeWriter({ text, speed = 15 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed("");
    setDone(false);

    const timer = setInterval(() => {
      if (indexRef.current < text.length) {
        indexRef.current += 1;
        setDisplayed(text.slice(0, indexRef.current));
      } else {
        setDone(true);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {!done && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-0.5 h-4 align-middle ml-0.5"
          style={{ background: "var(--blue)" }}
        />
      )}
    </span>
  );
}

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
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastSendRef = useRef<number>(0);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const simulateToolCalls = (toolResults?: any[]): ToolCall[] => {
    if (!toolResults || toolResults.length === 0) return [];
    return toolResults.map((tr: any) => ({
      name: tr.tool || "unknown",
      status: "done" as const,
      result: tr.result ? JSON.stringify(tr.result).slice(0, 50) + "..." : undefined,
    }));
  };

  // 从工具结果提取候选院校加入志愿表
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
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    // 防抖：500ms 内连续点击忽略
    const now = Date.now();
    if (now - lastSendRef.current < 500) return;
    lastSendRef.current = now;

    setInput("");
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

    // Add thinking message
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

      // Remove thinking message
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

      // 从工具结果中提取院校并加入志愿表
      const extracted = extractUniversitiesFromToolResults(data.toolResults || []);
      if (extracted.length > 0) addToVolunteerList(extracted);

      setStreamingId(assistantMessage.id);

      // Clear streaming after typewriter finishes (approximate)
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  };

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
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 py-3 sm:py-4">
          {messages.map((msg, i) => {
            if (msg.role === "thinking") {
              return <ThinkingCard key={msg.id} />;
            }

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
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
                      {/* 复制按钮 */}
                      <CopyButton content={msg.content} />
                    </div>
                  )}
                  <div className="whitespace-pre-wrap mt-1">
                    <MemoizedMarkdown content={msg.content} />
                    {msg.id === streamingId && (
                      <div className="mt-1">
                        <TypeWriter text={msg.content} speed={12} />
                      </div>
                    )}
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
          })}

          <div ref={bottomRef} />
        </div>

        {/* Quick Questions */}
        <AnimatePresence>
          {showQuickQuestions && messages.length === 1 && !loading && (
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
                    onClick={() => send(q.text)}
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

        {/* Input */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-card p-2.5 sm:p-3 flex gap-2"
        >
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
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
            onClick={() => send()}
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

        {/* Clear Chat Button */}
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