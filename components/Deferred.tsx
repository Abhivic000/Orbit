"use client";

import dynamic from "next/dynamic";

// Scroll machinery (Lenis, ScrollTrigger, the story timeline) isn't needed to
// paint the hero, so it loads as separate chunks after hydration instead of
// sitting in the first-load bundle in front of the LCP.
export const SmoothScroll = dynamic(() => import("./SmoothScroll").then((m) => m.SmoothScroll), {
  ssr: false,
});

export const StoryTimeline = dynamic(
  () => import("./story/StoryTimeline").then((m) => m.StoryTimeline),
  { ssr: false },
);
