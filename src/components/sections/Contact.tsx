"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { profile } from "@/data/profile";
import { useReveal } from "@/lib/useReveal";
import SectionLabel from "@/components/SectionLabel";

/**
 * Contact — "Let's connect." Copy-to-clipboard email, social links, and a form
 * that opens the visitor's mail app pre-filled (no backend needed).
 */
export default function Contact() {
  const root = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  useReveal(root);

  // No backend: compose the message in the visitor's mail app.
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const subject = encodeURIComponent(String(f.get("subject") || "Hello from your portfolio"));
    const body = encodeURIComponent(`${f.get("message")}\n\n— ${f.get("name")} (${f.get("email")})`);
    window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
  };

  const copy = async () => {
    await navigator.clipboard.writeText(profile.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const field =
    "w-full rounded-xl border border-line bg-[#05060f]/50 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-cyan focus:shadow-[0_0_0_3px_rgba(103,232,249,0.12)]";

  return (
    <section id="contact" ref={root} className="relative overflow-hidden py-28 md:py-40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_30%_60%,rgba(59,40,180,0.35),transparent_70%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-16 px-5 md:grid-cols-2 md:px-10">
        <div>
          <SectionLabel index="05">Available for projects</SectionLabel>
          <h2 className="font-display text-6xl leading-[0.95] md:text-8xl">
            <span data-reveal="line" className="block overflow-hidden pb-1">
              <span className="glow-white block">Let&apos;s</span>
            </span>
            <span data-reveal="line" className="block overflow-hidden pb-3">
              <span className="glow-cyan block italic">connect.</span>
            </span>
          </h2>
          <p data-reveal className="mt-6 max-w-md leading-relaxed text-muted">
            Have an idea, a role, or a product that needs a reliable full-stack hand? My inbox is always open —
            I&apos;ll get back to you within a day.
          </p>

          <div data-reveal className="mt-10 flex items-center gap-4">
            <div className="relative h-14 w-14 overflow-hidden rounded-full border border-cyan/50 shadow-[0_0_20px_rgba(103,232,249,0.3)]">
              <Image src={profile.photo} alt="" fill sizes="56px" className="object-cover object-top" />
            </div>
            <div>
              <button onClick={copy} className="font-mono text-sm text-ink transition hover:text-cyan md:text-base">
                {profile.email}
              </button>
              <p className="label mt-1 !text-[0.6rem]">{copied ? "✓ copied to clipboard" : "click to copy"}</p>
            </div>
          </div>

          <ul data-reveal className="mt-10 flex flex-wrap gap-3">
            {profile.socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noreferrer" className="pill pill-ghost">
                  {s.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>

        <form data-reveal onSubmit={onSubmit} className="glass self-start rounded-3xl p-6 md:p-9">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="label mb-2 block">Name</span>
              <input name="name" required placeholder="Your name" className={field} />
            </label>
            <label className="block">
              <span className="label mb-2 block">Email</span>
              <input name="email" type="email" required placeholder="you@email.com" className={field} />
            </label>
          </div>
          <label className="mt-5 block">
            <span className="label mb-2 block">Subject</span>
            <input name="subject" placeholder="What's this about?" className={field} />
          </label>
          <label className="mt-5 block">
            <span className="label mb-2 block">Message</span>
            <textarea name="message" required rows={5} placeholder="Tell me about your project, idea or role…" className={`${field} resize-none`} />
          </label>
          <button type="submit" className="pill pill-primary mt-7">
            Send message →
          </button>
        </form>
      </div>
    </section>
  );
}
