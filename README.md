# Orbit — Halo One

A premium 3D product launch page for a **fictional** pair of over-ear headphones, built to stay smooth on a phone and degrade gracefully. It has a scroll-driven story with an exploded view and a custom noise-cancelling shader, plus a configurator with four colourways, two headband materials, hotspots and a URL-shareable config.

Project 3 of 4 in my frontend portfolio.

- **Live:** _add your Vercel URL here_
- **Video:** _add a 30–45 s screen recording here (OBS → HandBrake)_

> Orbit and Halo One are fictional. Nothing is for sale.

## What it does

| | |
|---|---|
| **Scroll story** (`/`) | Hero turntable with cursor tilt → camera flies to the ear cushion (sheen lifts) → **exploded view** with leader-line callouts → ANC ripple shader around the cups → colourways cycle as you scroll, and the backdrop re-papers to match. Lenis smooth scroll, one GSAP master timeline scrubbed by ScrollTrigger; scrolling back reverses exactly. Wheel, trackpad, touch, Space / Page Down. |
| **Configurator** (`/configure`) | Free orbit, 4 colourways, knit/leather headband, 5 hotspots (click on the model, or Tab + Enter in the list), camera fly-to, **Show parts**, price, **Add to bag** (360° spin with overshoot + bag counter). Config lives in the URL: `/configure?c=moss&m=leather`. Renders on demand when idle. |
| **Quality tiers** | `high` / `low` / `fallback`, picked from device hints, then adjusted live by drei `<PerformanceMonitor>`. Force one with `?tier=high\|low\|fallback`. |
| **Fallback** | No WebGL, a weak device or `prefers-reduced-motion` gets pre-rendered stills (rendered from this scene) with the same copy and layout. The configurator becomes an image swap. |

## Run it

```bash
pnpm install
pnpm dev                 # http://localhost:3000  (r3f-perf panel bottom-left; ?perf=0 hides it)
pnpm test                # Vitest: URL ⇄ config, tier selection, explode mapping
pnpm lint && pnpm typecheck && pnpm build
```

Asset scripts (the source model is git-ignored, see [Credits](#credits) for the download):

```bash
pnpm optimize:model      # assets-src/headphones.glb → public/models/halo-one{,-mobile}.glb
pnpm prepare:hdri        # assets-src/hdri/*.hdr     → public/hdri/studio-{high,low}.hdr
pnpm gen:model           # gltfjsx --types (reference output; Headphones.tsx is the edited copy)
pnpm build && pnpm start # then, in another terminal:
pnpm render:stills http://localhost:3000   # 32 fallback stills via headless Chrome
pnpm measure http://localhost:3000         # bytes, LCP, draw calls, triangles
```

`render:stills` and `measure` drive a local Chrome/Edge over the DevTools Protocol with no extra dependencies (`scripts/cdp.mjs`). Set `CHROME=/path/to/chrome` if it isn't found.

## How it works

```
DOM (sections, text, buttons)          ← scrolls natively; Lenis smooths the wheel
        │ scroll position
        ▼
GSAP master timeline  (ScrollTrigger, scrub: true; 1 timeline second = 100vh scrolled)
        │ tweens plain numbers on `rig`  (camera, target, framing, model rotation,
        │                                 explode, labels, anc, sheen)
        ▼
R3F <Canvas> (one, fixed, behind the DOM, shared by both routes)
        useFrame: Rig damps the camera → ModelRig rotates → Headphones moves parts
```

- **GSAP never touches React state.** It writes numbers into `lib/rig.ts`. `useFrame` reads them and mutates three.js objects, so React doesn't re-render while you scroll.
- **Pinning** uses `position: sticky` stages inside tall sections. Each beat plays while its section is pinned, and the camera moves to the next pose while the next section slides in.
- **Discrete choices** (colourway, material, hotspot, bag) live in Zustand (`lib/configState.ts`) and the URL. Colour changes **mutate** the existing materials (a 600 ms tween), so no material is created per click and there's no shader recompile.
- **Responsive framing:** each shot declares how wide its subject is. The rig pulls the camera back until that width fits the screen share the model gets (55% on desktop, 90% on phones), and `camera.setViewOffset` slides the image left, right or up without moving the orbit pivot.

### The ANC shader in two sentences

The vertex shader pushes each vertex of a squashed sphere around the cup along its normal by `sin(distance-from-pole × uBands − uTime × uSpeed)`, so rings travel outward. The fragment shader sets alpha = **fresnel** (`pow(1 − |N·V|, 2.5)`) × ring crests × `uStrength`, so the shell only glows at its silhouette and the ripple fades in with scroll (`shaders/anc.*.glsl`).

## Asset pipeline (before → after)

`scripts/optimize-model.mjs` uses the gltf-transform API:

| Step | Size |
|---|---|
| Source (Sketchfab GLB, four 4096² textures) | **37.41 MB** |
| Drop cable + jack + light empties | 36.95 MB |
| Split shared L/R meshes into 23 named parts; keep only the normal map; strip UV2–4 + tangents; dedup / prune / weld | 13.91 MB |
| Resize textures → WebP (2048 desktop / 1024 mobile) | 1.51 MB / 1.25 MB |
| Draco geometry compression | **0.52 MB** desktop / **0.26 MB** mobile |

That's **98.6% smaller** (99.3% for mobile). 36,645 triangles. What made up the size: the 4K PNG metal/roughness and normal maps (~30 MB). Colour and roughness now come from our own PBR values, so the base-colour, metal/roughness and emissive maps went, and only the normal map (for stitching, grille and button detail) stays. The knit and leather headband normal maps are **generated in JS** (`lib/proceduralTextures.ts`, 0 bytes downloaded).

The model shipped with **both ear cups in the same mesh**, and with no drivers or battery inside. The pipeline splits every shared mesh by the side of x each triangle sits on (`CupCap_L` / `CupCap_R`, …), and the app adds simple procedural 40 mm drivers and a battery that show up when the cups separate.

HDRI: Poly Haven `studio_small_09` (1k, 1.6 MB) is box-downsampled to 512×256 (high, 512 KB) and 256×128 (low, 128 KB) by `scripts/prepare-hdri.mjs`. A matte product on a paper sweep only needs soft light and blurry reflections.

## Performance

Performance budgets, measured with `pnpm measure` (cold cache, production build) and Lighthouse 12 mobile (simulated slow 4G, 4× CPU).

| Budget | Target | Measured |
|---|---|---|
| Model after compression | ≤ 2 MB | **528 KB** desktop / **263 KB** mobile |
| First-load transfer, high tier (`/`) | ≤ 3.5 MB | **1.81 MB** (JS 582 KB · model 508 KB · HDRI 512 KB · fonts 101 KB · Draco 74 KB · CSS 7 KB) |
| First-load transfer, low tier (`/`, phone) | ≤ 3.5 MB | **1.16 MB** |
| First-load transfer, fallback | | **391 KB** (no three.js at all) |
| Draw calls, configurator | < 60 | **54** high · **51** low (every pass counted: shadow + main + postprocessing) |
| Draw calls, story | | 51 low · 70 high (bloom) · 72 during the ANC beat |
| Triangles / frame | | ~72.7k (36.6k model, drawn twice: main pass + contact-shadow pass) |
| LCP element | hero headline, not the canvas | `<h1 id="hero-title">` ✓ (`<H1>` on `/configure`) |
| LCP, observed (localhost) | < 2.5 s | **0.15 s** |
| LCP, Lighthouse mobile simulated | < 2.5 s | **2.6 s** (was 3.6 s, see below) |

**Lighthouse mobile** (`/` · `/configure`): Performance **66 · 65**, Accessibility **100 · 100**, Best Practices **100 · 100**, SEO **100 · 100**. FCP 0.8 s, CLS 0.03 · 0. TBT is high (4–7 s) because Lighthouse's headless Chrome renders WebGL **in software (SwiftShader) on the 4×-throttled main thread**. That is not representative of a phone GPU, but it's an honest note.

What moved simulated LCP from 3.6 s to 2.6 s: three.js out of the first-load bundle (−99 KB gz), Lenis + ScrollTrigger deferred (−25 KB gz), the Bricolage `opsz` axis dropped (font 129 → 78 KB), and the canvas mounted only after `document.fonts.ready` + `load`. The remaining gap is React and Next's runtime evaluated at 4× CPU slowdown.

**FPS:** every number above came from headless Chrome on a CPU rasteriser (1–4 fps), so FPS is not measured here. Fill this in from the r3f-perf panel (`pnpm dev`) on real hardware:

| Device | Tier | Story FPS | Configurator FPS |
|---|---|---|---|
| Mid-range laptop | high | _measure_ (target 60) | _measure_ |
| Mid-range phone | low | _measure_ (target ≥ 40) | _measure_ |

`pnpm measure http://localhost:3000 --gpu` uses the real GPU instead of SwiftShader.

## Accessibility

- Every 3D interaction has a DOM equivalent: colourway radio buttons, a material radio group, a hotspot list (Tab + Enter flies the camera), **Show parts**, colour buttons in the story, and a screen-reader list of the exploded-view callouts.
- `aria-live` announces config changes ("Moss with leather headband") and bag additions.
- Text is `--ink` on every backdrop (≥ 11:1). `--ink-soft` was darkened from `#5A626D` to `#4F5661` so secondary text passes AA on all four tints (Basalt was 4.32:1, now 5.18:1).
- `prefers-reduced-motion`: an inline script switches to the static version before first paint, with no smooth scroll, no turntable and no scrubbed animation.
- Story reveals animate opacity only (never `visibility`), so off-screen sections stay readable to screen readers.

## Decisions

| # | Decision | Alternatives | Why |
|---|---|---|---|
| 1 | Single fixed canvas, shared by both routes | Canvas per section/page | One GL context, assets uploaded once, seamless camera |
| 2 | GSAP for scroll timelines | Framer Motion `useScroll`, drei `ScrollControls` | Precise scrubbing, mature tooling |
| 3 | Contact shadows | Real-time shadow maps | Much cheaper, looks right for a studio set |
| 4 | `position: sticky` pins + one master timeline in "vh" units | ScrollTrigger `pin` per section | Browser-native pinning with no spacers or fixed-position swaps; timeline time maps 1:1 to scroll |
| 5 | WebP textures | KTX2 / Basis | No native toolchain needed; only one 2K normal map ships, so GPU-memory savings would be small |
| 6 | 512 / 256 px HDRI | 2k desktop / 1k mobile | 2k is ~6 MB and blows the 3.5 MB first-load budget; blur hides the difference on matte plastic |
| 7 | Parts that add no visible shadow sit on a layer the ContactShadows camera skips | Shadow every mesh | ContactShadows re-renders the scene each frame; this keeps the configurator under 60 draw calls |
| 8 | No bloom in the configurator (vignette + SMAA only) | Same effects everywhere | The mipmap-blur bloom chain is ~16 passes; without it the high-tier configurator went from 70 to 54 draw calls |
| 10 | One layout rule for CSS, GSAP and the cameras: side-by-side on wide **or landscape** screens, stacked (model above copy) on portrait phones/tablets (`lib/layout.ts`, Tailwind `side:` variant) | `md:` breakpoint only | Width alone put tablets in a cramped two-column layout and landscape phones in an overflowing stacked one. Cameras fit the model to its area in both width and height; type is fluid and capped by viewport height |
| 11 | No scroll-driven headline width (`wdth`) animation (the original design called for one) | Animate Bricolage's width axis | Changing glyph widths made headlines re-wrap mid-scroll, so the text visibly jumped. Headlines now hold still; dropping the axis also shrank the font file |
| 9 | three.js, Lenis and ScrollTrigger stay out of the first-load bundle | Import normally | The hero only needs React. The sweep colour is a plain `{r,g,b}` (a single `THREE.Color` import pulled ~100 KB gz of three into first load), and the canvas + scroll libraries are `next/dynamic` chunks loaded after fonts + `load` |

## Known limitations

- **FPS isn't measured yet on real hardware** (see the table above). Everything here was checked in headless Chrome on a CPU rasteriser.
- **The drivers and battery are procedural.** The source model is an empty shell, so they're simple cylinders, a cone and a rounded box.
- **Fallback stills cover the colourways, not the headband material in the story.** The configurator has all 8 combinations.
- **Simulated mobile LCP is 2.6 s** against the 2.5 s budget (observed: 0.15 s). See Performance.
- `next dev` needs `scripts/strip-sourcemap-loader.cjs`: r3f-perf 7.2.3 ships a source map pointing at a binary font, and Turbopack panics on it. It's wired up in `next.config.ts`.
- In dev only, React 19 StrictMode logs "synchronously unmount a root" from drei `<Html>` cleanup. Harmless.

## Credits

- **3D model:** ["Headphones"](https://sketchfab.com/3d-models/headphones-b12a7fb702804cc19537047a033fe0d9) by [re1monsen](https://sketchfab.com/re1monsen), licensed [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/). Modified: cable and jack removed, meshes split per side, re-materialed, textures reduced, Draco-compressed. To rebuild, download the GLB into `assets-src/headphones.glb`.
- **HDRI:** ["Studio Small 09"](https://polyhaven.com/a/studio_small_09) from Poly Haven, CC0. Download the 1k `.hdr` into `assets-src/hdri/`.
- Fonts: Bricolage Grotesque and Manrope (SIL OFL) via `next/font`.

## Technical highlights

1. **Shrinking the model:** 37.4 MB → 0.52 MB. Textures were ~80% of it: three of the four 4K maps went, the normal map was resized and converted to WebP, then Draco handled the geometry. Splitting shared L/R meshes made the exploded view possible.
2. **Refs, not state, in `useFrame`:** 60 setStates a second would re-render the React tree 60×/s. Mutating `ref.current.position` costs nothing outside the GPU loop.
3. **Scroll → GSAP → `rig` → `useFrame` → three:** one scrubbed timeline tweens plain numbers, and the render loop reads them and damps the camera toward them. Scrolling back reverses exactly because every value is a pure function of timeline time.
4. **The shader:** uniforms `uTime` (changes every frame), `uStrength` (scroll), `uColor`, `uBands`, `uSpeed`. The vertex shader decides where (displacement along the normal) and the fragment shader decides colour and alpha (fresnel × ring bands).
5. **Tiers and fallback:** a pure `selectTier()` (unit-tested) picks high, low or fallback from WebGL, GPU string, cores, memory, mobile, data saver and reduced motion. `PerformanceMonitor` then scales DPR and drops postprocessing when FPS declines. The fallback stills are rendered from the same scene by a script.

## Project structure

```
assets-src/            source model + HDRI (git-ignored)
scripts/               optimize-model, prepare-hdri, render-stills, measure, cdp driver, inspect-model
public/models|hdri|draco|fallback
app/                   layout (fonts, Lenis, canvas, tier gate), page (story), configure/
components/canvas/     Scene, Headphones (gltfjsx + edits), Internals, Rig, ModelRig, ConfigureRig,
                       Hotspots, Callouts, AncShader, Effects, StatsProbe, Perf
components/story/      sections, StoryTimeline, ColourList
components/configure/  Picker
lib/                   rig, timeline, explode, parts, materials, configState, quality, product, sweep
shaders/               anc.vert.glsl, anc.frag.glsl
```
