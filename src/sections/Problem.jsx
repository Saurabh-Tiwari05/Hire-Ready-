import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SectionTitle from "../components/ui/SectionTitle";

gsap.registerPlugin(ScrollTrigger);

const CARDS = [
  { title: "Students know coding", text: "But interviewers never see it.", icon: "💻" },
  { title: "Poor communication", text: "Great answers, lost in delivery.", icon: "💬" },
  { title: "No confidence", text: "Practice alone doesn't build presence.", icon: "⚡" },
  { title: "Generic interview platforms", text: "Same questions for everyone.", icon: "🤖" },
  { title: "No personalized feedback", text: "You never learn what you're missing.", icon: "📉" },
];

export default function Problem() {
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);
  const orbRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Cards fade up on scroll
      gsap.fromTo(
        cardsRef.current,
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: cardsRef.current[0], start: "top 80%" },
        }
      );

      // Orb fades in
      gsap.to(orbRef.current, {
        opacity: 1,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: { trigger: orbRef.current, start: "top 85%" },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative min-h-screen overflow-hidden bg-bg">
      <div className="section relative z-10 mx-auto max-w-6xl px-6">
        <SectionTitle
          title="Interviews don't test what you've learned"
          gradient={["Interviews"]}
          subtitle="Five silent killers between a great student and a great hire — every one of them fixable."
        />

        {/* Pain cards */}
        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((card, i) => (
            <div
              key={card.title}
              ref={(el) => (cardsRef.current[i] = el)}
              className="glass glass-hover group rounded-2xl p-6 opacity-0"
            >
              <div className="mb-3 text-xl">{card.icon}</div>
              <h3 className="text-base font-semibold text-white">{card.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-2)]">{card.text}</p>
            </div>
          ))}
        </div>

        {/* AI Orb */}
        <div className="mt-16 flex justify-center">
          <div
            ref={orbRef}
            className="relative flex h-48 w-48 items-center justify-center rounded-full opacity-0"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/70 to-cyan-400/50 blur-xl" />
            <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full border border-accent/50 bg-gradient-to-br from-accent/90 to-cyan-400/80 text-center text-base font-bold text-bg shadow-[0_0_60px_rgba(0,242,255,0.4)]">
              HireReady AI
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}