import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // turbopack 配置（dev 模式使用）
  turbopack: {
    root: path.resolve(__dirname),
  },
  // 压缩
  compress: true,
  // 输出模式（standalone 适合 Docker/Vercel/云服务器部署）
  output: "standalone",
  // 图片优化
  images: {
    formats: ["image/webp", "image/avif"],
  },
  // 严格模式
  reactStrictMode: true,
};

export default nextConfig;
