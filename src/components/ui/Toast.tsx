"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
  onClose: () => void;
}

const icons = {
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4M12 17h.01" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
};

const styles = {
  success: {
    bg: "rgba(107,155,122,0.95)",
    color: "#fff",
  },
  error: {
    bg: "rgba(194,91,86,0.95)",
    color: "#fff",
  },
  info: {
    bg: "rgba(74,111,165,0.95)",
    color: "#fff",
  },
  warning: {
    bg: "rgba(200,164,92,0.95)",
    color: "#fff",
  },
};

export function Toast({ message, type = "info", duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg"
      style={{
        background: styles[type].bg,
        color: styles[type].color,
      }}
      onClick={onClose}
    >
      {icons[type]}
      <span className="text-sm font-medium">{message}</span>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type?: "success" | "error" | "info" | "warning" }>;
  removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    message: string;
    type?: "success" | "error" | "info" | "warning";
  }>>([]);

  const addToast = useCallback((message: string, type: "success" | "error" | "info" | "warning" = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message: string) => addToast(message, "success"), [addToast]);
  const error = useCallback((message: string) => addToast(message, "error"), [addToast]);
  const info = useCallback((message: string) => addToast(message, "info"), [addToast]);
  const warning = useCallback((message: string) => addToast(message, "warning"), [addToast]);

  return { toasts, addToast, removeToast, success, error, info, warning };
}