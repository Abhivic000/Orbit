"use client";

import { OrbitControls } from "@react-three/drei";
import { invalidate, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import type { PerspectiveCamera } from "three";
import { useConfig } from "@/lib/configState";
import { HOTSPOTS } from "@/lib/parts";
import { rig } from "@/lib/rig";
import { isSideBySide } from "@/lib/layout";
import { minDistanceToFit } from "./framing";
import { applyViewShift } from "./viewOffset";

const HOME = { camera: [1.1, 0.35, 3.4] as const, target: [0, -0.04, 0] as const };
const HOME_DIST = Math.hypot(...HOME.camera.map((v, i) => v - HOME.target[i]!));

/** Camera position `p` pushed back from `t` by `fit` (keeps the viewing angle). */
const scaled = (p: readonly number[], t: readonly number[], fit: number) =>
  p.map((v, i) => t[i]! + (v - t[i]!) * fit) as [number, number, number];

/**
 * Configurator camera: free orbit, render-on-demand, hotspot fly-to and the
 * "Add to bag" spin. Every animation calls invalidate() per step because the
 * canvas only draws when asked.
 */
export function ConfigureRig() {
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const setFrameloop = useThree((s) => s.setFrameloop);
  // ≥ 1: how much further back than HOME the camera must sit to fit the model
  // into its area on this screen (see the size effect below).
  const fit = useRef(1);

  // Render on demand while idle; restore the continuous loop for the story.
  useEffect(() => {
    rig.hero = 0;
    rig.explode = 0;
    rig.anc = 0;
    rig.labels = 0;
    rig.sheen = 0;
    rig.model = { rotX: 0, rotY: 0, rotZ: 0, y: 0 };
    camera.position.set(...HOME.camera);
    controls.current?.target.set(...HOME.target);
    controls.current?.update();
    setFrameloop("demand");
    invalidate();
    return () => setFrameloop("always");
  }, [camera, setFrameloop]);

  // Layout-aware framing (same rule as the picker, lib/layout.ts):
  //   side-by-side → model centred in the left 2/3
  //   stacked      → model in the band above the bottom bar
  // and back the camera off until the whole model fits that area.
  useEffect(() => {
    const side = isSideBySide(size.width, size.height);
    if (rig.still) applyViewShift(camera, size.width, size.height, 0, 0);
    else applyViewShift(camera, size.width, size.height, side ? -1 / 6 : 0, side ? 0 : 0.14);
    const share = rig.still ? { w: 0.8, h: 0.8 } : side ? { w: 0.6, h: 0.78 } : { w: 0.9, h: 0.5 };
    fit.current = Math.max(
      1,
      minDistanceToFit(camera, { width: 1.3, height: 1.1 }, share) / HOME_DIST,
    );
    if (useConfig.getState().hotspot === null) {
      camera.position.set(...scaled(HOME.camera, HOME.target, fit.current));
      controls.current?.update();
    }
    if (controls.current) controls.current.maxDistance = 6 * fit.current;
    invalidate();
  }, [camera, size]);

  // Hotspot select → fly the camera; null → reset view.
  useEffect(() => {
    const fly = (id: string | null) => {
      const ctl = controls.current;
      if (!ctl) return;
      const hs = HOTSPOTS.find((h) => h.id === id);
      // Look between the model centre and the hotspot so orbiting still feels anchored.
      const tgt = hs ? hs.anchor.map((v) => v * 0.55) : HOME.target;
      // Narrow screens pull every shot back by the same fit factor.
      const cam = scaled(hs ? hs.camera : HOME.camera, tgt, fit.current);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const opts = { duration: reduce ? 0 : 1.1, ease: "power2.inOut", overwrite: true as const };
      gsap.to(camera.position, { x: cam[0], y: cam[1], z: cam[2], ...opts, onUpdate: invalidate });
      gsap.to(ctl.target, {
        x: tgt[0],
        y: tgt[1],
        z: tgt[2],
        ...opts,
        onUpdate: () => {
          ctl.update();
          invalidate();
        },
      });
    };
    return useConfig.subscribe((s, prev) => {
      if (s.hotspot !== prev.hotspot) fly(s.hotspot);
      if (s.bagPulse !== prev.bagPulse) {
        // One 360° spin with a soft overshoot.
        gsap.fromTo(
          rig,
          { spin: 0 },
          {
            spin: Math.PI * 2,
            duration: 1.2,
            ease: "back.out(1.6)",
            overwrite: true,
            onUpdate: invalidate,
          },
        );
      }
    });
  }, [camera]);

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      minDistance={1.5}
      maxDistance={6}
      minPolarAngle={Math.PI * 0.18}
      maxPolarAngle={Math.PI * 0.62}
    />
  );
}
