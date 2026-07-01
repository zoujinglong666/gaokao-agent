"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Navbar from "@/components/ui/Navbar";
import { Search, MapPin, Award, Star, Sparkles, ChevronRight, GraduationCap, BookOpen, Palette, Zap } from "lucide-react";

const PixelBead = dynamic(() => import("@/components/ui/PixelBead"), { ssr: false });
import top20Raw from "@/lib/data/top20-universities.json";

const universities = (top20Raw as any).universities;
const types = ["全部", "综合", "理工", "师范"];
const cities: string[] = [...new Set(universities.map((u: any) => u.city))] as string[];

// 装饰性背景元素
const FloatingShapes = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <motion.div
      className="absolute w-96 h-96 rounded-full opacity-5"
      style={{ background: "var(--blue)", top: "10%", left: "-10%" }}
      animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
      transition={{ duration: 20, repeat: Infinity }}
    />
    <motion.div
      className="absolute w-64 h-64 rounded-full opacity-5"
      style={{ background: "var(--gold)", bottom: "20%", right: "-5%" }}
      animate={{ scale: [1.1, 1, 1.1], rotate: [360, 180, 0] }}
      transition={{ duration: 25, repeat: Infinity }}
    />
    <motion.div
      className="absolute w-48 h-48 rounded-full opacity-5"
      style={{ background: "var(--blue-light)", top: "50%", left: "30%" }}
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 15, repeat: Infinity }}
    />
  </div>
);

// 大学卡片组件
const UniversityCard = ({ u, index, isFeatured }: { u: any; index: number; isFeatured: boolean }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ delay: index * 0.08, duration: 0.5, type: "spring", stiffness: 100 }}
      className={`relative group cursor-pointer ${isFeatured ? "md:col-span-2" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/universities/${u.id}`} className="block">
        <div
          className={`relative overflow-hidden rounded-3xl transition-all duration-500 ${
            isFeatured ? "p-8 sm:p-12" : "p-6"
          }`}
          style={{
            background: u.gradient,
            minHeight: isFeatured ? "320px" : "260px",
            boxShadow: isHovered
              ? "0 30px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1)"
              : "0 10px 30px rgba(0,0,0,0.1)",
            transform: isHovered ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)",
          }}
        >
          {/* 装饰性光效 */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 via-transparent to-transparent" />
          </div>

          {/* 像素画 - 右上角 */}
          {u.image && (
            <motion.div
              className="absolute top-4 right-4 rounded-2xl overflow-hidden shadow-2xl"
              style={{ zIndex: 10 }}
              animate={{ scale: isHovered ? 1.1 : 1, rotate: isHovered ? 5 : 0 }}
              transition={{ duration: 0.4 }}
            >
              <PixelBead
                src={u.image}
                alt={u.name}
                width={isFeatured ? 200 : 140}
                height={isFeatured ? 130 : 90}
                pixelSize={isFeatured ? 12 : 9}
                fallbackGradient={u.gradient}
              />
            </motion.div>
          )}

          {/* 内容区域 */}
          <div className="relative z-10 h-full flex flex-col justify-between">
            {/* 顶部：排名 + 标签 */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.2)", color: "#fff", backdropFilter: "blur(10px)" }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Award size={12} />
                  <span className="text-xs font-bold">#{u.ranking}</span>
                </motion.div>
                <div className="flex gap-1.5">
                  {u.tags.slice(0, 2).map((t: string) => (
                    <span
                      key={t}
                      className="text-[10px] px-2 py-1 rounded-full font-medium"
                      style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)" }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <motion.span
                className={`${isFeatured ? "text-6xl" : "text-5xl"} drop-shadow-lg`}
                animate={{ 
                  rotate: [0, 8, -8, 0],
                  scale: isHovered ? [1, 1.2, 1] : 1
                }}
                transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
              >
                {u.emoji}
              </motion.span>
            </div>

            {/* 中间：名称 */}
            <div className="my-6">
              <h2 className={`font-black text-white tracking-tight drop-shadow-lg ${isFeatured ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl"}`}>
                {u.name}
              </h2>
              <p className="text-xs font-mono mt-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                {u.englishName}
              </p>
            </div>

            {/* 底部：校训 + 信息 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={14} style={{ color: "rgba(255,255,255,0.8)" }} />
                <p className={`italic font-medium text-white/90 ${isFeatured ? "text-lg" : "text-sm"}`}>
                  &ldquo;{u.motto}&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: "rgba(255,255,255,0.8)" }}>
                <span className="flex items-center gap-1"><MapPin size={12} />{u.city}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><GraduationCap size={12} />{u.type}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Star size={12} />创建于 {u.founded}</span>
              </div>
            </div>
          </div>

          {/* 悬停箭头 */}
          <motion.div
            className="absolute bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}
            animate={{ x: isHovered ? 5 : 0, opacity: isHovered ? 1 : 0.5 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronRight size={20} style={{ color: "#fff" }} />
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
};

export default function UniversitiesPage() {
  const [activeType, setActiveType] = useState("全部");
  const [activeCity, setActiveCity] = useState("全部");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const filtered = useMemo(() => {
    let result = universities.filter((u: any) => {
      if (activeType !== "全部" && u.type !== activeType) return false;
      if (activeCity !== "全部" && u.city !== activeCity) return false;
      if (searchQuery && !u.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
    return result;
  }, [activeType, activeCity, searchQuery]);

  // 统计数据
  const stats = useMemo(() => ({
    total: universities.length,
    cities: new Set(universities.map((u: any) => u.city)).size,
    types: new Set(universities.map((u: any) => u.type)).size,
  }), []);

  return (
    <div className="min-h-dvh relative" style={{ background: "linear-gradient(180deg, var(--paper) 0%, var(--blue-50) 100%)" }}>
      <FloatingShapes />
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{
              background: "linear-gradient(135deg, rgba(74,111,165,0.1), rgba(212,175,55,0.1))",
              border: "1px solid rgba(74,111,165,0.2)",
            }}
          >
            <Sparkles size={14} style={{ color: "var(--gold)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--blue)" }}>
              Top 20 中国顶尖学府
            </span>
          </motion.div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-4" style={{ color: "var(--ink)" }}>
            中国最美大学
            <span className="bg-gradient-to-r from-[var(--blue)] to-[var(--gold)] bg-clip-text text-transparent">拼豆图鉴</span>
          </h1>
          
          <p className="text-sm sm:text-base max-w-2xl mx-auto mb-8" style={{ color: "var(--ink-muted)" }}>
            每一所学府都化作拼豆像素画，每一段校训都是一种人生哲学。
            <br />
            点击探索，找到属于你的梦想校园。
          </p>

          {/* 统计信息 */}
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-black" style={{ color: "var(--blue)" }}>{stats.total}</div>
              <div className="text-xs" style={{ color: "var(--ink-muted)" }}>所学府</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black" style={{ color: "var(--gold)" }}>{stats.cities}</div>
              <div className="text-xs" style={{ color: "var(--ink-muted)" }}>座城市</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black" style={{ color: "var(--blue-light)" }}>{stats.types}</div>
              <div className="text-xs" style={{ color: "var(--ink-muted)" }}>种类型</div>
            </div>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: "var(--ink-muted)" }}
            />
            <input
              type="text"
              placeholder="搜索大学名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-80 pl-12 pr-4 py-3 rounded-2xl text-sm"
              style={{
                background: "rgba(255,255,255,0.8)",
                border: "1px solid rgba(19,35,58,0.1)",
                backdropFilter: "blur(10px)",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs"
                style={{ color: "var(--ink-muted)" }}
              >
                清除
              </button>
            )}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-3 mb-8 justify-center"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: "var(--ink-muted)" }}>类型:</span>
            {types.map((t) => (
              <motion.button
                key={t}
                onClick={() => setActiveType(t)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-full text-xs font-medium transition-all"
                style={{
                  background: activeType === t ? "var(--blue)" : "rgba(74,111,165,0.05)",
                  color: activeType === t ? "#fff" : "var(--blue)",
                  border: activeType === t ? "none" : "1px solid rgba(74,111,165,0.2)",
                }}
              >
                {t}
              </motion.button>
            ))}
          </div>
          
          <div className="w-px h-8 self-center" style={{ background: "rgba(19,35,58,0.1)" }} />
          
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium" style={{ color: "var(--ink-muted)" }}>城市:</span>
            <motion.button
              onClick={() => setActiveCity("全部")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-2 rounded-full text-xs font-medium transition-all"
              style={{
                background: activeCity === "全部" ? "var(--gold)" : "rgba(212,175,55,0.05)",
                color: activeCity === "全部" ? "#fff" : "var(--gold)",
                border: activeCity === "全部" ? "none" : "1px solid rgba(212,175,55,0.2)",
              }}
            >
              全部
            </motion.button>
            {cities.map((c: string) => (
              <motion.button
                key={c}
                onClick={() => setActiveCity(c)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-2 rounded-full text-xs font-medium transition-all"
                style={{
                  background: activeCity === c ? "var(--gold)" : "rgba(212,175,55,0.05)",
                  color: activeCity === c ? "#fff" : "var(--gold)",
                  border: activeCity === c ? "none" : "1px solid rgba(212,175,55,0.2)",
                }}
              >
                {c}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Count */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs mb-6 text-center"
          style={{ color: "var(--ink-muted)" }}
        >
          共找到 {filtered.length} 所学府
        </motion.p>

        {/* University Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <AnimatePresence mode="popLayout">
            {filtered.map((u: any, i: number) => {
              const isFeatured = i === 0 || i === 3;
              return (
                <UniversityCard
                  key={u.id}
                  u={u}
                  index={i}
                  isFeatured={isFeatured}
                />
              );
            })}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Search size={48} className="mx-auto mb-4" style={{ color: "var(--ink-muted)", opacity: 0.3 }} />
            <p className="text-lg font-medium mb-2" style={{ color: "var(--ink)" }}>没有找到匹配的大学</p>
            <p className="text-sm" style={{ color: "var(--ink-muted)" }}>试试调整筛选条件或搜索关键词</p>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center pb-12 flex flex-wrap justify-center gap-4"
        >
          <Link href="/journey" className="btn-primary text-sm">
            <GraduationCap size={16} className="mr-2" />
            开始志愿规划
          </Link>
          <Link href="/chat" className="btn-secondary text-sm">
            <Zap size={16} className="mr-2" />
            AI 智能咨询
          </Link>
        </motion.div>
      </main>
    </div>
  );
}