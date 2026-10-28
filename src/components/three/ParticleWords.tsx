"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type Props = { words: string[]; index: number };

// Thousands of glowing points that spring into the shape of a word and
// explode / reform whenever `index` changes. Points dodge the cursor.
export default function ParticleWords({ words, index }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const setIndex = useRef<(i: number) => void>(() => {});

  useEffect(() => {
    const el = host.current!;
    const mobile = window.innerWidth < 768;
    const N = mobile ? 5000 : 10000;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.z = 10;

    const pos = new Float32Array(N * 3);
    const vel = new Float32Array(N * 3);
    const rand = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
      rand[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: (mobile ? 34 : 44) * Math.min(window.devicePixelRatio, 1.5) },
      },
      vertexShader: /* glsl */ `
        attribute float aRand;
        uniform float uTime;
        uniform float uSize;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          float tw = 0.8 + 0.2 * sin(uTime * 2.0 + aRand * 40.0);
          gl_PointSize = uSize * (0.6 + aRand * 0.4) * tw / -mv.z;
          vec3 violet = vec3(0.55, 0.42, 1.0);
          vec3 cyan = vec3(0.45, 0.92, 1.0);
          vec3 white = vec3(0.95, 0.95, 1.0);
          vColor = mix(mix(violet, cyan, smoothstep(-4.0, 4.0, position.x + aRand * 2.0)), white, step(0.9, aRand));
          vAlpha = 0.75 + 0.25 * aRand;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(vColor, a * vAlpha);
        }
      `,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    let viewW = 10;
    let viewH = 6;
    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      viewH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(20));
      viewW = viewH * camera.aspect;
      // nudge the word slightly above center: the orbit ring is drawn around it
      points.position.y = 0;
    };
    resize();

    // sample each word into N target points (heavy sans so strokes stay readable as dots)
    const fontFamily =
      getComputedStyle(document.documentElement).getPropertyValue("--font-sans-ui").trim() || "system-ui, sans-serif";
    const font = (px: number) => `900 ${px}px ${fontFamily}`;
    const targets: Float32Array[] = words.map((word) => {
      const cw = 1400;
      const ch = 420;
      const c = document.createElement("canvas");
      c.width = cw;
      c.height = ch;
      const g = c.getContext("2d", { willReadFrequently: true })!;
      let size = 320;
      g.letterSpacing = "0.08em";
      g.font = font(size);
      const mw = g.measureText(word).width;
      size = Math.min(size, (size * cw * 0.94) / mw);
      g.font = font(size);
      g.fillStyle = "#fff";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(word, cw / 2, ch / 2);
      const data = g.getImageData(0, 0, cw, ch).data;
      const pts: number[] = [];
      const step = 2;
      for (let y = 0; y < ch; y += step)
        for (let x = 0; x < cw; x += step) if (data[(y * cw + x) * 4 + 3] > 128) pts.push(x, y);

      const fit = Math.min((viewW * (mobile ? 0.58 : 0.5)) / cw, (viewH * 0.3) / ch);
      const out = new Float32Array(N * 3);
      const count = pts.length / 2;
      for (let i = 0; i < N; i++) {
        const k = Math.floor(Math.random() * count);
        out[i * 3] = (pts[k * 2] - cw / 2 + (Math.random() - 0.5) * step * 0.5) * fit;
        out[i * 3 + 1] = -(pts[k * 2 + 1] - ch / 2 + (Math.random() - 0.5) * step * 0.5) * fit;
        out[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
      }
      return out;
    });

    let current = -1;
    let target: Float32Array | null = null;
    setIndex.current = (i: number) => {
      if (i === current) return;
      current = i;
      target = targets[i] ?? null;
      for (let j = 0; j < N; j++) {
        vel[j * 3] += (Math.random() - 0.5) * 0.9;
        vel[j * 3 + 1] += (Math.random() - 0.5) * 0.9;
        vel[j * 3 + 2] += (Math.random() - 0.2) * 1.2;
      }
    };

    const mouse = new THREE.Vector2(9999, 9999);
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = -((e.clientY - r.top) / r.height) * 2 + 1;
      if (Math.abs(nx) > 1 || Math.abs(ny) > 1) return mouse.set(9999, 9999);
      mouse.set((nx * viewW) / 2, (ny * viewH) / 2 - points.position.y);
    };
    const onLeave = () => mouse.set(9999, 9999);
    window.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);

    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);

    const clock = new THREE.Clock();
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      mat.uniforms.uTime.value = t;
      const k = reduce ? 0.2 : 0.035;
      const damp = reduce ? 0.5 : 0.86;
      for (let i = 0; i < N; i++) {
        const ix = i * 3;
        let tx: number, ty: number, tz: number;
        if (target) {
          tx = target[ix] + Math.sin(t * 0.8 + rand[i] * 20) * 0.01;
          ty = target[ix + 1] + Math.cos(t * 0.7 + rand[i] * 20) * 0.01;
          tz = target[ix + 2];
        } else {
          tx = pos[ix] + Math.sin(t * 0.3 + i) * 0.002;
          ty = pos[ix + 1] + Math.cos(t * 0.3 + i) * 0.002;
          tz = pos[ix + 2];
        }
        vel[ix] += (tx - pos[ix]) * k;
        vel[ix + 1] += (ty - pos[ix + 1]) * k;
        vel[ix + 2] += (tz - pos[ix + 2]) * k;

        const dx = pos[ix] - mouse.x;
        const dy = pos[ix + 1] - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 1.2) {
          const f = (1.2 - d2) * 0.06;
          vel[ix] += dx * f;
          vel[ix + 1] += dy * f;
          vel[ix + 2] += f * 0.8;
        }
        vel[ix] *= damp;
        vel[ix + 1] *= damp;
        vel[ix + 2] *= damp;
        pos[ix] += vel[ix] * dt * 60 * 0.5;
        pos[ix + 1] += vel[ix + 1] * dt * 60 * 0.5;
        pos[ix + 2] += vel[ix + 2] * dt * 60 * 0.5;
      }
      geo.attributes.position.needsUpdate = true;
      points.rotation.y += ((mouse.x < 999 ? (mouse.x / viewW) * 0.15 : 0) - points.rotation.y) * 0.04;
      points.rotation.x += ((mouse.y < 999 ? (-mouse.y / viewH) * 0.1 : 0) - points.rotation.x) * 0.04;
      renderer.render(scene, camera);
    };
    tick();

    const ro = new ResizeObserver(resize);
    ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, [words]);

  useEffect(() => {
    setIndex.current(index);
  }, [index]);

  return <div ref={host} className="absolute inset-0" />;
}
