"use client";

import { useConfig } from "@/lib/configState";
import { getColourway } from "@/lib/product";

// Static, image-based version of the 3D scene for no-WebGL, low-end devices
// and prefers-reduced-motion. Same copy and layout; stills replace the canvas.
// Images are display:none + loading="lazy" unless <html data-tier="fallback">,
// so 3D visitors never download them.

const VIEW: Record<string, string> = {
  hero: "three-quarter view",
  comfort: "close-up of the memory-foam ear cushion",
  inside: "exploded view showing cups, drivers, battery and cushions",
  quiet: "side view of the ear cups",
  colours: "three-quarter view",
  outro: "front view",
  configure: "three-quarter view",
};

export function stillUrl(section: string, colourway: string, material?: string) {
  return section === "configure"
    ? `/fallback/configure-${colourway}-${material ?? "knit"}.webp`
    : `/fallback/${section}-${colourway}.webp`;
}

export function FallbackStill({ section }: { section: string }) {
  const colourway = useConfig((s) => s.colourway);
  const material = useConfig((s) => s.material);
  const name = getColourway(colourway).name;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- pre-optimized WebP stills, swapped by colourway
    <img
      data-fallback-only
      src={stillUrl(section, colourway, material)}
      alt={`Halo One in ${name}${section === "configure" ? ` with ${material} headband` : ""}, ${VIEW[section] ?? "product view"}`}
      width={1200}
      height={900}
      // Always lazy: Chrome fetches eager images even when display:none, which
      // would cost every 3D visitor the stills. Lazy + in-viewport still loads
      // promptly on the fallback tier.
      loading="lazy"
      decoding="async"
      className="mb-6 aspect-[4/3] w-full rounded-2xl object-cover"
    />
  );
}
