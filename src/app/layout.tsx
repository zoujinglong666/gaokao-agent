import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "./client-layout";

export const metadata: Metadata = {
  title: {
    default: "FuturePath · 高考志愿智能规划 Agent",
    template: "%s | FuturePath",
  },
  description: "AI 驱动的志愿填报助手 — 人格诊断、院校匹配、专业组分析、调剂风险评估，帮你做出不后悔的选择。",
  keywords: [
    "高考志愿",
    "志愿填报",
    "AI规划",
    "人格诊断",
    "院校推荐",
    "专业组分析",
    "调剂风险",
    "高考",
    "2026高考",
    "新高考",
    "3+1+2",
  ],
  authors: [{ name: "FuturePath" }],
  creator: "FuturePath",
  publisher: "FuturePath",
  robots: { index: true, follow: true },
  viewport: { width: "device-width", initialScale: 1, maximumScale: 5 },
  themeColor: "#3b557a",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "FuturePath · 高考志愿智能规划 Agent",
    description: "AI 驱动的志愿填报助手 — 人格诊断、院校匹配、专业组分析、调剂风险评估",
    url: "https://futurepath.gaokao.com",
    siteName: "FuturePath",
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: "FuturePath · 高考志愿智能规划 Agent",
    description: "AI 驱动的志愿填报助手 — 人格诊断、院校匹配、专业组分析、调剂风险评估",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* 生产环境字体优化：使用 display=swap 避免字体加载阻塞 */}
        <style>{`
          @font-face {
            font-family: 'Inter';
            font-display: swap;
          }
        `}</style>
      </head>
      <body className="min-h-dvh antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}