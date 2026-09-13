import { useState } from "react";
import PageTransition from "../components/ui/PageTransition";
import Navbar from "../components/ui/Navbar";

export default function Contact() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <>
      <Navbar />
      <PageTransition>
        <main id="main" className="relative flex min-h-screen flex-col items-center justify-center bg-bg px-6">
          <h1 className="font-display mb-2 text-5xl font-bold text-white md:text-7xl">
            Let's{" "}
            <span className="bg-gradient-to-r from-accent to-cyan-400 bg-clip-text text-transparent">
              Talk
            </span>
          </h1>
          <p className="mb-10 max-w-xl text-center text-gray-400">
            Questions, partnerships or feedback — reach out.
          </p>

          {sent ? (
            <p className="rounded-2xl border border-accent/30 bg-accent/10 px-6 py-4 text-accent">
              Thanks! We'll get back to you shortly.
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-md space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl"
            >
              <input
                type="email"
                required
                placeholder="Your email"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-accent/50"
              />
              <textarea
                required
                rows={4}
                placeholder="Your message"
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-accent/50"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-accent to-cyan-400 py-3 font-semibold text-bg transition-transform hover:scale-[1.02]"
              >
                Send message
              </button>
            </form>
          )}
        </main>
      </PageTransition>
    </>
  );
}
