"use client";
import { use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Navbar from "@/components/ui/Navbar";

const PixelBead = dynamic(() => import("@/components/ui/PixelBead"), { ssr: false });
const UniversityChat = dynamic(() => import("@/components/chat/UniversityChat"), { ssr: false });
import top20Raw from "@/lib/data/top20-universities.json";
import { useAppStore } from "@/lib/store";

const universities = (top20Raw as any).universities;

export default function UniversityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toggleShortlist, shortlist } = useAppStore();
  const u = universities.find((uni: any) => uni.id === id);

  if (!u) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--ink)" }}>未找到该大学</h1>
          <Link href="/universities" className="btn-primary text-sm">返回图鉴</Link>
        </div>
      </div>
    );
  }

  const isShortlisted = shortlist.includes(u.id);

  const stats = [
    { label: "建校年份", value: `${u.founded}年`, icon: "📅" },
    { label: "所在城市", value: u.city, icon: "📍" },
    { label: "在校学生", value: u.studentCount, icon: "👥" },
    { label: "校园面积", value: u.campusArea, icon: "🏞️" },
    { label: "藏书量", value: u.library, icon: "📚" },
    { label: "全国排名", value: `Top ${u.ranking}`, icon: "🏆" },
  ];

  return (
    <div className="min-h-dvh" style={{ background: "var(--paper)" }}>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 pb-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden mb-6"
          style={{ background: u.gradient, minHeight: "260px" }}
        >
          {/* Decorative */}
          <div className="absolute top-0 right-0 w-60 h-60 rounded-full opacity-10" style={{ background: "#fff", transform: "translate(40%, -40%)" }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10" style={{ background: "#fff", transform: "translate(-30%, 30%)" }} />

          <div className="relative z-10 p-8 sm:p-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>
                    #{u.ranking}
                  </span>
                  {u.tags.map((t: string) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)" }}>
                      {t}
                    </span>
                  ))}
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {u.name}
                </h1>
                <p className="text-sm font-mono mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {u.englishName}
                </p>
              </div>
              <motion.span
                className="text-6xl"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
              >
                {u.emoji}
              </motion.span>
            </div>

            <div className="mt-6">
              <p className="text-xl sm:text-2xl italic font-medium text-white/90">
                &ldquo;{u.motto}&rdquo;
              </p>
              <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.6)" }}>
                —— 校训
              </p>
            </div>
          </div>
        </motion.div>

        {/* Pixel Bead Campus Image */}
        {u.image && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6 rounded-2xl overflow-hidden shadow-lg"
            style={{ border: "3px solid rgba(19,35,58,0.08)" }}
          >
            <div className="relative w-full" style={{ aspectRatio: "800/280" }}>
              <PixelBead
                src={u.image}
                alt={`${u.name}校园拼豆`}
                width={800}
                height={280}
                pixelSize={10}
                fallbackGradient={u.gradient}
                className="w-full h-full"
                style={{ width: "100%", height: "100%", objectFit: "cover" as any }}
              />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: "rgba(0,0,0,0.5)", color: "#fff", backdropFilter: "blur(4px)" }}
              >
                🎨 {u.name} · 拼豆像素画
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className="paper-card p-3 text-center"
            >
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-xs font-bold" style={{ color: "var(--ink)" }}>{s.value}</div>
              <div className="text-[10px]" style={{ color: "var(--ink-muted)" }}>{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="paper-card p-5 mb-4"
        >
          <h2 className="font-bold text-base mb-3" style={{ color: "var(--ink)" }}>
            🌟 校园亮点
          </h2>
          <div className="space-y-2.5">
            {u.highlights.map((h: string, i: number) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "var(--blue-50)" }}>
                  <span className="text-[10px] font-bold" style={{ color: "var(--blue)" }}>{i + 1}</span>
                </div>
                <p className="text-sm" style={{ color: "var(--ink-light)" }}>{h}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Key Disciplines */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="paper-card p-5 mb-4"
        >
          <h2 className="font-bold text-base mb-3" style={{ color: "var(--ink)" }}>
            🎯 王牌学科
          </h2>
          <div className="flex flex-wrap gap-2">
            {u.keyDisciplines.map((d: string) => (
              <span key={d} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "var(--gold-50)", color: "var(--gold)", border: "1px solid rgba(200,164,92,0.2)" }}>
                {d}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Famous Alumni */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="paper-card p-5 mb-4"
        >
          <h2 className="font-bold text-base mb-3" style={{ color: "var(--ink)" }}>
            👤 知名校友
          </h2>
          <div className="flex flex-wrap gap-2">
            {u.famousAlumni.map((a: string) => (
              <span key={a} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(139,125,168,0.1)", color: "var(--purple)" }}>
                {a}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-wrap gap-3 mb-6"
        >
          <button
            onClick={() => toggleShortlist(u.id)}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            {isShortlisted ? "❤️ 已收藏" : "🤍 加入收藏"}
          </button>
          <Link href="/journey" className="btn-primary text-sm">
            开始志愿规划
          </Link>
          <a
            href={u.website || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm flex items-center gap-1"
          >
            访问官网
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </motion.div>

        {/* AI Chat */}
        <UniversityChat universityId={u.id} universityName={u.name} province={u.province} />

        {/* Back Link */}
        <div className="text-center mt-8">
          <Link href="/universities" className="text-xs font-medium" style={{ color: "var(--blue)" }}>
            ← 返回大学图鉴
          </Link>
        </div>
      </main>
    </div>
  );
}
