import { motion } from "framer-motion";

/**
 * Premium action button.
 * variant: "neon" | "ghost"
 * size: "sm" | "md" | "lg"
 */
export default function Button({
  children,
  variant = "neon",
  size = "md",
  className = "",
  href,
  onClick,
  ariaLabel,
  ...rest
}) {
  const sizes = {
    sm: "px-5 py-2 text-sm",
    md: "px-7 py-3 text-sm",
    lg: "px-9 py-4 text-base",
  };

  const classes = `${variant === "neon" ? "btn-neon" : "btn-ghost"} ${sizes[size]} ${className}`;

  const inner = (
    <>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      {variant === "neon" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full overflow-hidden"
        >
          {/* gentle sweep on hover */}
          <span
            className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <motion.a
        href={href}
        onClick={onClick}
        aria-label={ariaLabel}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={classes}
        {...rest}
      >
        {inner}
      </motion.a>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={classes}
      {...rest}
    >
      {inner}
    </motion.button>
  );
}
