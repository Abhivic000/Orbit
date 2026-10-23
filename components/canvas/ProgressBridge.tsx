"use client";

import { useProgress } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { useScene } from "@/lib/sceneState";

/**
 * Copies drei's real loader progress into the app store for the DOM indicator.
 *
 * Also requests frames as assets land. With frameloop="demand" (configurator)
 * nothing redraws on its own, and <Environment> assigns scene.environment in
 * an effect that doesn't invalidate — without this the last frame could be
 * the one drawn before the HDRI arrived (a dark model until the first drag).
 */
export function ProgressBridge() {
  const { progress, active, total } = useProgress();
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    useScene.getState().setLoading({ progress, done: !active && total > 0 && progress >= 100 });
    invalidate();
    // Effects that apply loaded assets run after this commit; draw again shortly after.
    const t1 = setTimeout(invalidate, 100);
    const t2 = setTimeout(invalidate, 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [progress, active, total, invalidate]);
  return null;
}
