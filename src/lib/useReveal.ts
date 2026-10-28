"use client";

import { type RefObject, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Animates [data-reveal] children in as the section scrolls into view.
// [data-reveal="line"] slides up from a mask; anything else fades up.
export function useReveal(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        const line = el.dataset.reveal === "line";
        gsap.from(line ? el.children : el, {
          yPercent: line ? 110 : 0,
          y: line ? 0 : 40,
          opacity: line ? 1 : 0,
          duration: line ? 1.2 : 1,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });
    }, root);
    return () => ctx.revert();
  }, [root]);
}
