"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { markIntroDone } from "@/lib/intro";

/**
 * Full-screen 00 → 100 counter shown on first load (page scroll is locked).
 * When it finishes it fires the intro signal, which starts the hero's camera
 * move and copy animation, then wipes upward and unmounts.
 */
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    const state = { v: 0 };
    const tl = gsap.timeline();
    tl.to(state, {
      v: 100,
      duration: 2.4,
      ease: "power2.inOut",
      onUpdate: () => setCount(Math.round(state.v)),
    })
      .to(".pre-num", { yPercent: -110, opacity: 0, duration: 0.6, ease: "power3.in" }, "+=0.15")
      .to(".pre-bar", { scaleX: 0, transformOrigin: "right", duration: 0.5, ease: "power3.in" }, "<")
      .add(() => {
        document.documentElement.style.overflow = "";
        markIntroDone();
      })
      .to(root.current, { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "expo.inOut" })
      .add(() => setGone(true));

    return () => {
      tl.kill();
      document.documentElement.style.overflow = "";
    };
  }, []);

  if (gone) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#030308]"
      style={{ clipPath: "inset(0 0 0% 0)" }}
      aria-hidden
    >
      <div className="overflow-hidden">
        <div className="pre-num font-display glow-white text-[22vw] leading-none tabular-nums md:text-[11rem]">
          {String(count).padStart(2, "0")}
        </div>
      </div>
      <div className="mt-6 h-px w-48 bg-white/10">
        <div
          className="pre-bar h-full bg-gradient-to-r from-violet to-cyan"
          style={{ width: `${count}%`, boxShadow: "0 0 12px var(--cyan)" }}
        />
      </div>
      <p className="label mt-5">Initializing experience</p>
    </div>
  );
}
