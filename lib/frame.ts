// Lets DOM code ask the canvas for a new frame without importing R3F into the
// page bundle. The Scene replaces `invalidate` with R3F's once it mounts.
// Needed because the configurator renders on demand (frameloop="demand").
export const frame = {
  invalidate: () => {},
};
