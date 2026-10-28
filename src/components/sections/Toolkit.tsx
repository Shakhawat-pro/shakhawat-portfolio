"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { toolkit } from "@/data/profile";
import { toolIcon } from "@/components/toolIcons";
import { prefersReducedMotion } from "@/lib/intro";

gsap.registerPlugin(ScrollTrigger);

const ParticleWords = dynamic(() => import("@/components/three/ParticleWords"), { ssr: false });
const WORDS = toolkit.map((t) => t.word);
// the first slice of scroll is spent arriving at the sticky frame
const LEAD = 0.08;
// orbit center, as a fraction of the frame height (matches the particle word)
const CY = 0.5;

export default function Toolkit() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const chips = useRef<(HTMLLIElement | null)[]>([]);
  const st = useRef<ScrollTrigger | null>(null);
  const hovered = useRef(false);
  const [index, setIndex] = useState(-1);

  useEffect(() => {
    st.current = ScrollTrigger.create({
      trigger: root.current,
      start: "top 60%",
      end: "bottom bottom",
      onUpdate: (self) => {
        const p = gsap.utils.clamp(0, 0.999, (self.progress - LEAD) / (1 - LEAD));
        setIndex(Math.floor(p * WORDS.length));
        if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      },
      onLeaveBack: () => setIndex(-1),
    });
    return () => st.current?.kill();
  }, []);

  const shown = Math.max(index, 0);
  const cat = toolkit[shown];

  // orbit: chips ride a tilted ellipse around the word; the back half sits
  // under the particle canvas, the front half above it
  useEffect(() => {
    const reduce = prefersReducedMotion();
    let angle = -Math.PI / 2;
    let speed = 0.12;
    let rx = 0;
    let ry = 0;
    let cx = 0;
    let cy = 0;

    const measure = () => {
      const el = stage.current!;
      const w = el.clientWidth;
      const h = el.clientHeight;
      const mobile = w < 768;
      rx = mobile ? w * 0.4 : Math.min(w * 0.4, 560);
      ry = mobile ? h * 0.2 : Math.min(h * 0.24, 230);
      cx = w / 2;
      cy = h * CY;
      if (ring.current) {
        Object.assign(ring.current.style, {
          width: `${rx * 2}px`,
          height: `${ry * 2}px`,
          left: `${cx - rx}px`,
          top: `${cy - ry}px`,
        });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage.current!);

    const tick = (_t: number, dt: number) => {
      const target = hovered.current ? 0.015 : 0.12;
      speed += (target - speed) * 0.06;
      if (!reduce) angle += speed * (dt / 1000);
      const list = chips.current.filter(Boolean) as HTMLLIElement[];
      const n = list.length;
      list.forEach((el, i) => {
        const a = angle + (i / n) * Math.PI * 2;
        const depth = (Math.sin(a) + 1) / 2; // 0 = back (top), 1 = front (bottom)
        const x = cx + Math.cos(a) * rx;
        const y = cy + Math.sin(a) * ry;
        const s = 0.68 + depth * 0.42;
        el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${s})`;
        el.style.opacity = String(0.35 + depth * 0.65);
        el.style.zIndex = depth > 0.5 ? "30" : "5";
      });
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      ro.disconnect();
    };
  }, []);

  // pop the new set of chips in when the category changes
  useEffect(() => {
    const inner = chips.current.filter(Boolean).map((c) => c!.firstElementChild);
    const tw = gsap.fromTo(
      inner,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.9, ease: "back.out(1.8)", stagger: 0.05 },
    );
    return () => {
      tw.kill();
    };
  }, [shown]);

  const jump = (i: number) => {
    const s = st.current;
    if (!s) return;
    const p = LEAD + ((i + 0.5) / WORDS.length) * (1 - LEAD);
    const y = s.start + (s.end - s.start) * p;
    const lenis = (window as unknown as { __lenis?: { scrollTo: (y: number, o?: object) => void } }).__lenis;
    if (lenis) lenis.scrollTo(y, { duration: 1.2 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <section id="skills" ref={root} className="relative" style={{ height: `${WORDS.length * 90 + 60}vh` }}>
      <div ref={stage} className="sticky top-0 h-[100svh] overflow-hidden">
        {/* ambient glow under the word */}
        <div
          className="pointer-events-none absolute left-1/2 h-[46vh] w-[70vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet/15 blur-[110px]"
          style={{ top: `${CY * 100}%` }}
        />

        {/* orbit rings */}
        <div ref={ring} className="pointer-events-none absolute">
          <div className="absolute inset-0 rounded-[50%] border border-violet/25 shadow-[0_0_40px_rgba(139,92,246,0.15)_inset]" />
          <div className="absolute -inset-[7%] rounded-[50%] border border-dashed border-cyan/10" />
          <div className="absolute inset-[22%] rounded-[50%] border border-line" />
        </div>

        {/* particle word (z-10) sits between the back and front chips */}
        <div className="absolute inset-0 z-10">
          <ParticleWords words={WORDS} index={index} />
        </div>

        <ul className="pointer-events-none absolute inset-0 z-20">
          {cat.items.map((name, i) => {
            const [Icon, color] = toolIcon(name);
            return (
              <li
                key={`${cat.word}-${name}`}
                ref={(el) => {
                  chips.current[i] = el;
                }}
                className="absolute left-0 top-0 will-change-transform"
                style={{ opacity: 0 }}
              >
                <div
                  data-cursor
                  className="group pointer-events-auto flex flex-col items-center gap-2"
                  onPointerEnter={() => (hovered.current = true)}
                  onPointerLeave={() => (hovered.current = false)}
                >
                  <span
                    className="relative grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-[#0b0c22] transition-transform duration-300 group-hover:scale-110 md:h-[68px] md:w-[68px]"
                    style={{ boxShadow: `0 0 0 1px ${color}22, 0 10px 30px -10px ${color}66` }}
                  >
                    <span
                      className="absolute inset-0 rounded-2xl opacity-40 transition-opacity duration-300 group-hover:opacity-90"
                      style={{ background: `radial-gradient(circle at 50% 50%, ${color}55, transparent 65%)` }}
                    />
                    <Icon className="relative h-7 w-7 md:h-8 md:w-8" style={{ color }} />
                  </span>
                  <span className="whitespace-nowrap rounded-full bg-[#05060f]/80 px-2 py-0.5 font-mono text-[0.6rem] tracking-wide text-ink/85 md:text-[0.66rem]">
                    {name}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        {/* header */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-40">
          <div className="mx-auto flex max-w-7xl items-start justify-between px-5 pt-20 md:px-10 md:pt-24">
            <div>
              <p className="label mb-3 flex items-center gap-3">
                <span className="text-cyan">{"//"}</span>
                <span className="text-violet">04</span>
                <span className="h-px w-10 bg-line" />
                What I use
              </p>
              <h2 className="font-display glow-white text-5xl md:text-6xl">
                My <span className="glow-cyan italic">Toolkit.</span>
              </h2>
            </div>
            <p className="font-display mt-6 text-right text-4xl text-ink/90 md:text-5xl">
              <span className="glow-cyan">{String(shown + 1).padStart(2, "0")}</span>
              <span className="text-xl text-muted md:text-2xl"> / {String(toolkit.length).padStart(2, "0")}</span>
            </p>
          </div>
        </div>

        {/* blurb + stepper */}
        <div className="absolute inset-x-0 bottom-0 z-40 px-5 pb-8 md:pb-10">
          <p
            key={cat.word}
            className="mx-auto mb-5 max-w-md animate-[fadeUp_0.7s_cubic-bezier(.2,.8,.2,1)] text-center text-sm text-muted md:text-base"
          >
            {cat.blurb}
          </p>
          <div className="mx-auto max-w-2xl">
            <div className="grid grid-cols-4 gap-2">
              {toolkit.map((t, i) => (
                <button
                  key={t.word}
                  onClick={() => jump(i)}
                  className={`group flex flex-col items-center gap-1.5 py-1 transition-colors duration-500 ${
                    i === shown ? "text-ink" : "text-muted hover:text-ink"
                  }`}
                >
                  <span className={`font-mono text-[0.6rem] ${i === shown ? "text-cyan" : "text-violet/70"}`}>
                    0{i + 1}
                  </span>
                  <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] md:text-[0.7rem]">{t.label}</span>
                </button>
              ))}
            </div>
            <div className="relative mt-2 h-px bg-line">
              <div
                ref={bar}
                className="h-full origin-left scale-x-0 bg-gradient-to-r from-violet to-cyan shadow-[0_0_10px_var(--cyan)]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
