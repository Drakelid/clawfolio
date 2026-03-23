"use client";

import { useEffect, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox, Environment, Text } from "@react-three/drei";
import * as THREE from "three";

// ═══════════════════════════════════════════════════════════
//  KEYBOARD LAYOUT DATA
// ═══════════════════════════════════════════════════════════

const KEY_UNIT = 0.38;
const KEY_GAP  = 0.04;
const KEY_H    = 0.14;

// Cherry-profile sculpted rows: tallest at top, lowest at home row
const ROW_HEIGHTS = [0.16, 0.145, 0.13, 0.135, 0.14];
const ROW_ANGLES  = [-0.12, -0.08, -0.03, -0.05, -0.07];

interface KeyData {
  id: string;
  label: string;
  x: number;
  z: number;
  w: number;
  d: number;
  row: number;
}

const rowDefs: { label: string; w: number }[][] = [
  [
    { label: "Esc", w: 1 }, { label: "1", w: 1 }, { label: "2", w: 1 }, { label: "3", w: 1 },
    { label: "4", w: 1 }, { label: "5", w: 1 }, { label: "6", w: 1 }, { label: "7", w: 1 },
    { label: "8", w: 1 }, { label: "9", w: 1 }, { label: "0", w: 1 }, { label: "-", w: 1 },
    { label: "=", w: 1 }, { label: "⌫", w: 1.6 },
  ],
  [
    { label: "Tab", w: 1.4 }, { label: "Q", w: 1 }, { label: "W", w: 1 }, { label: "E", w: 1 },
    { label: "R", w: 1 }, { label: "T", w: 1 }, { label: "Y", w: 1 }, { label: "U", w: 1 },
    { label: "I", w: 1 }, { label: "O", w: 1 }, { label: "P", w: 1 }, { label: "[", w: 1 },
    { label: "]", w: 1 }, { label: "\\", w: 1.2 },
  ],
  [
    { label: "Caps", w: 1.6 }, { label: "A", w: 1 }, { label: "S", w: 1 }, { label: "D", w: 1 },
    { label: "F", w: 1 }, { label: "G", w: 1 }, { label: "H", w: 1 }, { label: "J", w: 1 },
    { label: "K", w: 1 }, { label: "L", w: 1 }, { label: ";", w: 1 }, { label: "'", w: 1 },
    { label: "↵", w: 2 },
  ],
  [
    { label: "Shift", w: 2 }, { label: "Z", w: 1 }, { label: "X", w: 1 }, { label: "C", w: 1 },
    { label: "V", w: 1 }, { label: "B", w: 1 }, { label: "N", w: 1 }, { label: "M", w: 1 },
    { label: ",", w: 1 }, { label: ".", w: 1 }, { label: "/", w: 1 }, { label: "Shift", w: 2.6 },
  ],
  [
    { label: "Ctrl", w: 1.3 }, { label: "⌘", w: 1.1 }, { label: "Alt", w: 1.1 },
    { label: "", w: 5.8 }, { label: "Alt", w: 1.1 }, { label: "Fn", w: 1.1 },
    { label: "Ctrl", w: 1.3 },
  ],
];

function buildLayout(): KeyData[] {
  const keys: KeyData[] = [];
  for (let ri = 0; ri < rowDefs.length; ri++) {
    let xOff = 0;
    for (let ci = 0; ci < rowDefs[ri].length; ci++) {
      const def = rowDefs[ri][ci];
      const w = def.w * KEY_UNIT;
      const d = KEY_UNIT;
      keys.push({ id: `${ri}-${ci}`, label: def.label, x: xOff + w / 2, z: ri * (KEY_UNIT + KEY_GAP), w, d, row: ri });
      xOff += w + KEY_GAP;
    }
  }
  const xs = keys.map((k) => k.x);
  const zs = keys.map((k) => k.z);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cz = (Math.min(...zs) + Math.max(...zs)) / 2;
  return keys.map((k) => ({ ...k, x: k.x - cx, z: k.z - cz })) as KeyData[];
}

const CHAR_LABEL_MAP: Record<string, string> = {
  " ": "", "-": "-", "=": "=", "[": "[", "]": "]", "\\": "\\", ";": ";",
  "'": "'", ",": ",", ".": ".", "/": "/", "(": "9", ")": "0",
  "{": "[", "}": "]", ":": ";", '"': "'", "<": ",", ">": ".",
  "?": "/", "!": "1", "@": "2", "#": "3", "$": "4", "%": "5",
  "^": "6", "&": "7", "*": "8", "_": "-", "+": "=", "|": "\\",
};
const ALPHA_NUM = /^[A-Z0-9]$/;

function charToLabel(c: string): string | null {
  if (c === " ") return "";
  const u = c.toUpperCase();
  if (ALPHA_NUM.test(u)) return u;
  return CHAR_LABEL_MAP[c] ?? null;
}

const typeSeqs = [
  "const app = express();",
  "npm run deploy",
  "git commit -m 'ship it'",
  "SELECT * FROM users;",
  "docker compose up -d",
  "async function main() {",
];

function createSeededRandom(seed: number) {
  let value = seed >>> 0;

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function buildAmbientDustPositions(count: number): Float32Array {
  const random = createSeededRandom(0x5f3759df);
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (random() - 0.5) * 8;
    positions[i * 3 + 1] = random() * 3 - 0.5;
    positions[i * 3 + 2] = (random() - 0.5) * 5;
  }

  return positions;
}

// ═══════════════════════════════════════════════════════════
//  KEYBOARD
// ═══════════════════════════════════════════════════════════

const accentBlue   = new THREE.Color("#3B82F6");
const accentCyan   = new THREE.Color("#06B6D4");
const keyDark      = new THREE.Color("#0d0d18");
const keyBase      = new THREE.Color("#1a1a28");
const keyMod       = new THREE.Color("#202030"); // modifier keys — slightly lighter
const plateMetal   = new THREE.Color("#0a0a14");

const MODIFIER_LABELS = new Set(["Esc","Tab","Caps","Shift","Ctrl","Alt","⌘","Fn","⌫","↵","\\"]);
const HOMING_LABELS   = new Set(["F", "J"]);
const particleBlue   = new THREE.Color("#3B82F6");
const particleViolet = new THREE.Color("#8B5CF6");

function Keyboard() {
  const groupRef = useRef<THREE.Group>(null);
  const layout   = useMemo(() => buildLayout(), []);

  const labelMap = useMemo(() => {
    const m = new Map<string, KeyData>();
    for (const k of layout) if (k.label && !m.has(k.label)) m.set(k.label, k);
    return m;
  }, [layout]);

  // Per-key RGB — rainbow left→right
  const keyColorMap = useMemo(() => {
    const map  = new Map<string, THREE.Color>();
    const allX = layout.map((k) => k.x);
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const range = maxX - minX || 1;
    for (const k of layout) {
      const t = (k.x - minX) / range;
      const color = new THREE.Color();
      color.setHSL(t * 0.72, 1.0, 0.58);
      map.set(k.id, color);
    }
    return map;
  }, [layout]);

  // Normalised x-position (0 = leftmost key, 1 = rightmost) — used by the wave
  const xBounds = useMemo(() => {
    const allX = layout.map((k) => k.x);
    const minX = Math.min(...allX);
    const range = Math.max(...allX) - minX || 1;
    return { minX, range };
  }, [layout]);

  const capRefs  = useRef<Map<string, THREE.Mesh>>(new Map());
  const glowState = useRef<Map<string, number>>(new Map());
  const ripples  = useRef<{ x: number; z: number; time: number }[]>([]);

  const seqIdx       = useRef(0);
  const charIdx      = useRef(0);
  const lastTime     = useRef(0);
  const waiting      = useRef(false);
  const typedTextRef = useRef("");

  const dims = useMemo(() => {
    const ws    = layout.map((k) => k.x + k.w / 2);
    const wsMin = layout.map((k) => k.x - k.w / 2);
    const ds    = layout.map((k) => k.z + k.d / 2);
    const dsMin = layout.map((k) => k.z - k.d / 2);
    return {
      w: Math.max(...ws) - Math.min(...wsMin) + 0.3,
      d: Math.max(...ds) - Math.min(...dsMin) + 0.25,
    };
  }, [layout]);

  // Particle system
  const MAX_P  = 120;
  const burstRef = useRef<{ pos: THREE.Vector3; vel: THREE.Vector3; life: number; max: number; color: THREE.Color }[]>([]);
  const particleBuffersRef = useRef({
    positions: new Float32Array(MAX_P * 3),
    colors: new Float32Array(MAX_P * 3),
    sizes: new Float32Array(MAX_P),
  });
  const pGeo   = useRef<THREE.BufferGeometry>(null);

  // Accent strip refs
  const stripFrontRef = useRef<THREE.MeshStandardMaterial>(null);
  const stripBackRef  = useRef<THREE.MeshStandardMaterial>(null);

  useEffect(() => {
    if (!pGeo.current) {
      return;
    }

    const { positions, colors, sizes } = particleBuffersRef.current;
    pGeo.current.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pGeo.current.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    pGeo.current.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  }, []);

  useFrame(({ clock, pointer }, delta) => {
    if (!groupRef.current) return;
    const t   = clock.getElapsedTime();
    const now = t * 1000;

    // Mouse tilt
    groupRef.current.rotation.x += (-0.35 + pointer.y * 0.1 - groupRef.current.rotation.x) * 0.03;
    groupRef.current.rotation.y += (pointer.x * 0.15 - groupRef.current.rotation.y) * 0.03;
    groupRef.current.position.y  = Math.sin(t * 0.7) * 0.04;

    // Accent strip breathing — very slow, subtle
    if (stripFrontRef.current)
      stripFrontRef.current.emissiveIntensity = 0.3 + Math.sin(t * 0.4) * 0.06;
    if (stripBackRef.current)
      stripBackRef.current.emissiveIntensity  = 0.2 + Math.sin(t * 0.4 + Math.PI) * 0.04;

    // Auto-typing
    const seq     = typeSeqs[seqIdx.current];
    const elapsed = now - lastTime.current;

    if (waiting.current) {
      if (elapsed > 1400) {
        waiting.current  = false;
        seqIdx.current   = (seqIdx.current + 1) % typeSeqs.length;
        charIdx.current  = 0;
        lastTime.current = now;
        typedTextRef.current = "";
      }
    } else {
      const delay = 105 + Math.random() * 95;
      if (elapsed > delay && charIdx.current < seq.length) {
        const ch    = seq[charIdx.current];
        typedTextRef.current += ch;
        const label = charToLabel(ch);
        if (label !== null) {
          const kd = labelMap.get(label);
          if (kd) {
            glowState.current.set(kd.id, 1.0);
            ripples.current.push({ x: kd.x, z: kd.z, time: t });
            if (ripples.current.length > 8) ripples.current.shift();

            const keyRowH = ROW_HEIGHTS[kd.row] ?? KEY_H;
            const count   = 1 + Math.floor(Math.random() * 2);
            for (let i = 0; i < count; i++) {
              const angle  = Math.random() * Math.PI * 2;
              const spd    = 0.2 + Math.random() * 0.5;
              const isBlue = Math.random() > 0.35;
              burstRef.current.push({
                pos:   new THREE.Vector3(kd.x, keyRowH + 0.03, kd.z),
                vel:   new THREE.Vector3(
                  Math.cos(angle) * spd * 0.3,
                  0.6 + Math.random() * 1.2,
                  Math.sin(angle) * spd * 0.3,
                ),
                life:  0,
                max:   0.6 + Math.random() * 0.6,
                color: isBlue ? particleBlue : particleViolet,
              });
            }
            if (burstRef.current.length > MAX_P)
              burstRef.current.splice(0, burstRef.current.length - MAX_P);
          }
        }
        charIdx.current++;
        lastTime.current = now;
      }
      if (charIdx.current >= seq.length) {
        waiting.current  = true;
        lastTime.current = now;
      }
    }

    // Key glow + press + ripple
    for (const kd of layout) {
      const mesh = capRefs.current.get(kd.id);
      if (!mesh) continue;

      const rowH = ROW_HEIGHTS[kd.row] ?? KEY_H;
      const glow = glowState.current.get(kd.id) || 0;

      // Ripple wave
      let rippleGlow = 0;
      for (const rp of ripples.current) {
        const dist      = Math.sqrt((kd.x - rp.x) ** 2 + (kd.z - rp.z) ** 2);
        const age       = t - rp.time;
        const waveRadius = age * 3.0;
        const waveDelta  = Math.abs(dist - waveRadius);
        if (waveDelta < 0.35 && age < 1.2) {
          const strength = (1 - waveDelta / 0.35) * Math.max(0, 1 - age / 1.2) * 0.08;
          rippleGlow = Math.max(rippleGlow, strength);
        }
      }

      const totalGlow = Math.min(glow + rippleGlow, 1.0);
      const mat = mesh.material as THREE.MeshStandardMaterial;

      // Press animation — key depresses on hit, springs back
      const targetY = rowH / 2 - glow * 0.04;
      mesh.position.y += (targetY - mesh.position.y) * 0.25;

      // ── Idle breathing pulse ─────────────────────────────────────────────
      // Very subtle ambient glow — barely perceptible breathing, like real
      // RGB keyboards at low brightness. Most of the time keys look nearly off.
      const keyNorm   = (kd.x - xBounds.minX) / xBounds.range;

      // Hue: rotates through the rainbow very slowly (~40 s full cycle).
      const hue       = (t * 0.025 + keyNorm * 0.12) % 1.0;

      // Pulse: very gentle breathing — floor at 0.85 so keys barely dim.
      const pulse      = 0.85 + 0.15 * Math.sin(t * 0.5 + keyNorm * 0.3);
      const targetIdle = 0.015 + pulse * 0.035;   // range  0.028 → 0.050

      const keyColor = keyColorMap.get(kd.id) ?? accentBlue;
      if (totalGlow > 0.005) {
        // Key is pressed — flash its own RGB colour on top of the idle level
        if (rippleGlow > 0.02 && glow < 0.2) {
          mat.emissive.lerpColors(keyColor, accentCyan, 0.3);
        } else {
          mat.emissive.copy(keyColor);
        }
        const targetIntensity = targetIdle + totalGlow * 0.8;
        mat.emissiveIntensity += (targetIntensity - mat.emissiveIntensity) * 0.18;
      } else {
        // Pure idle — chase the breathing target with a gentle lerp
        mat.emissive.setHSL(hue, 1.0, 0.5);
        mat.emissiveIntensity += (targetIdle - mat.emissiveIntensity) * 0.025;
      }

      if (glow > 0.005) {
        glowState.current.set(kd.id, glow * 0.88); // faster decay — clean key release
      } else {
        glowState.current.delete(kd.id);
      }
    }

    ripples.current = ripples.current.filter((r) => t - r.time < 2);

    // Particles
    const alive = burstRef.current.filter((p) => {
      p.life += delta;
      if (p.life >= p.max) return false;
      p.vel.y -= delta * 3.5;
      p.pos.addScaledVector(p.vel, delta);
      return true;
    });
    burstRef.current = alive;

    const { positions: pos, colors: col, sizes } = particleBuffersRef.current;
    for (let i = 0; i < MAX_P; i++) {
      if (i < alive.length) {
        const p    = alive[i];
        const fade = 1 - p.life / p.max;
        pos[i * 3]     = p.pos.x;
        pos[i * 3 + 1] = p.pos.y;
        pos[i * 3 + 2] = p.pos.z;
        col[i * 3]     = p.color.r * fade;
        col[i * 3 + 1] = p.color.g * fade;
        col[i * 3 + 2] = p.color.b * fade;
        sizes[i] = fade * 0.05;
      } else {
        pos[i * 3 + 1] = -10;
        sizes[i] = 0;
      }
    }
    if (pGeo.current) {
      const positionAttribute = pGeo.current.getAttribute("position");
      const colorAttribute = pGeo.current.getAttribute("color");
      const sizeAttribute = pGeo.current.getAttribute("size");

      if (positionAttribute && colorAttribute && sizeAttribute) {
        positionAttribute.needsUpdate = true;
        colorAttribute.needsUpdate = true;
        sizeAttribute.needsUpdate = true;
      }
    }
  });

  return (
    <Float speed={0.8} rotationIntensity={0.03} floatIntensity={0.06}>
      <group ref={groupRef} rotation={[-0.30, 0, 0]} position={[0, -1.6, 1.2]} scale={0.62}>
        {/* ── Case bottom half — heavier base with weight ── */}
        <RoundedBox args={[dims.w, 0.06, dims.d]} radius={0.05} smoothness={4} position={[0, -0.08, 0]}>
          <meshStandardMaterial color="#080814" roughness={0.22} metalness={0.88} />
        </RoundedBox>

        {/* Case top half — anodized aluminum shell */}
        <RoundedBox args={[dims.w, 0.06, dims.d]} radius={0.06} smoothness={4} position={[0, -0.03, 0]}>
          <meshStandardMaterial color="#0e0e1a" roughness={0.25} metalness={0.82} />
        </RoundedBox>

        {/* Case seam line — where top and bottom halves join */}
        <mesh position={[0, -0.052, -(dims.d / 2 - 0.001)]}>
          <boxGeometry args={[dims.w - 0.02, 0.003, 0.002]} />
          <meshStandardMaterial color="#060612" roughness={0.5} metalness={0.6} />
        </mesh>
        <mesh position={[0, -0.052, dims.d / 2 - 0.001]}>
          <boxGeometry args={[dims.w - 0.02, 0.003, 0.002]} />
          <meshStandardMaterial color="#060612" roughness={0.5} metalness={0.6} />
        </mesh>

        {/* Inner case lip — raised bezel around the key area */}
        <RoundedBox args={[dims.w - 0.04, 0.04, dims.d - 0.04]} radius={0.04} smoothness={3} position={[0, 0.005, 0]}>
          <meshStandardMaterial color="#0c0c18" roughness={0.3} metalness={0.78} />
        </RoundedBox>

        {/* Front chamfer / lip */}
        <mesh position={[0, -0.02, -(dims.d / 2 + 0.015)]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[dims.w - 0.06, 0.04, 0.04]} />
          <meshStandardMaterial color="#0a0a16" roughness={0.2} metalness={0.85} />
        </mesh>

        {/* Back chamfer */}
        <mesh position={[0, -0.02, dims.d / 2 + 0.012]} rotation={[-0.25, 0, 0]}>
          <boxGeometry args={[dims.w - 0.06, 0.035, 0.035]} />
          <meshStandardMaterial color="#0a0a16" roughness={0.2} metalness={0.85} />
        </mesh>

        {/* Case mounting screws — 6 screws recessed into the top case */}
        {[
          [-dims.w / 2 + 0.18, -dims.d / 2 + 0.12],
          [dims.w / 2 - 0.18,  -dims.d / 2 + 0.12],
          [-dims.w / 2 + 0.18,  dims.d / 2 - 0.12],
          [dims.w / 2 - 0.18,   dims.d / 2 - 0.12],
          [0, -dims.d / 2 + 0.12],
          [0,  dims.d / 2 - 0.12],
        ].map(([sx, sz], i) => (
          <group key={`screw-${i}`} position={[sx!, -0.001, sz!]}>
            {/* Screw recess */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.018, 16]} />
              <meshStandardMaterial color="#060610" roughness={0.6} metalness={0.7} />
            </mesh>
            {/* Screw head */}
            <mesh position={[0, -0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.013, 16]} />
              <meshStandardMaterial color="#1a1a2a" roughness={0.15} metalness={0.95} />
            </mesh>
            {/* Phillips cross — horizontal */}
            <mesh position={[0, 0.0001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.016, 0.003]} />
              <meshStandardMaterial color="#0a0a16" roughness={0.4} metalness={0.8} />
            </mesh>
            {/* Phillips cross — vertical */}
            <mesh position={[0, 0.0001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.003, 0.016]} />
              <meshStandardMaterial color="#0a0a16" roughness={0.4} metalness={0.8} />
            </mesh>
          </group>
        ))}

        {/* Rubber feet — cylindrical pads with grip texture */}
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
          <group key={`foot-${i}`} position={[(dims.w / 2 - 0.15) * sx!, -0.11, (dims.d / 2 - 0.1) * sz!]}>
            {/* Rubber pad */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.035, 0.038, 0.012, 16]} />
              <meshStandardMaterial color="#030308" roughness={0.98} metalness={0.0} />
            </mesh>
            {/* Anti-slip ring */}
            <mesh position={[0, -0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.025, 0.032, 16]} />
              <meshStandardMaterial color="#0a0a12" roughness={0.95} metalness={0.0} />
            </mesh>
          </group>
        ))}

        {/* Rear tilt feet — angled risers at back */}
        {[-1, 1].map((sx) => (
          <group key={`tilt-${sx}`} position={[(dims.w / 2 - 0.25) * sx, -0.10, dims.d / 2 - 0.06]}>
            <mesh rotation={[0.15, 0, 0]}>
              <boxGeometry args={[0.05, 0.022, 0.03]} />
              <meshStandardMaterial color="#080812" roughness={0.3} metalness={0.7} />
            </mesh>
            {/* Rubber tip */}
            <mesh position={[0, -0.01, 0.012]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.04, 0.008]} />
              <meshStandardMaterial color="#040408" roughness={0.95} />
            </mesh>
          </group>
        ))}

        {/* LED indicators — Caps / Scroll / Num Lock, top-right of case */}
        {[0, 1, 2].map((i) => (
          <group key={`led-${i}`} position={[dims.w / 2 - 0.22 - i * 0.11, 0.052, -dims.d / 2 + 0.07]}>
            {/* LED recess */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.02, 12]} />
              <meshStandardMaterial color="#060610" roughness={0.7} metalness={0.5} />
            </mesh>
            {/* LED dot */}
            <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.012, 12]} />
              <meshStandardMaterial
                color={i === 0 ? "#22ffaa" : "#334455"}
                emissive={i === 0 ? "#00ff88" : "#112233"}
                emissiveIntensity={i === 0 ? 0.7 : 0.05}
                roughness={0.3}
                toneMapped={false}
              />
            </mesh>
          </group>
        ))}

        {/* Accent strip — front edge, pulsing blue */}
        <mesh position={[0, 0.001, -(dims.d / 2 - 0.01)]}>
          <boxGeometry args={[dims.w - 0.1, 0.008, 0.015]} />
          <meshStandardMaterial
            ref={stripFrontRef}
            color="#3B82F6"
            emissive="#3B82F6"
            emissiveIntensity={0.45}
            toneMapped={false}
          />
        </mesh>

        {/* Accent strip — back edge, violet */}
        <mesh position={[0, 0.001, dims.d / 2 - 0.01]}>
          <boxGeometry args={[dims.w - 0.1, 0.008, 0.015]} />
          <meshStandardMaterial
            ref={stripBackRef}
            color="#8B5CF6"
            emissive="#8B5CF6"
            emissiveIntensity={0.3}
            toneMapped={false}
          />
        </mesh>

        {/* Side accent strips — cyan */}
        <mesh position={[-(dims.w / 2 - 0.01), 0.001, 0]}>
          <boxGeometry args={[0.012, 0.008, dims.d - 0.1]} />
          <meshStandardMaterial color="#06B6D4" emissive="#06B6D4" emissiveIntensity={0.25} toneMapped={false} />
        </mesh>
        <mesh position={[dims.w / 2 - 0.01, 0.001, 0]}>
          <boxGeometry args={[0.012, 0.008, dims.d - 0.1]} />
          <meshStandardMaterial color="#06B6D4" emissive="#06B6D4" emissiveIntensity={0.25} toneMapped={false} />
        </mesh>

        {/* USB-C port — back-center of case */}
        <group position={[0, 0.028, dims.d / 2 - 0.002]}>
          {/* Port housing — metal surround */}
          <mesh>
            <boxGeometry args={[0.075, 0.028, 0.018]} />
            <meshStandardMaterial color="#18182a" roughness={0.15} metalness={0.92} />
          </mesh>
          {/* Port cavity */}
          <mesh position={[0, 0, 0.003]}>
            <boxGeometry args={[0.058, 0.018, 0.012]} />
            <meshStandardMaterial color="#020208" roughness={0.8} metalness={0.3} />
          </mesh>
          {/* USB-C tongue/insert */}
          <mesh position={[0, -0.002, 0.004]}>
            <boxGeometry args={[0.048, 0.006, 0.008]} />
            <meshStandardMaterial color="#2a2a40" roughness={0.3} metalness={0.85} />
          </mesh>
          {/* Contact pins — gold plated */}
          {[-0.015, -0.005, 0.005, 0.015].map((xOff, pi) => (
            <mesh key={`pin-${pi}`} position={[xOff, 0.003, 0.005]}>
              <boxGeometry args={[0.004, 0.002, 0.006]} />
              <meshStandardMaterial color="#b8962e" roughness={0.2} metalness={0.95} />
            </mesh>
          ))}
        </group>

        {/* PCB — green circuit board visible through key gaps */}
        <mesh position={[0, 0.005, 0]}>
          <boxGeometry args={[dims.w - 0.1, 0.004, dims.d - 0.1]} />
          <meshStandardMaterial color="#0a2812" roughness={0.7} metalness={0.15} />
        </mesh>
        {/* PCB traces — subtle copper lines */}
        {[-0.6, -0.2, 0.2, 0.6].map((xOff, ti) => (
          <mesh key={`trace-${ti}`} position={[xOff, 0.0072, 0]}>
            <boxGeometry args={[0.003, 0.0005, dims.d - 0.2]} />
            <meshStandardMaterial color="#8b6914" roughness={0.3} metalness={0.85} />
          </mesh>
        ))}

        {/* Switch plate — brushed stainless steel */}
        <mesh position={[0, 0.012, 0]}>
          <boxGeometry args={[dims.w - 0.08, 0.012, dims.d - 0.08]} />
          <meshStandardMaterial color={plateMetal} roughness={0.28} metalness={0.92} />
        </mesh>

        {/* Keys */}
        {layout.map((kd) => {
          const rowH     = ROW_HEIGHTS[kd.row] ?? KEY_H;
          const rowAngle = ROW_ANGLES[kd.row]  ?? 0;
          const capW     = kd.w - 0.04;
          const capD     = kd.d - 0.04;
          const isMod    = MODIFIER_LABELS.has(kd.label);
          const isHoming = HOMING_LABELS.has(kd.label);
          const capColor = isMod ? keyMod : keyBase;

          // Font size: fit multi-char legends inside the key face
          const labelLen  = kd.label.length;
          const fontSize  = labelLen <= 1 ? 0.052
                          : labelLen === 2 ? 0.040
                          : labelLen === 3 ? 0.034
                          : 0.026;

          return (
            <group key={kd.id} position={[kd.x, 0, kd.z]}>
              {/* Switch housing — dark well beneath the keycap */}
              <mesh position={[0, rowH * 0.15, 0]}>
                <boxGeometry args={[kd.w - 0.012, rowH * 0.35, kd.d - 0.012]} />
                <meshStandardMaterial color={keyDark} roughness={0.95} metalness={0.1} />
              </mesh>

              {/* Cherry MX stem — cross-shaped, visible in the key gap */}
              <mesh position={[0, 0.018, 0]}>
                <boxGeometry args={[0.016, 0.014, 0.004]} />
                <meshStandardMaterial color="#cc3344" roughness={0.45} metalness={0.08} />
              </mesh>
              <mesh position={[0, 0.018, 0]}>
                <boxGeometry args={[0.004, 0.014, 0.016]} />
                <meshStandardMaterial color="#cc3344" roughness={0.45} metalness={0.08} />
              </mesh>
              {/* Switch housing top — visible surround */}
              <mesh position={[0, 0.013, 0]}>
                <boxGeometry args={[0.058, 0.004, 0.058]} />
                <meshStandardMaterial color="#0f0f1c" roughness={0.85} metalness={0.15} />
              </mesh>

              {/* Stabilizer wire — visible on keys wider than 1.4u */}
              {kd.w > 0.52 && (
                <>
                  {/* Horizontal bar */}
                  <mesh position={[0, 0.017, 0]}>
                    <boxGeometry args={[kd.w - 0.16, 0.009, 0.013]} />
                    <meshStandardMaterial color="#9898b4" roughness={0.22} metalness={0.94} />
                  </mesh>
                  {/* Left mounting peg */}
                  <mesh position={[-(kd.w / 2 - 0.10), 0.022, 0]}>
                    <boxGeometry args={[0.022, 0.018, 0.022]} />
                    <meshStandardMaterial color="#1e1e32" roughness={0.8} metalness={0.3} />
                  </mesh>
                  {/* Right mounting peg */}
                  <mesh position={[(kd.w / 2 - 0.10), 0.022, 0]}>
                    <boxGeometry args={[0.022, 0.018, 0.022]} />
                    <meshStandardMaterial color="#1e1e32" roughness={0.8} metalness={0.3} />
                  </mesh>
                  {/* Stabilizer slider housings */}
                  <mesh position={[-(kd.w / 2 - 0.10), 0.015, 0]}>
                    <boxGeometry args={[0.03, 0.01, 0.03]} />
                    <meshStandardMaterial color="#0f0f1c" roughness={0.85} metalness={0.15} />
                  </mesh>
                  <mesh position={[(kd.w / 2 - 0.10), 0.015, 0]}>
                    <boxGeometry args={[0.03, 0.01, 0.03]} />
                    <meshStandardMaterial color="#0f0f1c" roughness={0.85} metalness={0.15} />
                  </mesh>
                </>
              )}

              {/* Keycap + legend — Cherry-profile sculpted with tilt */}
              <group rotation={[rowAngle, 0, 0]}>
                {/* Keycap skirt — slightly wider base for tapered look */}
                <RoundedBox
                  args={[capW + 0.008, rowH * 0.3, capD + 0.008]}
                  radius={0.014}
                  smoothness={3}
                  position={[0, rowH * 0.15, 0]}
                >
                  <meshStandardMaterial
                    color={isMod ? "#1a1a2a" : "#161624"}
                    roughness={0.85}
                    metalness={0.03}
                  />
                </RoundedBox>

                {/* Main keycap body */}
                <RoundedBox
                  ref={(m: THREE.Mesh | null) => { if (m) capRefs.current.set(kd.id, m); }}
                  args={[capW, rowH, capD]}
                  radius={0.018}
                  smoothness={4}
                  position={[0, rowH / 2, 0]}
                >
                  <meshStandardMaterial
                    color={capColor}
                    roughness={0.82}
                    metalness={0.02}
                    emissive={accentBlue}
                    emissiveIntensity={0}
                  />
                </RoundedBox>

                {/* Keycap dish — concave top surface, slightly darker */}
                <RoundedBox
                  args={[capW - 0.035, 0.005, capD - 0.035]}
                  radius={0.008}
                  smoothness={3}
                  position={[0, rowH + 0.001, 0]}
                >
                  <meshStandardMaterial
                    color={isMod ? "#171726" : "#131320"}
                    roughness={0.94}
                    metalness={0.01}
                  />
                </RoundedBox>

                {/* Keycap edge bevel — chamfered rim around top */}
                <RoundedBox
                  args={[capW - 0.005, 0.003, capD - 0.005]}
                  radius={0.006}
                  smoothness={2}
                  position={[0, rowH - 0.001, 0]}
                >
                  <meshStandardMaterial
                    color="#222238"
                    roughness={0.5}
                    metalness={0.12}
                  />
                </RoundedBox>

                {/* Homing bump — raised bar on F and J keys */}
                {isHoming && (
                  <mesh position={[0, rowH + 0.004, capD * 0.22]}>
                    <boxGeometry args={[capW * 0.35, 0.003, 0.012]} />
                    <meshStandardMaterial
                      color={isMod ? "#1e1e30" : "#1a1a2c"}
                      roughness={0.75}
                      metalness={0.05}
                    />
                  </mesh>
                )}

                {/* Legend — printed character/label on keycap top face */}
                {kd.label && (
                  <Text
                    position={[capW > 0.5 ? -capW * 0.2 : 0, rowH + 0.006, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    fontSize={fontSize}
                    color={isMod ? "#505078" : "#606090"}
                    anchorX="center"
                    anchorY="middle"
                    renderOrder={1}
                  >
                    {kd.label}
                  </Text>
                )}
              </group>
            </group>
          );
        })}

        {/* Keypress particle bursts */}
        <points>
          <bufferGeometry ref={pGeo} />
          <pointsMaterial
            vertexColors
            size={0.05}
            transparent
            opacity={0.95}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </points>

        {/* Under-glow — subtle RGB accent */}
        <pointLight position={[0,    -0.12, 0]} color="#3B82F6" intensity={1.0} distance={2.5} />
        <pointLight position={[-1.5, -0.1,  0]} color="#ff3366" intensity={0.5} distance={1.8} />
        <pointLight position={[1.5,  -0.1,  0]} color="#8B5CF6" intensity={0.5} distance={1.8} />
      </group>
    </Float>
  );
}

// ═══════════════════════════════════════════════════════════
//  AMBIENT DUST — subtle floating motes
// ═══════════════════════════════════════════════════════════

function AmbientDust() {
  const count     = 60;
  const ref       = useRef<THREE.Points>(null);
  const positions = useMemo(() => buildAmbientDustPositions(count), [count]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    const t   = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += Math.sin(t * 0.3 + i) * 0.0008;
      arr[i * 3]     += Math.cos(t * 0.15 + i * 0.5) * 0.0004;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#8B5CF6"
        size={0.01}
        transparent
        opacity={0.18}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}


// ═══════════════════════════════════════════════════════════
//  REACTIVE LIGHT — follows mouse pointer
// ═══════════════════════════════════════════════════════════

function ReactiveLight() {
  const ref = useRef<THREE.PointLight>(null);
  useFrame(({ pointer }) => {
    if (!ref.current) return;
    ref.current.position.x += (pointer.x * 3  - ref.current.position.x) * 0.03;
    ref.current.position.z += (-pointer.y * 2 - ref.current.position.z) * 0.03;
  });
  return <pointLight ref={ref} color="#ffffff" intensity={0.5} distance={8} position={[0, 3, 2]} />;
}

// ═══════════════════════════════════════════════════════════
//  MAIN EXPORT
// ═══════════════════════════════════════════════════════════

export default function HeroScene() {
  return (
    <div className="absolute inset-0 z-[2] opacity-80">
      <Canvas
        camera={{ position: [0, 2.9, 4.3], fov: 38 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
      >
        {/* Lighting — studio setup for realistic material reads */}
        <ambientLight intensity={0.2} />
        {/* Key light — slightly warm, above-right */}
        <directionalLight position={[2, 4, 3]} intensity={0.9} color="#f0eeff" />
        {/* Fill light — cool, opposite side to reduce harsh shadows */}
        <directionalLight position={[-3, 2, -1]} intensity={0.25} color="#a8b8d0" />
        {/* Rim light — edge definition from behind */}
        <directionalLight position={[0, 1, -4]} intensity={0.35} color="#8890b0" />
        {/* Accent light — subtle violet from below-left */}
        <directionalLight position={[-2, -1, -2]} intensity={0.08} color="#8B5CF6" />
        <ReactiveLight />

        {/* Environment — IBL for physically accurate case reflections */}
        <Environment preset="city" background={false} />

        <Keyboard />
        <AmbientDust />

        <fog attach="fog" args={["#0A0A0F", 5, 12]} />
      </Canvas>
    </div>
  );
}
