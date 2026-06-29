"use client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, ExternalLink, MapPin, FileText, BarChart3, Building2 } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import portalsRaw from "@/lib/data/province-portals.json";

const portals = (portalsRaw as Record<string, unknown>).portals as Array<{
  province: string;
  examInstituteUrl: string;
  scoreCheckUrl: string;
  volunteerSystemUrl: string;
  scoreTableUrl: string;
  scoreCheckDate?: string;
  volunteerFillDate?: string;
}>;

export default function PortalsPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return portals;
    return portals.filter((p) => p.province.includes(search));
  }, [search]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#06D6A0] to-[#118AB2] flex items-center justify-center shadow-lg">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">全国省份高考导航</h1>
            <p className="text-gray-500">一键直达各省官方查分入口、志愿填报系统、一分一段表</p>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索省份..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-orange-200 rounded-xl focus:border-[#FF8C42] focus:outline-none shadow-sm"
              />
            </div>
          </div>

          {/* Province Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((portal, idx) => (
              <motion.div
                key={portal.province}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-white rounded-xl shadow-md border border-orange-50 p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF8C42] to-[#FFD166] flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{portal.province.slice(0, 1)}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{portal.province}</h3>
                    <p className="text-xs text-gray-400">教育考试院</p>
                    {portal.scoreCheckDate && (
                      <p className="text-[10px] text-[#FF8C42] font-medium mt-0.5">查分：{portal.scoreCheckDate}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <a
                    href={portal.scoreCheckUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    高考查分入口
                  </a>
                  <a
                    href={portal.volunteerSystemUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    志愿填报系统
                  </a>
                  <a
                    href={portal.scoreTableUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    一分一段表
                  </a>
                  <a
                    href={portal.examInstituteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    <Building2 className="w-4 h-4" />
                    教育考试院官网
                  </a>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              未找到匹配的省份
            </div>
          )}

          <div className="mt-8 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <p className="text-sm text-yellow-700">
              <strong>温馨提示：</strong>数据来源为各省教育考试院官网（2025年手动验证）。
              查分入口仅在成绩公布期间开放，非公布期可能无法直接访问具体页面。
              如发现链接失效，请搜索"XX省教育考试院"获取最新官方入口。
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
