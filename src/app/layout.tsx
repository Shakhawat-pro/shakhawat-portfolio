import type { Metadata, Viewport } from "next";
import { preload } from "react-dom";
import { DM_Serif_Display, Inter, JetBrains_Mono } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Cursor from "@/components/Cursor";
import Navbar from "@/components/Navbar";
import Preloader from "@/components/Preloader";
import Starfield from "@/components/Starfield";
import { profile } from "@/data/profile";

// Fonts — exposed as CSS variables and mapped to Tailwind in globals.css:
// serif display for headings, Inter for body, JetBrains Mono for labels.
const serif = DM_Serif_Display({
  variable: "--font-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const sans = Inter({
  variable: "--font-sans-ui",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono-ui",
  subsets: ["latin"],
});

const title = `${profile.firstName} ${profile.lastName} — ${profile.role}`;
const description =
  "Portfolio of MD. Shakhawat Hossain, a full-stack software engineer from Dhaka building fast, reliable web applications with React, Next.js and Node.js.";

export const metadata: Metadata = {
  metadataBase: new URL(profile.siteUrl),
  title,
  description,
  authors: [{ name: profile.fullName }],
  keywords: ["Shakhawat Hossain", "full-stack developer", "software engineer", "React", "Next.js", "Node.js", "Dhaka"],
  openGraph: {
    type: "website",
    title,
    description,
    images: [{ url: profile.photo, width: 1086, height: 1448, alt: profile.fullName }],
  },
  twitter: { card: "summary_large_image", title, description, images: [profile.photo] },
};

export const viewport: Viewport = {
  themeColor: "#05060f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // start fetching the hero hologram texture while the preloader is still counting
  preload("/textures/hologram.webp", { as: "image", fetchPriority: "high" });

  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable} antialiased`}>
      <body>
        {/* site-wide chrome shared by every section */}
        <Preloader />
        <Starfield />
        <SmoothScroll />
        <Cursor />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
