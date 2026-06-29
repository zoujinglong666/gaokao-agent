"use client";
import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const markdownComponents: any = {
  p: ({ children }: any) => <p className="my-1.5">{children}</p>,
  ul: ({ children }: any) => (
    <ul className="list-disc list-inside my-1.5 space-y-1">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal list-inside my-1.5 space-y-1">{children}</ol>
  ),
  strong: ({ children }: any) => (
    <strong style={{ fontWeight: "600", color: "var(--blue)" }}>{children}</strong>
  ),
  em: ({ children }: any) => <em style={{ fontStyle: "italic" }}>{children}</em>,
  h1: ({ children }: any) => (
    <h1 className="text-lg font-bold my-2" style={{ color: "var(--ink)" }}>{children}</h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-base font-semibold my-2" style={{ color: "var(--ink)" }}>{children}</h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-sm font-semibold my-1.5" style={{ color: "var(--ink-light)" }}>{children}</h3>
  ),
  code: ({ children }: any) => (
    <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: "var(--blue-50)", color: "var(--blue)" }}>
      {children}
    </code>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 pl-3 my-2 italic" style={{ borderColor: "var(--blue)", color: "var(--ink-muted)" }}>
      {children}
    </blockquote>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-2">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead style={{ background: "var(--blue-50)" }}>{children}</thead>
  ),
  th: ({ children }: any) => (
    <th className="px-3 py-2 text-left font-semibold text-xs border-b-2" style={{ borderColor: "var(--blue)", color: "var(--ink)" }}>
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="px-3 py-2 text-xs border-b" style={{ borderColor: "rgba(19,35,58,0.08)", color: "var(--ink-light)" }}>
      {children}
    </td>
  ),
  tr: ({ children }: any) => <tr>{children}</tr>,
};

export default memo(function MemoizedMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  );
});