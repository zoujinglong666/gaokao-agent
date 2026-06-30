"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import personalitiesRaw from "@/lib/data/personalities.json";

const personalities = (personalitiesRaw as any).personalities;
const groups = ["硬核务实", "务实随缘", "浪漫理性", "纯粹体验"];
const groupTags = ["tag-blue", "tag-gold", "tag-purple", "tag-olive"];

export default function GalleryPage() {
  const [selected, setSelected] = useState<any>(null);
  const router = useRouter();

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
                <motion.div
                  key={p.id}
                  className="paper-card p-4 cursor-pointer glass-card-hover text-center"
                  onClick={() => setSelected(p)}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="text-3xl block mb-2">{p.emoji}</span>
                  <div className="font-bold text-sm" style={{ color: "var(--ink)" }}>{p.name}</div>
                  <div className="font-mono text-[10px] mt-0.5" style={{ color: "var(--ink-muted)" }}>{p.en}</div>
                  <div className="font-mono text-xs mt-1" style={{ color: "var(--gold)" }}>{p.pct}%</div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              style={{ background: "rgba(19,35,58,0.5)", backdropFilter: "blur(4px)" }}
              onClick={() => setSelected(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md glass-card p-6 sm:p-8 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-black/5 transition-colors"
                style={{ color: "var(--ink-muted)" }}
                onClick={() => setSelected(null)}
              >
                <X size={18} />
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
              <Link
                href={`/result?type=${selected.id}&d=0,0,0,0`}
                className="btn-primary w-full text-sm"
                onClick={() => setSelected(null)}
              >
                查看完整报告
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}