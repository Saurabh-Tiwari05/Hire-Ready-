import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/ui/Navbar";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";

// Use Vite's /api proxy in development to keep browser requests same-origin.
// Set VITE_API_URL for deployed environments that do not provide a proxy.
const BASE = import.meta.env.VITE_API_URL || "/api";

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 transition-colors focus:border-accent/60 focus:outline-none";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/signup";
      const res = await fetch(`${BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Authentication failed");
      }

      // Store token
      localStorage.setItem("hr_token", data.token);

      // Navigate to where the user was heading
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setError(null);
  };

  return (
    <div className="min-h-screen bg-bg pt-20">
      <Navbar />
      <main className="flex min-h-[80vh] items-center justify-center px-6 py-12">
        <GlassCard className="w-full max-w-md p-8" glow="#00F2FF">
          {/* Logo / Title */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white">HireReady</h1>
            <p className="mt-2 text-sm text-[var(--text-2)]">
              {mode === "login" ? "Welcome back. Login to continue." : "Create your account to start."}
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="mb-8 grid grid-cols-2 gap-1 rounded-xl bg-white/[0.04] p-1">
            {["login", "signup"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={switchMode}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  mode === m ? "bg-accent/20 text-accent" : "text-white/50 hover:text-white/80"
                }`}
              >
                {m === "login" ? "Login" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-400"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === "signup" && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="mb-1 block text-xs font-medium uppercase tracking-widest text-[var(--text-3)]">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                    placeholder="e.g., Rahul Sharma"
                    className={inputCls}
                    required
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-widest text-[var(--text-3)]">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-widest text-[var(--text-3)]">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                className={inputCls}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--text-2)]">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button onClick={switchMode} className="text-accent hover:underline">
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button onClick={switchMode} className="text-accent hover:underline">
                  Login
                </button>
              </>
            )}
          </p>
        </GlassCard>
      </main>
    </div>
  );
}
