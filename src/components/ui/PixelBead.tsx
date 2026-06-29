"use client";
import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

interface PixelBeadProps {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  pixelSize?: number;
  beadGap?: number;
  className?: string;
  style?: React.CSSProperties;
  fallbackGradient?: string;
  /** hover 时显示原图，默认 true */
  hoverReveal?: boolean;
}

/**
 * 拼豆风格像素化图片组件
 * 将真实图片转换为拼豆（Perler Beads）像素艺术效果
 * - 使用 Canvas 将图片缩小到极低分辨率
 * - 再以 nearest-neighbor 插值放大，形成像素块
 * - 叠加圆形珠子纹理 + 间隙线，模拟真实拼豆质感
 */
export default function PixelBead({
  src,
  alt = "",
  width = 400,
  height = 250,
  pixelSize = 12,
  beadGap = 1,
  className = "",
  style = {},
  fallbackGradient = "linear-gradient(135deg, #3B557A 0%, #6B8DB5 100%)",
  hoverReveal = true,
}: PixelBeadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (!src || error) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      // 计算缩小后的像素网格尺寸
      const smallW = Math.max(4, Math.floor(width / pixelSize));
      const smallH = Math.max(3, Math.floor(height / pixelSize));

      // 创建临时小画布，将图片缩到极低分辨率
      const tmpCanvas = document.createElement("canvas");
      tmpCanvas.width = smallW;
      tmpCanvas.height = smallH;
      const tmpCtx = tmpCanvas.getContext("2d");
      if (!tmpCtx) return;

      // 关闭抗锯齿，保留原始像素
      tmpCtx.imageSmoothingEnabled = false;
      tmpCtx.drawImage(img, 0, 0, smallW, smallH);

      // 读取缩小后的像素数据
      const imageData = tmpCtx.getImageData(0, 0, smallW, smallH);
      const data = imageData.data;

      // 在主画布上绘制拼豆效果
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, width, height);

      const beadR = (pixelSize - beadGap * 2) / 2;

      for (let y = 0; y < smallH; y++) {
        for (let x = 0; x < smallW; x++) {
          const idx = (y * smallW + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          if (a < 30) continue;

          const cx = x * pixelSize + pixelSize / 2;
          const cy = y * pixelSize + pixelSize / 2;

          // 绘制珠子底色
          ctx.beginPath();
          ctx.arc(cx, cy, beadR, 0, Math.PI * 2);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fill();

          // 绘制高光（左上角）模拟塑料珠子反光
          const hlR = beadR * 0.4;
          const hlX = cx - beadR * 0.25;
          const hlY = cy - beadR * 0.25;
          const hlGrad = ctx.createRadialGradient(hlX, hlY, 0, hlX, hlY, hlR);
          hlGrad.addColorStop(0, `rgba(255,255,255,0.35)`);
          hlGrad.addColorStop(1, `rgba(255,255,255,0)`);
          ctx.beginPath();
          ctx.arc(hlX, hlY, hlR, 0, Math.PI * 2);
          ctx.fillStyle = hlGrad;
          ctx.fill();

          // 绘制中心孔（拼豆特征）
          ctx.beginPath();
          ctx.arc(cx, cy, beadR * 0.15, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0,0,0,0.2)`;
          ctx.fill();
        }
      }

      setLoaded(true);
    };

    img.onerror = () => {
      setError(true);
    };

    img.src = src;
  }, [src, width, height, pixelSize, beadGap, error]);

  if (error || !src) {
    return (
      <div
        className={className}
        style={{
          width,
          height,
          background: fallbackGradient,
          borderRadius: "inherit",
          ...style,
        }}
      />
    );
  }

  return (
    <div
      className={`relative overflow-hidden cursor-pointer ${className}`}
      style={{ width: style.width ?? width, height: style.height ?? height, ...style }}
      onMouseEnter={() => hoverReveal && setHovering(true)}
      onMouseLeave={() => hoverReveal && setHovering(false)}
    >
      {/* 加载占位 - 渐变背景 */}
      {!loaded && (
        <motion.div
          className="absolute inset-0"
          style={{ background: fallbackGradient }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      {/* 拼豆 Canvas - 固定内部分辨率，CSS 控制显示尺寸 */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          imageRendering: "pixelated",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}
      />
      {/* 原图覆盖层 - hover 时淡入 */}
      {loaded && hoverReveal && (
        <img
          src={src}
          alt={alt}
          crossOrigin="anonymous"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: hovering ? 1 : 0,
            transition: "opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            pointerEvents: "none",
          }}
        />
      )}
      {/* 标签 - 根据 hover 状态切换 */}
      {loaded && (
        <div
          className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold transition-all duration-300"
          style={{
            background: hovering ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.5)",
            color: hovering ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.8)",
            backdropFilter: "blur(4px)",
          }}
        >
          {hovering ? "ORIGINAL" : "PIXEL BEAD"}
        </div>
      )}
      {/* hover 提示 */}
      {loaded && hoverReveal && !hovering && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[8px] font-medium"
          style={{
            background: "rgba(0,0,0,0.4)",
            color: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(4px)",
          }}
        >
          ✨ 悬浮查看原图
        </motion.div>
      )}
    </div>
  );
}
