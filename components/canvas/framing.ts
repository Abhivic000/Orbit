import { MathUtils, type PerspectiveCamera } from "three";

/**
 * Smallest camera distance at which a subject `width × height` (model units)
 * fits inside `shareW × shareH` of the viewport. Checking both axes matters:
 * portrait phones are width-limited, landscape phones are height-limited.
 */
export function minDistanceToFit(
  camera: PerspectiveCamera,
  subject: { width: number; height: number },
  share: { w: number; h: number },
) {
  const tanHalf = Math.tan(MathUtils.degToRad(camera.fov / 2));
  const byHeight = subject.height / (2 * tanHalf * share.h);
  const byWidth = subject.width / (2 * tanHalf * camera.aspect * share.w);
  return Math.max(byHeight, byWidth);
}

/**
 * How much of the screen the model may use in each layout (lib/layout.ts).
 * Side-by-side: the half not covered by copy, minus header/margins.
 * Stacked: full width, but only the band above the copy.
 */
export const STORY_SHARE = {
  side: { w: 0.5, h: 0.72 },
  stacked: { w: 0.88, h: 0.38 },
  still: { w: 0.8, h: 0.8 },
} as const;
