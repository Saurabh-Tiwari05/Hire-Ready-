import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import usePrefersReducedMotion from "../hooks/usePrefersReducedMotion";

gsap.registerPlugin(ScrollTrigger);

const SmoothScrollContext = createContext(null);

export function SmoothScrollProvider({ children }) {
  const lenisRef = useRef(null);
  const reduced = usePrefersReducedMotion();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reduced) {
      // Native scrolling fallback — still feed progress for the scroll bar.
      const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? window.scrollY / max : 0);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }

    const lenis = new Lenis({
      // Longer, silkier glide with a gentle expo-out tail.
      duration: 1.4,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
      touchMultiplier: 1.4,
      wheelMultiplier: 0.95,
      snap: {
        targets: "[data-snap]",
        duration: 0.9,
        velocityThreshold: 0.5,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      },
    });

    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    lenis.on("scroll", (e) => setProgress(e.progress));
    // Keep ScrollTrigger in sync when the tab regains focus.
    window.addEventListener("focus", ScrollTrigger.update);

    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      window.removeEventListener("focus", ScrollTrigger.update);
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reduced]);

  const api = useMemo(
    () => ({
      get lenis() {
        return lenisRef.current;
      },
      scrollTo(target, opts) {
        lenisRef.current?.scrollTo(target, opts);
      },
      stop() {
        lenisRef.current?.stop();
      },
      start() {
        lenisRef.current?.start();
      },
    }),
    []
  );

  const value = useMemo(() => ({ api, progress, reduced }), [api, progress, reduced]);
  return <SmoothScrollContext.Provider value={value}>{children}</SmoothScrollContext.Provider>;
}

export function useSmoothScroll() {
  const ctx = useContext(SmoothScrollContext);
  if (!ctx) throw new Error("useSmoothScroll must be used within SmoothScrollProvider");
  return ctx;
}
