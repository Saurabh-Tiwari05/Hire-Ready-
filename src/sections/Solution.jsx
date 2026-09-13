import React, { useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";
import * as THREE from "three";
import SectionTitle from "../components/ui/SectionTitle";
import useInView from "../hooks/useInView";

const ICONS = [
  {
    key: "resume",
    label: "Resume",
    title: "Resume Optimizer",
    desc: "AI scans your resume against the job description and rewrites it to beat the ATS filters recruiters use.",
    color: "#00F2FF",
  },
  {
    key: "interview",
    label: "Interview",
    title: "Live Mock Interview",
    desc: "Face a realistic AI interviewer that asks follow-up questions and adapts difficulty to your answers in real time.",
    color: "#A78BFA",
  },
  {
    key: "ai",
    label: "AI",
    title: "AI Coaching",
    desc: "A personal coach that learns your weak spots and builds a custom prep plan only for you.",
    color: "#F472B6",
  },
  {
    key: "feedback",
    label: "Feedback",
    title: "Instant Feedback",
    desc: "Get scored on communication, clarity and technical depth immediately after every answer.",
    color: "#34D399",
  },
  {
    key: "reports",
    label: "Reports",
    title: "Progress Reports",
    desc: "Weekly reports track your improvement across every skill, so you always see how far you've come.",
    color: "#FBBF24",
  },
  {
    key: "analytics",
    label: "Analytics",
    title: "Analytics",
    desc: "Deep analytics reveal exactly which topics stall you — and which are ready for the real interview.",
    color: "#60A5FA",
  },
  {
    key: "cloud",
    label: "Cloud",
    title: "Cloud Sync",
    desc: "Your progress, plans and reports are saved securely in the cloud, ready on any device.",
    color: "#F87171",
  },
];

const IconGlyph = ({ name }) => {
  const paths = {
    resume: (
      <>
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v4h4" />
        <path d="M9 12h6M9 16h6" />
      </>
    ),
    interview: (
      <>
        <rect x="9" y="2" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0" />
        <path d="M12 18v3" />
      </>
    ),
    ai: (
      <>
        <rect x="4" y="4" width="16" height="12" rx="2" />
        <path d="M8 4V2M16 4V2M12 4V2M8 20h8M12 20v-4" />
      </>
    ),
    feedback: (
      <>
        <path d="M4 5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-7l-5 4v-4a3 3 0 0 1-3-3z" />
        <path d="M8 9h8M8 12h5" />
      </>
    ),
    reports: (
      <>
        <path d="M4 20h16" />
        <rect x="6" y="12" width="3" height="8" rx="0.5" />
        <rect x="10.5" y="8" width="3" height="12" rx="0.5" />
        <rect x="15" y="4" width="3" height="16" rx="0.5" />
      </>
    ),
    analytics: (
      <>
        <path d="M4 18L9 12l4 4 7-9" />
        <path d="M16 7h4v4" />
      </>
    ),
    cloud: (
      <>
        <path d="M7 18a4 4 0 0 1-.5-7.97A5 5 0 0 1 16.5 8.5 3.5 3.5 0 0 1 17 18z" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {paths[name]}
    </svg>
  );
};

const HologramCore = () => {
  const coreRef = useRef();
  const wireRef = useRef();
  const beamRef = useRef();

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (coreRef.current) coreRef.current.rotation.y += delta * 0.3;
    if (wireRef.current) {
      wireRef.current.rotation.y -= delta * 0.15;
      wireRef.current.rotation.x = Math.sin(t * 0.2) * 0.2;
    }
    if (beamRef.current) {
      beamRef.current.material.opacity = 0.18 + Math.sin(t * 3) * 0.06;
    }
  });

  return (
    <group position={[0, -0.4, 0]}>
      {/* Inner glowing core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.9, 48, 48]} />
        <meshStandardMaterial
          color="#00F2FF"
          emissive="#00F2FF"
          emissiveIntensity={1.6}
          roughness={0.15}
          metalness={0.9}
        />
      </mesh>
      {/* Hologram wireframe shell */}
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[1.7, 1]} />
        <meshBasicMaterial color="#00F2FF" wireframe transparent opacity={0.35} />
      </mesh>
      {/* Rising light beam */}
      <mesh ref={beamRef} position={[0, -4.2, 0]}>
        <cylinderGeometry args={[1.1, 0.5, 8, 32, 1, true]} />
        <meshBasicMaterial color="#00F2FF" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      {/* Base pedestal */}
      <mesh position={[0, -4.45, 0]}>
        <cylinderGeometry args={[1.7, 2.1, 0.4, 48]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.9} roughness={0.4} />
      </mesh>
      <mesh position={[0, -4.2, 0]}>
        <ringGeometry args={[1.6, 1.8, 64]} />
        <meshBasicMaterial color="#00F2FF" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

const RisingParticles = () => {
  const points = useRef();
  const count = 70;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 0.4 + Math.random() * 1.2;
      const a = Math.random() * Math.PI * 2;
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = Math.random() * 7 - 3.5;
      arr[i * 3 + 2] = Math.sin(a) * r;
    }
    return arr;
  }, []);

  useFrame(() => {
    if (!points.current) return;
    const pos = points.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      pos.array[i * 3 + 1] += 0.012;
      if (pos.array[i * 3 + 1] > 3.5) pos.array[i * 3 + 1] = -3.5;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={points} position={[0, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#00F2FF" size={0.03} transparent opacity={0.8} sizeAttenuation />
    </points>
  );
};

const Scene = ({ onSelect, hovered }) => {
  const orbitRef = useRef();
  const paused = useRef(false);

  const radius = useMemo(() => (typeof window !== "undefined" && window.innerWidth < 768 ? 2.6 : 3.6), []);
  const cameraZ = useMemo(() => (typeof window !== "undefined" && window.innerWidth < 768 ? 8.5 : 9), []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    // Continuous orbit — pauses on hover
    if (!paused.current && orbitRef.current) {
      orbitRef.current.rotation.y += delta * 0.25;
    }
    // Gentle mouse parallax on the whole scene
    state.camera.position.x += (state.pointer.x * 0.8 - state.camera.position.x) * 0.04;
    state.camera.position.y += (state.pointer.y * 0.5 - state.camera.position.y) * 0.04;
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 6, 5]} intensity={60} color="#00F2FF" />
      <pointLight position={[-6, -4, 3]} intensity={40} color="#A78BFA" />

      <group position={[0, 0.4, 0]}>
        <HologramCore />
        <RisingParticles />
      </group>

      <group ref={orbitRef} position={[0, 0.4, 0]}>
        {ICONS.map((icon, i) => {
          const angle = (i / ICONS.length) * Math.PI * 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius * 0.62;
          return (
            <group key={icon.key} className="sol-orbit" position={[x, y, 0]}>
              {/* Neon connector line from core to icon */}
              <line>
                <bufferGeometry>
                  <bufferAttribute attach="attributes-position" count={2} array={new Float32Array([0, 0, 0, x, y, 0])} itemSize={3} />
                </bufferGeometry>
                <lineBasicMaterial color={icon.color} transparent opacity={0.35} />
              </line>
              {/* Pulsing node dot */}
              <mesh>
                <sphereGeometry args={[0.07, 12, 12]} />
                <meshBasicMaterial color={icon.color} />
              </mesh>
              <Html
                center
                zIndexRange={[20, 0]}
                style={{ pointerEvents: "auto" }}
              >
                <div
                  onMouseEnter={() => (paused.current = true)}
                  onMouseLeave={() => (paused.current = false)}
                  onClick={() => onSelect(i)}
                  className="group flex cursor-pointer flex-col items-center gap-2"
                  style={{ transform: "translate(-50%, -50%)", animationDelay: `${i * 0.4}s` }}
                >
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl transition-all duration-300 group-hover:scale-110 group-hover:border-white/30"
                    style={{ boxShadow: `0 0 24px ${icon.color}22, inset 0 0 12px ${icon.color}11` }}
                  >
                    <span style={{ color: icon.color }}>
                      <IconGlyph name={icon.key} />
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-white/60">
                    {icon.label}
                  </span>
                </div>
              </Html>
            </group>
          );
        })}
      </group>
    </>
  );
};

<style>{`
  @keyframes solFloat {
    0%, 100% { translate: 0 0; }
    50% { translate: 0 -6px; }
  }
  .sol-orbit {
    animation: solFloat 6s ease-in-out infinite;
  }
`}</style>

export default function Solution() {
  const [active, setActive] = useState(null);
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef);

  return (
    <section ref={sectionRef} className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg py-16">
      {/* Neon grid background */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,242,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,242,255,0.06) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />
      {/* Center glow */}
      <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[120px]" />

      <SectionTitle
        title="The Complete Interview System"
        gradient={["Complete"]}
        subtitle="One AI that handles everything around your interview."
      />

      {/* Hologram canvas */}
      <div className="relative z-10 h-[420px] w-full md:h-[520px]">
        <Canvas
          camera={{ position: [0, 0, 9], fov: 55 }}
          dpr={[1, 1.5]}
          frameloop={inView ? "always" : "never"}
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <Scene onSelect={setActive} />
        </Canvas>
      </div>

      {/* Floating glass info card */}
      <AnimatePresence>
        {active !== null && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="glass-strong relative z-20 w-full max-w-md rounded-3xl p-6"
            style={{ boxShadow: `0 0 60px ${ICONS[active].color}33` }}
          >
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ color: ICONS[active].color, backgroundColor: `${ICONS[active].color}1a` }}
              >
                <IconGlyph name={ICONS[active].key} />
              </div>
              <h3 className="text-lg font-bold text-white">{ICONS[active].title}</h3>
              <button
                onClick={() => setActive(null)}
                className="ml-auto text-white/40 transition-colors hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="text-sm leading-relaxed text-gray-300">{ICONS[active].desc}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
