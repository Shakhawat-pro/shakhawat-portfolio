"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { profile } from "@/data/profile";
import { onIntroDone, scrollToId } from "@/lib/intro";

gsap.registerPlugin(ScrollTrigger);

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), { ssr: false });

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    let off = () => {};
    const ctx = gsap.context(() => {
      gsap.set(".hero-line > *", { yPercent: 115 });
      gsap.set(".hero-fade", { opacity: 0, y: 16 });
      off = onIntroDone(() => {
        gsap
          .timeline({ delay: 2.2 })
          .to(".hero-line > *", { yPercent: 0, duration: 1.3, ease: "expo.out", stagger: 0.12 })
          .to(".hero-fade", { opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.08 }, "-=0.9");
      });

      gsap.to(".hero-copy", {
        yPercent: -30,
        opacity: 0,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });
    }, root);
    return () => {
      off();
      ctx.revert();
    };
  }, []);

  return (
    <section id="top" ref={root} className="relative h-[100svh] min-h-[640px] overflow-hidden">
      <HeroScene />

      {/* readability gradients */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#05060f]/85 via-[#05060f]/20 to-transparent max-md:bg-gradient-to-t max-md:from-[#05060f] max-md:via-[#05060f]/40" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#05060f] to-transparent" />

      <div className="hero-copy relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-5 pb-28 md:justify-center md:px-10 md:pb-0">
        <p className="hero-fade label mb-5 flex items-center gap-3">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-cyan shadow-[0_0_10px_var(--cyan)]" />
          Hello world, I&apos;m
        </p>
        <h1 className="font-display leading-[0.88]">
          <span className="hero-line block overflow-hidden pb-2">
            <span className="glow-white block text-[18vw] md:text-[8.5rem]">{profile.firstName}</span>
          </span>
          <span className="hero-line block overflow-hidden pb-3">
            <span className="glow-cyan block text-[18vw] italic md:text-[8.5rem]">{profile.lastName}.</span>
          </span>
        </h1>
        <p className="hero-fade mt-6 max-w-md text-base leading-relaxed text-muted md:text-lg">
          <span className="text-ink">{profile.role}</span> crafting fast, thoughtful web apps — from ERP
          backends to buttery-smooth interfaces.
        </p>
        <div className="hero-fade mt-8 flex flex-wrap gap-3">
          <button className="pill pill-primary" onClick={() => scrollToId("work")}>
            View my work →
          </button>
          <button className="pill pill-ghost" onClick={() => scrollToId("contact")}>
            Let&apos;s talk
          </button>
        </div>
      </div>

      <div className="hero-fade absolute inset-x-0 bottom-0 z-10 overflow-hidden border-t border-line bg-[#05060f]/40 py-3 backdrop-blur-sm">
        <div className="marquee">
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0" aria-hidden={k === 1}>
              {profile.ticker.map((t) => (
                <span key={t} className="label mx-6 flex items-center gap-6 whitespace-nowrap">
                  {t}
                  <span className="text-violet">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="hero-fade absolute bottom-16 right-6 z-10 hidden flex-col items-center gap-3 md:flex">
        <span className="label [writing-mode:vertical-rl]">Scroll</span>
        <span className="h-12 w-px overflow-hidden bg-line">
          <span className="block h-1/2 w-full animate-[scrollcue_1.8s_ease-in-out_infinite] bg-cyan" />
        </span>
      </div>
    </section>
  );
}
