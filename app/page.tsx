import { Footer } from "@/components/Footer";
import { SceneMode } from "@/components/SceneMode";
import { SectionColours } from "@/components/story/SectionColours";
import { SectionComfort } from "@/components/story/SectionComfort";
import { SectionHero } from "@/components/story/SectionHero";
import { SectionInside } from "@/components/story/SectionInside";
import { SectionOutro } from "@/components/story/SectionOutro";
import { SectionQuiet } from "@/components/story/SectionQuiet";
import { StoryTimeline } from "@/components/Deferred";

// The story page. Sections are server components; the scroll timeline and the
// shared canvas are client islands.
export default function Home() {
  return (
    <>
      <main id="main" className="relative z-10">
        <SceneMode mode="story" />
        <StoryTimeline />
        <div id="story">
          <SectionHero />
          <SectionComfort />
          <SectionInside />
          <SectionQuiet />
          <SectionColours />
          <SectionOutro />
        </div>
      </main>
      <Footer />
    </>
  );
}
