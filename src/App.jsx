import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { SmoothScrollProvider } from "./context/SmoothScroll";
import { useAppStore } from "./store/appStore";
import ScrollProgress from "./components/ui/ScrollProgress";
import MusicToggle from "./components/ui/MusicToggle";

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Work = lazy(() => import("./pages/Work"));
const Contact = lazy(() => import("./pages/Contact"));
const Profile = lazy(() => import("./pages/Profile"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Resume = lazy(() => import("./pages/Resume"));
const Interview = lazy(() => import("./pages/Interview"));
const Login = lazy(() => import("./pages/Login"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

// Protected route - redirects to /login if not authenticated
function Protected({ children }) {
  const token = localStorage.getItem("hr_token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/work" element={<Work />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/resume" element={<Protected><Resume /></Protected>} />
        <Route path="/interview" element={<Protected><Interview /></Protected>} />
        <Route path="*" element={<Home />} />
      </Routes>
    </AnimatePresence>
  );
}

function Shell() {
  const loaded = useAppStore((s) => s.loaded);
  useEffect(() => {
    const t = setTimeout(() => useAppStore.getState().setLoaded(true), 1300);
    return () => clearTimeout(t);
  }, []);

  return (
    <BrowserRouter>
      <SmoothScrollProvider>
        <ScrollToTop />
        <ScrollProgress />
        <MusicToggle />
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center bg-bg">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          }
        >
          <AnimatedRoutes />
        </Suspense>
      </SmoothScrollProvider>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <>
      {/* subtle vignette for depth */}
      <div
        className="pointer-events-none fixed inset-0 z-[9999]"
        style={{ background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)" }}
        aria-hidden
      />
      <Shell />
    </>
  );
}
