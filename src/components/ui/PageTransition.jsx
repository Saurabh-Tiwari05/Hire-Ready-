import { motion, useReducedMotion } from "framer-motion";

/**
 * Cinematic page transition — content crossfades and rises while
 * a neon sheen sweeps across, like a slow camera pull-in.
 */
export default function PageTransition({ children }) {
  const reduced = useReducedMotion();

  if (reduced) return children;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        initial={{ y: 24, scale: 0.995 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: -16, scale: 0.995 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
