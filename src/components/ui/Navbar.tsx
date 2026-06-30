"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/", label: "首页" },
  { href: "/quiz", label: "人格诊断" },
  { href: "/gallery", label: "人格图鉴" },
  { href: "/universities", label: "大学图鉴" },
  { href: "/journey", label: "志愿规划" },
  { href: "/chat", label: "AI 咨询" },
];

export default function Navbar() {
  const path = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop Navbar */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="hidden md:flex items-center justify-between px-6 py-3 max-w-2xl mx-auto w-full"
      >
        <Link href="/" className="font-bold text-lg tracking-tight" style={{ color: "var(--ink)" }}>
          FuturePath
        </Link>
        <div className="flex gap-1">
          {links.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                color: path === link.href ? "var(--blue)" : "var(--ink-muted)",
                background: path === link.href ? "var(--blue-50)" : "transparent",
              }}
            >
              <motion.span
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {link.label}
              </motion.span>
              {path === link.href && (
                <motion.span
                  layoutId="navIndicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                  style={{ background: "var(--blue)" }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </div>
      </motion.nav>

      {/* Mobile Navbar */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="md:hidden flex items-center justify-between px-4 py-3"
      >
        <Link href="/" className="font-bold text-lg tracking-tight" style={{ color: "var(--ink)" }}>
          FuturePath
        </Link>
        <motion.button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-lg"
          style={{ background: "var(--blue-50)", color: "var(--blue)" }}
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </motion.button>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-card mx-4 mb-4 overflow-hidden"
            style={{ position: "relative" }}
          >
            <div className="flex flex-col py-2">
              {links.map((link, i) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium transition-colors"
                  style={{
                    color: path === link.href ? "var(--blue)" : "var(--ink-light)",
                    background: path === link.href ? "var(--blue-50)" : "transparent",
                  }}
                >
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    {link.label}
                  </motion.span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}