"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, type ReactNode } from "react";
import { MathUtils, type Group } from "three";
import { rig } from "@/lib/rig";

const TURNTABLE_SPEED = (Math.PI * 2) / 20; // one revolution per ~20 s
const TILT = 0.12; // max cursor tilt (radians)

/**
 * Applies model transforms from the rig every frame:
 *   outer  → scroll-driven rotation/position (GSAP timeline writes rig.model)
 *   spin   → hero turntable (fades with rig.hero) + "Add to bag" spin (rig.spin)
 *   tilt   → slight lean toward the cursor (desktop, hero only)
 * All mutation, no React state.
 */
export function ModelRig({ children }: { children: ReactNode }) {
  const outer = useRef<Group>(null);
  const spin = useRef<Group>(null);
  const tilt = useRef<Group>(null);
  const state = useRef({ angle: 0, speed: TURNTABLE_SPEED, stopped: false, px: 0, py: 0 });

  useEffect(() => {
    const s = state.current;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const stop = () => {
      s.stopped = true;
    };
    const move = (e: PointerEvent) => {
      if (!fine) return;
      s.px = (e.clientX / window.innerWidth) * 2 - 1;
      s.py = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointerdown", stop, { passive: true });
    window.addEventListener("keydown", stop, { passive: true });
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", stop);
      window.removeEventListener("keydown", stop);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("pointermove", move);
    };
  }, []);

  useFrame((_, delta) => {
    const s = state.current;
    const dt = Math.min(delta, 0.1);
    // Ease the turntable to a halt after the first interaction (no snap).
    s.speed = MathUtils.damp(s.speed, s.stopped ? 0 : TURNTABLE_SPEED, 2, dt);
    if (rig.hero > 0.99 && !rig.still) s.angle += s.speed * dt;
    // Keep the angle in (-π, π] so fading rig.hero unwinds the short way round.
    s.angle = MathUtils.euclideanModulo(s.angle + Math.PI, Math.PI * 2) - Math.PI;

    if (outer.current) {
      outer.current.rotation.set(rig.model.rotX, rig.model.rotY, rig.model.rotZ);
      outer.current.position.y = rig.model.y;
    }
    if (spin.current) spin.current.rotation.y = s.angle * rig.hero + rig.spin;
    if (tilt.current) {
      const w = rig.still ? 0 : rig.hero;
      const tx = s.py * TILT * w;
      const ty = s.px * TILT * w;
      tilt.current.rotation.x = MathUtils.damp(tilt.current.rotation.x, tx, 4, dt);
      tilt.current.rotation.y = MathUtils.damp(tilt.current.rotation.y, ty, 4, dt);
    }
  });

  return (
    <group ref={outer}>
      <group ref={spin}>
        <group ref={tilt}>{children}</group>
      </group>
    </group>
  );
}
