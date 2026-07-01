"use client";
import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error("[ErrorBoundary]", error.message, info.componentStack || "");
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          className="min-h-dvh flex flex-col items-center justify-center p-6 text-center"
          style={{ background: "var(--paper)" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(220, 38, 38, 0.1)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-lg font-bold mb-1" style={{ color: "var(--ink)" }}>
            页面出现了一点小问题
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--ink-muted)" }}>
            请刷新页面重试，或返回首页
          </p>
          <div className="flex gap-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                background: "var(--blue)",
                color: "#fff",
              }}
            >
              重试
            </button>
            <a
              href="/"
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                background: "rgba(19, 35, 58, 0.06)",
                color: "var(--ink)",
              }}
            >
              返回首页
            </a>
          </div>
          {this.state.error && (
            <details className="mt-4 text-xs text-left max-w-md" style={{ color: "var(--ink-muted)" }}>
              <summary className="cursor-pointer">错误详情</summary>
              <pre className="mt-1 p-2 rounded overflow-auto" style={{ background: "rgba(0,0,0,0.04)", fontSize: "10px" }}>
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
