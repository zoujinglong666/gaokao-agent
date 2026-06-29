"use client";
import { useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import html2canvas from "html2canvas";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import personalitiesRaw from "@/lib/data/personalities.json";

const personalities = (personalitiesRaw as any).personalities;
const dimDefs = (personalitiesRaw as any).dimensions;
const dimColors = ["var(--blue)", "var(--gold)", "var(--terracotta)", "var(--olive)"];

function ResultContent() {
  const params = useSearchParams();
  const router = useRouter();
  const typeId = params.get("type") || "chill";
  const dimsStr = params.get("d") || "0,0,0,0";
  const dims = dimsStr.split(",").map(Number);
  const normalized = dims.map((d) => Math.max(5, Math.min(100, Math.round((d + 30) / 60 * 100))));

  const p = personalities.find((x: any) => x.id === typeId) || personalities[0];
  const bestP = personalities.find((x: any) => x.id === p.best);
  const worstP = personalities.find((x: any) => x.id === p.worst);
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeShareTab, setActiveShareTab] = useState<"wechat" | "weibo" | "qq">("wechat");

  const exportImage = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: "#FBF9F1",
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `FuturePath-${p.en.replace(/\s/g, "")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error(e);
    }
    setExporting(false);
  };

  const copyText = () => {
    const text = `我的高考填报人格是「${p.name} ${p.en}」！\n${p.desc}\n\n快来测测你是哪种 👉 ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sharePlatforms = {
    wechat: {
      name: "微信",
      icon: "💬",
      color: "var(--success)",
      bg: "rgba(107,155,122,0.1)",
      tip: "点击复制文案后，打开微信粘贴给好友",
    },
    weibo: {
      name: "微博",
      icon: "📱",
      color: "var(--danger)",
      bg: "rgba(194,91,86,0.1)",
      tip: "复制文案后分享到微博",
    },
    qq: {
      name: "QQ",
      icon: "💎",
      color: "var(--blue)",
      bg: "rgba(74,111,165,0.1)",
      tip: "点击复制文案后，打开QQ粘贴给好友",
    },
  };

  const shareText = `【高考填报人格测试】我是「${p.name} ${p.en}」！${p.desc} 快来测测你的专属人格吧～ ${typeof window !== "undefined" ? window.location.origin : ""}`;

  return (
    <div className="min-h-dvh py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Share Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          ref={cardRef}
          className="glass-card p-6 sm:p-8 mb-6"
        >
          {/* Header */}
          <div className="flex items-start gap-4 mb-5">
            <motion.span
              className="text-5xl sm:text-6xl"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 4 }}
            >
              {p.emoji}
            </motion.span>
            <div className="flex-1">
              <div className="tag tag-blue mb-1">{p.group}</div>
              <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: "var(--ink)" }}>
                {p.name}
              </h1>
              <div className="font-mono text-sm" style={{ color: "var(--ink-muted)" }}>
                {p.en}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-2xl sm:text-3xl font-bold" style={{ color: "var(--gold)" }}>
                {p.pct}%
              </div>
              <div className="text-xs" style={{ color: "var(--ink-muted)" }}>的人和你一样</div>
            </div>
          </div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base leading-relaxed mb-5"
            style={{ color: "var(--ink-light)" }}
          >
            {p.desc}
          </motion.p>

          {/* Pros & Cons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-3 mb-5"
          >
            <div className="rounded-lg p-3" style={{ background: "var(--blue-50)" }}>
              <div className="text-xs font-medium mb-1" style={{ color: "var(--blue)" }}>优点</div>
              <div className="text-sm" style={{ color: "var(--ink)" }}>{p.pros}</div>
            </div>
            <div className="rounded-lg p-3" style={{ background: "var(--gold-50)" }}>
              <div className="text-xs font-medium mb-1" style={{ color: "var(--gold)" }}>小缺点</div>
              <div className="text-sm" style={{ color: "var(--ink)" }}>{p.cons}</div>
            </div>
          </motion.div>

          {/* Best / Worst Match */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex gap-3 mb-5"
          >
            {bestP && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex-1 flex items-center gap-2 rounded-lg p-3"
                style={{ background: "rgba(107,155,122,0.1)" }}
                whileHover={{ scale: 1.02 }}
              >
                <span className="text-2xl">{bestP.emoji}</span>
                <div>
                  <div className="text-xs" style={{ color: "var(--success)" }}>最配人格</div>
                  <Link
                    href={`/result?type=${bestP.id}&d=0,0,0,0`}
                    className="text-sm font-medium hover:underline"
                    style={{ color: "var(--ink)" }}
                  >
                    {bestP.name}
                  </Link>
                </div>
              </motion.div>
            )}
            {worstP && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 }}
                className="flex-1 flex items-center gap-2 rounded-lg p-3"
                style={{ background: "rgba(194,91,86,0.08)" }}
                whileHover={{ scale: 1.02 }}
              >
                <span className="text-2xl">{worstP.emoji}</span>
                <div>
                  <div className="text-xs" style={{ color: "var(--danger)" }}>最挑战</div>
                  <Link
                    href={`/result?type=${worstP.id}&d=0,0,0,0`}
                    className="text-sm font-medium hover:underline"
                    style={{ color: "var(--ink)" }}
                  >
                    {worstP.name}
                  </Link>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Quote */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="rounded-lg p-4 mb-5 italic text-sm"
            style={{ background: "rgba(19,35,58,0.03)", color: "var(--ink-light)" }}
          >
            &ldquo;{p.quote}&rdquo;
          </motion.div>

          {/* Dimension Bars */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-3"
          >
            {dimDefs.map((dim: any, i: number) => (
              <motion.div
                key={dim.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
              >
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: "var(--ink-muted)" }}>{dim.left}</span>
                  <span className="font-mono font-medium" style={{ color: "var(--ink)" }}>
                    {normalized[i]}
                  </span>
                  <span style={{ color: "var(--ink-muted)" }}>{dim.right}</span>
                </div>
                <div className="dim-bar-track">
                  <motion.div
                    className="dim-bar-fill"
                    style={{ width: `${normalized[i]}%`, background: dimColors[i] }}
                    initial={{ width: "0%" }}
                    animate={{ width: `${normalized[i]}%` }}
                    transition={{ duration: 1, delay: 1 + i * 0.1, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Watermark */}
          <div className="divider mt-6 mb-3" />
          <p className="text-center text-xs" style={{ color: "var(--ink-muted)" }}>
            FuturePath &middot; 仅供娱乐
          </p>
        </motion.div>

        {/* Share Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-4 mb-6"
        >
          <div className="text-xs font-medium mb-3" style={{ color: "var(--ink-muted)" }}>
            分享你的人格
          </div>
          
          {/* Platform Tabs */}
          <div className="flex gap-2 mb-3">
            {Object.entries(sharePlatforms).map(([key, platform]) => (
              <motion.button
                key={key}
                onClick={() => setActiveShareTab(key as "wechat" | "weibo" | "qq")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm"
                style={{
                  background: activeShareTab === key ? platform.bg : "transparent",
                  color: activeShareTab === key ? platform.color : "var(--ink-muted)",
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>{platform.icon}</span>
                <span>{platform.name}</span>
              </motion.button>
            ))}
          </div>

          {/* Share Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeShareTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="p-3 rounded-lg text-xs" style={{ background: sharePlatforms[activeShareTab].bg }}>
                <span className="opacity-70">{sharePlatforms[activeShareTab].tip}</span>
              </div>
              <div className="flex gap-2">
                <motion.button
                  onClick={() => {
                    navigator.clipboard.writeText(shareText);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {copied ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      已复制
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      复制分享文案
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap gap-3 justify-center mb-8"
        >
          <motion.button
            onClick={exportImage}
            disabled={exporting}
            className="btn-primary flex items-center gap-2"
            whileHover={{ scale: exporting ? 1 : 1.02 }}
            whileTap={{ scale: exporting ? 1 : 0.98 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {exporting ? "导出中..." : "保存分享卡"}
          </motion.button>
          <motion.button
            onClick={copyText}
            className="btn-secondary flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 4h5v16H7V4h5V2a3 3 0 0 1 6 0v2zM2 8h14v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8z" />
            </svg>
            复制推荐文案
          </motion.button>
        </motion.div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex gap-3 justify-center"
        >
          <Link href="/quiz" className="btn-secondary" style={{ fontSize: "0.875rem" }}>
            重新诊断
          </Link>
          <Link href="/gallery" className="btn-secondary" style={{ fontSize: "0.875rem" }}>
            查看人格图鉴
          </Link>
          <Link href="/journey" className="btn-primary" style={{ fontSize: "0.875rem" }}>
            开始志愿规划
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center">
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-12 h-12 border-2 border-[var(--blue)] border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p style={{ color: "var(--ink-muted)" }}>Loading...</p>
          </motion.div>
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}