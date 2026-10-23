"use client";

import {
  ContactShadows,
  Environment,
  PerformanceMonitor,
  Preload,
  useGLTF,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Color, SRGBColorSpace } from "three";
import { frame } from "@/lib/frame";
import { TIER_SETTINGS } from "@/lib/quality";
import { rig } from "@/lib/rig";
import { useScene } from "@/lib/sceneState";
import { sweep, syncSweepFromCss } from "@/lib/sweep";
import { AncShells } from "./AncShader";
import { calloutAttachments } from "./Callouts";
import { ConfigureRig } from "./ConfigureRig";
import { Effects } from "./Effects";
import { DRACO_PATH, Headphones, MODEL_URL, SHADOW_SKIP_LAYER } from "./Headphones";
import { Hotspots } from "./Hotspots";
import { ModelRig } from "./ModelRig";
import { Perf } from "./Perf";
import { ProgressBridge } from "./ProgressBridge";
import { Rig } from "./Rig";
import { StatsProbe } from "./StatsProbe";

/**
 * The backdrop follows the CSS --sweep variable via the shared sRGB colour.
 * scene.background (not gl.setClearColor) so ContactShadows, which nulls the
 * background for its own pass, still clears its render target to transparent.
 */
function Backdrop() {
  const get = useThree((s) => s.get);
  const color = useMemo(() => new Color(), []);
  useEffect(() => {
    syncSweepFromCss();
    const { scene } = get();
    scene.background = color;
    return () => {
      scene.background = null;
    };
  }, [get, color]);
  useFrame(() => {
    color.setRGB(sweep.r, sweep.g, sweep.b, SRGBColorSpace);
  });
  return null;
}

// Exploded-view labels ride on their parts (story only).
const STORY_ATTACH = calloutAttachments();

export default function Scene() {
  const mode = useScene((s) => s.mode);
  const tier = useScene((s) => s.tier);
  // Assets (model texture size, HDRI) are chosen once from the initial tier;
  // swapping them later would mean a re-download. Runtime changes only touch
  // DPR, effects and shadow resolution.
  const [assets] = useState(
    () => TIER_SETTINGS[useScene.getState().tier === "high" ? "high" : "low"],
  );
  const live = TIER_SETTINGS[tier === "high" ? "high" : "low"];
  const [dpr, setDpr] = useState(live.dpr[1]);
  const modelUrl = MODEL_URL[assets.model];
  useGLTF.preload(modelUrl, DRACO_PATH);

  return (
    <Canvas
      className="pointer-events-auto!"
      dpr={dpr}
      // A long lens (small fov) flattens perspective like a product photo.
      camera={{ position: [0, 0.15, 4.2], fov: 26, near: 0.1, far: 40 }}
      // MSAA only on low; high anti-aliases with SMAA in the composer.
      gl={{ antialias: !assets.effects, powerPreference: "high-performance" }}
      onCreated={({ invalidate, camera }) => {
        frame.invalidate = invalidate;
        // The main camera sees the shadow-skip layer; the ContactShadows camera doesn't.
        camera.layers.enable(SHADOW_SKIP_LAYER);
      }}
    >
      {/* Adaptive quality: watch the frame rate and scale DPR between the
          tier's bounds; a sustained decline drops high → low (no effects).
          Story only — the configurator renders on demand, so its frame rate
          says nothing about the device. Off in still-capture mode. */}
      {mode === "story" && !rig.still && (
        <PerformanceMonitor
          flipflops={3}
          onChange={({ factor }) => {
            const [min, max] =
              TIER_SETTINGS[useScene.getState().tier === "high" ? "high" : "low"].dpr;
            setDpr(Math.round((min + (max - min) * factor) * 4) / 4);
          }}
          onDecline={() => {
            if (useScene.getState().tier === "high") useScene.getState().setTier("low");
          }}
          onFallback={() => setDpr(1)}
        />
      )}

      <Backdrop />
      <Suspense fallback={null}>
        <Environment files={assets.hdri} environmentIntensity={0.85} />
      </Suspense>
      {/* One soft key light from upper left-front; the HDRI does the fill. */}
      <directionalLight position={[-2.5, 3.5, 3]} intensity={1.4} />

      <Suspense fallback={null}>
        <ModelRig>
          <Headphones url={modelUrl} attach={mode === "story" ? STORY_ATTACH : undefined} />
          {mode === "story" && <AncShells />}
        </ModelRig>
        <Preload all />
      </Suspense>

      <ContactShadows
        key={live.shadowResolution}
        position={[0, -0.62, 0]}
        opacity={0.42}
        scale={3.2}
        blur={2.6}
        far={1.4}
        resolution={live.shadowResolution}
        color="#3b414a"
      />

      {mode === "configure" ? (
        <>
          <ConfigureRig />
          <Hotspots />
        </>
      ) : (
        <Rig />
      )}
      {live.effects && <Effects bloom={mode !== "configure"} />}
      <ProgressBridge />
      <Perf />
      <StatsProbe />
    </Canvas>
  );
}
