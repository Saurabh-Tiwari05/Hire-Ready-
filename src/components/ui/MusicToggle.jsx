import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "../../store/appStore";

// Ambient generative soundtrack — no external asset needed.
function buildAudio() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const master = ctx.createGain();
  master.gain.value = 0.18;
  master.connect(ctx.destination);

  const freqs = [261.63, 329.63, 392.0, 523.25, 659.25];
  const notes = [];

  freqs.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = i % 2 === 0 ? "sine" : "triangle";
    osc.frequency.value = f;
    g.gain.value = 0;
    osc.connect(g);
    g.connect(master);
    osc.start();
    notes.push({ osc, g, base: f });
  });

  // A soft slow pulse per note
  notes.forEach((n, i) => {
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.05 + i * 0.03;
    lfoGain.gain.value = 0.03;
    lfo.connect(lfoGain);
    lfoGain.connect(n.g);
    lfo.start();
    n.lfo = lfo;
  });

  return { ctx, master, notes };
}

export default function MusicToggle() {
  const music = useAppStore((s) => s.music);
  const toggle = useAppStore((s) => s.toggleMusic);
  const audioRef = useRef(null);

  useEffect(() => {
  if (!music) return;
  if (!audioRef.current) audioRef.current = buildAudio();

  const a = audioRef.current;

  a.ctx.resume?.();

  // FIXED
  a.master.gain.setTargetAtTime(
    0.18,
    a.ctx.currentTime,
    0.4
  );

  a.notes.forEach(
    (n) => (n.g.gain.value = 0.05 + Math.random() * 0.04)
  );

  return () => {
    // FIXED
    a.master.gain.setTargetAtTime(
      0.0001,
      a.ctx.currentTime,
      0.2
    );
  };
}, [music]);

  const bars = [4, 7, 5, 9, 6];

  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      className="fixed bottom-6 right-6 z-[300] flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/50 backdrop-blur-xl"
      style={{ boxShadow: music ? "0 0 30px rgba(0,242,255,0.35)" : "none" }}
      aria-label={music ? "Pause ambient sound" : "Play ambient sound"}
      data-interactive
    >
      {music ? (
        <span className="flex h-4 items-end gap-[3px]">
          {bars.map((h, i) => (
            <motion.span
              key={i}
              className="w-[3px] rounded-full bg-accent"
              animate={{ height: [3, h, 3] }}
              transition={{ duration: 0.9 + i * 0.15, repeat: Infinity, ease: "easeInOut" }}
              style={{ height: h }}
            />
          ))}
        </span>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="#8a8a8a" strokeWidth="1.8" className="h-5 w-5">
          <path d="M5 12h3l4-4v8l-4-4H5zM15 10a4 4 0 0 1 0 4M17.5 7.5a8 8 0 0 1 0 9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      <AnimatePresence>
        {music && (
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute -top-9 right-0 whitespace-nowrap rounded-full border border-white/10 bg-black/80 px-3 py-1 text-[10px] text-accent"
          >
            Ambient on
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
