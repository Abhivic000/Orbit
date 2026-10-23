import { Body, Eyebrow, Headline, SpecList, StorySection } from "./StorySection";

export function SectionComfort() {
  return (
    <StorySection id="comfort" length={2.4} side="right" labelledBy="comfort-title">
      <Eyebrow>Comfort</Eyebrow>
      <Headline id="comfort-title">Forget you&rsquo;re wearing them.</Headline>
      <Body>
        Slow-recovery memory foam spreads the pressure evenly, so a long flight feels like a short
        one.
      </Body>
      <SpecList
        items={[
          { term: "Weight", value: "254 g" },
          { term: "Clamp force", value: "4.2 N" },
          { term: "Cushions", value: "Memory foam, protein leather" },
        ]}
      />
    </StorySection>
  );
}
