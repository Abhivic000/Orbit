import gsap from "gsap";
import { rig, type Rig } from "./rig";

export { partOffset, partProgress } from "./explode";

// The story's master timeline.
//
// One timeline, scrubbed by one ScrollTrigger over the whole story. Its time
// unit is "viewport heights scrolled", so a tween at position 3.2 plays when
// the page has scrolled 3.2 × 100vh. Each section is a tall block with a
// sticky (pinned) inner stage: the pose for a section holds while it is
// pinned, its beat (explode, ANC…) plays across the pin, and the camera moves
// to the next pose during the last viewport of scroll, while the next section
// slides in.
//
// GSAP only writes plain numbers onto `rig`; the R3F Rig/ModelRig/Headphones
// read them in useFrame. React never re-renders while scrolling.

type Pose = {
  camera: [number, number, number];
  target: [number, number, number];
  /** Desktop horizontal framing (+ = model on the right). */
  shiftX: number;
  /** Desktop vertical framing (+ = model higher). Mobile always lifts the model. */
  shiftY?: number;
  /** Width of the subject in this shot (see rig.frameWidth). */
  frameWidth?: number;
  model: { rotX?: number; rotY: number; rotZ?: number; y?: number };
};

export type SectionId = "hero" | "comfort" | "inside" | "quiet" | "colours" | "outro";

export const POSES: Record<SectionId, Pose> = {
  hero: {
    camera: [0, 0.15, 4.2],
    target: [0, -0.03, 0],
    shiftX: 0.2,
    model: { rotY: -0.45, rotX: 0.06 },
  },
  // Turn the left cup's inner face (the cushion) to camera and move in close.
  comfort: {
    camera: [0.1, 0.12, 2.7],
    target: [0.0, -0.12, 0.15],
    shiftX: -0.2,
    frameWidth: 0.85,
    model: { rotY: -Math.PI / 2 + 0.62, rotX: 0.14 },
  },
  inside: {
    camera: [0, 0.25, 5.6],
    target: [0, 0.02, 0],
    shiftX: 0.17,
    model: { rotY: -0.18, rotX: 0.1 },
  },
  quiet: {
    camera: [-0.2, 0.1, 3.7],
    target: [0, -0.08, 0],
    shiftX: -0.2,
    model: { rotY: 0.7, rotX: 0.08 },
  },
  colours: {
    camera: [0, 0.1, 4.1],
    target: [0, -0.03, 0],
    shiftX: 0.2,
    model: { rotY: -0.7, rotX: 0.05 },
  },
  outro: {
    camera: [0, 0.2, 4.6],
    target: [0, -0.05, 0],
    shiftX: 0,
    shiftY: 0.14,
    model: { rotY: -0.3, rotX: 0.05 },
  },
};

export type SectionSpan = { id: SectionId; el: HTMLElement; start: number; length: number };

/** Measure sections in viewport-height units (timeline time). */
export function measureSections(els: HTMLElement[], vh: number, scrollY = 0): SectionSpan[] {
  return els.map((el) => {
    const rect = el.getBoundingClientRect();
    return {
      id: el.dataset.section as SectionId,
      el,
      start: (rect.top + scrollY) / vh,
      length: rect.height / vh,
    };
  });
}

function applyPose(target: Rig, pose: Pose, mobile: boolean) {
  return {
    camera: { x: pose.camera[0], y: pose.camera[1], z: pose.camera[2] },
    target: { x: pose.target[0], y: pose.target[1], z: pose.target[2] },
    // Mobile stacks model above text: centre horizontally, lift vertically.
    shift: { x: mobile ? 0 : pose.shiftX, y: mobile ? 0.19 : (pose.shiftY ?? 0) },
    frameWidth: pose.frameWidth ?? 1.3,
    model: { rotX: 0, rotZ: 0, y: 0, ...pose.model },
    _target: target,
  };
}

/** Set the rig to a pose immediately (initial state before any scrolling). */
export function setPose(id: SectionId, mobile: boolean) {
  const p = applyPose(rig, POSES[id], mobile);
  Object.assign(rig.camera, p.camera);
  Object.assign(rig.target, p.target);
  Object.assign(rig.shift, p.shift);
  Object.assign(rig.model, p.model);
  rig.frameWidth = p.frameWidth;
}

const EASE = "power2.inOut";

/** Tween the rig to a pose over [at, at + dur] in timeline time. */
function toPose(tl: gsap.core.Timeline, id: SectionId, at: number, dur: number, mobile: boolean) {
  const p = applyPose(rig, POSES[id], mobile);
  tl.to(rig.camera, { ...p.camera, duration: dur, ease: EASE }, at)
    .to(rig.target, { ...p.target, duration: dur, ease: EASE }, at)
    .to(rig.shift, { ...p.shift, duration: dur, ease: EASE }, at)
    .to(rig.model, { ...p.model, duration: dur, ease: EASE }, at)
    .to(rig, { frameWidth: p.frameWidth, duration: dur, ease: EASE }, at);
}

/**
 * Text reveals for one section: fade in (with a small rise) while the section
 * slides in, hold completely still while pinned, fade out as it leaves.
 * Opacity only (not autoAlpha/visibility), so screen readers can still reach
 * text in sections that are not scrolled into view yet.
 *
 * No variable-font width animation: changing `wdth` changes glyph widths, so
 * the headline re-wrapped its lines mid-scroll and the text visibly jumped.
 */
function sectionText(tl: gsap.core.Timeline, s: SectionSpan, isFirst: boolean) {
  const items = s.el.querySelectorAll<HTMLElement>("[data-reveal]");
  const end = s.start + s.length;
  const pinEnd = end - 1;

  if (!isFirst && items.length) {
    tl.fromTo(
      items,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.3, stagger: 0.04, ease: "power2.out" },
      s.start - 0.3,
    );
  }
  if (items.length && s.id !== "outro") {
    tl.to(
      items,
      { opacity: 0, y: -12, duration: 0.25, stagger: 0.03, ease: "power2.in" },
      pinEnd + 0.25,
    );
  }
}

type BuildOptions = { sections: SectionSpan[]; mobile: boolean };

/**
 * Build the master timeline. Pure GSAP (no ScrollTrigger) so the caller
 * decides how it's driven; total duration = scrollable height in vh.
 */
export function buildStoryTimeline({ sections, mobile }: BuildOptions) {
  const tl = gsap.timeline({ paused: true, defaults: { overwrite: false } });
  setPose("hero", mobile);
  rig.explode = 0;
  rig.labels = 0;
  rig.anc = 0;
  rig.sheen = 0;
  rig.hero = 1;

  const by = Object.fromEntries(sections.map((s) => [s.id, s])) as Record<SectionId, SectionSpan>;
  const order = sections.map((s) => s.id);

  // Camera/model moves: into each section during the viewport before it pins.
  order.forEach((id, i) => {
    if (i === 0) return;
    const s = by[id];
    toPose(tl, id, s.start - 1, 1, mobile);
  });

  // Hero → turntable + cursor tilt fade as soon as you start scrolling.
  if (by.hero) tl.to(rig, { hero: 0, duration: 0.6, ease: "power1.out" }, 0.05);

  // Comfort beat: the cushion's sheen rises while pinned.
  if (by.comfort) {
    const s = by.comfort;
    tl.to(rig, { sheen: 1, duration: (s.length - 1) * 0.6, ease: "power1.inOut" }, s.start);
    tl.to(rig, { sheen: 0, duration: 0.6, ease: "power1.in" }, s.start + s.length - 1);
  }

  // Inside beat: explode across the pin, callouts draw in once parts separate.
  if (by.inside) {
    const s = by.inside;
    const pin = s.length - 1;
    tl.to(rig, { explode: 1, duration: pin * 0.55, ease: "none" }, s.start);
    tl.to(rig, { labels: 1, duration: pin * 0.2, ease: "power1.out" }, s.start + pin * 0.45);
    // A slow orbit while exploded so the depth reads.
    tl.to(rig.model, { rotY: 0.18, duration: pin, ease: "none" }, s.start);
    tl.to(rig, { labels: 0, duration: 0.25, ease: "power1.in" }, s.start + pin + 0.05);
    tl.to(rig, { explode: 0, duration: 0.8, ease: "power2.inOut" }, s.start + pin + 0.1);
  }

  // Quiet beat: ANC ripple strength.
  if (by.quiet) {
    const s = by.quiet;
    const pin = s.length - 1;
    tl.to(rig, { anc: 1, duration: pin * 0.4, ease: "power1.inOut" }, s.start);
    tl.to(rig.model, { rotY: POSES.quiet.model.rotY + 0.35, duration: pin, ease: "none" }, s.start);
    tl.to(rig, { anc: 0, duration: 0.6, ease: "power1.in" }, s.start + pin);
  }

  // Colours beat: a slow rotation; the colour cycling itself is discrete and
  // handled by a ScrollTrigger in StoryTimeline (store, not per-frame).
  if (by.colours) {
    const s = by.colours;
    tl.to(rig.model, { rotY: 0.5, duration: s.length - 1, ease: "none" }, s.start);
  }

  sections.forEach((s, i) => sectionText(tl, s, i === 0));

  // Pad the timeline to the full scrollable length so time == vh scrolled.
  const last = sections[sections.length - 1];
  if (last) tl.set({}, {}, last.start + last.length - 1);
  return tl;
}
