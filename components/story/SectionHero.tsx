import Link from "next/link";
import { FallbackStill } from "@/components/Fallback";
import { LoadingIndicator } from "@/components/LoadingIndicator";

/**
 * Hero. Server-rendered and visible immediately: the headline is the LCP
 * element, not the canvas. No reveal animation on first paint.
 */
export function SectionHero() {
  return (
    <section
      id="hero"
      data-section="hero"
      aria-labelledby="hero-title"
      className="relative"
      style={{ height: "160vh" }}
    >
      <div className="sticky top-0 flex h-dvh items-end side:items-center">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-12 gap-6 px-5 pb-8 sm:px-8 side:pt-16 side:pb-0">
          <div className="col-span-12 max-w-xl xl:col-span-5 side:col-span-6 side:max-w-none">
            <FallbackStill section="hero" />
            <p
              data-reveal
              className="mb-4 text-sm font-semibold tracking-[0.18em] text-ink-soft uppercase short:mb-2 short:text-xs"
            >
              Orbit Halo One
            </p>
            <h1
              id="hero-title"
              data-reveal
              data-headline
              // Fluid: follows the width, capped by the height (6rem max).
              className="font-display text-[clamp(2.5rem,min(6vw,10svh),6rem)] leading-[0.9] font-semibold text-balance"
            >
              Sound that stays out of your way.
            </h1>
            <p
              data-reveal
              className="mt-5 max-w-sm text-base text-ink-soft side:text-lg short:mt-2 short:text-sm"
            >
              Over-ear wireless headphones with adaptive noise cancelling. From €349.
            </p>
            <div data-reveal className="mt-7 flex flex-wrap items-center gap-3 short:mt-3">
              <Link
                href="/configure"
                className="rounded-full bg-ink px-6 py-3 font-semibold text-white transition hover:bg-black"
              >
                Configure yours
              </Link>
              <a
                href="#comfort"
                className="rounded-full px-4 py-3 text-ink-soft underline-offset-4 hover:underline"
              >
                Scroll to explore
              </a>
            </div>
            <LoadingIndicator />
          </div>
        </div>
      </div>
    </section>
  );
}
