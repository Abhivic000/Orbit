import type { ReactNode } from "react";
import type { SectionId } from "@/lib/timeline";
import { FallbackStill } from "@/components/Fallback";

type Props = {
  id: SectionId;
  /** Section length in viewport heights. The stage is pinned for (length − 1). */
  length: number;
  /** Which side the copy sits on (side-by-side layout). The model takes the other side. */
  side: "left" | "right";
  labelledBy: string;
  children: ReactNode;
};

/**
 * A story beat. The outer block is `length × 100vh` tall; the inner stage is
 * `position: sticky`, so it stays pinned while the master timeline plays the
 * beat, then scrolls away as the next section arrives. (Sticky is the
 * browser-native pin: no spacer elements or fixed-position swaps.)
 *
 * Side-by-side (`side:` — wide or landscape screens): copy in 5 columns,
 * vertically centred; the camera frames the model in the other 7.
 * Stacked (portrait phones/tablets): copy anchored to the bottom, the camera
 * frames the model in the space above it.
 */
export function StorySection({ id, length, side, labelledBy, children }: Props) {
  return (
    <section
      id={id}
      data-section={id}
      aria-labelledby={labelledBy}
      className="relative"
      style={{ height: `${length * 100}vh` }}
    >
      <div className="sticky top-0 flex h-dvh items-end side:items-center">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-12 gap-6 px-5 pb-8 sm:px-8 side:pt-16 side:pb-0">
          <div
            className={`col-span-12 max-w-xl side:col-span-5 side:max-w-none ${
              side === "right" ? "side:col-start-8" : "side:col-start-1"
            }`}
          >
            <FallbackStill section={id} />
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p
      data-reveal
      className="mb-3 text-sm font-semibold tracking-[0.18em] text-ink-soft uppercase short:mb-1.5 short:text-xs"
    >
      {children}
    </p>
  );
}

/**
 * Fluid size: tracks the viewport width but is also capped by its height, so
 * a landscape phone or a short laptop window never gets a headline taller
 * than the screen.
 */
export function Headline({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      data-reveal
      data-headline
      className="font-display text-[clamp(2rem,min(5vw,6.5svh),3.5rem)] leading-[0.95] font-semibold text-balance"
    >
      {children}
    </h2>
  );
}

export function Body({ children }: { children: ReactNode }) {
  return (
    <p
      data-reveal
      className="mt-4 max-w-md text-base text-ink-soft side:text-lg short:mt-2 short:text-sm"
    >
      {children}
    </p>
  );
}

/** Specs as a definition list with tabular figures (not a grid of stat cards). */
export function SpecList({ items }: { items: { term: string; value: string }[] }) {
  return (
    <dl
      data-reveal
      // Hidden when there's no vertical room; the same specs close the story.
      className="mt-6 grid max-w-md grid-cols-[auto_1fr] gap-x-8 gap-y-1.5 border-t border-ink/15 pt-4 text-sm tabular-nums short:hidden"
    >
      {items.map((s) => (
        <div key={s.term} className="contents">
          <dt className="text-ink-soft">{s.term}</dt>
          <dd className="font-medium">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
