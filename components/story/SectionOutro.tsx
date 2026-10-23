import { ConfigureLink } from "./ConfigureLink";
import { SPECS } from "@/lib/product";
import { SpecList } from "./StorySection";

export function SectionOutro() {
  return (
    <section
      id="outro"
      data-section="outro"
      aria-labelledby="outro-title"
      className="relative"
      style={{ height: "200vh" }}
    >
      <div className="sticky top-0 flex h-dvh items-end">
        <div className="mx-auto w-full max-w-7xl px-5 pb-8 sm:px-8 side:grid side:grid-cols-12 side:items-end side:gap-6 side:pb-12 short:pb-6">
          <div className="side:col-span-5">
            <h2
              id="outro-title"
              data-reveal
              data-headline
              className="font-display text-[clamp(2rem,min(5vw,6.5svh),3.5rem)] leading-[0.95] font-semibold"
            >
              Make it yours.
            </h2>
            <div data-reveal className="mt-6 short:mt-3">
              <ConfigureLink />
            </div>
          </div>
          <div className="mt-6 side:col-span-5 side:col-start-8 side:mt-0">
            <SpecList items={SPECS} />
          </div>
        </div>
      </div>
    </section>
  );
}
