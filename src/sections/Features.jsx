import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatePresence, motion } from "framer-motion";
import SectionTitle from "../components/ui/SectionTitle";

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    icon: "resume",
    title: "Resume Based Interviews",
    desc: "Interviews built from your actual resume. Questions target the exact projects and skills you claim — so recruiters never catch you bluffing.",
    color: "#00F2FF",
  },
  {
    icon: "company",
    title: "Company Specific Interviews",
    desc: "Practice against question banks modeled on your dream company. Google, Amazon, Microsoft — tailored rounds that mirror their real hiring style.",
    color: "#A78BFA",
  },
  {
    icon: "adaptive",
    title: "Adaptive Questions",
    desc: "The AI reads your answers and adjusts difficulty live. Get harder when you're strong, easier when you struggle — always right at your edge.",
    color: "#F472B6",
  },
  {
    icon: "evaluation",
    title: "AI Evaluation",
    desc: "Every answer scored on technical depth, clarity and structure in seconds. No waiting, no bias, just precise feedback on what you said.",
    color: "#34D399",
  },
  {
    icon: "reports",
    title: "Detailed Reports",
    desc: "Rich session reports break down every question, score and answer. See exactly where you won and where you lost, question by question.",
    color: "#FBBF24",
  },
  {
    icon: "gap",
    title: "Skill Gap Analysis",
    desc: "Your performance mapped against the job's requirements. We surface the specific skills holding you back from the offer.",
    color: "#60A5FA",
  },
  {
    icon: "tracking",
    title: "Progress Tracking",
    desc: "A living dashboard of your improvement over time. Watch your score climb week after week as you get interview-ready.",
    color: "#F87171",
  },
  {
    icon: "recommendations",
    title: "Learning Recommendations",
    desc: "Get curated resources, problems and topics for your weak spots — a personal study plan generated from your gaps.",
    color: "#FB923C",
  },
];

const icons = {
  resume: (
    <path d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6" />
  ),
  company: (
    <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01M5 10h14" />
  ),
  adaptive: (
    <path d="M12 2a5 5 0 0 1 5 5v2a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5zM7 12a5 5 0 0 0 10 0M12 17v4M8 21h8" />
  ),
  evaluation: (
    <path d="M12 3v18M7 7l5 5 5-5M7 17l5-5 5 5" />
  ),
  reports: (
    <path d="M4 20h16M6 12h3v8H6zM10.5 8h3v12h-3zM15 4h3v16h-3z" />
  ),
  gap: (
    <path d="M4 18L9 12l4 4 7-9M16 7h4v4" />
  ),
  tracking: (
    <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 6v6l4 2" />
  ),
  recommendations: (
    <path d="M12 21c-4-2-7-5.5-7-9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7 4.5c0 4-3 7.5-7 9.5z" />
  ),
};

const Icon = ({ name, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-8 w-8"
  >
    {icons[name]}
  </svg>
);

export default function Features() {
  const sectionRef = useRef(null);
  const gridRef = useRef(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        gridRef.current.children,
        {
          opacity: 0,
          y: 32,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 80%",
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative bg-bg">
      <div className="section relative z-10 mx-auto max-w-6xl px-6">
        <SectionTitle
          title="Built for the Real Interview"
          gradient={["Real", "Interview"]}
          subtitle="Eight systems working together to take you from nervous candidate to confident hire."
        />

        <div ref={gridRef} className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const isExpanded = expanded === i;
            return (
              <motion.button
                key={f.title}
                layout
                onClick={() => setExpanded(isExpanded ? null : i)}
                className="glass glass-hover group rounded-2xl p-6 text-left"
              >
                {/* Icon */}
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border"
                  style={{ borderColor: `${f.color}40`, background: `${f.color}12` }}
                >
                  <Icon name={f.icon} color={f.color} />
                </div>

                <h3 className="text-base font-semibold text-white">{f.title}</h3>
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="overflow-hidden text-sm leading-relaxed text-[var(--text-2)]"
                    >
                      {f.desc}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>

    </section>
  );
}