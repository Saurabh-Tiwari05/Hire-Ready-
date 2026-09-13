import { motion, useReducedMotion } from "framer-motion";

/**
 * Cinematic section heading — eyebrow + display title + subtitle.
 * Reveals on scroll with blur/rise stagger.
 * gradient: pass array of words to render as gradient (string[]).
 */
export default function SectionTitle({
  eyebrow = null,
  title,
  gradient = [],
  subtitle = null,
  align = "center",
  className = "",
}) {
  const reduced = useReducedMotion();

  const alignCls = align === "center" ? "text-center" : "text-left";

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
  };
  const item = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  // Split title into normal + gradient spans
  const words = title.split(" ");
  const gradientSet = new Set(gradient);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.6 }}
      className={`${alignCls} ${className}`}
    >
      {align === "center" && <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-accent/70" />}
      {eyebrow && (
        <motion.span variants={item} className="eyebrow">
          {eyebrow}
        </motion.span>
      )}

      <motion.h2
        variants={item}
        className="display-title mt-4 text-3xl text-white md:text-4xl"
      >
        {words.map((w, i) => (
          <span
            key={i}
            className={
              gradientSet.has(w.replace(/[.,!?]/g, ""))
                ? "text-gradient-cyan"
                : undefined
            }
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </motion.h2>

      {subtitle && (
        <motion.p
          variants={item}
          className={`mt-5 max-w-2xl text-sm leading-relaxed text-[var(--text-2)] md:text-base ${
            align === "center" ? "mx-auto" : ""
          }`}
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
}
