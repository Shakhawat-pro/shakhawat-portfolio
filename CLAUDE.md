# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

A single-page 3D animated portfolio for MD. Shakhawat Hossain, built with Next.js 16 (App Router, Turbopack), React 19, Tailwind 4, three.js / React Three Fiber, GSAP + ScrollTrigger, and Lenis.

## Commands

```bash
npm run dev          # dev server on :3000
npm run build        # production build (also type-checks)
npm run lint         # ESLint (eslint-config-next, incl. React Compiler hook rules)
npx tsc --noEmit     # fast type-check
```

There is no test suite. Verify changes with `tsc` + `lint` + `build`, then by looking at the page in a browser.

## Next.js 16 caveats

See `AGENTS.md`: this Next version has breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before using an unfamiliar API.

- `next.config.ts` enables `cacheComponents`, so server components must stay static. For example, don't call `new Date()` in a server component; the footer year is hard-coded for this reason.
- `dynamic(..., { ssr: false })` is only allowed inside client components. That is why `Hero.tsx` and `Toolkit.tsx` (both client components) lazy-load the WebGL code.
- Root layout props use the global `LayoutProps<"/">` type.

## Architecture

**Content vs. presentation.** All personal copy lives in `src/data/profile.ts`: identity, links, about, stats, ticker, experience, projects and toolkit. Components only render it. Every name in a `toolkit` category's `items` needs an icon and color entry in `src/components/toolIcons.tsx`; anything without one falls back to a generic icon.

**Page composition.** `src/app/layout.tsx` mounts the site-wide chrome: `Preloader`, `Starfield`, `SmoothScroll`, `Cursor` and `Navbar`. `src/app/page.tsx` lists the sections in scroll order. Nav targets are the section ids `top`, `about`, `work`, `skills` and `contact`.

**Intro sequencing.** `Preloader` locks scroll, counts 00→100, then calls `markIntroDone()` (`src/lib/intro.ts`). Hero copy (`sections/Hero.tsx`) and the 3D camera dolly (`three/HeroScene.tsx`) each subscribe with `onIntroDone()`. To change intro timing, adjust both sides.

**Scrolling.** `SmoothScroll` creates the single Lenis instance and drives it from `gsap.ticker` so it stays synced with ScrollTrigger. It registers the instance in `src/lib/scroll.ts`. Programmatic scrolling must go through `scrollToId` / `scrollToY` there, which fall back to native smooth scroll when Lenis is off because of reduced motion. `src/lib/motion.ts` holds `prefersReducedMotion()` and `useMediaQuery(MOBILE_QUERY)`.

**Three rendering surfaces.** Each one pauses when it is off screen.
1. `three/HeroScene.tsx` uses React Three Fiber, and its file header documents the scene graph. The portrait hologram uses `public/textures/hologram.webp`, a 900px WebP derived from `public/Shakhawat_img.png` with sharp, and the layout preloads it. If the photo changes, regenerate the WebP. HUD panel images are drawn at runtime by `three/textures.ts`. The `DataColumn` pillars are repositioned every frame by unprojecting a fixed NDC x, so they stay pinned to the screen edges. On narrow aspects, `Panels` scale their x positions inward to keep a gap from those pillars.
2. `three/ParticleWords.tsx` is plain three.js with no R3F. It rasterizes each toolkit word to an offscreen canvas into N target points, then runs a CPU spring simulation.
3. `Starfield.tsx` is a 2D canvas fixed behind everything. For it to show, `body` must keep a transparent background.

**Toolkit section** (`sections/Toolkit.tsx`) is a tall section with a sticky stage. ScrollTrigger progress, after a `LEAD` offset, selects the category index. Tool chips are positioned on an ellipse by a `gsap.ticker` callback, which runs only while the stage intersects the viewport. Depth comes from z-index: back-half chips (z-5) sit under the particle canvas (z-10), and front-half chips (z-30) sit above it.

**Reveal animations.** `useReveal(rootRef)` (`src/lib/useReveal.ts`) animates any `[data-reveal]` descendant on scroll. `data-reveal="line"` slides the element's children up from an `overflow-hidden` mask. Elements with `data-cursor` enlarge the custom cursor.

## Gotchas

- **React Compiler lint rules** (`react-hooks/purity`, `react-hooks/immutability`) fail on:
  - `Math.random()` during render. Generate random values in a module-level function passed to `useState(fn)` or inside an effect.
  - Mutating hook return values or objects already passed to hooks. Use refs, or create and configure objects inside effects. `HeroScene`'s `usePhotoTexture` is an example of this pattern.
- **Additive shaders on the transparent canvas:** the WebGL canvases use `alpha: true`. A custom additive shader that writes `gl_FragColor.a = 1.0` paints opaque black rectangles over the starfield. Output alpha equal to brightness instead (see `LightningFloor` / `DataColumn`).
- **Disposing textures:** canvas textures created by hand must be disposed on unmount (`useDisposeOnUnmount` in `HeroScene`).
- **ESLint directive comments:** a comment starting with `/* global` is parsed as an ESLint directive. Word JSX comments differently.
- **Uncommitted public files:** `public/website video.mp4` (the design reference recording) and the empty `public/Shakhawat Hossain CV.pdf` are intentionally left uncommitted. Anything in `public/` is publicly served. The resume button uses `Shakhawat_Hossain_Resume.docx.pdf`.
