import PageTransition from "../components/ui/PageTransition";
import Navbar from "../components/ui/Navbar";

export default function Work() {
  return (
    <>
      <Navbar />
      <PageTransition>
        <main id="main" className="relative flex min-h-screen flex-col items-center justify-center bg-bg px-6">
          <h1 className="font-display mb-4 text-5xl font-bold text-white md:text-7xl">
            Our{" "}
            <span className="bg-gradient-to-r from-accent to-cyan-400 bg-clip-text text-transparent">
              Work
            </span>
          </h1>
          <p className="max-w-xl text-center text-gray-400">
            Case studies and results coming soon.
          </p>
        </main>
      </PageTransition>
    </>
  );
}
