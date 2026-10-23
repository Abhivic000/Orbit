// The bridge between GSAP and three.js.
//
// GSAP (scroll timeline, button tweens) writes plain numbers into this object.
// `useFrame` consumers (Rig, Headphones, AncShell…) read them every frame and
// apply them to three objects. Nothing here is React state, so scrolling never
// re-renders React — the render loop just reads numbers.
//
// Java analogy: the timeline is a producer, useFrame is the consumer loop, and
// this object is the shared buffer between them.

export type Vec3 = { x: number; y: number; z: number };

export const rig = {
  /** Camera position + look-at target (story mode). */
  camera: { x: 0, y: 0.15, z: 4.2 } as Vec3,
  target: { x: 0, y: -0.02, z: 0 } as Vec3,
  /**
   * Screen-space shift of the whole image, as a fraction of the viewport
   * (x: + moves the model right, y: + moves it up). Implemented with
   * camera.setViewOffset so orbiting still pivots around the model.
   */
  shift: { x: 0, y: 0 },
  /**
   * Width (model units) the current shot must fit on screen. The Rig pulls the
   * camera back when the viewport is too narrow for it (phones, portrait).
   */
  frameWidth: 1.3,
  /** Model transform driven by scroll. */
  model: { rotX: 0, rotY: 0, rotZ: 0, y: 0 },
  /** 0 → assembled, 1 → fully exploded. Parts stagger off this value. */
  explode: 0,
  /** Opacity of the exploded-view callouts. */
  labels: 0,
  /** ANC shader strength 0 → 1 (uStrength). */
  anc: 0,
  /** Extra sheen on the ear cushions for the Comfort beat. */
  sheen: 0,
  /** 1 while the hero turntable + cursor tilt are active; fades to 0 on scroll. */
  hero: 1,
  /** Extra Y rotation for the "Add to bag" spin (radians). */
  spin: 0,
  /** Capture mode for fallback stills: centred framing, no turntable/tilt. */
  still: false,
};

export type Rig = typeof rig;
