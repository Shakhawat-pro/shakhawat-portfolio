import { profile } from "@/data/profile";

export default function Footer() {
  return (
    <footer className="relative border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 md:flex-row md:px-10">
        <p className="label">
          © 2026 {profile.fullName}
        </p>
        <p className="label">
          Designed &amp; built with <span className="text-cyan">Next.js · Three.js · GSAP</span>
        </p>
        <p className="label">{profile.location}</p>
      </div>
    </footer>
  );
}
