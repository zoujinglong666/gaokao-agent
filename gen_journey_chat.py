# -*- coding: utf-8 -*-
"""Generate FuturePath-styled journey + chat pages"""
import os
BASE = r"d:\workCode\AiWorkCode\gaokao-agent\src"

def w(path, content):
    full = os.path.join(BASE, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  + {path}")

# ============ Journey Page (FuturePath style) ============
w("app/journey/page.tsx", r'''"use client";
import { useState, useMemo } from "react";
import Navbar from "@/components/ui/Navbar";
import universitiesRaw from "@/lib/data/universities.json";
import portalsRaw from "@/lib/data/province-portals.json";

const universities = (universitiesRaw as any).universities;
const portals = (portalsRaw as any).portals as Array<{
  province: string; examInstituteUrl: string; scoreCheckUrl: string;
  volunteerSystemUrl: string; scoreTableUrl: string;
  scoreCheckDate?: string; volunteerFillDate?: string;
}>;

const allProvinces = [
  "北京","天津","河北","山西","内蒙古","辽宁","吉林","黑龙江",
  "上海","江苏","浙江","安徽","福建","江西","山东","河南",
  "湖北","湖南","广东","广西","海南","重庆","四川","贵州",
  "云南","西藏","陕西","甘肃","青海","宁夏","新疆"
];

type Step = "province" | "score" | "recommending" | "results";

export default function JourneyPage() {
  const [step, setStep] = useState<Step>("province");
  const [province, setProvince] = useState("");
  const [score, setScore] = useState("");
  const [recs, setRecs] = useState<{reach: any[]; match: any[]; safety: any[]}>({reach:[],match:[],safety:[]});
  const [shortlist, setShortlist] = useState<string[]>([]);

  const portal = useMemo(() => portals.find((p: any) => p.province === province), [province]);

  const generate = () => {
    const s = parseInt(score);
    if (!s) return;
    setStep("recommending");
    setTimeout(() => {
      const reach: any[] = [], match: any[] = [], safety: any[] = [];
      universities.forEach((u: any) => {
        const is9 = u.tags.includes("985"), is2 = u.tags.includes("211"), isD = u.tags.includes("\u53cc\u4e00\u6d41");
        if (s >= 650) { is9 ? (s >= 680 ? reach.push(u) : match.push(u)) : is2 ? safety.push(u) : null; }
        else if (s >= 600) { is9 ? reach.push(u) : is2 ? match.push(u) : isD ? safety.push(u) : null; }
        else if (s >= 550) { is2 ? reach.push(u) : isD ? match.push(u) : safety.push(u); }
        else if (s >= 500) { isD ? reach.push(u) : match.push(u); }
        else { (!is9 && !is2) ? match.push(u) : (is2 && !is9) ? reach.push(u) : null; }
      });
      const sh = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);
      setRecs({ reach: sh(reach).slice(0,5), match: sh(match).slice(0,5), safety: sh(safety).slice(0,5) });
      setStep("results");
    }, 2000);
  };

  const toggle = (id: string) => setShortlist(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);

  const steps: {key: Step; label: string}[] = [
    {key:"province",label:"\u9009\u62e9\u7701\u4efd"},
    {key:"score",label:"\u8f93\u5165\u5206\u6570"},
    {key:"results",label:"\u67e5\u770b\u63a8\u8350"}
  ];
  const stepIdx = step === "recommending" ? 2 : steps.findIndex(s => s.key === step);

  return (
    <div className="min-h-dvh">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                i === stepIdx ? "bg-[var(--blue)] text-white shadow-md" :
                i < stepIdx ? "text-[var(--success)]" : "text-[var(--ink-muted)]"
              }`} style={i < stepIdx ? {background:"rgba(107,155,122,0.12)"} : i > stepIdx ? {background:"rgba(19,35,58,0.04)"} : {}}>
                {i < stepIdx ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                ) : <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px]">{i+1}</span>}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < 2 && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted)" strokeWidth="2" opacity="0.3"><path d="M9 18l6-6-6-6"/></svg>}
            </div>
          ))}
        </div>

        {/* Province Select */}
        {step === "province" && (
          <div className="paper-card p-8 text-center animate-fade-up">
            <h2 className="text-2xl font-bold mb-2" style={{color:"var(--ink)"}}>你来自哪个省份？</h2>
            <p className="text-sm mb-6" style={{color:"var(--ink-muted)"}}>选择后我帮你找到查分入口，然后推荐适合的院校</p>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {allProvinces.map(p => (
                <button key={p} onClick={() => { setProvince(p); setStep("score"); }}
                  className="px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:shadow-md"
                  style={{background:"var(--blue-50)",color:"var(--ink-light)"}}
                  onMouseOver={e=>{e.currentTarget.style.background="var(--blue)";e.currentTarget.style.color="#fff"}}
                  onMouseOut={e=>{e.currentTarget.style.background="var(--blue-50)";e.currentTarget.style.color="var(--ink-light)"}}
                >{p}</button>
              ))}
            </div>
          </div>
        )}

        {/* Score Input */}
        {step === "score" && portal && (
          <div className="space-y-4 animate-fade-up">
            <div className="paper-card p-8 text-center">
              <h2 className="text-2xl font-bold mb-1" style={{color:"var(--ink)"}}>{province}考生</h2>
              {portal.scoreCheckDate && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full tag-gold text-xs mb-4">
                  查分时间：{portal.scoreCheckDate}
                </div>
              )}
              <div className="flex justify-center gap-3 mb-6 text-xs">
                <a href={portal.scoreCheckUrl} target="_blank" rel="noopener noreferrer"
                  className="btn-primary text-xs" style={{fontSize:"0.8rem"}}>
                  前往查分入口
                </a>
              </div>
              {portal.volunteerFillDate && (
                <p className="text-xs mb-4" style={{color:"var(--ink-muted)"}}>填报时间：{portal.volunteerFillDate}</p>
              )}
              <div className="max-w-xs mx-auto">
                <label className="block text-xs font-medium mb-2 text-left" style={{color:"var(--ink-muted)"}}>高考分数 / 估分</label>
                <input type="number" value={score} onChange={e=>setScore(e.target.value)} placeholder="如：620"
                  className="w-full px-4 py-3 text-xl text-center rounded-xl border-2 focus:outline-none transition-colors"
                  style={{borderColor:"rgba(74,111,165,0.2)",background:"var(--blue-50)",color:"var(--ink)"}}
                  onFocus={e=>e.currentTarget.style.borderColor="var(--blue)"}
                  onBlur={e=>e.currentTarget.style.borderColor="rgba(74,111,165,0.2)"}
                />
              </div>
              <button onClick={generate} disabled={!score} className="btn-primary mt-6 w-full max-w-xs">
                开始智能匹配
              </button>
            </div>
            <button onClick={()=>setStep("province")} className="btn-secondary mx-auto block text-xs">重新选择省份</button>
          </div>
        )}

        {/* Loading */}
        {step === "recommending" && (
          <div className="paper-card p-16 text-center animate-fade-in">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-2" style={{borderColor:"rgba(19,35,58,0.06)"}} />
              <div className="absolute inset-0 rounded-full border-2 border-t-[var(--blue)] border-r-[var(--gold)] animate-spin" />
            </div>
            <h2 className="text-xl font-bold gradient-text mb-2">正在匹配院校...</h2>
            <p className="text-sm" style={{color:"var(--ink-muted)"}}>{province} {score}分 的最佳选择</p>
          </div>
        )}

        {/* Results */}
        {step === "results" && (
          <div className="space-y-6 animate-fade-up">
            <div className="paper-card p-6">
              <h2 className="text-xl font-bold mb-1" style={{color:"var(--ink)"}}>你的专属志愿方案</h2>
              <p className="text-sm" style={{color:"var(--ink-muted)"}}>{province} &middot; {score}分 &middot; 共推荐 {recs.reach.length+recs.match.length+recs.safety.length} 所院校</p>
              <div className="flex gap-3 mt-4">
                <div className="text-center px-4 py-2 rounded-xl" style={{background:"rgba(194,91,86,0.08)"}}>
                  <div className="text-xl font-bold font-mono" style={{color:"var(--danger)"}}>{recs.reach.length}</div>
                  <div className="text-[10px]" style={{color:"var(--ink-muted)"}}>冲刺</div>
                </div>
                <div className="text-center px-4 py-2 rounded-xl" style={{background:"var(--gold-50)"}}>
                  <div className="text-xl font-bold font-mono" style={{color:"var(--gold)"}}>{recs.match.length}</div>
                  <div className="text-[10px]" style={{color:"var(--ink-muted)"}}>稳妥</div>
                </div>
                <div className="text-center px-4 py-2 rounded-xl" style={{background:"rgba(107,155,122,0.08)"}}>
                  <div className="text-xl font-bold font-mono" style={{color:"var(--success)"}}>{recs.safety.length}</div>
                  <div className="text-[10px]" style={{color:"var(--ink-muted)"}}>保底</div>
                </div>
              </div>
            </div>

            {([["reach","冲刺院校","var(--danger)","有挑战但值得尝试"],
               ["match","稳妥院校","var(--gold)","最匹配你的选择"],
               ["safety","保底院校","var(--success)","确保有学可上"]] as const).map(([key,title,color,sub]) => (
              <div key={key}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{background:color}} />
                  <h3 className="font-bold" style={{color:"var(--ink)"}}>{title}</h3>
                  <span className="text-xs" style={{color:"var(--ink-muted)"}}>{sub}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(recs as any)[key].map((u: any, i: number) => (
                    <div key={u.id} className="paper-card p-4 glass-card-hover">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-sm" style={{color:"var(--ink)"}}>{u.name}</div>
                          <div className="text-xs mt-0.5" style={{color:"var(--ink-muted)"}}>{u.city} &middot; {u.type}</div>
                        </div>
                        <button onClick={()=>toggle(u.id)} className="text-sm" style={{color:shortlist.includes(u.id)?"var(--danger)":"var(--ink-muted)"}}>
                          {shortlist.includes(u.id) ? "\u2764" : "\u2661"}
                        </button>
                      </div>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {u.tags.map((t: string) => <span key={t} className="tag tag-blue text-[10px]">{t}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex justify-center gap-3 pb-8">
              <button onClick={()=>{setStep("score");setRecs({reach:[],match:[],safety:[]})}} className="btn-secondary">
                修改分数重新推荐
              </button>
              <a href="/chat" className="btn-primary">进入 AI 深度咨询</a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
''')

# ============ Chat Page (FuturePath style) ============
w("app/chat/page.tsx", r'''"use client";
import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/ui/Navbar";

interface Msg { role: "user" | "assistant"; content: string; }

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "你好！我是 FuturePath AI 顾问。你可以问我关于志愿填报的任何问题，比如：\n\n- 我的分数能上哪些 985？\n- 计算机和人工智能专业怎么选？\n- 这个学校的就业情况怎么样？" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, { role: "user", content: userMsg }] }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setMessages(m => [...m, { role: "assistant", content: data.reply || "抱歉，我暂时无法回答这个问题。请稍后再试。" }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "网络异常，请检查你的 API Key 配置后重试。" }]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-4 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "text-white"
                  : "glass-card"
              }`} style={msg.role === "user" ? {background:"var(--blue)"} : {color:"var(--ink)"}}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="glass-card px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{background:"var(--blue)",animationDelay:"0s"}} />
                  <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{background:"var(--blue)",animationDelay:"0.3s"}} />
                  <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{background:"var(--blue)",animationDelay:"0.6s"}} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="glass-card p-3 flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="问我任何志愿填报的问题..."
            className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none"
            style={{background:"rgba(19,35,58,0.03)",color:"var(--ink)"}}
          />
          <button onClick={send} disabled={!input.trim() || loading} className="btn-primary px-4 py-2.5 text-sm">
            发送
          </button>
        </div>
      </main>
    </div>
  );
}
''')

print("\nJourney + Chat 页面生成完成！")
