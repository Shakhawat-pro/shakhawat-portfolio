"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    document.documentElement.classList.add("has-cursor");
    const r = ring.current!;
    const d = dot.current!;
    gsap.set([r, d], { xPercent: -50, yPercent: -50, opacity: 1 });

    const rx = gsap.quickTo(r, "x", { duration: 0.45, ease: "power3" });
    const ry = gsap.quickTo(r, "y", { duration: 0.45, ease: "power3" });
    const dx = gsap.quickTo(d, "x", { duration: 0.1 });
    const dy = gsap.quickTo(d, "y", { duration: 0.1 });

    const move = (e: PointerEvent) => {
      rx(e.clientX);
      ry(e.clientY);
      dx(e.clientX);
      dy(e.clientY);
    };
    const over = (e: PointerEvent) => {
      const hit = (e.target as HTMLElement).closest("a, button, [data-cursor], input, textarea");
      gsap.to(r, {
        scale: hit ? 1.9 : 1,
        borderColor: hit ? "rgba(103,232,249,0.9)" : "rgba(238,240,255,0.5)",
        duration: 0.35,
      });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerover", over);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  return (
    <>
      <div
        ref={ring}
        className="pointer-events-none fixed left-0 top-0 z-[90] h-9 w-9 rounded-full border opacity-0 mix-blend-difference"
        style={{ borderColor: "rgba(238,240,255,0.5)" }}
      />
      <div
        ref={dot}
        className="pointer-events-none fixed left-0 top-0 z-[90] h-1.5 w-1.5 rounded-full bg-cyan opacity-0"
        style={{ boxShadow: "0 0 10px var(--cyan)" }}
      />
    </>
  );
}
