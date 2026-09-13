import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Work", path: "/work" },
  { name: "About", path: "/about" },
  { name: "Contact", path: "/contact" },
  { name: "Resume", path: "/resume" },
  { name: "Dashboard", path: "/dashboard" },
  { name: "Profile", path: "/profile" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const navbarRef = useRef(null);
  const glowRef = useRef(null);
  const location = useLocation();

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
      if (glowRef.current && navbarRef.current) {
        const rect = navbarRef.current.getBoundingClientRect();
        const relX = ((e.clientX - rect.left) / rect.width) * 100;
        const relY = ((e.clientY - rect.top) / rect.height) * 100;
        glowRef.current.style.background = `radial-gradient(circle at ${relX}% ${relY}%, rgba(0,242,255,0.12), transparent 55%)`;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // GSAP: background + height settle as you scroll
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(navbarRef.current, {
        backgroundColor: "rgba(5,5,8,0.72)",
        boxShadow: "0 8px 40px -12px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.05)",
        backdropFilter: "blur(22px) saturate(160%)",
        scrollTrigger: {
          trigger: document.body,
          start: "top -60px",
          toggleActions: "play reverse",
        },
      });
    }, navbarRef);
    return () => ctx.revert();
  }, []);

  return (
    <nav
      ref={navbarRef}
      className="fixed top-0 left-0 z-[100] w-full border-b border-transparent transition-[border-color] duration-500"
      style={{
        transform: `perspective(1000px) rotateX(${mousePos.y * 0.4}deg) rotateY(${mousePos.x * 0.2}deg)`,
        transformOrigin: "top center",
      }}
    >
      {/* mouse glow */}
      <div ref={glowRef} className="pointer-events-none absolute inset-0 opacity-80" />

      <div
        className={`relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 transition-all duration-500 md:px-10 ${
          scrolled ? "h-16" : "h-20"
        }`}
      >
        {/* Logo */}
        <Link to="/" className="relative z-10" aria-label="HireReady AI — home">
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            <div className="relative flex h-9 w-9 items-center justify-center">
              <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent to-cyan-400 opacity-80" />
              <span className="absolute inset-[2px] rounded-[10px] bg-bg" />
              <span className="relative z-10 font-display text-sm font-bold text-white">
                H<span className="text-accent">R</span>
              </span>
            </div>
            <span className="font-display text-lg font-semibold tracking-tight text-white">
              HireReady <span className="text-gradient-cyan">AI</span>
            </span>
          </motion.div>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <NavLink key={link.path} to={link.path} className="group relative px-4 py-2">
              {({ isActive }) => (
                <>
                  <span
                    className={`relative z-10 text-sm font-medium transition-colors duration-300 ${
                      isActive ? "text-white" : "text-[var(--text-2)] group-hover:text-white"
                    }`}
                  >
                    {link.name}
                  </span>
                  {/* underline */}
                  <span
                    className={`absolute inset-x-3 -bottom-0.5 h-px origin-left bg-gradient-to-r from-accent to-cyan-400 transition-transform duration-400 ${
                      isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                    style={{ transform: isActive ? "scaleX(1)" : "scaleX(0)", transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
                  />
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:block">
          <a href="#start" className="btn-neon px-5 py-2 text-sm">
            Start Interview
          </a>
        </div>

        {/* Mobile burger */}
        <div className="md:hidden">
          <motion.button
            onClick={() => setMobileOpen((v) => !v)}
            className="relative z-10 flex h-10 w-10 items-center justify-center text-white"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            <span className="flex flex-col gap-1.5">
              <motion.span
                className="block h-[2px] w-6 rounded-full bg-white"
                animate={{ rotate: mobileOpen ? 45 : 0, y: mobileOpen ? 3.5 : 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              />
              <motion.span
                className="block h-[2px] w-6 rounded-full bg-white"
                animate={{ rotate: mobileOpen ? -45 : 0, y: mobileOpen ? -3.5 : 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              />
            </span>
          </motion.button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="glass-strong mx-4 mt-2 overflow-hidden rounded-3xl hidden"
          >
            <div className="flex flex-col p-2">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.05 }}
                >
                  <NavLink
                    to={link.path}
                    className={({ isActive }) =>
                      `block rounded-2xl px-4 py-3.5 text-sm font-medium transition-colors ${
                        isActive ? "bg-accent/10 text-white" : "text-[var(--text-2)]"
                      }`
                    }
                  >
                    {link.name}
                  </NavLink>
                </motion.div>
              ))}
              <div className="p-2 pt-1">
                <a href="#start" className="btn-neon w-full py-3 text-sm">
                  Start Interview
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
