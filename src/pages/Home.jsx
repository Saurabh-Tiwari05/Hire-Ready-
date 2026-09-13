import { Suspense, lazy, useEffect } from "react";
import PageTransition from "../components/ui/PageTransition";
import Navbar from "../components/ui/Navbar";
import LoadingScreen from "../components/ui/LoadingScreen";
import Hero from "../components/Hero";

const Problem = lazy(() => import("../sections/Problem"));
const Solution = lazy(() => import("../sections/Solution"));
const Features = lazy(() => import("../sections/Features"));
const Workflow = lazy(() => import("../sections/Workflow"));
const TechnologyStack = lazy(() => import("../sections/TechnologyStack"));
const Dashboard = lazy(() => import("../sections/Dashboard"));
const CallToAction = lazy(() => import("../sections/CallToAction"));

// Preload the next sections right after Hero mounts, for seamless scroll.
function PreloadHelper() {
  useEffect(() => {
    const t = setTimeout(() => {
      Promise.allSettled([
        import("../sections/Problem"),
        import("../sections/Solution"),
        import("../sections/Features"),
        import("../sections/Workflow"),
        import("../sections/TechnologyStack"),
        import("../sections/Dashboard"),
      ]);
    }, 600);
    return () => clearTimeout(t);
  }, []);
  return null;
}

/** Cinematic divider — a glowing seam that breathes between story beats. */
function SceneDivider() {
  return (
    <div className="relative z-10 py-8 md:py-10" aria-hidden>
      <div className="section-divider" />
    </div>
  );
}

const fallback = (
  <div className="flex h-[70vh] items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
  </div>
);

export default function Home() {
  return (
    <>
      <Navbar />
      <LoadingScreen />
      <PageTransition>
        <main id="main" className="relative overflow-hidden">
          {/* Hero loads immediately (first paint) */}
          <Hero />

          {/* Remaining sections lazy-loaded, joined by cinematic seams */}
          <Suspense fallback={fallback}>
            <section className="relative" data-snap>
              <Problem />
              <SceneDivider />
            </section>
            <section className="relative" data-snap>
              <Solution />
              <SceneDivider />
            </section>
            <section className="relative" data-snap>
              <Features />
              <SceneDivider />
            </section>
            <section className="relative" data-snap>
              <Workflow />
              <SceneDivider />
            </section>
            <section className="relative" data-snap>
              <TechnologyStack />
              <SceneDivider />
            </section>
            <section className="relative" data-snap>
              <Dashboard />
              <SceneDivider />
            </section>
            <section className="relative" data-snap>
              <CallToAction />
            </section>
          </Suspense>
        </main>
      </PageTransition>
      <PreloadHelper />
    </>
  );
}
