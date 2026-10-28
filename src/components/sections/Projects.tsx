"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { projects, type Project } from "@/data/profile";
import { useReveal } from "@/lib/useReveal";
import SectionLabel from "@/components/SectionLabel";

function Art({ p }: { p: Project }) {
  const [a, b] = p.hue;
  return (
    <div
      className="relative h-48 overflow-hidden rounded-t-2xl"
      style={{ background: `radial-gradient(120% 90% at 30% 10%, ${a}, transparent 60%), radial-gradient(100% 90% at 90% 100%, ${b}, #0b0b1e 70%)` }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:22px_22px]" />
      <svg viewBox="0 0 300 160" className="absolute inset-0 h-full w-full" fill="none">
        {p.art === "erp" && (
          <>
            {[30, 70, 50, 95, 65, 110, 85].map((h, i) => (
              <rect key={i} x={40 + i * 32} y={140 - h} width="18" height={h} rx="3" fill="white" opacity={0.25 + i * 0.08} />
            ))}
            <path d="M40 90 C 90 40, 140 110, 260 30" stroke="white" strokeWidth="2.5" />
          </>
        )}
        {p.art === "shop" && (
          <>
            {[0, 1, 2].map((i) => (
              <g key={i} transform={`translate(${50 + i * 75} ${40 + (i % 2) * 18})`}>
                <rect width="58" height="72" rx="10" fill="white" opacity="0.18" stroke="white" strokeOpacity="0.6" />
                <circle cx="29" cy="28" r="12" fill="white" opacity="0.55" />
                <rect x="10" y="50" width="38" height="5" rx="2.5" fill="white" opacity="0.7" />
              </g>
            ))}
          </>
        )}
        {p.art === "motion" && (
          <>
            {[0, 1, 2, 3, 4].map((i) => (
              <path
                key={i}
                d={`M0 ${80 + i * 6} Q 75 ${20 + i * 14}, 150 ${80 + i * 4} T 300 ${70 - i * 6}`}
                stroke="white"
                strokeOpacity={0.2 + i * 0.15}
                strokeWidth="2"
              />
            ))}
            <circle cx="150" cy="80" r="16" fill="white" opacity="0.8" />
          </>
        )}
      </svg>
      <span className="label absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1 !text-[0.6rem] !text-white backdrop-blur">
        {p.kind}
      </span>
    </div>
  );
}

export default function Projects() {
  const root = useRef<HTMLElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [narrow, setNarrow] = useState(false);
  const n = projects.length;
  useReveal(root);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const up = () => setNarrow(mq.matches);
    up();
    mq.addEventListener("change", up);
    return () => mq.removeEventListener("change", up);
  }, []);

  useEffect(() => {
    cards.current.forEach((el, i) => {
      if (!el) return;
      let off = i - active;
      if (off > n / 2) off -= n;
      if (off < -n / 2) off += n;
      const abs = Math.abs(off);
      gsap.to(el, {
        x: off * (narrow ? 260 : 330),
        z: -abs * 260,
        rotateY: -off * 32,
        scale: abs ? 0.86 : 1,
        opacity: abs > 1 ? 0 : abs ? 0.45 : 1,
        filter: abs ? "blur(1.5px) saturate(0.7)" : "blur(0px) saturate(1)",
        zIndex: 10 - abs,
        duration: 1.1,
        ease: "expo.out",
      });
    });
  }, [active, n, narrow]);

  const go = useCallback((d: number) => setActive((a) => (a + d + n) % n), [n]);

  // swipe / drag
  const start = useRef<number | null>(null);
  const onDown = (e: React.PointerEvent) => (start.current = e.clientX);
  const onUp = (e: React.PointerEvent) => {
    if (start.current === null) return;
    const dx = e.clientX - start.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    start.current = null;
  };

  return (
    <section id="work" ref={root} className="relative overflow-hidden py-28 md:py-40">
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <SectionLabel index="03">Selected work</SectionLabel>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="font-display text-5xl leading-[1.02] md:text-8xl">
            <span data-reveal="line" className="block overflow-hidden pb-1">
              <span className="glow-white block">Things I&apos;ve</span>
            </span>
            <span data-reveal="line" className="block overflow-hidden pb-2">
              <span className="glow-cyan block italic">built.</span>
            </span>
          </h2>
          <p data-reveal className="label">
            <span className="text-ink">{String(active + 1).padStart(2, "0")}</span> / {String(n).padStart(2, "0")}
          </p>
        </div>
      </div>

      <div
        className="relative mt-16 h-[520px] touch-pan-y select-none [perspective:1400px]"
        onPointerDown={onDown}
        onPointerUp={onUp}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
        tabIndex={0}
        aria-roledescription="carousel"
      >
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet/25 blur-[120px]" />
        <div className="absolute inset-0 [transform-style:preserve-3d]">
          {projects.map((p, i) => (
            <div
              key={p.name}
              ref={(el) => {
                cards.current[i] = el;
              }}
              onClick={() => i !== active && setActive(i)}
              data-cursor
              className="glass absolute left-1/2 top-0 w-[300px] -ml-[150px] rounded-2xl md:w-[360px] md:-ml-[180px]"
              style={{ boxShadow: i === active ? `0 30px 80px -20px ${p.hue[0]}aa` : undefined }}
            >
              <Art p={p} />
              <div className="p-6">
                <h3 className="font-display text-3xl">{p.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{p.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <span key={t} className="rounded-full border border-line px-3 py-1 font-mono text-[0.62rem] text-ink/80">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-6 flex gap-3">
                  {p.live && (
                    <a href={p.live} className="pill pill-primary !px-4 !py-2" target="_blank" rel="noreferrer">
                      Live ↗
                    </a>
                  )}
                  {p.repo && (
                    <a href={p.repo} className="pill pill-ghost !px-4 !py-2" target="_blank" rel="noreferrer">
                      Code
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-5">
        <button onClick={() => go(-1)} aria-label="Previous project" className="grid h-12 w-12 place-items-center rounded-full border border-line transition hover:border-cyan hover:text-cyan">
          ←
        </button>
        <div className="flex gap-2">
          {projects.map((p, i) => (
            <button
              key={p.name}
              onClick={() => setActive(i)}
              aria-label={`Show ${p.name}`}
              className={`h-1.5 rounded-full transition-all duration-500 ${i === active ? "w-8 bg-cyan" : "w-3 bg-line"}`}
            />
          ))}
        </div>
        <button onClick={() => go(1)} aria-label="Next project" className="grid h-12 w-12 place-items-center rounded-full border border-line transition hover:border-cyan hover:text-cyan">
          →
        </button>
      </div>
    </section>
  );
}
