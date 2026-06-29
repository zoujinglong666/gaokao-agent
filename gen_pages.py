# -*- coding: utf-8 -*-
"""Generate ALL page components for FuturePath"""
import os
BASE = r"d:\workCode\AiWorkCode\gaokao-agent\src"

def w(path, content):
    full = os.path.join(BASE, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  + {path}")

# ============ Landing Page ============
w("app/page.tsx", r'''"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import personalitiesRaw from "@/lib/data/personalities.json";

const personalities = (personalitiesRaw as any).personalities;
const previewIds = ["analyst", "elite", "vibe", "mystic", "scout", "strategist"];

export default function LandingPage() {
  const [preview, setPreview] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPreview(p => (p + 1) % previewIds.length), 2500);
    return () => clearInterval(t);
  }, []);

  const current = personalities.find((p: any) => p.id === previewIds[preview]);

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-2xl mx-auto w-full">
        <span className="font-bold text-lg tracking-tight" style={{ color: "var(--ink)" }}>
          FuturePath
        </span>
        <div className="flex gap-4 text-sm" style={{ color: "var(--ink-muted)" }}>
          <Link href="/gallery" className="hover:opacity-70 transition-opacity">人格图鉴</Link>
          <Link href="/journey" className="hover:opacity-70 transition-opacity">志愿推荐</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-8">
        <div className="max-w-2xl w-full text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6 tag-blue">
            <span className="w-2 h-2 rounded-full bg-[var(--blue)] animate-pulse-dot" />
            基于 16 型高考填报人格模型
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4" style={{ color: "var(--ink)" }}>
            测测你是哪种
            <br />
            <span className="gradient-text">高考填志愿选手</span>
          </h1>

          <p className="text-base mb-10 max-w-md mx-auto" style={{ color: "var(--ink-light)" }}>
            24 道生活化场景题，3 分钟诊断你的志愿填报人格。
            <br />
            认识自己，是做出正确选择的第一步。
          </p>

          {/* CTA */}
          <Link href="/quiz" className="btn-gold text-base mb-12 inline-flex">
            开始诊断
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>

          {/* Preview Card */}
          {current && (
            <div className="glass-card p-6 mt-4 max-w-sm mx-auto animate-fade-up text-left">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{current.emoji}</span>
                <div>
                  <div className="font-bold" style={{ color: "var(--ink)" }}>{current.name}</div>
                  <div className="font-mono text-xs" style={{ color: "var(--ink-muted)" }}>{current.en}</div>
                </div>
                <span className="ml-auto tag tag-gold font-mono">{current.pct}%</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--ink-light)" }}>
                {current.desc}
              </p>
            </div>
          )}

          {/* Footer */}
          <p className="mt-10 text-xs" style={{ color: "var(--ink-muted)" }}>
            FuturePath &middot; 仅供娱乐 &middot; 专业志愿规划请结合官方数据
          </p>
        </div>
      </main>
    </div>
  );
}
''')

# ============ Quiz Page ============
w("app/quiz/page.tsx", r'''"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import questionsRaw from "@/lib/data/questions.json";

const allQuestions = (questionsRaw as any).questions;

export default function QuizPage() {
  const router = useRouter();
  const [order, setOrder] = useState<number[]>(() => {
    const main = allQuestions.filter((q: any) => !q.hidden).map((_: any, i: number) => i);
    for (let i = main.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [main[i], main[j]] = [main[j], main[i]];
    }
    return main;
  });
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [mysticCount, setMysticCount] = useState(0);
  const [showHidden, setShowHidden] = useState(false);
  const [hiddenAnswered, setHiddenAnswered] = useState(false);

  const hiddenQ = allQuestions.find((q: any) => q.hidden);
  const totalVisible = order.length;
  const q = allQuestions[order[current]];
  const selectedIdx = answers[order[current]] ?? -1;
  const isLast = current === totalVisible - 1;
  const progress = ((current + 1) / totalVisible) * 100;

  const selectOption = (optIdx: number) => {
    const qIdx = order[current];
    const newAnswers = { ...answers, [qIdx]: optIdx };
    setAnswers(newAnswers);
    const scores = q.options[optIdx].scores;
    if (scores[0] < 0 && scores[1] < 0) setMysticCount(c => c + 1);
  };

  const goNext = () => {
    if (!isLast) {
      setCurrent(c => c + 1);
    } else if (mysticCount >= 3 && hiddenQ && !hiddenAnswered && !showHidden) {
      setShowHidden(true);
    } else {
      finish();
    }
  };

  const finish = () => {
    const dims = [0, 0, 0, 0];
    Object.entries(answers).forEach(([qIdx, optIdx]) => {
      const question = allQuestions[parseInt(qIdx)];
      const scores = question.options[optIdx as number].scores;
      scores.forEach((s: number, i: number) => { dims[i] += s; });
    });
    router.push(`/loading?d=${dims.join(",")}`);
  };

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <div className="max-w-2xl mx-auto w-full px-4 pt-6 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-sm" style={{ color: "var(--ink-muted)" }}>
            Q <span style={{ color: "var(--blue)" }}>{current + 1}</span>/{totalVisible}
          </span>
          <button onClick={() => router.push("/")} className="text-xs" style={{ color: "var(--ink-muted)" }}>
            退出
          </button>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="max-w-2xl w-full animate-fade-up" key={current}>
          {/* Hidden Question Overlay */}
          {showHidden && hiddenQ ? (
            <div className="paper-card p-8 text-center">
              <div className="tag tag-purple mb-4">隐藏题</div>
              <h2 className="text-xl font-bold mb-6" style={{ color: "var(--ink)" }}>
                {hiddenQ.text}
              </h2>
              <div className="space-y-3">
                {hiddenQ.options.map((opt: any, i: number) => (
                  <div
                    key={i}
                    className={`option-card ${answers[hiddenQ.id] === i ? "selected" : ""}`}
                    onClick={() => {
                      setAnswers(a => ({ ...a, [hiddenQ.id]: i }));
                      setHiddenAnswered(true);
                    }}
                  >
                    <span className="text-sm" style={{ color: "var(--ink)" }}>{opt.text}</span>
                  </div>
                ))}
              </div>
              {hiddenAnswered && (
                <button className="btn-primary mt-6" onClick={finish}>
                  生成人格报告
                </button>
              )}
            </div>
          ) : (
            <>
              <h2 className="text-xl sm:text-2xl font-bold mb-8 text-center" style={{ color: "var(--ink)" }}>
                {q.text}
              </h2>
              <div className="space-y-3">
                {q.options.map((opt: any, i: number) => (
                  <div
                    key={i}
                    className={`option-card ${selectedIdx === i ? "selected" : ""}`}
                    onClick={() => selectOption(i)}
                  >
                    <span className="text-sm" style={{ color: "var(--ink)" }}>{opt.text}</span>
                  </div>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8">
                <button
                  className="btn-secondary"
                  onClick={() => setCurrent(c => Math.max(0, c - 1))}
                  disabled={current === 0}
                >
                  上一题
                </button>
                <button
                  className="btn-primary"
                  onClick={goNext}
                  disabled={selectedIdx === -1}
                >
                  {isLast ? "生成人格报告" : "下一题"}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
''')

# ============ Loading Page ============
w("app/loading-result/page.tsx", r'''"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import personalitiesRaw from "@/lib/data/personalities.json";

const personalities = (personalitiesRaw as any).personalities;
const dimDefs = (personalitiesRaw as any).dimensions;

function LoadingContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState(0);
  const msgs = ["正在分析你的填报基因...", "正在匹配人格档案...", "生成你的专属报告中..."];

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 1000);
    const t2 = setTimeout(() => setStep(2), 2000);
    const t3 = setTimeout(() => {
      const dStr = params.get("d");
      if (!dStr) { router.push("/"); return; }
      const dims = dStr.split(",").map(Number);
      let bestId = "chill";
      let bestScore = -Infinity;
      personalities.forEach((p: any) => {
        let score = 0;
        p.dims.forEach((pd: number, i: number) => {
          score -= Math.abs(pd - ((dims[i] + 30) / 60 * 100));
        });
        if (score > bestScore) { bestScore = score; bestId = p.id; }
      });
      router.push(`/result?type=${bestId}&d=${dStr}`);
    }, 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [params, router]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: "rgba(19,35,58,0.06)" }} />
          <div className="absolute inset-0 rounded-full border-2 border-t-[var(--blue)] border-r-[var(--gold)] animate-spin" />
          <div className="absolute inset-3 rounded-full bg-[var(--blue-50)] flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--ink)" }}>
          {msgs[step]}
        </h2>
        <div className="progress-track w-48 mx-auto mt-6">
          <div className="progress-fill" style={{ width: `${((step + 1) / 3) * 100}%` }} />
        </div>
        <p className="mt-4 text-xs" style={{ color: "var(--ink-muted)" }}>
          纯前端计算，不上传任何数据
        </p>
      </div>
    </div>
  );
}

export default function LoadingPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center"><p style={{color:"var(--ink-muted)"}}>Loading...</p></div>}>
      <LoadingContent />
    </Suspense>
  );
}
''')

# ============ Result Page ============
w("app/result/page.tsx", r'''"use client";
import { useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import html2canvas from "html2canvas";
import Link from "next/link";
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
  const normalized = dims.map(d => Math.max(5, Math.min(100, Math.round((d + 30) / 60 * 100))));

  const p = personalities.find((x: any) => x.id === typeId) || personalities[0];
  const bestP = personalities.find((x: any) => x.id === p.best);
  const worstP = personalities.find((x: any) => x.id === p.worst);
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const exportImage = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, backgroundColor: "#FBF9F1", useCORS: true
      });
      const link = document.createElement("a");
      link.download = `FuturePath-${p.en.replace(/\s/g, "")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) { console.error(e); }
    setExporting(false);
  };

  const copyText = () => {
    const text = `我的高考填报人格是「${p.name} ${p.en}」！\n${p.desc}\n\n快来测测你是哪种 👉 ${window.location.origin}`;
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-dvh py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Share Card */}
        <div ref={cardRef} className="glass-card p-6 sm:p-8 mb-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-5">
            <span className="text-5xl">{p.emoji}</span>
            <div className="flex-1">
              <div className="tag tag-blue mb-1">{p.group}</div>
              <h1 className="text-2xl font-extrabold" style={{ color: "var(--ink)" }}>{p.name}</h1>
              <div className="font-mono text-sm" style={{ color: "var(--ink-muted)" }}>{p.en}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-2xl font-bold" style={{ color: "var(--gold)" }}>{p.pct}%</div>
              <div className="text-xs" style={{ color: "var(--ink-muted)" }}>的人和你一样</div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--ink-light)" }}>{p.desc}</p>

          {/* Pros & Cons */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-lg p-3" style={{ background: "var(--blue-50)" }}>
              <div className="text-xs font-medium mb-1" style={{ color: "var(--blue)" }}>优点</div>
              <div className="text-sm" style={{ color: "var(--ink)" }}>{p.pros}</div>
            </div>
            <div className="rounded-lg p-3" style={{ background: "var(--gold-50)" }}>
              <div className="text-xs font-medium mb-1" style={{ color: "var(--gold)" }}>小缺点</div>
              <div className="text-sm" style={{ color: "var(--ink)" }}>{p.cons}</div>
            </div>
          </div>

          {/* Best / Worst Match */}
          <div className="flex gap-3 mb-5">
            {bestP && (
              <div className="flex-1 flex items-center gap-2 rounded-lg p-3" style={{ background: "rgba(107,155,122,0.1)" }}>
                <span className="text-2xl">{bestP.emoji}</span>
                <div>
                  <div className="text-xs" style={{ color: "var(--success)" }}>最配人格</div>
                  <Link href={`/result?type=${bestP.id}&d=0,0,0,0`} className="text-sm font-medium hover:underline" style={{ color: "var(--ink)" }}>{bestP.name}</Link>
                </div>
              </div>
            )}
            {worstP && (
              <div className="flex-1 flex items-center gap-2 rounded-lg p-3" style={{ background: "rgba(194,91,86,0.08)" }}>
                <span className="text-2xl">{worstP.emoji}</span>
                <div>
                  <div className="text-xs" style={{ color: "var(--danger)" }}>最挑战</div>
                  <Link href={`/result?type=${worstP.id}&d=0,0,0,0`} className="text-sm font-medium hover:underline" style={{ color: "var(--ink)" }}>{worstP.name}</Link>
                </div>
              </div>
            )}
          </div>

          {/* Quote */}
          <div className="rounded-lg p-4 mb-5 italic text-sm" style={{ background: "rgba(19,35,58,0.03)", color: "var(--ink-light)" }}>
            &ldquo;{p.quote}&rdquo;
          </div>

          {/* Dimension Bars */}
          <div className="space-y-3">
            {dimDefs.map((dim: any, i: number) => (
              <div key={dim.key}>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: "var(--ink-muted)" }}>{dim.left}</span>
                  <span className="font-mono font-medium" style={{ color: "var(--ink)" }}>{normalized[i]}</span>
                  <span style={{ color: "var(--ink-muted)" }}>{dim.right}</span>
                </div>
                <div className="dim-bar-track">
                  <div className="dim-bar-fill" style={{ width: `${normalized[i]}%`, background: dimColors[i] }} />
                </div>
              </div>
            ))}
          </div>

          {/* Watermark */}
          <div className="divider mt-6 mb-3" />
          <p className="text-center text-xs" style={{ color: "var(--ink-muted)" }}>
            FuturePath &middot; 仅供娱乐
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          <button className="btn-primary" onClick={exportImage} disabled={exporting}>
            {exporting ? "导出中..." : "保存分享卡"}
          </button>
          <button className="btn-secondary" onClick={copyText}>
            复制推荐文案
          </button>
        </div>
        <div className="flex gap-3 justify-center">
          <Link href="/quiz" className="btn-secondary">重新诊断</Link>
          <Link href="/gallery" className="btn-secondary">查看人格图鉴</Link>
          <Link href="/journey" className="btn-primary">开始志愿规划</Link>
        </div>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center"><p style={{color:"var(--ink-muted)"}}>Loading...</p></div>}>
      <ResultContent />
    </Suspense>
  );
}
''')

# ============ Gallery Page ============
w("app/gallery/page.tsx", r'''"use client";
import { useState } from "react";
import Link from "next/link";
import personalitiesRaw from "@/lib/data/personalities.json";

const personalities = (personalitiesRaw as any).personalities;
const groups = ["硬核务实", "务实随缘", "浪漫理性", "纯粹体验"];
const groupTags = ["tag-blue", "tag-gold", "tag-purple", "tag-olive"];

export default function GalleryPage() {
  const [selected, setSelected] = useState<any>(null);

  return (
    <div className="min-h-dvh py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: "var(--ink)" }}>人格图鉴</h1>
            <p className="text-sm mt-1" style={{ color: "var(--ink-muted)" }}>16 种高考填报人格，你是哪一种？</p>
          </div>
          <Link href="/" className="btn-secondary text-xs">返回首页</Link>
        </div>

        {/* Grid */}
        {groups.map((group, gi) => (
          <div key={group} className="mb-8">
            <div className={`tag ${groupTags[gi]} mb-3`}>{group}</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {personalities.filter((p: any) => p.group === group).map((p: any) => (
                <div
                  key={p.id}
                  className="paper-card p-4 cursor-pointer glass-card-hover text-center"
                  onClick={() => setSelected(p)}
                >
                  <span className="text-3xl block mb-2">{p.emoji}</span>
                  <div className="font-bold text-sm" style={{ color: "var(--ink)" }}>{p.name}</div>
                  <div className="font-mono text-[10px] mt-0.5" style={{ color: "var(--ink-muted)" }}>{p.en}</div>
                  <div className="font-mono text-xs mt-1" style={{ color: "var(--gold)" }}>{p.pct}%</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div className="glass-card p-6 sm:p-8 max-w-md w-full relative z-10 animate-fade-up max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-sm" style={{ color: "var(--ink-muted)" }} onClick={() => setSelected(null)}>
              &times;
            </button>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{selected.emoji}</span>
              <div>
                <div className="tag tag-blue text-[10px]">{selected.group}</div>
                <h2 className="text-xl font-extrabold" style={{ color: "var(--ink)" }}>{selected.name}</h2>
                <div className="font-mono text-xs" style={{ color: "var(--ink-muted)" }}>{selected.en}</div>
              </div>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--ink-light)" }}>{selected.desc}</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="rounded-lg p-2.5" style={{ background: "var(--blue-50)" }}>
                <div className="text-[10px] font-medium" style={{ color: "var(--blue)" }}>优点</div>
                <div className="text-xs" style={{ color: "var(--ink)" }}>{selected.pros}</div>
              </div>
              <div className="rounded-lg p-2.5" style={{ background: "var(--gold-50)" }}>
                <div className="text-[10px] font-medium" style={{ color: "var(--gold)" }}>小缺点</div>
                <div className="text-xs" style={{ color: "var(--ink)" }}>{selected.cons}</div>
              </div>
            </div>
            <div className="italic text-sm mb-4" style={{ color: "var(--ink-light)" }}>&ldquo;{selected.quote}&rdquo;</div>
            <Link href={`/result?type=${selected.id}&d=0,0,0,0`} className="btn-primary w-full text-sm">
              查看完整报告
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
''')

# ============ Navbar (Updated) ============
w("components/ui/Navbar.tsx", r'''"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "首页" },
  { href: "/quiz", label: "人格诊断" },
  { href: "/gallery", label: "图鉴" },
  { href: "/journey", label: "志愿规划" },
  { href: "/chat", label: "AI 咨询" },
];

export default function Navbar() {
  const path = usePathname();
  return (
    <nav className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto w-full">
      <Link href="/" className="font-bold text-lg tracking-tight" style={{ color: "var(--ink)" }}>
        FuturePath
      </Link>
      <div className="flex gap-1">
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              color: path === l.href ? "var(--blue)" : "var(--ink-muted)",
              background: path === l.href ? "var(--blue-50)" : "transparent",
            }}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
''')

print("\n所有页面组件生成完成！")
