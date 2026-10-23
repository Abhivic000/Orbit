import { ColourList } from "./ColourList";
import { Body, Eyebrow, Headline, StorySection } from "./StorySection";

export function SectionColours() {
  return (
    <StorySection id="colours" length={3} side="left" labelledBy="colours-title">
      <Eyebrow>Colours</Eyebrow>
      <Headline id="colours-title">Four colours. One studio.</Headline>
      <Body>Scroll through them, or pick one.</Body>
      <ColourList />
    </StorySection>
  );
}
