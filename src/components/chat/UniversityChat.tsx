"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface UniversityChatProps {
  universityId: string;
  universityName: string;
  province: string;
}

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const quickQuestions = [
  "这所大学录取分数线多少？",
  "王牌专业有哪些？",
  "校园生活怎么样？",
  "就业前景好不好？",
];

export default function UniversityChat({ universityId, universityName, province }: UniversityChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;

    setInput("");
    const userMessage: ChatMsg = {
      id: Date.now().toString(),
      role: "user",
      content: userMsg,
      timestamp: new Date(),
    };

    setMessages((m) => [...m, userMessage]);
    setLoading(true);

    try {
      const contextMessage = `我正在查看${universityName}（${province}）的详情页，请针对这所大学回答我的问题。`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: contextMessage },
            ...messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: userMsg },
          ],
          profile: {},
          universityId,
          universityName,
        }),
      });

      if (!res.ok) throw new Error("API error");
      const data = await res.json();

      const assistantMessage: ChatMsg = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || "抱歉，我暂时无法回答这个问题。",
        timestamp: new Date(),
      };

      setMessages((m) => [...m, assistantMessage]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "抱歉，服务暂时不可用 😅 请稍后再试。",
          timestamp: new Date(),
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="mt-8">
      {/* Toggle Button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 rounded-xl transition-all"
        style={{
          background: isOpen ? "var(--blue)" : "var(--blue-50)",
          color: isOpen ? "#fff" : "var(--blue)",
        }}
      >
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="font-medium text-sm">AI 智能问答 · {universityName}</span>
        </div>
        <motion.svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          animate={{ rotate: isOpen ? 180 : 0 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </motion.svg>
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-xl border" style={{ borderColor: "rgba(74,111,165,0.15)", background: "#fff" }}>
              {/* Messages */}
              <div className="h-72 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-3xl mb-2">🤖</div>
                    <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                      关于{universityName}，你想了解什么？
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--ink-muted)" }}>
                      AI 将为你解答录取分数、专业设置、校园生活等问题
                    </p>
                  </div>
                )}

                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm ${
                        msg.role === "user" ? "text-white" : ""
                      }`}
                      style={
                        msg.role === "user"
                          ? { background: "var(--blue)" }
                          : { background: "var(--blue-50)", color: "var(--ink)" }
                      }
                    >
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="rounded-xl px-4 py-3" style={{ background: "var(--blue-50)" }}>
                      <div className="flex gap-1">
                        <motion.span
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                          className="w-2 h-2 rounded-full"
                          style={{ background: "var(--blue)" }}
                        />
                        <motion.span
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                          className="w-2 h-2 rounded-full"
                          style={{ background: "var(--blue)" }}
                        />
                        <motion.span
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                          className="w-2 h-2 rounded-full"
                          style={{ background: "var(--blue)" }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Quick Questions */}
              {messages.length === 0 && (
                <div className="px-4 pb-3 flex flex-wrap gap-2">
                  {quickQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => send(q)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: "var(--blue-50)", color: "var(--blue)" }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t" style={{ borderColor: "rgba(74,111,165,0.1)" }}>
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="问我关于这所大学的任何问题..."
                    className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none"
                    style={{ background: "rgba(19,35,58,0.03)", color: "var(--ink)" }}
                  />
                  <button
                    onClick={() => send()}
                    disabled={!input.trim() || loading}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                    style={{ background: "var(--blue)" }}
                  >
                    发送
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
