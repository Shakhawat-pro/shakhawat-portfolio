"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { experience } from "@/data/profile";
import { useReveal } from "@/lib/useReveal";
import SectionLabel from "@/components/SectionLabel";

export default function Experience() {
  const root = useRef<HTMLElement>(null);
  const beam = useRef<HTMLDivElement>(null);
  useReveal(root);

  useEffect(() => {
    const tw = gsap.fromTo(
      beam.current,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: "none",
        scrollTrigger: { trigger: beam.current?.parentElement, start: "top 70%", end: "bottom 60%", scrub: true },
      },
    );
    return () => {
      tw.scrollTrigger?.kill();
      tw.kill();
    };
  }, []);

  return (
    <section ref={root} className="relative mx-auto max-w-7xl px-5 py-24 md:px-10">
      <SectionLabel index="02">Journey</SectionLabel>
      <h2 className="font-display text-5xl md:text-7xl">
        <span data-reveal="line" className="block overflow-hidden pb-2">
          <span className="block">
            Where I&apos;ve <span className="glow-cyan italic">been.</span>
          </span>
        </span>
      </h2>

      <div className="relative mt-16 pl-8 md:pl-0">
        <div className="absolute bottom-0 left-2 top-0 w-px bg-line md:left-1/2">
          <div
            ref={beam}
            className="h-full w-full origin-top bg-gradient-to-b from-cyan via-violet to-transparent shadow-[0_0_12px_var(--cyan)]"
          />
        </div>
        <div className="space-y-14">
          {experience.map((e, i) => (
            <div
              key={e.org}
              data-reveal
              className={`relative md:w-1/2 ${i % 2 ? "md:ml-auto md:pl-14" : "md:pr-14"}`}
            >
              <span
                className={`absolute -left-[1.85rem] top-7 h-3 w-3 rounded-full border border-cyan bg-[#05060f] shadow-[0_0_14px_var(--cyan)] ${
                  i % 2 ? "md:-left-1.5" : "md:-right-1.5 md:left-auto"
                }`}
              />
              <article className="glass group rounded-2xl p-7 transition-colors duration-500 hover:border-violet/50">
                <p className="label !text-cyan">{e.period}</p>
                <h3 className="font-display mt-3 text-3xl">{e.title}</h3>
                <p className="mt-1 text-ink/80">
                  {e.org} <span className="text-muted">· {e.place}</span>
                </p>
                <ul className="mt-5 space-y-2 text-sm leading-relaxed text-muted">
                  {e.points.map((p) => (
                    <li key={p} className="flex gap-3">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-violet" />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
