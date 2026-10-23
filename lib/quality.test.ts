import { describe, expect, it } from "vitest";
import { selectTier, tierOverride, type TierInput } from "./quality";

const laptop: TierInput = {
  webgl: true,
  reducedMotion: false,
  dpr: 2,
  cores: 10,
  memory: 16,
  gpu: "ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)",
  mobile: false,
};

const midPhone: TierInput = {
  webgl: true,
  reducedMotion: false,
  dpr: 3,
  cores: 8,
  memory: 6,
  gpu: "Adreno (TM) 730",
  mobile: true,
};

describe("selectTier", () => {
  it("gives a modern laptop the high tier", () => {
    expect(selectTier(laptop)).toBe("high");
  });

  it("gives a mid-range phone the low tier", () => {
    expect(selectTier(midPhone)).toBe("low");
  });

  it("falls back without WebGL", () => {
    expect(selectTier({ ...laptop, webgl: false })).toBe("fallback");
  });

  it("falls back for prefers-reduced-motion, even on a fast machine", () => {
    expect(selectTier({ ...laptop, reducedMotion: true })).toBe("fallback");
  });

  it("falls back on software renderers", () => {
    expect(selectTier({ ...laptop, gpu: "Google SwiftShader" })).toBe("fallback");
    expect(selectTier({ ...laptop, gpu: "llvmpipe (LLVM 15.0.7, 256 bits)" })).toBe("fallback");
  });

  it("falls back on a weak, low-memory phone", () => {
    expect(selectTier({ ...midPhone, gpu: "Mali-G52", cores: 4, memory: 2 })).toBe("fallback");
  });

  it("uses low for an old integrated GPU on desktop", () => {
    expect(selectTier({ ...laptop, gpu: "Intel(R) HD Graphics 520", cores: 4 })).toBe("low");
  });

  it("uses low for data saver", () => {
    expect(selectTier({ ...laptop, saveData: true })).toBe("low");
  });

  it("uses low on few cores and treats unknown cores as capable", () => {
    expect(selectTier({ ...laptop, cores: 4 })).toBe("low");
    expect(selectTier({ ...laptop, cores: 0, memory: undefined })).toBe("high");
  });

  it("does not punish a high-DPR laptop", () => {
    expect(selectTier({ ...laptop, dpr: 3 })).toBe("high");
  });
});

describe("tierOverride", () => {
  it("reads ?tier=", () => {
    expect(tierOverride("?tier=low")).toBe("low");
    expect(tierOverride("?tier=fallback&c=moss")).toBe("fallback");
    expect(tierOverride("?tier=ultra")).toBeNull();
    expect(tierOverride("")).toBeNull();
  });
});
