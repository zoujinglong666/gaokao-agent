"use client";
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
