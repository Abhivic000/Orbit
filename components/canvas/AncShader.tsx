"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { AdditiveBlending, Color, ShaderMaterial, SphereGeometry, type Group } from "three";
import { rig } from "@/lib/rig";
import { SHADOW_SKIP_LAYER } from "./layers";
import fragmentShader from "@/shaders/anc.frag.glsl";
import vertexShader from "@/shaders/anc.vert.glsl";

/**
 * Noise-cancelling visual: a transparent, rippling shell around each ear cup.
 *
 * Uniforms (JS → GPU, same value for every vertex/pixel in a frame):
 *   uTime     – advances every frame (the only one that changes constantly)
 *   uStrength – scroll-driven 0 → 1 from the timeline (rig.anc)
 *   uColor    – ring tint
 *   uBands / uSpeed – ring count and speed
 */
export function createAncMaterial() {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uStrength: { value: 0 },
      uColor: { value: new Color("#3d6fe6") },
      uBands: { value: 3.5 },
      uSpeed: { value: 0.45 },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
}

// One material + geometry shared by both shells (2 draw calls, 1 shader program).
// Module-level like lib/materials.ts: created once, uniforms mutated per frame.
let shared: { material: ShaderMaterial; geometry: SphereGeometry } | null = null;
function getShell() {
  shared ??= { material: createAncMaterial(), geometry: new SphereGeometry(1, 48, 32) };
  return shared;
}
function disposeShell() {
  shared?.material.dispose();
  shared?.geometry.dispose();
  shared = null;
}
/** Advance the ripple. uTime is the only uniform that changes every frame. */
function tickShell(delta: number, strength: number) {
  if (!shared) return;
  shared.material.uniforms.uTime!.value += delta;
  shared.material.uniforms.uStrength!.value = strength;
}

// Cup centres + the shell's squash (model units; cups face ±x).
const CUP = { x: 0.37, y: -0.25, scale: [0.2, 0.33, 0.24] as const };

export function AncShells() {
  const group = useRef<Group>(null);
  const { material, geometry } = getShell();
  useEffect(() => disposeShell, []);

  useFrame((_, delta) => {
    const on = rig.anc > 0.001;
    if (group.current) group.current.visible = on; // no draw calls while off
    if (!on) return;
    tickShell(delta, rig.anc);
  });

  return (
    <group ref={group} visible={false}>
      {/* Right cup: local +x already points out of the cup. */}
      <mesh
        layers={SHADOW_SKIP_LAYER}
        geometry={geometry}
        material={material}
        position={[CUP.x, CUP.y, 0]}
        scale={[...CUP.scale]}
      />
      {/* Left cup: turn half a revolution so the ripple pole faces outward too
          (a negative scale would flip the triangle winding). */}
      <mesh
        layers={SHADOW_SKIP_LAYER}
        geometry={geometry}
        material={material}
        position={[-CUP.x, CUP.y, 0]}
        rotation={[0, Math.PI, 0]}
        scale={[...CUP.scale]}
      />
    </group>
  );
}
