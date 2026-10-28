import type Lenis from "lenis";

// Holds the single Lenis smooth-scroll instance (registered by <SmoothScroll />)
// so any component can scroll programmatically. Falls back to native smooth
// scrolling when Lenis is off (e.g. prefers-reduced-motion).

let lenis: Lenis | null = null;

export function setLenis(instance: Lenis | null) {
  lenis = instance;
}

export function scrollToY(y: number, duration = 1.2) {
  if (lenis) lenis.scrollTo(y, { duration });
  else window.scrollTo({ top: y, behavior: "smooth" });
}

export function scrollToId(id: string, duration = 1.6) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { duration });
  else el.scrollIntoView({ behavior: "smooth" });
}
