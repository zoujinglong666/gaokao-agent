# -*- coding: utf-8 -*-
"""Generate CSS + Layout for FuturePath"""
import os
BASE = r"d:\workCode\AiWorkCode\gaokao-agent\src"

def w(path, content):
    full = os.path.join(BASE, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  + {path}")

w("app/globals.css", r"""@import "tailwindcss";

@layer base {
  :root {
    --paper: #FBF9F1;
    --ink: #13233A;
    --ink-light: #3D4F6A;
    --ink-muted: #8896A8;
    --blue: #4A6FA5;
    --blue-light: #6B8DC4;
    --blue-50: #EEF3F9;
    --gold: #C8A45C;
    --gold-light: #D4B87A;
    --gold-50: #FBF6EC;
    --purple: #8B7DA8;
    --terracotta: #B5846C;
    --fog: #7A9CB5;
    --olive: #7A8B5C;
    --danger: #C25B56;
    --success: #6B9B7A;
    --glass-bg: rgba(255, 255, 255, 0.65);
    --glass-border: rgba(255, 255, 255, 0.35);
    --radius-card: 0.75rem;
    --radius-btn: 0.5rem;
    --shadow-card: 0 1px 3px rgba(19, 35, 58, 0.06), 0 1px 2px rgba(19, 35, 58, 0.04);
    --shadow-hover: 0 4px 12px rgba(19, 35, 58, 0.08), 0 2px 4px rgba(19, 35, 58, 0.04);
    --font-sans: 'Inter', 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --font-mono: 'JetBrains Mono', 'Roboto Mono', 'SF Mono', monospace;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
  body {
    font-family: var(--font-sans);
    background-color: var(--paper);
    color: var(--ink);
    line-height: 1.6;
    min-height: 100dvh;
  }
  h1, h2, h3, h4 { font-weight: 700; letter-spacing: -0.01em; line-height: 1.25; }
  .font-mono { font-family: var(--font-mono); }
}

@layer components {
  .glass-card {
    background: var(--glass-bg);
    backdrop-filter: blur(16px) saturate(1.4);
    -webkit-backdrop-filter: blur(16px) saturate(1.4);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-card);
  }
  .glass-card-hover:hover {
    box-shadow: var(--shadow-hover);
    transform: translateY(-2px);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .paper-card {
    background: #FFFFFF;
    border: 1px solid rgba(19, 35, 58, 0.05);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-card);
  }
  .btn-primary {
    display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
    padding: 0.75rem 1.75rem;
    background: var(--blue); color: #FFFFFF;
    font-weight: 600; font-size: 0.9375rem;
    border-radius: var(--radius-btn); border: none; cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(74, 111, 165, 0.3);
  }
  .btn-primary:hover { background: var(--blue-light); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(74, 111, 165, 0.25); }
  .btn-primary:active { transform: translateY(0); }
  .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }
  .btn-secondary {
    display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
    padding: 0.625rem 1.5rem;
    background: transparent; color: var(--ink-light);
    font-weight: 500; font-size: 0.875rem;
    border-radius: var(--radius-btn);
    border: 1px solid rgba(19, 35, 58, 0.12); cursor: pointer;
    transition: all 0.2s ease;
  }
  .btn-secondary:hover { border-color: var(--blue); color: var(--blue); background: var(--blue-50); }
  .btn-gold {
    display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
    padding: 0.875rem 2rem;
    background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%);
    color: #FFFFFF; font-weight: 700; font-size: 1rem;
    border-radius: var(--radius-btn); border: none; cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(200, 164, 92, 0.3);
  }
  .btn-gold:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(200, 164, 92, 0.35); }
  .option-card {
    padding: 1rem 1.25rem; background: #FFFFFF;
    border: 2px solid rgba(19, 35, 58, 0.06);
    border-radius: var(--radius-card); cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); user-select: none;
  }
  .option-card:hover { border-color: rgba(74, 111, 165, 0.3); background: var(--blue-50); }
  .option-card.selected {
    border-color: var(--blue); background: var(--blue-50);
    box-shadow: 0 2px 8px rgba(74, 111, 165, 0.15);
    transform: translateY(-2px);
  }
  .progress-track { height: 4px; background: rgba(19, 35, 58, 0.06); border-radius: 2px; overflow: hidden; }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--blue) 0%, var(--gold) 100%);
    border-radius: 2px; transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .dim-bar-track { height: 8px; background: rgba(19, 35, 58, 0.06); border-radius: 4px; overflow: hidden; }
  .dim-bar-fill { height: 100%; border-radius: 4px; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }
  .tag { display: inline-flex; align-items: center; padding: 0.2rem 0.6rem; font-size: 0.75rem; font-weight: 500; border-radius: 9999px; border: 1px solid transparent; }
  .tag-purple { background: rgba(139,125,168,0.12); color: var(--purple); border-color: rgba(139,125,168,0.2); }
  .tag-terracotta { background: rgba(181,132,108,0.12); color: var(--terracotta); border-color: rgba(181,132,108,0.2); }
  .tag-fog { background: rgba(122,156,181,0.12); color: var(--fog); border-color: rgba(122,156,181,0.2); }
  .tag-olive { background: rgba(122,139,92,0.12); color: var(--olive); border-color: rgba(122,139,92,0.2); }
  .tag-blue { background: var(--blue-50); color: var(--blue); border-color: rgba(74,111,165,0.2); }
  .tag-gold { background: var(--gold-50); color: var(--gold); border-color: rgba(200,164,92,0.2); }
  .divider { height: 1px; background: rgba(19, 35, 58, 0.06); }
  .gradient-text {
    background: linear-gradient(135deg, var(--blue) 0%, var(--gold) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .skeleton {
    background: linear-gradient(90deg, rgba(19,35,58,0.04) 25%, rgba(19,35,58,0.08) 50%, rgba(19,35,58,0.04) 75%);
    background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px;
  }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  .animate-fade-up { animation: fadeUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) both; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .animate-fade-in { animation: fadeIn 0.3s ease both; }
  @keyframes pulse-dot { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
  .animate-pulse-dot { animation: pulse-dot 1.5s ease-in-out infinite; }
}
""")

w("app/layout.tsx", r"""import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FuturePath \u00b7 \u9ad8\u8003\u5fd7\u613f\u667a\u80fd\u89c4\u5212 Agent",
  description: "FuturePath \u5e2e\u4f60\u8ba4\u8bc6\u81ea\u5df1\u3001\u7406\u89e3\u89c4\u5219\u3001\u5339\u914d\u9662\u6821\uff0c\u5728\u6b63\u786e\u7684\u65f6\u95f4\u505a\u51fa\u4e0d\u540e\u6094\u7684\u9009\u62e9\u3002",
  keywords: "\u9ad8\u8003\u5fd7\u613f,\u5fd7\u613f\u586b\u62a5,AI\u89c4\u5212,\u4eba\u683c\u8bca\u65ad,\u9662\u6821\u63a8\u8350",
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
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
""")

print("CSS + Layout generated!")
