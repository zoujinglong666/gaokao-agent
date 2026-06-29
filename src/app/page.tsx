"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import personalitiesRaw from "@/lib/data/personalities.json";

const personalities = (personalitiesRaw as any).personalities;
const previewIds = ["analyst", "elite", "vibe", "mystic", "scout", "strategist"];

export default function LandingPage() {
  const router = useRouter();
  const [preview, setPreview] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    const tick = () => {
      // 2026 江西/全国典型志愿填报时间在 6 月 25-30 日
      const target = new Date("2026-06-26T08:00:00+08:00");
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown("已开始");
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setCountdown(`${days} 天 ${hours} 小时 ${mins} 分`);
    };
    tick();
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (isHovering) return;
    const t = setInterval(() => setPreview(p => (p + 1) % previewIds.length), 4000);
    return () => clearInterval(t);
  }, [isHovering]);

  const current = personalities.find((p: any) => p.id === previewIds[preview]);

  const navTo = (href: string) => {
    // Fallback for browsers where Next.js Link may fail
    try {
      router.push(href);
    } catch {
      window.location.href = href;
    }
  };

  const navLinks = [
    { href: "/gallery", label: "人格图鉴" },
    { href: "/universities", label: "大学图鉴" },
    { href: "/journey", label: "志愿推荐" },
    { href: "/chat", label: "智能咨询" },
  ];

  const quickCards = [
    {
      href: "/quiz",
      icon: "🔮",
      title: "人格诊断",
      desc: "3分钟测出你的填报人格",
      color: "var(--blue)",
      bg: "rgba(74,111,165,0.08)",
    },
    {
      href: "/universities",
      icon: "🏛️",
      title: "大学图鉴",
      desc: "中国最美Top20大学",
      color: "var(--purple)",
      bg: "rgba(155,105,180,0.08)",
    },
    {
      href: "/journey",
      icon: "🎯",
      title: "志愿推荐",
      desc: "输入分数智能推荐院校",
      color: "var(--gold)",
      bg: "rgba(183,143,64,0.08)",
    },
    {
      href: "/chat",
      icon: "💬",
      title: "智能咨询",
      desc: "AI规划师一对一答疑",
      color: "var(--olive)",
      bg: "rgba(100,130,90,0.08)",
    },
  ];

  return (
    <div className="min-h-dvh flex flex-col relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20"
          style={{ background: "linear-gradient(135deg, var(--blue) 0%, transparent 70%)" }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-15"
          style={{ background: "linear-gradient(135deg, var(--gold) 0%, transparent 70%)" }}
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Nav */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative flex items-center justify-between px-6 py-4 max-w-2xl mx-auto w-full z-10"
      >
        <span className="font-bold text-lg tracking-tight" style={{ color: "var(--ink)" }}>
          FuturePath
        </span>
        <div className="flex gap-5 text-sm" style={{ color: "var(--ink-muted)" }}>
          {navLinks.map((link, i) => (
            <button
              key={link.href}
              onClick={() => navTo(link.href)}
              className="hover:opacity-70 transition-opacity relative group cursor-pointer bg-transparent border-none"
              style={{ color: "var(--ink-muted)", fontSize: "0.875rem" }}
            >
              <motion.span
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                {link.label}
              </motion.span>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-200" style={{ background: "var(--blue)" }} />
            </button>
          ))}
        </div>
      </motion.nav>

      {/* Hero */}
      <main className="relative flex-1 flex flex-col items-center justify-center px-4 -mt-8 z-10">
        <div className="max-w-2xl w-full text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6 tag-blue"
          >
            <motion.span
              className="w-2 h-2 rounded-full bg-[var(--blue)]"
              animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            基于 16 型高考填报人格模型
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4"
            style={{ color: "var(--ink)" }}
          >
            测测你是哪种
            <br />
            <span className="gradient-text relative inline-block">
              高考填志愿选手
              <motion.span
                className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-[var(--blue)] to-[var(--gold)] rounded-full opacity-60"
                animate={{ scaleX: [0, 1], opacity: [0, 0.6] }}
                transition={{ delay: 0.8, duration: 0.5 }}
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-base sm:text-lg mb-10 max-w-md mx-auto"
            style={{ color: "var(--ink-light)" }}
          >
            24 道生活化场景题，3 分钟诊断你的志愿填报人格。
            <br />
            认识自己，是做出正确选择的第一步。
          </motion.p>

          {/* 2026 志愿填报倒计时 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6 text-xs sm:text-sm"
            style={{
              background: "linear-gradient(135deg, rgba(59,85,122,0.08), rgba(201,162,39,0.08))",
              border: "1px solid rgba(59,85,122,0.15)",
              color: "var(--ink)",
            }}
          >
            <motion.span
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: "#c9a227" }}
            />
            <span style={{ color: "var(--ink-muted)" }}>距离 2026 志愿填报：</span>
            <b style={{ color: "var(--blue)" }}>{countdown}</b>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-12"
          >
            <Link href="/quiz" className="btn-gold text-base inline-flex group">
              开始诊断
              <motion.svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:translate-x-1 transition-transform"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </motion.svg>
            </Link>
          </motion.div>

          {/* Quick Entry Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
          >
            {quickCards.map((card, i) => (
              <motion.button
                key={card.href}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75 + i * 0.08 }}
                whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(19,35,58,0.08)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navTo(card.href)}
                className="text-left p-4 rounded-xl border border-transparent cursor-pointer"
                style={{ background: card.bg }}
              >
                <span className="text-xl mb-2 block">{card.icon}</span>
                <div className="font-bold text-sm mb-0.5" style={{ color: card.color }}>
                  {card.title}
                </div>
                <div className="text-[11px] leading-tight" style={{ color: "var(--ink-muted)" }}>
                  {card.desc}
                </div>
              </motion.button>
            ))}
          </motion.div>

          {/* Preview Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="relative"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <AnimatePresence mode="wait">
              {current && (
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="glass-card p-6 sm:p-8 mt-4 max-w-sm mx-auto animate-fade-up text-left cursor-pointer"
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <motion.span
                      className="text-3xl sm:text-4xl"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                    >
                      {current.emoji}
                    </motion.span>
                    <div>
                      <div className="font-bold text-base sm:text-lg" style={{ color: "var(--ink)" }}>
                        {current.name}
                      </div>
                      <div className="font-mono text-xs" style={{ color: "var(--ink-muted)" }}>
                        {current.en}
                      </div>
                    </div>
                    <span className="ml-auto tag tag-gold font-mono">{current.pct}%</span>
                  </div>
                  <motion.p
                    className="text-sm sm:text-base leading-relaxed"
                    style={{ color: "var(--ink-light)" }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {current.desc}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {previewIds.map((_, i) => (
                <motion.button
                  key={i}
                  className="w-2 h-2 rounded-full transition-colors"
                  style={{
                    backgroundColor: i === preview ? "var(--blue)" : "rgba(74, 111, 165, 0.2)",
                  }}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={() => setPreview(i)}
                />
              ))}
            </div>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 text-xs"
            style={{ color: "var(--ink-muted)" }}
          >
            FuturePath &middot; 仅供娱乐 &middot; 专业志愿规划请结合官方数据
          </motion.p>
        </div>
      </main>
    </div>
  );
}