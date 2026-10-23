"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { MathUtils, Vector3, type PerspectiveCamera } from "three";
import { isSideBySide } from "@/lib/layout";
import { rig } from "@/lib/rig";
import { STORY_SHARE, minDistanceToFit } from "./framing";
import { applyViewShift } from "./viewOffset";

/**
 * Story camera rig. The scroll timeline (lib/timeline.ts) tweens plain numbers
 * on `rig`; here we read them every frame and damp the camera toward them.
 * Damping (instead of snapping) hides the steps between wheel ticks and makes
 * touch scrolling feel continuous.
 */
export function Rig() {
  const get = useThree((s) => s.get);
  const target = useRef(new Vector3(rig.target.x, rig.target.y, rig.target.z));
  const shift = useRef({ x: rig.shift.x, y: rig.shift.y });
  const desired = useRef(new Vector3());

  // Jump straight to the current rig pose when entering story mode.
  useEffect(() => {
    const camera = get().camera;
    camera.position.set(rig.camera.x, rig.camera.y, rig.camera.z);
    target.current.set(rig.target.x, rig.target.y, rig.target.z);
    shift.current = { ...rig.shift };
    camera.lookAt(target.current);
  }, [get]);

  useFrame(({ camera, size }, delta) => {
    const dt = Math.min(delta, 0.1);
    const k = 6; // higher = snappier
    const cam = camera as PerspectiveCamera;

    // Responsive framing: pull back along the view direction until the shot
    // fits the part of the screen the model gets in this layout — width AND
    // height, so neither portrait phones nor landscape phones crop it.
    const share = rig.still
      ? STORY_SHARE.still
      : isSideBySide(size.width, size.height)
        ? STORY_SHARE.side
        : STORY_SHARE.stacked;
    const minDist = minDistanceToFit(
      cam,
      {
        // Exploded parts spread sideways; the headband lifts.
        width: rig.frameWidth + 1.1 * rig.explode,
        height: rig.frameWidth * 0.8 + 0.3 * rig.explode,
      },
      share,
    );
    const dx = rig.camera.x - rig.target.x;
    const dy = rig.camera.y - rig.target.y;
    const dz = rig.camera.z - rig.target.z;
    const fit = Math.max(1, minDist / Math.hypot(dx, dy, dz));
    const goal = desired.current.set(
      rig.target.x + dx * fit,
      rig.target.y + dy * fit,
      rig.target.z + dz * fit,
    );

    camera.position.x = MathUtils.damp(camera.position.x, goal.x, k, dt);
    camera.position.y = MathUtils.damp(camera.position.y, goal.y, k, dt);
    camera.position.z = MathUtils.damp(camera.position.z, goal.z, k, dt);
    target.current.x = MathUtils.damp(target.current.x, rig.target.x, k, dt);
    target.current.y = MathUtils.damp(target.current.y, rig.target.y, k, dt);
    target.current.z = MathUtils.damp(target.current.z, rig.target.z, k, dt);
    camera.lookAt(target.current);

    shift.current.x = MathUtils.damp(shift.current.x, rig.still ? 0 : rig.shift.x, k, dt);
    shift.current.y = MathUtils.damp(shift.current.y, rig.still ? 0 : rig.shift.y, k, dt);
    applyViewShift(cam, size.width, size.height, shift.current.x, shift.current.y);
  });

  return null;
}
