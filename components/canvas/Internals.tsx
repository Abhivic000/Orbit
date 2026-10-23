"use client";

import { RoundedBox } from "@react-three/drei";
import type { ReactNode } from "react";
import type { Object3D } from "three";
import type { HaloMaterials } from "@/lib/materials";
import { BATTERY, DRIVER } from "@/lib/parts";
import { SHADOW_SKIP_LAYER } from "./layers";

// The source model is a shell with no internals, so the exploded view adds
// simple procedural ones: a 40 mm driver per cup and a battery in the right
// cup. They sit hidden inside the housing until the parts separate.

type Props = {
  materials: HaloMaterials;
  register: (name: string, base: [number, number, number]) => (o: Object3D | null) => void;
  attach: Partial<Record<string, ReactNode>>;
};

function Driver({
  name,
  side,
  materials,
  register,
  attach,
}: Props & { name: string; side: 1 | -1 }) {
  const pos: [number, number, number] = [DRIVER.x * side, DRIVER.y, 0];
  const r = DRIVER.radius;
  return (
    // Rotate so the cylinder axis (y) points along ±x, out of the cup.
    <group name={name} ref={register(name, pos)} position={pos}>
      <group rotation={[0, 0, (-Math.PI / 2) * side]}>
        {/* Frame ring */}
        <mesh layers={SHADOW_SKIP_LAYER} material={materials.metal}>
          <cylinderGeometry args={[r, r * 0.92, 0.018, 40, 1, true]} />
        </mesh>
        {/* Cone (membrane) + dust cap, one draw call with the dark material */}
        <mesh layers={SHADOW_SKIP_LAYER} material={materials.driver} position={[0, 0.004, 0]}>
          <coneGeometry args={[r * 0.92, 0.035, 40, 1, true]} />
        </mesh>
        <mesh layers={SHADOW_SKIP_LAYER} material={materials.metal} position={[0, -0.012, 0]}>
          <cylinderGeometry args={[r * 0.38, r * 0.38, 0.03, 24]} />
        </mesh>
      </group>
      {attach[name]}
    </group>
  );
}

export function Internals(props: Props) {
  const { materials, register, attach } = props;
  const bpos: [number, number, number] = [BATTERY.x, BATTERY.y, 0];
  return (
    <>
      <Driver {...props} name="Driver_L" side={-1} />
      <Driver {...props} name="Driver_R" side={1} />
      <group name="Battery" ref={register("Battery", bpos)} position={bpos}>
        <RoundedBox
          layers={SHADOW_SKIP_LAYER}
          args={[...BATTERY.size]}
          radius={0.012}
          smoothness={2}
          material={materials.trim}
        />
        {attach.Battery}
      </group>
    </>
  );
}
