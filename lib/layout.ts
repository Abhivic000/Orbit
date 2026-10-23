// One layout rule shared by CSS (the `side:` Tailwind variant in globals.css),
// GSAP (matchMedia) and the camera rigs, so DOM and 3D always agree:
//
//   side-by-side → wide screens (≥ 1024px) OR any landscape screen (phones on
//                  their side, small laptops): copy on one side, model on the other.
//   stacked      → portrait phones and tablets: model on top, copy below.

export const SIDE_BY_SIDE_QUERY = "(min-width: 1024px), (min-aspect-ratio: 6/5)";
export const STACKED_QUERY = "(max-width: 1023.98px) and (max-aspect-ratio: 6/5)";

export function isSideBySide(width: number, height: number) {
  return width >= 1024 || width / height >= 1.2;
}
