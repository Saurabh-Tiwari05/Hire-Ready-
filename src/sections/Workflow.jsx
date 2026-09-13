import React, { useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import SectionTitle from "../components/ui/SectionTitle";
import useInView from "../hooks/useInView";

// Memoized inner component → same React element every render, no instance churn.
const NodeMesh = React.memo(NodeBase);

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  { label: "Resume Upload", color: "#00F2FF", desc: "Drop your resume. HireReady AI parses every line instantly." },
  { label: "Backend", color: "#60A5FA", desc: "Your resume is normalized and mapped into a structured profile." },
  { label: "AI Processing", color: "#A78BFA", desc: "The model reads your skills, projects and experience to build your interview plan." },
  { label: "Interview Questions", color: "#F472B6", desc: "Tailored questions are generated from your profile — no generic prompts." },
  { label: "Candidate Response", color: "#FB923C", desc: "You answer out loud, just like a real interview. Voice, video and code captured." },
  { label: "AI Evaluation", color: "#34D399", desc: "Every answer scored on clarity, structure and technical depth in seconds." },
  { label: "Performance Dashboard", color: "#FBBF24", desc: "Your scores, reports and progress land on a live dashboard." },
];

const NODE_COUNT = STEPS.length;

// Vertical pipeline layout with slight depth wiggle
const positions = STEPS.map((_, i) => ({
  x: Math.sin(i * 1.7) * 0.9,
  y: 3.3 - i * (6.4 / (NODE_COUNT - 1)),
  z: Math.cos(i * 1.9) * 0.6,
}));

function Packet({ from, to, color, offset, active }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const t = (state.clock.getElapsedTime() * 0.5 + offset) % 1;
    ref.current.position.lerpVectors(from, to, t);
    const pulse = 0.5 + Math.sin(t * Math.PI) * 0.5;
    ref.current.scale.setScalar(0.05 + pulse * 0.06);
    ref.current.material.opacity = (active ? 1 : 0.4) * pulse;
  });
  return (
    <mesh ref={ref}>
      <octahedronGeometry args={[0.05, 0]} />
      <meshBasicMaterial color={color} transparent />
    </mesh>
  );
}

function Connector({ from, to, color, active, phase }) {
  const line = useRef();
  const segs = useMemo(() => {
    const pts = [];
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = THREE.MathUtils.lerp(from.x, to.x, t);
      const y = THREE.MathUtils.lerp(from.y, to.y, t);
      const z = THREE.MathUtils.lerp(from.z, to.z, t) + Math.sin(t * Math.PI) * 0.5;
      pts.push(x, y, z);
    }
    return new Float32Array(pts);
  }, [from, to]);

  useFrame((state) => {
    if (!line.current) return;
    const t = state.clock.getElapsedTime();
    const base = active ? 0.9 : 0.25;
    line.current.material.opacity = base + Math.sin(t * 2 + phase) * 0.15;
  });

  return (
    <group>
      <line ref={line}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={segs} count={segs.length / 3} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.3} />
      </line>
      <Packet from={from} to={to} color={color} offset={phase} active={active} />
    </group>
  );
}

function NodeBase({ data, index, active, hovered, setHovered }) {
  const group = useRef();
  const core = useRef();
  const ring = useRef();
  const glow = useRef();

  // Per-node continuous motion driven from refs — no react state churn per frame.
  useEffect(() => {
    const scale = { v: 1 };
    const spin = { a: 0, b: 0 };
    let raf = 0;
    const tick = () => {
      const t = performance.now() * 0.001;
      const isHover = hovered === index;
      const target = isHover || active ? 1.4 : 0.75;
      scale.v += (target - scale.v) * 0.12;
      group.current?.scale.setScalar(scale.v);

      if (core.current) {
        core.current.rotation.y += 0.02;
        core.current.rotation.x += 0.01;
        core.current.material.emissiveIntensity = (active ? 1.6 : 0.4) + Math.sin(t * 3 + index) * 0.4;
      }
      if (ring.current) {
        spin.a += 0.03;
        ring.current.rotation.z = spin.a;
      }
      if (glow.current) {
        glow.current.material.opacity = (active ? 0.5 : 0.15) + Math.sin(t * 2 + index) * 0.1;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, hovered, index]);

  return (
    <group position={[data.position.x, data.position.y, data.position.z]}>
      <group ref={group}>
        <mesh
          ref={core}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(index); }}
          onPointerOut={() => setHovered(null)}
        >
          <octahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial
            color={data.color}
            emissive={data.color}
            emissiveIntensity={0.5}
            metalness={0.8}
            roughness={0.15}
          />
        </mesh>
        <mesh ref={glow}>
          <sphereGeometry args={[0.55, 16, 16]} />
          <meshBasicMaterial color={data.color} transparent opacity={0.2} />
        </mesh>
        <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.45, 0.015, 8, 40]} />
          <meshBasicMaterial color={data.color} transparent opacity={0.5} />
        </mesh>
      </group>

      <Html center position={[0.9, 0.35, 0]} style={{ pointerEvents: "auto" }}>
        <div
          className="wf-label w-max max-w-[180px] cursor-pointer rounded-2xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-xl transition-colors"
          style={{ boxShadow: `0 0 30px ${active ? data.color + "44" : "transparent"}`, animationDelay: `${(index % 5) * 0.5}s` }}
          onClick={() => setHovered(index)}
          onMouseEnter={() => setHovered(index)}
          onMouseLeave={() => setHovered(null)}
        >
          <p
            className="text-xs font-semibold text-white md:text-sm"
            style={{ textShadow: active ? `0 0 12px ${data.color}` : "none" }}
          >
            {data.label}
          </p>
          {active && (
            <p className="mt-1 hidden text-[10px] leading-snug text-white/50 md:block">{data.desc}</p>
          )}
        </div>
      </Html>
    </group>
  );
}

function CyberGrid() {
  const gridRef = useRef();
  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.position.z = ((state.clock.getElapsedTime() * 1.5) % 2) - 1;
    }
  });
  return (
    <gridHelper ref={gridRef} args={[40, 40, "#00F2FF", "#0af"]} position={[0, -4.4, -2]} material-transparent material-opacity={0.25} />
  );
}

function RisingParticles() {
  const ref = useRef();
  const count = 90;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 24;
      arr[i * 3 + 1] = Math.random() * 14 - 7;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
    }
    return arr;
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      pos.array[i * 3 + 1] += 0.02;
      if (pos.array[i * 3 + 1] > 7) pos.array[i * 3 + 1] = -7;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#00F2FF" size={0.03} transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

function Scene({ activeSet, hovered, setHovered }) {
  useFrame((state) => {
    state.camera.position.x += (state.pointer.x * 0.6 - state.camera.position.x) * 0.04;
    state.camera.position.y += (state.pointer.y * 0.4 - state.camera.position.y) * 0.04;
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[5, 5, 6]} intensity={40} color="#00F2FF" />
      <pointLight position={[-5, -4, 4]} intensity={30} color="#A78BFA" />

      <CyberGrid />
      <RisingParticles />

      {/* Main vertical spine */}
      <Connector
        from={positions[0]}
        to={positions[NODE_COUNT - 1]}
        color="#00F2FF"
        active={activeSet.has(NODE_COUNT - 1)}
        phase={0}
      />

      {STEPS.map((step, i) => (
        <NodeMesh
          key={step.label}
          data={{ ...step, position: positions[i] }}
          index={i}
          active={activeSet.has(i)}
          hovered={hovered}
          setHovered={setHovered}
        />
      ))}
    </>
  );
}

<style>{`
  @keyframes wfFloat {
    0%, 100% { translate: 0 0; }
    50% { translate: 0 -5px; }
  }
  .wf-label {
    animation: wfFloat 5s ease-in-out infinite;
  }
`}</style>

export default function Workflow() {
  const sectionRef = useRef(null);
  const canvasWrap = useRef(null);
  const inView = useInView(sectionRef);
  const [activeSet, setActiveSet] = useState(() => new Set([0]));
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Activate each step as its label scrolls into view
      const nodeEls = canvasWrap.current.querySelectorAll("[data-node]");
      nodeEls.forEach((el, i) => {
        ScrollTrigger.create({
          trigger: el,
          start: "top 75%",
          end: "bottom 20%",
          onEnter: () => setActiveSet((prev) => new Set(prev).add(i)),
          onLeaveBack: () => setActiveSet((prev) => {
            const next = new Set(prev);
            next.delete(i);
            return next;
          }),
        });
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative min-h-screen overflow-hidden bg-bg">
      {/* Neon ambient */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/6 blur-[130px]" />

      <div className="section relative z-10 mx-auto max-w-7xl px-6">
        <SectionTitle
          title="From Resume to Dashboard"
          gradient={["Dashboard"]}
          subtitle="Your interview flows through a live AI pipeline. Keep scrolling to trigger each stage."
        />
      </div>

      <div ref={canvasWrap} className="relative z-10 h-[560px] w-full md:h-[700px]">
        {/* Hidden scroll anchors spaced through the canvas */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-around opacity-0">
          {STEPS.map((s, i) => (
            <div key={s.label} data-node className="h-px" />
          ))}
        </div>
        <Canvas
          camera={{ position: [0, 0, 8.5], fov: 50 }}
          dpr={[1, 1.5]}
          frameloop={inView ? "always" : "never"}
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <Scene activeSet={activeSet} hovered={hovered} setHovered={setHovered} />
        </Canvas>
      </div>
    </section>
  );
}
