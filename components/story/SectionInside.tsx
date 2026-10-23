import { CALLOUTS } from "@/lib/parts";
import { Body, Eyebrow, Headline, SpecList, StorySection } from "./StorySection";

export function SectionInside() {
  return (
    <StorySection id="inside" length={3.2} side="left" labelledBy="inside-title">
      <Eyebrow>Inside</Eyebrow>
      <Headline id="inside-title">Built around a 40&nbsp;mm driver.</Headline>
      <Body>
        Bio-cellulose cones for low distortion at any volume, and a battery that outlasts the week.
      </Body>
      <SpecList
        items={[
          { term: "Drivers", value: "40 mm dynamic" },
          { term: "Frequency", value: "4 Hz – 40 kHz" },
          { term: "Battery", value: "40 h with ANC on" },
          { term: "Charging", value: "10 min = 5 h" },
        ]}
      />
      {/* DOM equivalent of the exploded-view callouts, for screen readers. */}
      <ul className="sr-only">
        {CALLOUTS.map((c) => (
          <li key={c.id}>
            {c.title}: {c.detail}
          </li>
        ))}
      </ul>
    </StorySection>
  );
}
