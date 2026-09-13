import { useEffect, useState } from "react";

/**
 * True while the element is in (or near) the viewport. Defaults to true so the
 * first paint never flashes a frozen scene. Used to pause rAF-heavy work
 * (WebGL canvases) once a section scrolls out of view.
 */
export default function useInView(ref, margin = "200px") {
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin]);

  return inView;
}
