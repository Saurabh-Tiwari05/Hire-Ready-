import PageTransition from "../components/ui/PageTransition";
import Navbar from "../components/ui/Navbar";

export default function About() {
  return (
    <>
      <Navbar />
      <PageTransition>
        <main id="main" className="relative flex min-h-screen flex-col items-center justify-center bg-bg px-6">
          <h1 className="font-display mb-4 text-5xl font-bold text-white md:text-7xl">
            About{" "}
            <span className="bg-gradient-to-r from-accent to-cyan-400 bg-clip-text text-transparent">
              HireReady AI
            </span>
          </h1>
          <p className="max-w-xl text-center text-gray-400">
            We believe every student deserves a personalized interview coach. This section is next in the roadmap.
          </p>
        </main>
      </PageTransition>
    </>
  );
}
