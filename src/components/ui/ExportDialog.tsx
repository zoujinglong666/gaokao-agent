"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileText, X, Check, FileSpreadsheet } from "lucide-react";

interface ShortlistItem {
  id: string;
  name: string;
  province: string;
  city: string;
  tags: string[];
}

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  items: ShortlistItem[];
  studentInfo: { province: string; score: number | null; subjects: string[] };
}

export default function ExportDialog({ open, onClose, items, studentInfo }: ExportDialogProps) {
  const [format, setFormat] = useState<"pdf" | "csv" | "print">("print");
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    if (format === "csv") exportCSV();
    else if (format === "pdf") exportPDF();
    else printTable();
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  const exportCSV = () => {
    const headers = ["序号", "院校名称", "所在地", "省份", "标签", "考生省份", "考生分数", "选科"];
    const rows = items.map((it, i) => [
      i + 1,
      it.name,
      it.city,
      it.province,
      (it.tags || []).join("/"),
      studentInfo.province,
      studentInfo.score ?? "",
      (studentInfo.subjects || []).join("+"),
    ]);
    const csv = "\uFEFF" + [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `志愿表_${studentInfo.province || "未填"}_${studentInfo.score || "未填"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    // 用浏览器原生打印生成 PDF
    printTable();
  };

  const printTable = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>志愿表</title>
    <style>
      body{font-family:system-ui,"PingFang SC","Microsoft YaHei",sans-serif;padding:24px;color:#13233a}
      h1{font-size:20px;margin:0 0 8px}
      .meta{font-size:13px;color:#5a6b7a;margin-bottom:16px;line-height:1.8}
      .meta b{color:#13233a}
      table{width:100%;border-collapse:collapse;font-size:13px}
      th,td{border:1px solid #cbd5e0;padding:8px 10px;text-align:left}
      th{background:#eef3f9;font-weight:600}
      tr:nth-child(even) td{background:#f8fafc}
      .badge{display:inline-block;padding:1px 6px;background:#eef3f9;color:#3b557a;border-radius:3px;font-size:11px;margin-right:3px}
      .footer{margin-top:24px;padding-top:12px;border-top:1px dashed #cbd5e0;font-size:11px;color:#7a8593;line-height:1.7}
      @media print {
        .no-print{display:none}
        body{padding:8mm}
      }
    </style></head><body>
    <h1>高考志愿表（草稿）</h1>
    <div class="meta">
      <div><b>考生所在地：</b>${studentInfo.province || "未填"}</div>
      <div><b>高考分数：</b>${studentInfo.score ?? "未填"}</div>
      <div><b>选考科目：</b>${(studentInfo.subjects || []).join(" + ") || "未填"}</div>
      <div><b>生成时间：</b>${new Date().toLocaleString("zh-CN")}</div>
      <div><b>志愿数量：</b>${items.length} 所</div>
    </div>
    <table>
      <thead><tr><th style="width:50px">序号</th><th>院校名称</th><th style="width:90px">所在地</th><th>标签</th></tr></thead>
      <tbody>
        ${items.map((it, i) => `<tr>
          <td>${i + 1}</td>
          <td><b>${it.name}</b></td>
          <td>${it.city} · ${it.province}</td>
          <td>${(it.tags || []).map((t) => `<span class="badge">${t}</span>`).join("")}</td>
        </tr>`).join("")}
      </tbody>
    </table>
    <div class="footer">
      ⚠️ 本表为草稿，最终志愿以省教育考试院官方系统为准。<br>
      📌 数据可信度：AI 推荐结果仅供参考，请结合招生章程、近三年录取数据、一分一段表综合判断。
    </div>
    <div class="no-print" style="margin-top:16px">
      <button onclick="window.print()" style="padding:8px 16px;background:#3b557a;color:#fff;border:none;border-radius:4px;cursor:pointer">打印 / 另存为 PDF</button>
    </div>
    </body></html>`;
    win.document.write(html);
    win.document.close();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(19,35,58,0.5)", backdropFilter: "blur(4px)" }}
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md p-5 rounded-2xl"
            style={{ background: "var(--paper)", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: "var(--ink)" }}>
                <Download size={18} /> 导出志愿表
              </h3>
              <button onClick={onClose} className="p-1 rounded" style={{ color: "var(--ink-muted)" }}>
                <X size={18} />
              </button>
            </div>

            <div className="text-xs mb-3" style={{ color: "var(--ink-muted)" }}>
              已选 <b style={{ color: "var(--ink)" }}>{items.length}</b> 所院校，可导出为：
            </div>

            <div className="space-y-2 mb-4">
              {[
                { v: "print", icon: FileText, t: "打印 / 另存为 PDF", d: "推荐：可保存为 PDF 直接打印" },
                { v: "csv", icon: FileSpreadsheet, t: "Excel / CSV 表格", d: "可在 Excel 中编辑" },
              ].map((opt) => {
                const Icon = opt.icon;
                const sel = format === opt.v;
                return (
                  <button
                    key={opt.v}
                    onClick={() => setFormat(opt.v as any)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition"
                    style={{
                      background: sel ? "var(--blue-50)" : "rgba(0,0,0,0.02)",
                      border: sel ? "1.5px solid var(--blue)" : "1px solid rgba(0,0,0,0.06)",
                    }}
                  >
                    <Icon size={18} style={{ color: sel ? "var(--blue)" : "var(--ink-muted)" }} />
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: "var(--ink)" }}>{opt.t}</div>
                      <div className="text-xs" style={{ color: "var(--ink-muted)" }}>{opt.d}</div>
                    </div>
                    {sel && <Check size={16} style={{ color: "var(--blue)" }} />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleExport}
              className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition active:scale-95"
              style={{ background: "var(--blue)" }}
            >
              {exported ? "已导出 ✓" : "开始导出"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}