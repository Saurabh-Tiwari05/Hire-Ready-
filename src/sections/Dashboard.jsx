import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import SectionTitle from "../components/ui/SectionTitle";

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------ Data ------------------------------ */

const METRICS = [
  { key: "communication", label: "Communication", value: 82, color: "#00F2FF" },
  { key: "technical", label: "Technical", value: 76, color: "#60A5FA" },
  { key: "behavior", label: "Behavioral", value: 88, color: "#A78BFA" },
  { key: "confidence", label: "Confidence", value: 69, color: "#F472B6" },
  { key: "coding", label: "Coding", value: 91, color: "#34D399" },
];

const HISTORY = [
  { date: "Week 1", score: 52 },
  { date: "Week 2", score: 61 },
  { date: "Week 3", score: 58 },
  { date: "Week 4", score: 70 },
  { date: "Week 5", score: 77 },
  { date: "Week 6", score: 86 },
];

const TIMELINE = [
  { stage: "Resume Screening", when: "Mon 9:00", status: "done", score: 91 },
  { stage: "Technical Round 1", when: "Mon 10:30", status: "done", score: 84 },
  { stage: "Communication Check", when: "Tue 11:00", status: "done", score: 88 },
  { stage: "System Design", when: "Wed 14:00", status: "done", score: 79 },
  { stage: "Final Panel", when: "Fri 15:30", status: "upcoming", score: null },
];

/* ------------------------------ Circular gauge ------------------------------ */

export function Gauge({ value, color, size = 170, stroke = 10 }) {
  const circleRef = useRef(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const radius = (size - stroke) / 2;
    const circ = 2 * Math.PI * radius;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        circleRef.current,
        { strokeDashoffset: circ },
        {
          strokeDashoffset: circ * (1 - value / 100),
          duration: 2,
          ease: "power3.out",
          scrollTrigger: { trigger: circleRef.current, start: "top 85%" },
        }
      );
      const obj = { v: 0 };
      gsap.to(obj, {
        v: value,
        duration: 2,
        ease: "power3.out",
        scrollTrigger: { trigger: circleRef.current, start: "top 85%" },
        onUpdate: () => setDisplay(Math.round(obj.v)),
      });
    });
    return () => ctx.revert();
  }, [value, size, stroke]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - stroke) / 2}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <circle
          ref={circleRef}
          cx={size / 2}
          cy={size / 2}
          r={(size - stroke) / 2}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * ((size - stroke) / 2)}
          strokeDashoffset={2 * Math.PI * ((size - stroke) / 2)}
          style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-white tabular-nums">{display}</span>
        <span className="text-[10px] uppercase tracking-widest text-white/40">/100</span>
      </div>
    </div>
  );
}

/* ------------------------------ Bar chart ------------------------------ */

export function AnimatedBar({ height, color, delay = 0 }) {
  const barRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        barRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          transformOrigin: "bottom",
          duration: 0.9,
          delay,
          ease: "power3.out",
          scrollTrigger: { trigger: barRef.current, start: "top 90%" },
        }
      );
    });
    return () => ctx.revert();
  }, [delay]);

  return (
    <div
      ref={barRef}
      className="flex-1 rounded-t-md"
      style={{ height: `${height}%`, background: `linear-gradient(180deg, ${color}, ${color}33)` }}
    />
  );
}

export function ProgressBar({ value, color }) {
  const barRef = useRef(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const obj = { v: 0 };
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        v: value,
        duration: 1.6,
        ease: "power3.out",
        scrollTrigger: { trigger: barRef.current, start: "top 90%" },
        onUpdate: () => setDisplay(Math.round(obj.v)),
      });
      gsap.fromTo(
        barRef.current,
        { width: "0%" },
        {
          width: `${value}%`,
          duration: 1.6,
          ease: "power3.out",
          scrollTrigger: { trigger: barRef.current, start: "top 90%" },
        }
      );
    });
    return () => ctx.revert();
  }, [value]);

  return (
    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/10">
      <div
        ref={barRef}
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}88)`, boxShadow: `0 0 12px ${color}66` }}
      />
    </div>
  );
}

/* ------------------------------ Section ------------------------------ */

export default function Dashboard() {
  const sectionRef = useRef(null);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        sectionRef.current.querySelector(".dash-card"),
        { opacity: 0, y: 60, scale: 0.94 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const filtered = filter === "All" ? HISTORY : HISTORY.filter((h, i) => (filter === "First half" ? i < 3 : i >= 3));

  return (
    <section ref={sectionRef} className="relative bg-bg">
      <div className="section relative z-10 mx-auto max-w-6xl px-6">
        <SectionTitle
          title="Your Performance Dashboard"
          gradient={["Performance"]}
          subtitle="Every interview measured across the five skills that matter."
        />

        <div className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Overall gauge */}
          <div className="dash-card glass rounded-2xl p-6">
            <p className="mb-6 text-sm font-semibold uppercase tracking-widest text-white/40">Overall Score</p>
            <div className="flex justify-center">
              <Gauge value={86} color="#00F2FF" />
            </div>
            <p className="mt-6 text-center text-sm text-gray-400">
              Up <span className="font-bold text-emerald-400">+14</span> from last week
            </p>
          </div>

          {/* Metric bars */}
          <div className="dash-card glass rounded-2xl p-6">
            <p className="mb-6 text-sm font-semibold uppercase tracking-widest text-white/40">Skill Breakdown</p>
            <div className="space-y-5">
              {METRICS.map((m) => (
                <div key={m.key} className="flex items-center gap-4">
                  <span className="w-28 text-sm text-gray-300">{m.label}</span>
                  <ProgressBar value={m.value} color={m.color} />
                  <span className="w-8 text-right text-sm font-bold tabular-nums text-white">{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly history */}
          <div className="dash-card glass rounded-2xl p-6">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-widest text-white/40">History</p>
              <div className="flex gap-1 rounded-full bg-white/5 p-1">
                {["All", "First half", "Second half"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-full px-3 py-1 text-[11px] transition-colors ${
                      filter === f ? "bg-accent/20 text-accent" : "text-white/50 hover:text-white"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex h-40 items-end gap-3">
              {filtered.map((h, i) => (
                <div key={h.date} className="flex flex-1 flex-col items-center gap-2">
                  <AnimatedBar height={h.score} color="#A78BFA" delay={i * 0.12} />
                  <span className="text-[10px] text-white/40">{h.date.replace("Week ", "W")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="dash-card mt-4 glass rounded-2xl p-6">
          <p className="mb-6 text-sm font-semibold uppercase tracking-widest text-white/40">Interview Timeline</p>
          <div className="relative flex flex-col gap-5 pl-6">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-accent via-white/10 to-transparent" />
            {TIMELINE.map((item) => (
              <div key={item.stage} className="relative flex items-center gap-4">
                <span
                  className={`absolute -left-6 h-[15px] w-[15px] rounded-full border-2 ${
                    item.status === "done"
                      ? "border-accent bg-accent/30 shadow-[0_0_10px_rgba(0,242,255,0.6)]"
                      : "border-white/20 bg-white/5"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{item.stage}</p>
                  <p className="text-xs text-white/40">{item.when}</p>
                </div>
                {item.score !== null ? (
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-accent">{item.score}</span>
                ) : (
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/40">Upcoming</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
