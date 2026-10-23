"use client";

import { Bloom, EffectComposer, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";

/**
 * Postprocessing — HIGH TIER ONLY (each pass is a full-screen draw, which is
 * expensive on phones). Subtle: bloom only catches the brightest highlights
 * on the metal, a soft vignette, and SMAA instead of MSAA.
 *
 * Rendering through the composer skips three's built-in tone mapping (it is
 * only applied when drawing straight to the screen), so ToneMapping re-applies
 * ACES Filmic to match the low tier.
 */
export function Effects({ bloom = true }: { bloom?: boolean }) {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {/* The mipmap blur chain is ~16 extra passes; the configurator skips
          bloom to stay under its 60 draw-call budget. */}
      {bloom ? (
        <Bloom
          mipmapBlur
          luminanceThreshold={0.92}
          luminanceSmoothing={0.1}
          intensity={0.35}
          radius={0.6}
        />
      ) : (
        <></>
      )}
      <Vignette offset={0.3} darkness={0.32} eskil={false} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <SMAA />
    </EffectComposer>
  );
}
