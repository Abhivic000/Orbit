import { Body, Eyebrow, Headline, SpecList, StorySection } from "./StorySection";

export function SectionQuiet() {
  return (
    <StorySection id="quiet" length={2.4} side="right" labelledBy="quiet-title">
      <Eyebrow>Noise cancelling</Eyebrow>
      <Headline id="quiet-title">Quiet, on your terms.</Headline>
      <Body>
        Six microphones listen to the room 50,000 times a second and cancel what you don&rsquo;t
        want to hear. Tap once for transparency.
      </Body>
      <SpecList
        items={[
          { term: "Microphones", value: "6" },
          { term: "Modes", value: "ANC · Transparency · Off" },
          { term: "Attenuation", value: "Up to 35 dB" },
        ]}
      />
    </StorySection>
  );
}
