import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Button from "../components/ui/Button";

gsap.registerPlugin(ScrollTrigger);

const SOCIALS = [
  {
    key: "github",
    label: "GitHub",
    href: "https://github.com",
    color: "#ffffff",
    path: "M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.72-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.9-.64.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2z",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    href: "https://linkedin.com",
    color: "#4aa8ff",
    path: "M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.76-1.95 4.02 0 4.76 2.65 4.76 6.09V21h-4v-5.3c0-1.26-.02-2.89-1.76-2.89-1.76 0-2.03 1.38-2.03 2.8V21H9z",
  },
  {
    key: "email",
    label: "Email",
    href: "mailto:hello@hireready.ai",
    color: "#FBBF24",
    path: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm8 7L22 6.5V6l-10 6L2 6v.5L12 11z",
  },
];

const COLUMNS = [
  { title: "Product", links: ["Features", "Pricing", "Mock Interviews", "Reports", "Roadmap"] },
  { title: "Company", links: ["About", "Careers", "Blog", "Press", "Contact"] },
  { title: "Resources", links: ["Interview Guide", "Cheat Sheets", "System Design", "FAQ", "Support"] },
  { title: "Legal", links: ["Privacy", "Terms", "Security", "Cookies"] },
];

export default function CallToAction() {
  const sectionRef = useRef(null);
  const textRef = useRef(null);
  const footerRef = useRef(null);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        textRef.current,
        { opacity: 0, y: 60, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 70%" },
        }
      );
      gsap.fromTo(
        footerRef.current.children,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: footerRef.current, start: "top 90%" },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="ending-root relative overflow-hidden bg-bg"
    >
      {/* Cinematic vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.75)_100%)]" />

      {/* CTA */}
      <div ref={textRef} className="relative z-10 mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center px-6 text-center opacity-0">
        <span className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          HireReady AI
        </span>

        <h2 className="display-title mb-6 text-3xl text-white md:text-5xl">
          Ready For Your{" "}
          <span className="text-gradient">Dream Job</span>
        </h2>

        <p className="mx-auto mb-10 max-w-2xl text-sm font-light text-[var(--text-2)] md:text-base">
          HireReady AI transforms interview preparation into confidence through AI-powered mock interviews.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 md:flex-row">
          <Button size="lg">Start Your Journey</Button>
          <Button variant="ghost" size="lg">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M8 5v14l11-7z" />
            </svg>
            Watch Demo
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer ref={footerRef} className="relative overflow-hidden border-t border-white/10">
        <div className="relative z-10 mx-auto max-w-6xl px-6">
          {/* Top: logo + socials */}
          <div className="mb-10 flex flex-col items-center gap-6 pt-10 md:flex-row md:items-center md:justify-between">
            <motion.div whileHover={{ scale: 1.04 }} className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-cyan-400 shadow-[0_0_30px_rgba(0,242,255,0.4)]">
                <div className="absolute inset-0 rounded-2xl bg-accent/40 blur-md" />
                <span className="relative z-10 text-sm font-black text-bg">HR</span>
              </div>
              <div>
                <p className="font-display text-xl font-semibold tracking-tight text-white">
                  HireReady <span className="text-gradient-cyan">AI</span>
                </p>
                <p className="text-xs text-[var(--text-3)]">Interview coach, powered by AI</p>
              </div>
            </motion.div>

            <div className="flex items-center gap-3">
              {SOCIALS.map((s, i) => {
                const isHover = hovered === s.key;
                return (
                  <motion.a
                    key={s.key}
                    href={s.href}
                    target={s.href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    aria-label={s.label}
                    onMouseEnter={() => setHovered(s.key)}
                    onMouseLeave={() => setHovered(null)}
                    className="glass relative flex h-12 w-12 items-center justify-center rounded-2xl"
                    animate={
                      isHover
                        ? { y: -6, borderColor: `${s.color}66`, boxShadow: `0 0 30px ${s.color}55` }
                        : { y: 0, borderColor: "rgba(255,255,255,0.1)", boxShadow: "0 0 0 rgba(0,0,0,0)" }
                    }
                    whileHover={{ scale: 1.1 }}
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" style={{ color: s.color }} fill="currentColor">
                      <path d={s.path} />
                    </svg>
                    {isHover && (
                      <motion.span
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -top-9 whitespace-nowrap rounded-full border border-white/10 bg-black/80 px-3 py-1 text-[11px] text-white backdrop-blur"
                        style={{ boxShadow: `0 0 20px ${s.color}40` }}
                      >
                        {s.label}
                      </motion.span>
                    )}
                  </motion.a>
                );
              })}
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-6 pb-10 md:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-3)]">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-[var(--text-2)] transition-colors duration-300 hover:text-white"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-8 md:flex-row">
            <p className="text-sm text-[var(--text-3)]">
              © {new Date().getFullYear()} HireReady AI. Built for the dream job.
            </p>
            <div className="flex items-center gap-6 text-sm text-[var(--text-3)]">
              <a href="#" className="transition-colors hover:text-accent">Privacy</a>
              <a href="#" className="transition-colors hover:text-accent">Terms</a>
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </section>
  );
}
