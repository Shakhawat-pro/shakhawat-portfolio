"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { profile } from "@/data/profile";
import { useReveal } from "@/lib/useReveal";
import SectionLabel from "@/components/SectionLabel";

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const el = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const state = { v: 0 };
    const tw = gsap.to(state, {
      v: value,
      duration: 2,
      ease: "power2.out",
      scrollTrigger: { trigger: el.current, start: "top 90%" },
      onUpdate: () => {
        if (el.current) el.current.textContent = Math.round(state.v) + suffix;
      },
    });
    return () => {
      tw.scrollTrigger?.kill();
      tw.kill();
    };
  }, [value, suffix]);
  return <span ref={el}>0{suffix}</span>;
}

function Portrait() {
  const card = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent) => {
    const r = card.current!.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(card.current, { rotateY: x * 16, rotateX: -y * 16, duration: 0.6, ease: "power3.out" });
    card.current!.style.setProperty("--gx", `${(x + 0.5) * 100}%`);
    card.current!.style.setProperty("--gy", `${(y + 0.5) * 100}%`);
  };
  const onLeave = () => gsap.to(card.current, { rotateY: 0, rotateX: 0, duration: 1, ease: "elastic.out(1,0.5)" });

  return (
    <div data-reveal className="relative mx-auto aspect-square w-full max-w-[460px] [perspective:1000px]">
      {/* rotating diamond frames */}
      <div className="absolute inset-[8%] rotate-45 rounded-3xl border border-violet/40 bg-gradient-to-br from-violet/25 to-transparent shadow-[0_0_80px_rgba(139,92,246,0.35)]" />
      <div className="spin-slow absolute inset-[2%] rounded-[2rem] border border-dashed border-cyan/25" />
      <div
        ref={card}
        data-cursor
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="absolute inset-[16%] overflow-hidden rounded-2xl border border-cyan/40 shadow-[0_0_50px_rgba(103,232,249,0.25)] [transform-style:preserve-3d]"
      >
        <Image
          src={profile.photo}
          alt={profile.fullName}
          fill
          sizes="(max-width: 768px) 70vw, 340px"
          className="object-cover object-[50%_25%]"
        />
        <div
          className="pointer-events-none absolute inset-0 mix-blend-overlay"
          style={{
            background:
              "radial-gradient(circle at var(--gx,50%) var(--gy,30%), rgba(255,255,255,0.35), transparent 45%)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.12)_0_1px,transparent_1px_3px)]" />
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-lg bg-[#05060f]/70 px-3 py-2 backdrop-blur">
          <span className="label !text-[0.6rem] !text-ink">{profile.firstName}.exe</span>
          <span className="flex items-center gap-1.5 font-mono text-[0.6rem] text-cyan">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4ade80]" /> online
          </span>
        </div>
      </div>
      {/* HUD annotations */}
      <span className="label absolute left-0 top-[18%] hidden md:block">[ fullstack ]</span>
      <span className="label absolute bottom-[12%] right-0 hidden md:block">dhaka · bd ◎</span>
    </div>
  );
}

export default function About() {
  const root = useRef<HTMLElement>(null);
  useReveal(root);

  return (
    <section id="about" ref={root} className="relative mx-auto max-w-7xl px-5 py-28 md:px-10 md:py-40">
      <div className="grid items-center gap-16 md:grid-cols-[1.1fr_1fr]">
        <div>
          <SectionLabel index="01">About me</SectionLabel>
          <h2 className="font-display text-5xl leading-[1.02] md:text-7xl">
            <span data-reveal="line" className="block overflow-hidden pb-1">
              <span className="glow-white block">Building at the</span>
            </span>
            <span data-reveal="line" className="block overflow-hidden pb-1">
              <span className="block italic text-ink/90">intersection of</span>
            </span>
            <span data-reveal="line" className="block overflow-hidden pb-2">
              <span className="block">
                code &amp; <span className="glow-cyan italic">craft.</span>
              </span>
            </span>
          </h2>
          <div className="mt-8 max-w-xl space-y-4 text-muted md:text-lg">
            {profile.about.map((p) => (
              <p data-reveal key={p.slice(0, 20)} className="leading-relaxed">
                {p}
              </p>
            ))}
          </div>
          <dl data-reveal className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {profile.stats.map((s) => (
              <div key={s.label} className="border-l border-line pl-4">
                <dt className="font-display text-4xl text-ink">
                  <Counter value={s.value} suffix={s.suffix} />
                </dt>
                <dd className="label mt-2 !text-[0.6rem]">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <Portrait />
      </div>
    </section>
  );
}
