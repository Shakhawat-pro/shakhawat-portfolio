"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { gsap } from "gsap";
import { onIntroDone, prefersReducedMotion } from "@/lib/intro";
import { profile } from "@/data/profile";
import { glowTexture, panelTexture, type PanelKind } from "./textures";

const PHOTO_H = 4.2;
const PHOTO_W = PHOTO_H * (1086 / 1448);
const PHOTO_Y = 0.25;
// eyes sit ~36% from the top of the photo
const EYE_Y = PHOTO_Y + (0.64 - 0.5) * PHOTO_H;

// shared animation state driven by GSAP, read inside useFrame
type Intro = { dolly: number; reveal: number };
type IntroRef = React.RefObject<Intro>;

const MOTE_COUNT = 360;
function makeMotes() {
  const a = new Float32Array(MOTE_COUNT * 3);
  for (let i = 0; i < MOTE_COUNT; i++) {
    a[i * 3] = (Math.random() - 0.5) * 10;
    a[i * 3 + 1] = Math.random() * 6 - 2;
    a[i * 3 + 2] = (Math.random() - 0.5) * 5;
  }
  return a;
}

const noiseGLSL = /* glsl */ `
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }
`;

function Hologram({ intro }: { intro: IntroRef }) {
  const tex = useTexture(profile.photo, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
  });
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { pointer } = useThree();

  const uniforms = useMemo(
    () => ({
      uTex: { value: tex },
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uMouse: { value: new THREE.Vector2() },
    }),
    [tex],
  );

  useFrame((_, dt) => {
    const u = mat.current!.uniforms;
    u.uTime.value += dt;
    u.uReveal.value = intro.current.reveal;
    u.uMouse.value.lerp(pointer, 0.05);
  });

  return (
    <mesh position={[0, PHOTO_Y, 0]}>
      <planeGeometry args={[PHOTO_W, PHOTO_H, 96, 128]} />
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          uniform vec2 uMouse;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec3 p = position;
            vec2 c = (uv - vec2(0.5, 0.62)) * vec2(1.7, 1.15);
            float face = 1.0 - smoothstep(0.0, 0.55, length(c));
            float body = (1.0 - smoothstep(0.0, 0.45, uv.y)) * (1.0 - smoothstep(0.0, 0.5, abs(uv.x - 0.5)));
            float d = face * 0.38 + body * 0.12;
            p.z += d;
            p.xy += uMouse * d * 0.12;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `}
        fragmentShader={/* glsl */ `
          uniform sampler2D uTex;
          uniform float uTime;
          uniform float uReveal;
          varying vec2 vUv;
          ${noiseGLSL}
          void main() {
            vec2 uv = vUv;
            float band = step(0.988, hash(vec2(floor(uv.y * 48.0), floor(uTime * 5.0))));
            uv.x += band * 0.012 * sin(uTime * 60.0);
            float ab = 0.002 + band * 0.008;
            vec3 col;
            col.r = texture2D(uTex, uv + vec2(ab, 0.0)).r;
            col.g = texture2D(uTex, uv).g;
            col.b = texture2D(uTex, uv - vec2(ab, 0.0)).b;

            vec2 m = (uv - vec2(0.5, 0.5)) * vec2(1.2, 0.86);
            float r = length(m);
            float mask = 1.0 - smoothstep(0.3, 0.5, r);
            mask *= smoothstep(0.0, 0.16, uv.y);

            float lum = dot(col, vec3(0.299, 0.587, 0.114));
            vec3 tint = mix(vec3(0.16, 0.1, 0.5), vec3(0.45, 0.9,1.0), lum);
            col = mix(col, col * 0.8 + tint * 0.35, 0.3);
            col *= 0.92 + 0.08 * sin(uv.y * 900.0 - uTime * 8.0);

            float edge = smoothstep(0.22, 0.48, r) * mask;
            col += vec3(0.45, 0.35, 1.0) * edge * 0.7;

            float n = fbm(uv * 7.0 + vec2(0.0, uTime * 0.15));
            float vis = 1.0 - smoothstep(uReveal - 0.1, uReveal, n);
            float burn = smoothstep(uReveal - 0.1, uReveal, n) * (1.0 - smoothstep(uReveal, uReveal + 0.05, n));
            col += vec3(0.4, 0.9, 1.0) * burn * 2.2;

            float alpha = mask * clamp(vis + burn, 0.0, 1.0);
            alpha *= 0.94 + 0.06 * sin(uTime * 2.5);
            gl_FragColor = vec4(col, alpha);
          }
        `}
      />
    </mesh>
  );
}

function LightningFloor() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame((_, dt) => {
    mat.current!.uniforms.uTime.value += dt;
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.95, 0.5]}>
      <planeGeometry args={[16, 7]} />
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `}
        fragmentShader={/* glsl */ `
          uniform float uTime;
          varying vec2 vUv;
          ${noiseGLSL}
          void main() {
            vec2 uv = vUv;
            vec3 col = vec3(0.0);
            for (int i = 0; i < 3; i++) {
              float fi = float(i);
              float seed = floor(uTime * 7.0 + fi * 13.7);
              float on = step(0.35, hash(vec2(seed, fi)));
              float path = 0.5 + (fbm(vec2(uv.x * 5.0, seed * 0.37 + fi)) - 0.5) * 0.7;
              float d = abs(uv.y - path);
              float core = 0.0016 / max(d, 0.0008);
              float halo = 0.012 / max(d, 0.004);
              col += (vec3(0.85, 0.8, 1.0) * core + vec3(0.5, 0.25, 1.0) * halo * 0.25) * on;
            }
            // subtle glowing grid
            vec2 g = abs(fract(uv * vec2(32.0, 14.0)) - 0.5);
            float grid = smoothstep(0.48, 0.5, max(g.x, g.y));
            col += vec3(0.3, 0.25, 0.9) * grid * 0.12;
            float fade = smoothstep(0.0, 0.3, uv.y) * smoothstep(1.0, 0.6, uv.y)
                       * (1.0 - smoothstep(0.15, 0.5, abs(uv.x - 0.5)));
            gl_FragColor = vec4(col * fade, 1.0);
          }
        `}
      />
    </mesh>
  );
}

type PanelCfg = { kind: PanelKind; pos: [number, number, number]; rotY: number; scale: number };

function Panels({ compact }: { compact: boolean }) {
  const cfg: PanelCfg[] = useMemo(() => {
    const all: PanelCfg[] = [
      { kind: "code", pos: [-3.1, 1.3, -1.0], rotY: 0.4, scale: 1.25 },
      { kind: "bars", pos: [-3.3, -0.55, -0.6], rotY: 0.45, scale: 1.05 },
      { kind: "terminal", pos: [-2.0, 2.65, -2.4], rotY: 0.25, scale: 0.95 },
      { kind: "api", pos: [3.0, 1.35, -0.9], rotY: -0.4, scale: 1.2 },
      { kind: "stats", pos: [3.25, -0.5, -0.5], rotY: -0.45, scale: 1.0 },
      { kind: "line", pos: [2.1, 2.7, -2.5], rotY: -0.25, scale: 0.95 },
    ];
    return compact ? all.filter((p) => p.kind !== "terminal" && p.kind !== "line") : all;
  }, [compact]);

  const textures = useMemo(() => cfg.map((c) => panelTexture(c.kind)), [cfg]);
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      m.position.y = cfg[i].pos[1] + Math.sin(t * 0.7 + i * 1.3) * 0.08;
      (m.material as THREE.MeshBasicMaterial).opacity = 0.78 + Math.sin(t * 3 + i) * 0.06;
    });
  });

  return (
    <>
      {cfg.map((c, i) => (
        <mesh
          key={c.kind}
          ref={(el) => {
            refs.current[i] = el;
          }}
          position={c.pos}
          rotation={[0, c.rotY, 0]}
          scale={c.scale}
        >
          <planeGeometry args={[1.6, 1.0]} />
          <meshBasicMaterial
            map={textures[i]}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </>
  );
}

function Environment({ compact }: { compact: boolean }) {
  const violetGlow = useMemo(() => glowTexture("rgba(124,58,237,0.9)", "rgba(124,58,237,0)"), []);
  const cyanGlow = useMemo(() => glowTexture("rgba(103,232,249,0.9)", "rgba(103,232,249,0)"), []);
  const ring = useRef<THREE.Mesh>(null);
  const motes = useRef<THREE.Points>(null);

  const moteCount = MOTE_COUNT;
  const [motePos] = useState(makeMotes);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    if (ring.current) {
      ring.current.rotation.z = t * 0.25;
      (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.7 + Math.sin(t * 2) * 0.15;
    }
    const attr = motes.current?.geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
    if (attr) {
      const arr = attr.array as Float32Array;
      for (let i = 0; i < moteCount; i++) {
        arr[i * 3 + 1] += dt * (0.12 + (i % 7) * 0.03);
        if (arr[i * 3 + 1] > 4) arr[i * 3 + 1] = -2;
      }
      attr.needsUpdate = true;
    }
  });

  return (
    <>
      {/* halo behind the subject */}
      <sprite position={[0, 0.9, -1.2]} scale={[7, 7, 1]}>
        <spriteMaterial map={violetGlow} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.55} />
      </sprite>
      {/* overhead ring light */}
      <group position={[0, 2.55, -0.6]} rotation={[Math.PI / 2.3, 0, 0]} visible={!compact}>
        <mesh ref={ring}>
          <torusGeometry args={[0.95, 0.014, 8, 120]} />
          <meshBasicMaterial color="#9ad8ff" transparent />
        </mesh>
        <sprite scale={[3.6, 3.6, 1]}>
          <spriteMaterial map={cyanGlow} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.25} />
        </sprite>
      </group>
      {/* neon pillars */}
      {[-4.4, 4.4].map((x) => (
        <group key={x} position={[x, 0.6, -3.2]}>
          <mesh>
            <boxGeometry args={[0.05, 5.4, 0.05]} />
            <meshBasicMaterial color="#c4b5fd" />
          </mesh>
          <sprite scale={[1.4, 6.5, 1]}>
            <spriteMaterial map={violetGlow} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.8} />
          </sprite>
        </group>
      ))}
      <points ref={motes}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[motePos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          map={cyanGlow}
          color="#a5f3fc"
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}

function Rig({ intro, offsetX, compact }: { intro: IntroRef; offsetX: number; compact: boolean }) {
  const { camera, pointer } = useThree();
  const smooth = useRef(new THREE.Vector2());
  const from = useMemo(() => new THREE.Vector3(), []);
  const to = useMemo(() => new THREE.Vector3(), []);
  const lookFrom = useMemo(() => new THREE.Vector3(), []);
  const lookTo = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    smooth.current.lerp(pointer, 0.04);
    const s = Math.min(window.scrollY / window.innerHeight, 1.2);
    const p = intro.current.dolly;
    const endZ = compact ? 11 : 8.2;

    from.set(offsetX, EYE_Y + 0.02, 1.15);
    to.set(smooth.current.x * 0.6, 0.45 + smooth.current.y * 0.35 + s * 0.6, endZ + s * 2.5);
    camera.position.lerpVectors(from, to, p);

    lookFrom.set(offsetX, EYE_Y, 0);
    lookTo.set(offsetX * 0.4, 0.25 + s * 0.2, 0);
    look.lerpVectors(lookFrom, lookTo, p);
    camera.lookAt(look);
  });
  return null;
}

function Scene({ compact }: { compact: boolean }) {
  const intro = useRef<Intro>({ dolly: 0, reveal: 0 });
  const offsetX = compact ? 0 : 1.7;

  useEffect(() => {
    const state = intro.current;
    if (prefersReducedMotion()) {
      state.dolly = 1;
      state.reveal = 1.2;
      return;
    }
    let tl: gsap.core.Timeline | undefined;
    const off = onIntroDone(() => {
      tl = gsap
        .timeline()
        .to(state, { reveal: 1.2, duration: 1.6, ease: "power2.out" })
        .to(state, { dolly: 1, duration: 3.4, ease: "power3.inOut" }, 0.7);
    });
    return () => {
      off();
      tl?.kill();
    };
  }, [intro]);

  return (
    <>
      <Rig intro={intro} offsetX={offsetX} compact={compact} />
      <group position={[offsetX, compact ? 0.7 : 0, 0]}>
        <Environment compact={compact} />
        <Panels compact={compact} />
        <Suspense fallback={null}>
          <Hologram intro={intro} />
        </Suspense>
        <LightningFloor />
      </group>
    </>
  );
}

export default function HeroScene() {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener("change", update);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(wrap.current!);
    return () => {
      mq.removeEventListener("change", update);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, 1.5]}
        camera={{ fov: 38, position: [1.7, EYE_Y, 1.15], near: 0.05, far: 60 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Scene compact={compact} />
      </Canvas>
    </div>
  );
}
