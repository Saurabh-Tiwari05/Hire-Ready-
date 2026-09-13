

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Environment, Lightformer, MeshReflectorMaterial, Instances, Instance } from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import SectionTitle from "../components/ui/SectionTitle";

gsap.registerPlugin(ScrollTrigger);

/* ---------------------------------- Screen UI ---------------------------------- */

const SCREENS = [
  {
    id: "dashboard",
    label: "Dashboard",
    node: (
      <div className="flex h-full w-full flex-col gap-2 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-white">HireReady AI</span>
          <span className="text-[7px] text-white/40">Live</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { k: "Score", v: "82", c: "#00F2FF" },
            { k: "Interviews", v: "24", c: "#A78BFA" },
            { k: "Streak", v: "7d", c: "#34D399" },
          ].map((s) => (
            <div key={s.k} className="rounded-md border border-white/10 bg-white/5 px-1.5 py-1 backdrop-blur">
              <p className="text-[7px] text-white/40">{s.k}</p>
              <p className="text-[12px] font-bold" style={{ color: s.c }}>{s.v}</p>
            </div>
          ))}
        </div>
        <div className="flex-1 rounded-md border border-white/10 bg-white/5 p-1.5">
          <p className="mb-1 text-[7px] text-white/40">Progress</p>
          <div className="flex h-full items-end gap-[3px]">
            {[45, 62, 40, 70, 55, 85, 60, 78, 92].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm"
                style={{ height: `${h}%`, background: "linear-gradient(180deg,#00F2FF,#0e7490)" }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "resume",
    label: "Resume Upload",
    node: (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/40 bg-accent/10">
          <svg viewBox="0 0 24 24" fill="none" stroke="#00F2FF" strokeWidth="1.6" className="h-5 w-5">
            <path d="M12 3v10M8 9l4-4 4 4M4 17v3h16v-3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-[9px] font-semibold text-white">Resume_Final.pdf</p>
        <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-accent to-cyan-400" />
        </div>
        <p className="text-[7px] text-white/40">Parsing & extracting skills… 66%</p>
      </div>
    ),
  },
  {
    id: "interview",
    label: "Interview",
    node: (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-purple-500 text-[13px] font-bold text-bg">
          AI
        </div>
        <div className="max-w-[150px] rounded-xl rounded-tl-sm border border-white/10 bg-white/5 px-2 py-1 text-center text-[7.5px] leading-snug text-white/80">
          Explain closures in JavaScript.
        </div>
        <div className="flex h-4 items-end gap-[2px]">
          {[3, 6, 4, 8, 5, 9, 4, 7, 3, 6, 8, 4].map((h, i) => (
            <div
              key={i}
              className="w-[3px] rounded-full"
              style={{ height: `${h * 3}px`, background: "linear-gradient(180deg,#00F2FF,#4d7cff)" }}
            />
          ))}
        </div>
        <p className="text-[7px] text-white/40">● REC · 00:42</p>
      </div>
    ),
  },
  {
    id: "analytics",
    label: "Analytics",
    node: (
      <div className="flex h-full w-full flex-col gap-2 p-3">
        <p className="text-[9px] font-semibold text-white">Skill Analytics</p>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded-md border border-white/10 bg-white/5 p-1.5">
            <div
              className="mx-auto mb-1 h-8 w-8 rounded-full"
              style={{ background: "conic-gradient(#00F2FF 0 68%, rgba(255,255,255,0.08) 68%)" }}
            />
            <p className="text-center text-[7px] text-white/40">Communication 68%</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 p-1.5">
            {[["DS/Algo", 82], ["System", 64], ["Behavioral", 90]].map(([k, v]) => (
              <div key={k} className="mb-1 flex items-center gap-1">
                <span className="w-12 text-[6.5px] text-white/40">{k}</span>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-purple-400" style={{ width: `${v}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "recommendations",
    label: "Recommendations",
    node: (
      <div className="flex h-full w-full flex-col gap-1.5 p-3">
        <p className="text-[9px] font-semibold text-white">Recommended for you</p>
        {[
          ["Graph algorithms", "#A78BFA"],
          ["System design: scaling", "#F472B6"],
          ["Behavioral STAR method", "#34D399"],
        ].map(([t, c]) => (
          <div key={t} className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-2 py-1">
            <span className="text-[7px] text-white/80">{t}</span>
            <span className="rounded-full px-1.5 py-0.5 text-[6.5px] font-semibold" style={{ color: c, background: `${c}22` }}>
              Start
            </span>
          </div>
        ))}
      </div>
    ),
  },
];

/* ---------------------------------- Laptop ---------------------------------- */

function Laptop({ screenIndex }) {
  const laptop = useRef();
  const screen = useRef();
  const glowRef = useRef();
  const wrapper = useRef();

  // Rotates with the mouse, gentle idle float
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const rotY = state.pointer.x * 0.55;
    const rotX = -state.pointer.y * 0.28;
    if (wrapper.current) {
      wrapper.current.rotation.y = THREE.MathUtils.lerp(wrapper.current.rotation.y, rotY, 0.06);
      wrapper.current.rotation.x = THREE.MathUtils.lerp(wrapper.current.rotation.x, rotX, 0.06);
    }
    if (laptop.current) {
      laptop.current.position.y = 0.35 + Math.sin(t * 1.1) * 0.07;
    }
    if (glowRef.current) {
      const g = glowRef.current.material;
      g.opacity = 0.5 + Math.sin(t * 2) * 0.15;
    }
    if (screen.current) {
      screen.current.material.emissiveIntensity = 0.7 + Math.sin(t * 2.4) * 0.25;
    }
  });

  // Keyboard key positions
  const keys = [];
  const cols = 12, rows = 4;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      keys.push({
        x: -1.65 + c * 0.3,
        z: 0.62 - r * 0.34,
        w: r === 3 && c === 0 ? 0.55 : 0.26,
      });
    }
  }

  return (
    <group>
      {/* ---- Floating laptop assembly ---- */}
      <group ref={wrapper}>
        <group ref={laptop} position={[0, 0.35, 0]}>
          {/* Base deck */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[4.4, 0.2, 3.0]} />
            <meshStandardMaterial color="#15171d" metalness={0.85} roughness={0.35} />
          </mesh>
          {/* Keyboard plate */}
          <mesh position={[0, 0.105, 0]}>
            <boxGeometry args={[3.6, 0.02, 1.35]} />
            <meshStandardMaterial color="#0b0d12" metalness={0.7} roughness={0.5} />
          </mesh>
          {/* Keys */}
          <Instances limit={keys.length}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#1d2026" metalness={0.6} roughness={0.5} />
            {keys.map((k, i) => (
              <Instance
                key={i}
                position={[k.x, 0.125, k.z]}
                scale={[k.w, 0.03, 0.24]}
                rotation={[0, 0, 0]}
              />
            ))}
          </Instances>
          {/* Trackpad */}
          <mesh position={[0, 0.105, -1.0]}>
            <boxGeometry args={[1.5, 0.02, 0.85]} />
            <meshStandardMaterial color="#10131a" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Hinge */}
          <mesh position={[0, 0.14, -1.42]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 4.4, 16]} />
            <meshStandardMaterial color="#262b33" metalness={0.9} roughness={0.3} />
          </mesh>

          {/* Screen (leaning back) */}
          <group ref={screen} position={[0, 0.16, -1.42]} rotation={[-1.12, 0, 0]}>
            {/* Panel */}
            <mesh position={[0, 1.5, 0]}>
              <boxGeometry args={[4.4, 3.0, 0.1]} />
              <meshStandardMaterial color="#0d0f14" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Screen backing */}
            <mesh position={[0, 1.5, 0.02]}>
              <planeGeometry args={[4.0, 2.6]} />
              <meshStandardMaterial
                color="#04060a"
                emissive="#0e2a33"
                emissiveIntensity={0.5}
                roughness={0.2}
              />
            </mesh>
            {/* Soft glow behind display */}
            <mesh ref={glowRef} position={[0, 1.5, 0.0]}>
              <planeGeometry args={[4.2, 2.8]} />
              <meshBasicMaterial color="#00F2FF" transparent opacity={0.5} />
            </mesh>
            {/* The live DOM screen lying on the plane */}
            <Html transform scale={0.01} position={[0, 1.5, 0.055]} style={{ pointerEvents: "none" }}>
              <div className="relative h-[260px] w-[400px] overflow-hidden rounded-md border border-white/10 bg-black/80 font-sans">
                {/* glass sheen */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
                {/* colored ambient wash per screen */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-purple-500/10" />
                <div className="absolute inset-0">{SCREENS[screenIndex].node}</div>
                {/* screen clock strip */}
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-center justify-between bg-black/50 px-2 py-0.5 backdrop-blur">
                  <span className="text-[6px] text-white/30">{SCREENS[screenIndex].label}</span>
                  <span className="text-[6px] text-white/30">● HireReady AI</span>
                </div>
              </div>
            </Html>
          </group>
        </group>
      </group>

      {/* Reflective floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.1, 0]}>
        <planeGeometry args={[24, 18]} />
        <MeshReflectorMaterial
          blur={[240, 120]}
          resolution={512}
          mixBlur={1}
          mixStrength={40}
          roughness={0.7}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#06070b"
          metalness={0.5}
        />
      </mesh>
    </group>
  );
}

function Scene({ screenIndex }) {
  useFrame((state) => {
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, state.pointer.x * 0.6, 0.04);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 1.2 + state.pointer.y * 0.3, 0.04);
    state.camera.lookAt(0, 0.3, 0);
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <spotLight position={[6, 8, 6]} angle={0.4} penumbra={1} intensity={80} color="#00F2FF" />
      <pointLight position={[-6, 3, -4]} intensity={40} color="#A78BFA" />
      <pointLight position={[0, -2, 5]} intensity={20} color="#ffffff" />

      {/* Procedural environment for reflections (no network fetch) */}
      <Environment resolution={64}>
        <Lightformer intensity={2} rotation-x={Math.PI / 2} position={[0, 5, 0]} scale={[10, 10, 1]} color="#00F2FF" />
        <Lightformer intensity={1.2} position={[-5, 2, -3]} rotation-y={Math.PI / 2} scale={[4, 8, 1]} color="#A78BFA" />
        <Lightformer intensity={0.8} position={[5, 2, 3]} rotation-y={-Math.PI / 2} scale={[4, 8, 1]} color="#ffffff" />
      </Environment>

      <Laptop screenIndex={screenIndex} />
    </>
  );
}

/* ---------------------------------- Section ---------------------------------- */

export default function Architecture() {
  const sectionRef = useRef(null);
  const canvasWrap = useRef(null);
  const [screenIndex, setScreenIndex] = useState(0);

  // Cycle screens every 4s
  useEffect(() => {
    const id = setInterval(() => setScreenIndex((i) => (i + 1) % SCREENS.length), 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        canvasWrap.current,
        { opacity: 0, y: 80, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 70%" },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative min-h-screen overflow-hidden bg-bg py-24">
      {/* Neon ambient */}
      <div className="pointer-events-none absolute left-1/4 top-1/3 h-[420px] w-[420px] rounded-full bg-accent/8 blur-[140px]" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-[360px] w-[360px] rounded-full bg-purple-500/8 blur-[140px]" />

      <div className="section relative z-10 mx-auto max-w-7xl px-6">
        <SectionTitle
          eyebrow="The product"
          title="The Experience"
          gradient={["Experience"]}
          subtitle="A single glass interface — dashboard, uploads, live interviews, analytics and coaching."
        />
      </div>

      <div ref={canvasWrap} className="relative z-10 h-[520px] w-full md:h-[660px]">
        <Canvas camera={{ position: [0, 1.2, 8.5], fov: 42 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
          <Scene screenIndex={screenIndex} />
        </Canvas>

        {/* Screen dots indicator */}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
          {SCREENS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setScreenIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === screenIndex ? "w-5 bg-accent" : "w-1.5 bg-white/20 hover:bg-white/40"
              }`}
              aria-label={s.label}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
