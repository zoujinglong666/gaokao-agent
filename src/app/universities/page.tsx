"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Navbar from "@/components/ui/Navbar";

const PixelBead = dynamic(() => import("@/components/ui/PixelBead"), { ssr: false });
import top20Raw from "@/lib/data/top20-universities.json";

const universities = (top20Raw as any).universities;
const types = ["全部", "综合", "理工", "师范"];
const cities: string[] = [...new Set(universities.map((u: any) => u.city))] as string[];

export default function UniversitiesPage() {
  const [activeType, setActiveType] = useState("全部");
  const [activeCity, setActiveCity] = useState("全部");

  const filtered = useMemo(() => {
    return universities.filter((u: any) => {
      if (activeType !== "全部" && u.type !== activeType) return false;
      if (activeCity !== "全部" && u.city !== activeCity) return false;
      return true;
    });
  }, [activeType, activeCity]);

  return (
    <div className="min-h-dvh" style={{ background: "var(--paper)" }}>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full tag-gold text-xs mb-4"
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--gold)" }} />
            Top 20 中国顶尖学府
          </motion.div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3" style={{ color: "var(--ink)" }}>
            中国最美大学
            <span className="gradient-text">拼豆图鉴</span>
          </h1>
          <p className="text-sm sm:text-base max-w-lg mx-auto" style={{ color: "var(--ink-muted)" }}>
            每一所学府都化作拼豆像素画，每一段校训都是一种人生哲学。
            点击探索，找到属于你的梦想校园。
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2 mb-8 justify-center"
        >
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: activeType === t ? "var(--blue)" : "var(--blue-50)",
                color: activeType === t ? "#fff" : "var(--blue)",
              }}
            >
              {t}
            </button>
          ))}
          <span className="w-px h-6 self-center mx-1" style={{ background: "rgba(19,35,58,0.1)" }} />
          <button
            onClick={() => setActiveCity("全部")}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: activeCity === "全部" ? "var(--gold)" : "var(--gold-50)",
              color: activeCity === "全部" ? "#fff" : "var(--gold)",
            }}
          >
            全部城市
          </button>
          {cities.map((c: string) => (
            <button
              key={c}
              onClick={() => setActiveCity(c)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: activeCity === c ? "var(--gold)" : "var(--gold-50)",
                color: activeCity === c ? "#fff" : "var(--gold)",
              }}
            >
              {c}
            </button>
          ))}
        </motion.div>

        {/* Count */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs mb-4 text-center"
          style={{ color: "var(--ink-muted)" }}
        >
          共 {filtered.length} 所学府
        </motion.p>

        {/* University Grid - Poster Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <AnimatePresence mode="popLayout">
            {filtered.map((u: any, i: number) => {
              const isFeatured = i === 0 || i === 3;
              return (
                <motion.div
                  key={u.id}
                  layout
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  className={`relative overflow-hidden rounded-2xl cursor-pointer group ${isFeatured ? "sm:col-span-2" : ""}`}
                >
                  <Link href={`/universities/${u.id}`} className="block">
                    {/* Poster Background */}
                    <div
                      className={`relative ${isFeatured ? "p-8 sm:p-10" : "p-6"} transition-all duration-300 group-hover:scale-[1.01]`}
                      style={{ background: u.gradient, minHeight: isFeatured ? "240px" : "200px" }}
                    >
                      {/* Decorative circles */}
                      <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10" style={{ background: "#fff", transform: "translate(30%, -30%)" }} />
                      <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10" style={{ background: "#fff", transform: "translate(-20%, 40%)" }} />

                      {/* Pixel Bead Image - top right corner */}
                      {u.image && (
                        <div className="absolute top-3 right-3 opacity-70 group-hover:opacity-90 transition-opacity duration-300 rounded-xl overflow-hidden shadow-lg" style={{ zIndex: 5 }}>
                          <PixelBead
                            src={u.image}
                            alt={u.name}
                            width={isFeatured ? 160 : 110}
                            height={isFeatured ? 100 : 70}
                            pixelSize={isFeatured ? 10 : 8}
                            fallbackGradient={u.gradient}
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="relative z-10 h-full flex flex-col justify-between">
                        {/* Top: Ranking + Emoji */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>
                              #{u.ranking}
                            </span>
                            <div className="flex gap-1">
                              {u.tags.slice(0, 2).map((t: string) => (
                                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)" }}>
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                          <motion.span
                            className={`${isFeatured ? "text-5xl" : "text-4xl"}`}
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
                          >
                            {u.emoji}
                          </motion.span>
                        </div>

                        {/* Middle: Name + English */}
                        <div className="my-4">
                          <h2 className={`font-extrabold text-white tracking-tight ${isFeatured ? "text-3xl sm:text-4xl" : "text-2xl"}`}>
                            {u.name}
                          </h2>
                          <p className="text-xs font-mono mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                            {u.englishName}
                          </p>
                        </div>

                        {/* Bottom: Motto + City */}
                        <div>
                          <p className={`italic font-medium text-white/90 ${isFeatured ? "text-lg" : "text-sm"} mb-2`}>
                            &ldquo;{u.motto}&rdquo;
                          </p>
                          <div className="flex items-center gap-3 text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                            <span>{u.city}</span>
                            <span>·</span>
                            <span>{u.type}</span>
                            <span>·</span>
                            <span>创建于 {u.founded}</span>
                          </div>
                        </div>
                      </div>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-all duration-300 rounded-2xl" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center pb-10 flex flex-wrap justify-center gap-3"
        >
          <Link href="/journey" className="btn-primary text-sm">
            开始志愿规划
          </Link>
          <Link href="/chat" className="btn-secondary text-sm">
            AI 智能咨询
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
