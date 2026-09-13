import { motion, useReducedMotion } from "framer-motion";

/**
 * Word-by-word cinematic text reveal.
 * gradientWords: words rendered with the cyan gradient.
 */
export default function AnimatedText({
  text,
  gradientWords = [],
  className = "",
  delay = 0,
}) {
  const reduced = useReducedMotion();
  const words = text.split(" ");
  const gradientSet = new Set(gradientWords);

  return (
    <span className={className} aria-label={text}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="inline-block"
          initial={
            reduced
              ? { opacity: 0 }
              : { opacity: 0, y: 16, filter: "blur(6px)" }
          }
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{
            duration: 0.6,
            delay: delay + i * 0.055,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <span
            className={
              gradientSet.has(word.replace(/[.,!?]/g, ""))
                ? "text-gradient-cyan"
                : undefined
            }
          >
            {word}
          </span>
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </span>
  );
}
