"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

const CYAN_STAR = "rgb(160,235,255)";
const VIOLET_STAR = "rgb(170,160,255)";

/**
 * Starfield — fixed 2D-canvas backdrop behind every section. Stars twinkle,
 * drift with scroll at depth-based speeds (parallax) and are nudged away from
 * the cursor. Deliberately plain canvas, not WebGL, so it costs ~nothing.
 */
export default function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = prefersReducedMotion();
    let w = 0;
    let h = 0;
    type Star = { x: number; y: number; z: number; tw: number; ox: number; oy: number; color: string };
    let stars: Star[] = [];
    const mouse = { x: -9999, y: -9999 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      const widthChanged = window.innerWidth !== w;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // mobile URL bars resize the height constantly — only reseed on a width change
      if (!widthChanged && stars.length) return;
      const count = Math.round((w * h) / (w < 768 ? 9000 : 5200));
      stars = Array.from({ length: count }, () => {
        const z = Math.random() * 0.9 + 0.1; // depth: bigger, brighter, faster when near
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          z,
          tw: Math.random() * Math.PI * 2,
          ox: 0,
          oy: 0,
          color: z > 0.75 ? CYAN_STAR : VIOLET_STAR,
        };
      });
    };
    resize();

    let raf = 0;
    let last = window.scrollY;
    const draw = (t: number) => {
      const sy = window.scrollY;
      const dy = sy - last;
      last = sy;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        // scroll parallax + slow downward drift, wrapping top/bottom
        s.y -= dy * s.z * 0.25;
        s.y += s.z * 0.06;
        if (s.y < -4) s.y += h + 8;
        if (s.y > h + 4) s.y -= h + 8;

        // ease away from the cursor, ease back when it leaves
        const mx = s.x - mouse.x;
        const my = s.y - mouse.y;
        const d2 = mx * mx + my * my;
        if (d2 < 14000) {
          const f = (1 - d2 / 14000) * 18 * s.z;
          const d = Math.sqrt(d2) || 1;
          s.ox += ((mx / d) * f - s.ox) * 0.12;
          s.oy += ((my / d) * f - s.oy) * 0.12;
        } else {
          s.ox *= 0.94;
          s.oy *= 0.94;
        }

        ctx.globalAlpha = 0.25 + 0.55 * s.z * (0.6 + 0.4 * Math.sin(t * 0.002 + s.tw));
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x + s.ox, s.y + s.oy, s.z * 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <>
      {/* base nebula gradient under the stars */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-20"
        style={{
          background:
            "radial-gradient(80% 60% at 70% 0%, rgba(76,51,200,0.22), transparent 60%), radial-gradient(60% 50% at 0% 100%, rgba(34,211,238,0.08), transparent 60%), #05060f",
        }}
      />
      <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
    </>
  );
}
