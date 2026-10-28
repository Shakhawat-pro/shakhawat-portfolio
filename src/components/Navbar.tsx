"use client";

import { useEffect, useState } from "react";
import { profile } from "@/data/profile";
import { scrollToId } from "@/lib/intro";

const links = [
  { id: "about", label: "About" },
  { id: "work", label: "Work" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string) => {
    setOpen(false);
    scrollToId(id);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-[#05060f]/60 backdrop-blur-xl border-b border-line" : ""
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-10">
        <button onClick={() => go("top")} className="font-display text-xl tracking-wide">
          shakhawat<span className="text-cyan">.</span>
        </button>

        <ul className="hidden items-center gap-9 md:flex">
          {links.map((l) => (
            <li key={l.id}>
              <button
                onClick={() => go(l.id)}
                className="group relative font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted transition-colors hover:text-ink"
              >
                {l.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-cyan transition-all duration-300 group-hover:w-full" />
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <a href={profile.resume} target="_blank" rel="noreferrer" className="pill pill-ghost !py-2 !px-4">
            Resume ↗
          </a>
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
            aria-label="Menu"
          >
            <span className={`h-px w-5 bg-ink transition ${open ? "translate-y-[3.5px] rotate-45" : ""}`} />
            <span className={`h-px w-5 bg-ink transition ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`} />
          </button>
        </div>
      </nav>

      <div
        className={`overflow-hidden transition-[max-height] duration-500 md:hidden ${open ? "max-h-72" : "max-h-0"}`}
      >
        <ul className="glass mx-4 mb-4 rounded-2xl p-4">
          {links.map((l, i) => (
            <li key={l.id}>
              <button onClick={() => go(l.id)} className="flex w-full items-baseline gap-3 py-3 text-left">
                <span className="label">0{i + 1}</span>
                <span className="font-display text-2xl">{l.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
