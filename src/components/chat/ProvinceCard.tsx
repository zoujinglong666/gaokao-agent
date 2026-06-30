"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, MapPin, X } from "lucide-react";

interface ProvinceCardProps {
  onSelect: (province: string) => void;
  onDismiss: () => void;
}

const PROVINCES = [
  "北京", "天津", "河北", "山西", "内蒙古", "辽宁", "吉林", "黑龙江",
  "上海", "江苏", "浙江", "安徽", "福建", "江西", "山东", "河南",
  "湖北", "湖南", "广东", "广西", "海南", "重庆", "四川", "贵州",
  "云南", "西藏", "陕西", "甘肃", "青海", "宁夏", "新疆",
];

export default function ProvinceCard({ onSelect, onDismiss }: ProvinceCardProps) {
  const [selected, setSelected] = useState("");

  const handleConfirm = () => {
    if (selected) {
      onSelect(selected);
      setSelected("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 4px 20px rgba(19, 35, 58, 0.08)",
        border: "1px solid rgba(19, 35, 58, 0.06)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: "var(--blue-50)" }}>
        <div className="flex items-center gap-2">
          <MapPin size={16} style={{ color: "var(--blue)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--blue)" }}>
            选择你的省份
          </span>
        </div>
        <button onClick={onDismiss} className="p-1 rounded-full hover:bg-white/50 transition-colors">
          <X size={14} style={{ color: "var(--ink-muted)" }} />
        </button>
      </div>

      {/* Province Grid */}
      <div className="grid grid-cols-6 gap-1.5 p-3">
        {PROVINCES.map((province) => (
          <button
            key={province}
            onClick={() => setSelected(province)}
            className="py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: selected === province
                ? "linear-gradient(135deg, var(--blue) 0%, var(--blue-light) 100%)"
                : "rgba(19, 35, 58, 0.04)",
              color: selected === province ? "#fff" : "var(--ink)",
            }}
          >
            {selected === province && <Check size={10} className="mr-0.5" />}
            {province}
          </button>
        ))}
      </div>

      {/* Confirm */}
      {selected && (
        <div className="px-3 pb-3">
          <button
            onClick={handleConfirm}
            className="w-full py-2 rounded-lg text-xs font-bold transition-all"
            style={{
              background: "linear-gradient(135deg, var(--blue) 0%, var(--blue-light) 100%)",
              color: "#fff",
              boxShadow: "0 2px 8px rgba(74, 111, 165, 0.3)",
            }}
          >
            确认：{selected}
          </button>
        </div>
      )}
    </motion.div>
  );
}