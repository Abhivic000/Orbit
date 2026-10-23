import type { PerspectiveCamera } from "three";

/**
 * Shift the rendered image by a fraction of the viewport without moving the
 * camera: x > 0 moves the subject right, y > 0 moves it up. Because only the
 * projection changes, OrbitControls still pivots around the model.
 */
export function applyViewShift(
  camera: PerspectiveCamera,
  width: number,
  height: number,
  sx: number,
  sy: number,
) {
  if (Math.abs(sx) < 1e-4 && Math.abs(sy) < 1e-4) {
    if (camera.view?.enabled) camera.clearViewOffset();
    return;
  }
  camera.setViewOffset(width, height, -sx * width, sy * height, width, height);
}
