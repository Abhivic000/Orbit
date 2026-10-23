import { describe, expect, it } from "vitest";
import { EXPLODE_STAGGER, partOffset, partProgress } from "./explode";

describe("exploded view mapping", () => {
  it("is 0 when assembled and 1 when fully exploded for every part", () => {
    for (let i = 0; i < 10; i++) {
      expect(partProgress(0, i, 10)).toBe(0);
      expect(partProgress(1, i, 10)).toBeCloseTo(1);
    }
  });

  it("staggers: earlier parts lead later ones", () => {
    const e = 0.3;
    expect(partProgress(e, 0, 10)).toBeGreaterThan(partProgress(e, 1, 10));
    expect(partProgress(e, 1, 10)).toBeGreaterThan(partProgress(e, 5, 10));
  });

  it("a part does not move before its stagger slot", () => {
    expect(partProgress(EXPLODE_STAGGER * 3 - 0.001, 3, 10)).toBe(0);
  });

  it("is monotonic, so scrubbing backwards retraces the same path", () => {
    let prev = -1;
    for (let e = 0; e <= 1.0001; e += 0.01) {
      const p = partProgress(e, 4, 10);
      expect(p).toBeGreaterThanOrEqual(prev);
      prev = p;
    }
  });

  it("offset = direction × distance × progress", () => {
    expect(partOffset(1, 0, 1, [1, 0, 0], 0.5)).toEqual([0.5, 0, 0]);
    const [x, y, z] = partOffset(0.5, 0, 1, [0, -1, 0], 2);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(-1);
    expect(z).toBeCloseTo(0);
  });

  it("clamps outside 0..1", () => {
    expect(partProgress(-1, 0, 3)).toBe(0);
    expect(partProgress(2, 2, 3)).toBe(1);
  });
});
