import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points } from "@react-three/drei";
import { motion } from "framer-motion";
import gsap from "gsap";
import * as THREE from "three";
import Button from "./ui/Button";
import useInView from "../hooks/useInView";

/* ------------------------------ Starfield (single draw call) ------------------------------ */

function Starfield() {
  const ref = useRef();
  const count = 350;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 46;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 30;
      arr[i * 3 + 2] = -4 - Math.random() * 22;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const attr = ref.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      attr.array[i * 3 + 2] += 0.02;
      if (attr.array[i * 3 + 2] > 4) attr.array[i * 3 + 2] = -26;
    }
    attr.needsUpdate = true;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <pointsMaterial size={0.035} color="#9fd8e8" transparent opacity={0.8} sizeAttenuation depthWrite={false} />
    </Points>
  );
}

/* ------------------------------ Particle nebula ------------------------------ */

function ParticleNebula() {
  const ref = useRef();
  const count = 140;
  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const r = 2.2 + Math.random() * 4;
      const t = Math.random() * Math.PI * 2;
      const p = (Math.random() - 0.5) * Math.PI;
      pos[i * 3] = Math.cos(t) * Math.cos(p) * r;
      pos[i * 3 + 1] = Math.sin(p) * r * 0.8;
      pos[i * 3 + 2] = Math.sin(t) * Math.cos(p) * r;
      const hue = 0.5 + Math.random() * 0.08; // cyan range
      const sat = 0.9;
      const light = 0.3 + Math.random() * 0.4;
      c.setHSL(hue, sat, light);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { positions: pos, colors: col };
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const attr = ref.current.geometry.attributes.position;
    const t = state.clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      attr.array[i * 3 + 1] += Math.sin(t * 0.3 + i) * 0.0015;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
        <bufferAttribute attach="attributes-color" array={colors} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.09} vertexColors transparent opacity={0.7} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

/* ------------------------------ AI brain ------------------------------ */

function Brain() {
  const group = useRef();
  const core = useRef();
  const shell = useRef();
  const ring = useRef();
  const target = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    // mouse parallax
    if (group.current) {
      const gx = THREE.MathUtils.lerp(group.current.rotation.y, state.pointer.x * 0.5, 0.06);
      const gy = THREE.MathUtils.lerp(group.current.rotation.x, state.pointer.y * 0.3, 0.06);
      group.current.rotation.y = gx;
      group.current.rotation.x = gy;
    }
    // idle spin
    if (core.current) {
      core.current.rotation.y = t * 0.18;
      core.current.material.emissiveIntensity = 1.3 + Math.sin(t * 1.8) * 0.4;
    }
    if (shell.current) {
      shell.current.rotation.y = -t * 0.08;
      shell.current.rotation.z = Math.sin(t * 0.3) * 0.15;
    }
    if (ring.current) {
      ring.current.rotation.x = t * 0.4;
    }
  });

  return (
    <group ref={group}>
      {/* ambient glow */}
      <mesh>
        <sphereGeometry args={[2.4, 48, 48]} />
        <meshBasicMaterial color="#00F2FF" transparent opacity={0.09} depthWrite={false} />
      </mesh>
      {/* wireframe shell */}
      <mesh ref={shell}>
        <icosahedronGeometry args={[1.9, 1]} />
        <meshBasicMaterial color="#00F2FF" wireframe transparent opacity={0.18} depthWrite={false} />
      </mesh>
      {/* orbital ring */}
      <mesh ref={ring} rotation={[0, 0, 0]}>
        <torusGeometry args={[2.35, 0.012, 8, 90]} />
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.35} />
      </mesh>
      {/* core */}
      <mesh ref={core}>
        <icosahedronGeometry args={[1.15, 2]} />
        <meshStandardMaterial color="#04141a" emissive="#00F2FF" emissiveIntensity={1.3} metalness={0.85} roughness={0.15} />
      </mesh>
      {/* inner light */}
      <mesh>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshBasicMaterial color="#bffaff" toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------ Scene ------------------------------ */

function Scene() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[6, 6, 6]} intensity={40} color="#00F2FF" />
      <pointLight position={[-6, -4, 4]} intensity={24} color="#a78bfa" />

      <Starfield />
      <ParticleNebula />
      <Brain />
    </>
  );
}

/* ------------------------------ Section ------------------------------ */

export default function Hero() {
  const containerRef = useRef();
  const contentRef = useRef();
  const inView = useInView(containerRef);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.15, defaults: { ease: "power3.out" } });
      tl.from(contentRef.current.querySelector(".hero-eyebrow"), {
        y: 24,
        opacity: 0,
        filter: "blur(6px)",
        duration: 0.8,
      })
        .from(
          contentRef.current.querySelector(".hero-title"),
          { y: 46, opacity: 0, filter: "blur(10px)", duration: 1 },
          "-=0.45"
        )
        .from(
          contentRef.current.querySelector(".hero-sub"),
          { y: 30, opacity: 0, filter: "blur(6px)", duration: 0.9 },
          "-=0.6"
        )
        .from(
          contentRef.current.querySelectorAll(".hero-cta"),
          { y: 20, opacity: 0, scale: 0.96, duration: 0.6, stagger: 0.12 },
          "-=0.5"
        );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-bg">
      {/* Three.js scene */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 7.5], fov: 48 }}
          dpr={[1, 1.5]}
          frameloop={inView ? "always" : "never"}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        >
          <Scene />
        </Canvas>
      </div>

      {/* depth overlays */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg via-transparent to-bg z-[1]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(5,5,6,0.55)_100%)]" />

      {/* content */}
      <div ref={contentRef} className="relative z-[2] flex flex-col items-center px-6 text-center">
        <motion.span
          className="hero-eyebrow eyebrow"
          initial={{ opacity: 0 }}
        >
          Powered by AI · Built for placements
        </motion.span>

        <h1 className="hero-title display-title mt-6 max-w-4xl text-4xl text-white md:text-6xl">
          Your Personal{" "}
          <span className="text-gradient">AI Interview</span>{" "}
          Coach
        </h1>

        <p className="hero-sub mt-6 max-w-2xl text-base font-light leading-relaxed text-[var(--text-2)] md:text-lg">
          HireReady AI prepares students for placements, internships and technical interviews
          with personalized AI-powered mock interviews.
        </p>

        <div className="mt-9 flex flex-col items-center gap-3 md:flex-row">
          <span className="hero-cta">
            <Button size="lg">Start Interview</Button>
          </span>
          <span className="hero-cta">
            <Button variant="ghost" size="lg">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M8 5v14l11-7z" />
              </svg>
              Watch Demo
            </Button>
          </span>
        </div>
      </div>

      {/* scroll cue */}
      <div className="absolute bottom-8 left-1/2 z-[2] flex -translate-x-1/2 flex-col items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">Scroll</span>
        <span className="block h-10 w-px bg-gradient-to-b from-accent to-transparent" />
      </div>
    </section>
  );
}
