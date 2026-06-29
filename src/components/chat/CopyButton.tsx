"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors"
      style={{
        background: copied ? "var(--blue-50)" : "transparent",
        color: copied ? "var(--blue)" : "var(--ink-muted)",
        border: "1px solid rgba(19,35,58,0.1)",
      }}
      title="复制内容"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      <span>{copied ? "已复制" : "复制"}</span>
    </button>
  );
}