import { create } from "zustand";
import type { Tier } from "./quality";

// Which "set" the single canvas is dressing. Pages declare their mode with
// <SceneMode/>; the canvas persists across routes (no WebGL context re-creation).
export type SceneMode = "story" | "configure" | "capture";

type SceneStore = {
  mode: SceneMode;
  tier: Tier | "pending";
  /** Story: true while the Colours beat is active (backdrop follows colourway). */
  storyTint: boolean;
  /** Story: section the user is currently in (for DOM a11y + labels). */
  section: string;
  /** Asset loading, bridged from drei useProgress inside the canvas. */
  loading: { progress: number; done: boolean };
  setMode: (m: SceneMode) => void;
  setTier: (t: Tier) => void;
  setStoryTint: (on: boolean) => void;
  setSection: (s: string) => void;
  setLoading: (l: { progress: number; done: boolean }) => void;
};

export const useScene = create<SceneStore>()((set) => ({
  mode: "story",
  tier: "pending",
  storyTint: false,
  section: "hero",
  loading: { progress: 0, done: false },
  setMode: (mode) => set({ mode }),
  setTier: (tier) => set({ tier }),
  setStoryTint: (storyTint) => set({ storyTint }),
  setSection: (section) => set({ section }),
  setLoading: (loading) => set({ loading }),
}));
