"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Loader2, Download, Sparkles, ChevronRight } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import ReactMarkdown from "react-markdown";

export default function ReportPage() {
  const [report, setReport] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("gaokao-profile");
    if (saved) {
      try { setProfile(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  const generateReport = async () => {
    if (!profile) return;
    setIsLoading(true);
    setReport("");
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      const data = await res.json();
      setReport(data.report || "报告生成失败，请重试。");
    } catch {
      setReport("网络错误，请稍后重试。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#118AB2] to-[#06D6A0] flex items-center justify-center shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">个性化志愿报告</h1>
            <p className="text-gray-500">基于你的信息，AI为你量身定制的志愿推荐方案</p>
          </div>

          {!profile ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-orange-50">
              <p className="text-gray-500 mb-4">你还没有填写个人信息哦！</p>
              <a href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FF8C42] to-[#FFD166] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all">
                去填写信息 <ChevronRight className="w-5 h-5" />
              </a>
            </div>
          ) : (
            <>
              {/* Profile Summary */}
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-orange-50">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#FF8C42]" /> 你的信息
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="text-gray-400">省份</div>
                    <div className="font-bold text-gray-800">{(profile as Record<string, string>).province || "未设置"}</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="text-gray-400">分数</div>
                    <div className="font-bold text-gray-800">{(profile as Record<string, number>).score || "未设置"}分</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="text-gray-400">选科</div>
                    <div className="font-bold text-gray-800">{Array.isArray((profile as Record<string, string[]>).subjects) ? ((profile as Record<string, string[]>).subjects || []).join(",") : "未设置"}</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="text-gray-400">兴趣</div>
                    <div className="font-bold text-gray-800 truncate">{(profile as Record<string, string>).interests || "未设置"}</div>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              {!report && !isLoading && (
                <div className="text-center">
                  <button
                    onClick={generateReport}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#118AB2] to-[#06D6A0] text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                  >
                    <Sparkles className="w-5 h-5" />
                    生成志愿报告
                  </button>
                  <p className="text-sm text-gray-400 mt-3">报告生成可能需要 30-60 秒，请耐心等待</p>
                </div>
              )}

              {/* Loading */}
              {isLoading && (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-orange-50">
                  <Loader2 className="w-10 h-10 text-[#118AB2] animate-spin mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">正在为你生成个性化志愿报告...</p>
                  <p className="text-sm text-gray-400 mt-2">AI 正在分析院校数据、匹配专业方向，马上就好！</p>
                </div>
              )}

              {/* Report Content */}
              {report && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-8 border border-orange-50">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">你的志愿报告</h2>
                    <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-orange-50 text-[#FF8C42] rounded-lg hover:bg-orange-100 transition-colors">
                      <Download className="w-4 h-4" /> 导出
                    </button>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{report}</ReactMarkdown>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
