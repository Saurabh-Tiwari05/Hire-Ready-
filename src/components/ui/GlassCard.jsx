import { useRef } from "react";
import { motion } from "framer-motion";

/**
 * Consistent glassmorphism surface.
 * - glass / glass-strong backdrop
 * - optional 3D tilt on pointer move
 * - optional hover lift + neon glow
 */
export default function GlassCard({
  children,
  className = "",
  glow = null, // hex color for hover glow, e.g. "#00F2FF"
  tilt = false,
  strong = false,
  onClick,
  ...rest
}) {
  const ref = useRef(null);

  const handleMove = (e) => {
    if (!tilt || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.transform = `perspective(900px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg) translateZ(0)`;
  };

  const handleLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg)";
  };

  const glowStyle = glow
    ? {
        "--glow": glow,
      }
    : {};

  return (
    <motion.div
      ref={ref}
      onMouseMove={tilt ? handleMove : undefined}
      onMouseLeave={tilt ? handleLeave : undefined}
      onClick={onClick}
      className={`${strong ? "glass-strong" : "glass"} card-hover-lift rounded-3xl ${className}`}
      style={
        glow
          ? {
              ...glowStyle,
              ...(glow
                ? {
                    // hover shadow driven via CSS var so each card can tint its own glow
                  }
                : {}),
            }
          : undefined
      }
      whileHover={
        glow
          ? { boxShadow: `0 0 60px ${glow}2e, 0 24px 60px -24px rgba(0,0,0,0.7)` }
          : { boxShadow: "0 24px 60px -24px rgba(0,0,0,0.7)" }
      }
      {...rest}
    >
      {children}
    </motion.div>
  );
}
