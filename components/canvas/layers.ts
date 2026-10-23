/**
 * Objects on this layer are drawn by the main camera but skipped by the
 * ContactShadows pass (which re-renders the scene from below every frame).
 * Tiny parts and the hidden internals add draw calls but no visible shadow.
 */
export const SHADOW_SKIP_LAYER = 1;
