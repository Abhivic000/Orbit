"use client";

import { useEffect } from "react";
import { useScene, type SceneMode as Mode } from "@/lib/sceneState";

/** A page declares which "set" the shared canvas should dress. */
export function SceneMode({ mode }: { mode: Mode }) {
  useEffect(() => {
    useScene.getState().setMode(mode);
    document.documentElement.dataset.mode = mode;
  }, [mode]);
  return null;
}
