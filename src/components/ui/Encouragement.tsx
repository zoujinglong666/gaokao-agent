
"use client";
import { motion } from "framer-motion";
import { Heart, Sparkles, TrendingUp, Star, Sun } from "lucide-react";

interface EncouragementProps {
  score: number;
  province: string;
}

// 根据分数区间返回不同的鼓励信息
const encouragementData = [
  {
    minScore: 650,
    icon: Star,
    color: "from-[#FFD166] to-[#FF8C42]",
    messages: [
      "太厉害了！你的分数非常优秀，顶尖名校正在向你招手！",
      "这个分数让你拥有了选择的主动权，好好规划，未来可期！",
    ],
  },
  {
    minScore: 600,
    icon: Sparkles,
    color: "from-[#118AB2] to-[#06D6A0]",
    messages: [
      "很棒的成绩！你有实力去冲击很多好学校，让我们一起找到最适合你的！",
      "你的努力已经有了回报，接下来的志愿填报同样精彩！",
    ],
  },
  {
    minScore: 550,
    icon: TrendingUp,
    color: "from-[#06D6A0] to-[#118AB2]",
    messages: [
      "不错的分数！有很多优秀的学校和专业适合你，关键是找到真正感兴趣的方向。",
      "分数只是起点，选对方向更重要。你的未来有无限可能！",
    ],
  },
  {
    minScore: 500,
    icon: Sun,
    color: "from-[#FF8C42] to-[#FFD166]",
    messages: [
      "每个人都有属于自己的赛道！找到适合自己的学校和专业，一样可以很精彩。",
      "高考只是人生的一个节点，不是终点。很多成功的人都是从普通学校起步的！",
    ],
  },
  {
    minScore: 400,
    icon: Heart,
    color: "from-[#EF476F] to-[#FF8C42]",
    messages: [
      "别灰心！人生的路很长，高考只是一个开始。找到适合自己的方向，你一样可以很出色。",
      "很多优秀的技能人才都是从专科起步的。重要的不是起点，而是你选择的方向和坚持的努力。",
      "你知道吗？很多成功的企业家都不是名校毕业的。你的未来由你自己定义！",
    ],
  },
  {
    minScore: 0,
    icon: Heart,
    color: "from-[#EF476F] to-[#FF8C42]",
    messages: [
      "无论分数如何，你都是独一无二的。每个人都有自己的闪光点，让我们一起找到最适合你的路。",
      "人生不是百米冲刺，而是一场马拉松。现在只是一个起点，未来充满了可能性！",
      "记住：你的价值不由一个分数定义。找到热爱的事，坚持下去，你一定会很出色。",
    ],
  },
];

export default function Encouragement({ score, province }: EncouragementProps) {
  const tier = encouragementData.find((t) => score >= t.minScore) || encouragementData[encouragementData.length - 1];
  const Icon = tier.icon;
  const message = tier.messages[Math.floor(Math.random() * tier.messages.length)];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`bg-gradient-to-r ${tier.color} rounded-2xl p-6 text-white shadow-lg`}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-lg font-medium leading-relaxed mb-2">
            {message}
          </p>
          <p className="text-sm text-white/80">
            来自{province}的 {score} 分考生，我们为你准备了最适合的院校推荐方案 💪
          </p>
        </div>
      </div>
    </motion.div>
  );
}
