
"use client";
import { motion } from "framer-motion";
import {
  MapPin, ExternalLink, Phone, Globe, Navigation,
  GraduationCap, Star, Heart, ChevronDown, ChevronUp
} from "lucide-react";
import { useState } from "react";

export interface UniversityInfo {
  id: string;
  name: string;
  province: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  website: string;
  admissionOfficePhone: string;
  tags: string[];
  type: string;
}

interface UniversityCardProps {
  university: UniversityInfo;
  tier?: "reach" | "match" | "safety";
  index?: number;
  onShortlist?: (id: string) => void;
  isShortlisted?: boolean;
}

const tierConfig = {
  reach: {
    label: "冲刺",
    bg: "from-[#EF476F] to-[#FF6B8A]",
    badge: "bg-[#EF476F]",
    text: "这个目标有点高，但梦想值得追逐！",
    emoji: "🔥",
  },
  match: {
    label: "稳妥",
    bg: "from-[#FFD166] to-[#FFE0A0]",
    badge: "bg-[#FFD166]",
    text: "很匹配！这是最适合你的选择区间。",
    emoji: "⭐",
  },
  safety: {
    label: "保底",
    bg: "from-[#06D6A0] to-[#40E8B8]",
    badge: "bg-[#06D6A0]",
    text: "稳稳的幸福，确保你有学可上！",
    emoji: "🛡️",
  },
};

export default function UniversityCard({
  university,
  tier,
  index = 0,
  onShortlist,
  isShortlisted = false,
}: UniversityCardProps) {
  const [expanded, setExpanded] = useState(false);
  const u = university;
  const tierInfo = tier ? tierConfig[tier] : null;

  // Amap navigation URL
  const navUrl = `https://uri.amap.com/marker?position=${u.lng},${u.lat}&name=${encodeURIComponent(u.name)}&callnative=1`;
  // Amap route planning URL
  const routeUrl = `https://uri.amap.com/navigation?to=${u.lng},${u.lat},${encodeURIComponent(u.name)}&mode=car&src=gaokao-agent`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${tier ? `bg-gradient-to-br ${tierInfo!.bg}` : "bg-gradient-to-br from-[#FF8C42] to-[#118AB2]"} flex items-center justify-center shadow-md`}>
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800">{u.name}</h3>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <MapPin className="w-3.5 h-3.5" />
                {u.city} · {u.type}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tierInfo && (
              <span className={`px-2.5 py-1 ${tierInfo.badge} text-white text-xs font-bold rounded-full`}>
                {tierInfo.emoji} {tierInfo.label}
              </span>
            )}
            {onShortlist && (
              <button
                onClick={() => onShortlist(u.id)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isShortlisted
                    ? "bg-red-50 text-red-500"
                    : "bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-400"
                }`}
              >
                <Heart className={`w-4 h-4 ${isShortlisted ? "fill-current" : ""}`} />
              </button>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {u.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs font-medium rounded-md bg-orange-50 text-[#FF8C42]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Tier encouragement text */}
        {tierInfo && (
          <p className="text-sm text-gray-500 italic mb-3">
            {tierInfo.text}
          </p>
        )}
      </div>

      {/* Action Buttons - Always visible */}
      <div className="px-5 pb-3 flex gap-2">
        <a
          href={navUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
        >
          <MapPin className="w-4 h-4" />
          查看位置
        </a>
        <a
          href={routeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-50 text-green-600 rounded-xl text-sm font-medium hover:bg-green-100 transition-colors"
        >
          <Navigation className="w-4 h-4" />
          路线规划
        </a>
      </div>

      {/* Expand button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-2 text-sm text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 border-t border-gray-50 transition-colors"
      >
        {expanded ? "收起详情" : "展开详情"}
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Expanded Details */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="border-t border-gray-100"
        >
          <div className="p-5 space-y-3">
            {/* Address */}
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-gray-400">详细地址</div>
                <div className="text-gray-700">{u.address}</div>
              </div>
            </div>

            {/* Website */}
            <div className="flex items-start gap-2 text-sm">
              <Globe className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-gray-400">学校官网</div>
                <a href={u.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                  {u.website.replace("https://", "").replace("http://", "")}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Admission Office */}
            <div className="flex items-start gap-2 text-sm">
              <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-gray-400">招生办电话</div>
                <a href={`tel:${u.admissionOfficePhone}`} className="text-blue-500 hover:underline">
                  {u.admissionOfficePhone}
                </a>
              </div>
            </div>

            {/* Mini Map Preview */}
            {process.env.NEXT_PUBLIC_AMAP_KEY && u.lng && u.lat && (
              <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                <a href={navUrl} target="_blank" rel="noopener noreferrer" className="block relative">
                  <img
                    src={`https://restapi.amap.com/v3/staticmap?location=${u.lng},${u.lat}&zoom=14&size=600*200&markers=mid,,A:${u.lng},${u.lat}&key=${process.env.NEXT_PUBLIC_AMAP_KEY}`}
                    alt={`${u.name}位置`}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent flex items-end justify-center pb-2">
                    <span className="text-white text-xs font-medium bg-black/40 px-2 py-1 rounded-full">
                      点击打开高德地图导航
                    </span>
                  </div>
                </a>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
