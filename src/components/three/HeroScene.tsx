"use client";

/**
 * HeroScene — the WebGL "hologram command room" behind the hero copy.
 *
 * Scene graph (all inside a group shifted right on desktop so the name has room):
 *   Hologram        the portrait on a displaced plane with a hologram shader
 *   Panels          floating HUD screens (code, API, charts…) drawn to canvases
 *   Environment     halo, overhead ring light, edge data columns, rising motes
 *   LightningFloor  animated lightning + grid on the floor plane
 *   Rig             camera: starts on the eyes, dollies out after the preloader,
 *                   then follows the pointer and drifts back with scroll
 *
 * Rendering pauses whenever the hero is off screen.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { onIntroDone } from "@/lib/intro";
import { MOBILE_QUERY, prefersReducedMotion, useMediaQuery } from "@/lib/motion";
import { glowTexture, panelTexture, type PanelKind } from "./textures";

// 900px WebP made from the portrait (~90 KB vs the 2.2 MB original) — plenty for the hologram
const PHOTO_TEXTURE = "/textures/hologram.webp";
const PHOTO_H = 4.2;
const PHOTO_W = PHOTO_H * (3 / 4);
const PHOTO_Y = 0.25;
// eyes sit ~36% from the top of the photo
const EYE_Y = PHOTO_Y + (0.64 - 0.5) * PHOTO_H;

// shared animation state driven by GSAP, read inside useFrame
type Intro = { dolly: number; reveal: number };
type IntroRef = React.RefObject<Intro>;

/** Disposes GPU textures that were created by hand (canvas textures) on unmount. */
function useDisposeOnUnmount(textures: THREE.Texture[]) {
  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures]);
}

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

// ---------------------------------------------------------------------------
// Hologram: the portrait. The vertex shader pushes the face/torso forward for
// depth and parallax; the fragment shader adds chromatic glitch bands,
// scanlines, an oval fade-out mask, a violet rim and a noise "burn-in" reveal.
// ---------------------------------------------------------------------------
function usePhotoTexture() {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let alive = true;
    let loaded: THREE.Texture | null = null;
    new THREE.TextureLoader().load(PHOTO_TEXTURE, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      loaded = t;
      if (alive) setTex(t);
      else t.dispose();
    });
    return () => {
      alive = false;
      loaded?.dispose();
    };
  }, []);
  return tex;
}

function Hologram({ intro }: { intro: IntroRef }) {
  const tex = usePhotoTexture();
  return tex ? <HologramMesh tex={tex} intro={intro} /> : null;
}

function HologramMesh({ tex, intro }: { tex: THREE.Texture; intro: IntroRef }) {
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

// ---------------------------------------------------------------------------
// LightningFloor: three flickering fbm lightning bolts plus a faint grid,
// faded out toward the plane's edges.
// ---------------------------------------------------------------------------
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
            col *= fade;
            float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
            gl_FragColor = vec4(col / max(a, 1e-4), a);
          }
        `}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Panels: floating HUD screens around the subject. Each texture is drawn once
// to a canvas (see textures.ts); panels bob and flicker slightly.
// ---------------------------------------------------------------------------
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
  useDisposeOnUnmount(textures);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  // on narrower screens pull the panels inward so they stay clear of the edge columns
  const aspect = useThree((s) => s.size.width / s.size.height);
  const spread = compact ? 1 : THREE.MathUtils.clamp(aspect / 1.9, 0.78, 1);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      m.position.x = cfg[i].pos[0] * spread;
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

// ---------------------------------------------------------------------------
// DataColumn: a segmented neon column with pulses of light streaming upward,
// fading out at both ends — like data flowing through a cable.
// Each column is pinned to a screen edge (`side` = -1 left, 1 right) every
// frame, so it always frames the scene and never crosses the HUD panels.
// ---------------------------------------------------------------------------
const COLUMN_NDC_X = 0.94;
const COLUMN_Z = -3.2;

function DataColumn({ side, seed }: { side: -1 | 1; seed: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uSeed: { value: seed } }), [seed]);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera }, dt) => {
    mat.current!.uniforms.uTime.value += dt;
    const m = mesh.current!;
    // cast a ray through the screen-edge point and meet the column's depth plane
    dir.set(side * COLUMN_NDC_X, 0, 0.5).unproject(camera).sub(camera.position).normalize();
    const t = (COLUMN_Z - camera.position.z) / dir.z;
    hit.copy(camera.position).addScaledVector(dir, t);
    m.parent!.worldToLocal(hit);
    m.position.set(hit.x, 0.6, COLUMN_Z);
  });

  return (
    <mesh ref={mesh} position={[side * 4.4, 0.6, COLUMN_Z]}>
      <planeGeometry args={[1.2, 5.6]} />
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
          uniform float uSeed;
          varying vec2 vUv;
          void main() {
            float dx = abs(vUv.x - 0.5) * 1.2;   // distance from the center line, in world units
            float y = vUv.y;

            // segmented core: short dashes with small gaps
            float seg = step(0.22, fract(y * 34.0));
            float core = (1.0 - smoothstep(0.008, 0.02, dx)) * seg;

            // pulses travelling upward at different speeds
            float pulse = 0.0;
            for (int i = 0; i < 3; i++) {
              float fi = float(i);
              float p = fract(uTime * (0.16 + fi * 0.05) + uSeed + fi * 0.37);
              float d = y - p;
              pulse += exp(-d * d / 0.0009) + 0.35 * exp(-d * d / 0.012) * step(d, 0.0);
            }

            float halo = exp(-dx * 9.0) * (0.12 + pulse * 0.55);
            float spark = (1.0 - smoothstep(0.0, 0.06, dx)) * pulse;

            float fade = smoothstep(0.0, 0.18, y) * smoothstep(1.0, 0.78, y);
            vec3 violet = vec3(0.55, 0.38, 1.0);
            vec3 cyan = vec3(0.45, 0.92, 1.0);
            vec3 col = (violet * (core * 0.9 + halo) + mix(violet, cyan, 0.7) * spark * 1.6) * fade;
            // alpha follows brightness so dark pixels stay see-through on the transparent canvas
            float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
            gl_FragColor = vec4(col / max(a, 1e-4), a);
          }
        `}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Environment: ambient set dressing around the subject.
// ---------------------------------------------------------------------------
function Environment({ compact }: { compact: boolean }) {
  const violetGlow = useMemo(() => glowTexture("rgba(124,58,237,0.9)", "rgba(124,58,237,0)"), []);
  const cyanGlow = useMemo(() => glowTexture("rgba(103,232,249,0.9)", "rgba(103,232,249,0)"), []);
  useDisposeOnUnmount(useMemo(() => [violetGlow, cyanGlow], [violetGlow, cyanGlow]));
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
      {/* energy data columns */}
      <DataColumn side={-1} seed={0} />
      <DataColumn side={1} seed={0.5} />
      {/* dust motes rising through the room */}
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

// ---------------------------------------------------------------------------
// Rig: camera choreography. `intro.dolly` (0 → 1) blends from the eye close-up
// to the wide shot; pointer adds parallax and scroll pulls the camera back.
// ---------------------------------------------------------------------------
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

  // after the preloader: burn the hologram in, then pull the camera back
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
        <Hologram intro={intro} />
        <LightningFloor />
      </group>
    </>
  );
}

export default function HeroScene() {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const compact = useMediaQuery(MOBILE_QUERY);

  // stop the render loop entirely while the hero is scrolled out of view
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(wrap.current!);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0" aria-hidden>
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
