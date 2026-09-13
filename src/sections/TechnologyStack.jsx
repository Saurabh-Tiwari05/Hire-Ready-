import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SectionTitle from "../components/ui/SectionTitle";

gsap.registerPlugin(ScrollTrigger);

const CATEGORIES = [
  {
    title: "Frontend",
    sub: "The interface you see",
    color: "#00F2FF",
    items: ["React", "Three.js", "GSAP", "Tailwind CSS"],
  },
  {
    title: "Backend",
    sub: "The logic that powers it",
    color: "#A78BFA",
    items: ["Node.js", "REST API", "JWT Auth", "Cloud Sync"],
  },
  {
    title: "AI Engine",
    sub: "The interview intelligence",
    color: "#F472B6",
    items: ["LLM Evaluation", "Adaptive Questioning", "Voice & Code Capture"],
  },
  {
    title: "Data",
    sub: "Everything you learn, stored",
    color: "#34D399",
    items: ["PostgreSQL", "Structured Profiles", "Real-time Analytics"],
  },
  {
    title: "Scalability",
    sub: "Built for thousands of students",
    color: "#FBBF24",
    items: ["Session Isolation", "Secure Storage", "Zero-Downtime Prep"],
  },
];

export default function TechnologyStack() {
  const sectionRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        gridRef.current.children,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: gridRef.current, start: "top 80%" },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative bg-bg">
      <div className="section relative z-10 mx-auto max-w-6xl px-6">
        <SectionTitle
          title="Technology Stack"
          gradient={["Technology"]}
          subtitle="Engineered to feel instant — built to scale with every student."
        />

        <div ref={gridRef} className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <div key={cat.title} className="glass glass-hover rounded-2xl p-6">
              <div className="mb-3 flex items-center gap-2.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: cat.color, boxShadow: `0 0 10px ${cat.color}` }}
                />
                <h3 className="text-base font-semibold text-white">{cat.title}</h3>
              </div>
              <p className="mb-4 text-xs text-[var(--text-3)]">{cat.sub}</p>
              <div className="flex flex-wrap gap-2">
                {cat.items.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-[var(--text-2)]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
