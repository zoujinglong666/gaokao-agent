"use client";
import { motion } from "framer-motion";

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

export default function LoadingOverlay({ isLoading, message = "加载中..." }: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--paper)]/80 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-4">
        <motion.div
          className="relative w-16 h-16"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: "rgba(19,35,58,0.06)" }} />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-t-[var(--blue)] border-r-[var(--gold)]"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border border-[var(--gold)] opacity-50"
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-4 h-4 rounded-full"
              style={{ background: "var(--blue)" }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </div>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm"
          style={{ color: "var(--ink-muted)" }}
        >
          {message}
        </motion.p>
      </div>
    </motion.div>
  );
}