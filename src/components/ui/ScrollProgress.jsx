import { motion, useSpring } from "framer-motion";
import { useSmoothScroll } from "../../context/SmoothScroll";

export default function ScrollProgress() {
  const { progress } = useSmoothScroll();
  const width = useSpring(progress, { stiffness: 120, damping: 26, mass: 0.5 });

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-[200] h-[3px]">
      <motion.div
        className="h-full origin-left bg-gradient-to-r from-accent via-cyan-400 to-[var(--accent-2)]"
        style={{
          scaleX: width,
          boxShadow: "0 0 12px rgba(0,242,255,0.6)",
        }}
      />
    </div>
  );
}
