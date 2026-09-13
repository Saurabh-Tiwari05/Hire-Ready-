import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "../../store/appStore";

export default function LoadingScreen() {
  const loaded = useAppStore((s) => s.loaded);
  const [hidden, setHidden] = useState(false);
  const barRef = useRef(null);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => setHidden(true), 600);
    return () => clearTimeout(t);
  }, [loaded]);

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.06 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[5000] flex flex-col items-center justify-center bg-bg"
          aria-hidden={loaded}
        >
          {/* Logo mark */}
          <div className="relative mb-8 flex h-20 w-20 items-center justify-center">
            <motion.div
              className="absolute inset-0 rounded-3xl bg-gradient-to-br from-accent to-cyan-400"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
            <motion.div
              className="absolute inset-2 rounded-2xl bg-bg"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
            <span className="relative z-10 text-xl font-black text-white">HR</span>
          </div>

          {/* Wordmark */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-10 text-lg font-semibold tracking-[0.35em] text-white/80"
          >
            HIRE<span className="text-accent">READY</span>
          </motion.p>

          {/* Progress bar */}
          <div className="relative h-[3px] w-56 overflow-hidden rounded-full bg-white/10">
            <motion.div
              ref={barRef}
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent to-cyan-400"
              initial={{ width: "0%" }}
              animate={{ width: loaded ? "100%" : "75%" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-xs text-white/40"
          >
            Initializing interview coach…
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
