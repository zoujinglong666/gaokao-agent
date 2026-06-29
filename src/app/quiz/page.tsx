"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import questionsRaw from "@/lib/data/questions.json";

const allQuestions = (questionsRaw as any).questions;

export default function QuizPage() {
  const router = useRouter();
  const [order, setOrder] = useState<number[]>(() => {
    const main = allQuestions.filter((q: any) => !q.hidden).map((_: any, i: number) => i);
    for (let i = main.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [main[i], main[j]] = [main[j], main[i]];
    }
    return main;
  });
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [mysticCount, setMysticCount] = useState(0);
  const [showHidden, setShowHidden] = useState(false);
  const [hiddenAnswered, setHiddenAnswered] = useState(false);
  const [direction, setDirection] = useState(1);

  const hiddenQ = allQuestions.find((q: any) => q.hidden);
  const totalVisible = order.length;
  const q = allQuestions[order[current]];
  const selectedIdx = answers[order[current]] ?? -1;
  const isLast = current === totalVisible - 1;
  const progress = ((current + 1) / totalVisible) * 100;

  const selectOption = (optIdx: number) => {
    const qIdx = order[current];
    const newAnswers = { ...answers, [qIdx]: optIdx };
    setAnswers(newAnswers);
    const scores = q.options[optIdx].scores;
    if (scores[0] < 0 && scores[1] < 0) setMysticCount(c => c + 1);
  };

  const goNext = () => {
    if (!isLast) {
      setDirection(1);
      setCurrent(c => c + 1);
    } else if (mysticCount >= 3 && hiddenQ && !hiddenAnswered && !showHidden) {
      setShowHidden(true);
    } else {
      finish();
    }
  };

  const goPrev = () => {
    if (current > 0) {
      setDirection(-1);
      setCurrent(c => c - 1);
    }
  };

  const finish = () => {
    const dims = [0, 0, 0, 0];
    Object.entries(answers).forEach(([qIdx, optIdx]) => {
      const idx = parseInt(qIdx);
      // 兼容两种索引方式：普通题用数组索引，隐藏题用题目id
      const question = allQuestions[idx] || allQuestions.find((q: any) => q.id === idx);
      if (!question || !question.options || !question.options[optIdx as number]) return;
      const scores = question.options[optIdx as number].scores;
      scores.forEach((s: number, i: number) => { dims[i] += s; });
    });
    router.push(`/loading-result?d=${dims.join(",")}`);
  };

  const answeredCount = Object.keys(answers).length;
  const progressSegments = useMemo(() => {
    return order.map((_, i) => ({
      index: i,
      answered: answers[order[i]] !== undefined,
      current: i === current,
    }));
  }, [order, answers, current]);

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-2xl mx-auto w-full px-4 pt-6 pb-2"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm" style={{ color: "var(--ink-muted)" }}>
              Q <span style={{ color: "var(--blue)" }}>{current + 1}</span>/{totalVisible}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--blue-50)", color: "var(--blue)" }}>
              {answeredCount}/{totalVisible}
            </span>
          </div>
          <button
            onClick={() => {
              if (confirm("确定要退出测验吗？你的进度将不会保存。")) {
                router.push("/");
              }
            }}
            className="text-xs hover:opacity-70 transition-opacity"
            style={{ color: "var(--ink-muted)" }}
          >
            退出
          </button>
        </div>

        {/* Progress Bar */}
        <div className="progress-track">
          <motion.div
            className="progress-fill"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* Progress Segments */}
        <div className="flex gap-1 mt-2">
          {progressSegments.map((seg) => (
            <motion.button
              key={seg.index}
              className="flex-1 h-1 rounded-full transition-colors"
              style={{
                backgroundColor: seg.current
                  ? "var(--blue)"
                  : seg.answered
                  ? "rgba(74, 111, 165, 0.4)"
                  : "rgba(19, 35, 58, 0.06)",
              }}
              whileHover={{ scaleY: 1.5 }}
              onClick={() => {
                if (seg.index !== current) {
                  setDirection(seg.index > current ? 1 : -1);
                  setCurrent(seg.index);
                }
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Question */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          {/* Hidden Question Overlay */}
          {showHidden && hiddenQ && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="paper-card p-8 text-center"
            >
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="tag tag-purple mb-4"
              >
                🎲 隐藏题
              </motion.div>
              <motion.h2
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xl sm:text-2xl font-bold mb-6"
                style={{ color: "var(--ink)" }}
              >
                {hiddenQ.text}
              </motion.h2>
              <div className="space-y-3">
                {hiddenQ.options.map((opt: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className={`option-card ${answers[hiddenQ.id] === i ? "selected" : ""}`}
                    onClick={() => {
                      setAnswers(a => ({ ...a, [hiddenQ.id]: i }));
                      setHiddenAnswered(true);
                    }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-sm" style={{ color: "var(--ink)" }}>
                      {opt.text}
                    </span>
                  </motion.div>
                ))}
              </div>
              {hiddenAnswered && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="btn-primary mt-6"
                  onClick={finish}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  生成人格报告
                </motion.button>
              )}
            </motion.div>
          )}

          {/* Regular Questions */}
          {!showHidden && (
            <div className="relative" style={{ minHeight: "400px" }}>
              <AnimatePresence initial={false}>
                <motion.div
                  key={current}
                  initial={{ opacity: 0, x: direction * 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -direction * 30 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  style={{ position: "absolute", width: "100%", left: 0, top: 0 }}
                >
                  {/* Question Text */}
                  <h2
                    className="text-xl sm:text-2xl font-bold mb-8 text-center"
                    style={{ color: "var(--ink)" }}
                  >
                    {q.text}
                  </h2>

                  {/* Options */}
                  <div className="space-y-3">
                    {q.options.map((opt: any, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.2 }}
                        className={`option-card ${selectedIdx === i ? "selected" : ""}`}
                        onClick={() => selectOption(i)}
                        whileHover={{ scale: 1.01, boxShadow: "0 4px 12px rgba(19, 35, 58, 0.08)" }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors"
                            style={{
                              backgroundColor: selectedIdx === i ? "var(--blue)" : "rgba(19, 35, 58, 0.06)",
                              color: selectedIdx === i ? "#fff" : "var(--ink-muted)",
                            }}
                          >
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="text-sm" style={{ color: "var(--ink)" }}>
                            {opt.text}
                          </span>
                          {selectedIdx === i && (
                            <motion.svg
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="ml-auto w-5 h-5"
                              style={{ color: "var(--blue)" }}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <path d="M20 6L9 17l-5-5" />
                            </motion.svg>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Navigation */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.2 }}
                    className="flex items-center justify-between mt-8"
                  >
                  <motion.button
                    className="btn-secondary"
                    onClick={goPrev}
                    disabled={current === 0}
                    whileHover={{ scale: current === 0 ? 1 : 1.02 }}
                    whileTap={{ scale: current === 0 ? 1 : 0.98 }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                    上一题
                  </motion.button>

                  <motion.button
                    className="btn-primary"
                    onClick={goNext}
                    disabled={selectedIdx === -1}
                    whileHover={{ scale: selectedIdx === -1 ? 1 : 1.02 }}
                    whileTap={{ scale: selectedIdx === -1 ? 1 : 0.98 }}
                  >
                    {isLast ? (
                      <>
                        生成人格报告
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </>
                    ) : (
                      <>
                        下一题
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
          )}
        </div>
      </main>
    </div>
  );
}