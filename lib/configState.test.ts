import { describe, expect, it } from "vitest";
import { parseConfig, serializeConfig, type Config } from "./configState";
import { COLOURWAYS, HEADBAND_MATERIALS } from "./product";

describe("config ⇄ URL", () => {
  it("round-trips every colourway × material", () => {
    for (const c of COLOURWAYS) {
      for (const m of HEADBAND_MATERIALS) {
        const config: Config = { colourway: c.id, material: m.id };
        expect(parseConfig(serializeConfig(config))).toEqual(config);
      }
    }
  });

  it("serializes to the short ?c=&m= form", () => {
    expect(serializeConfig({ colourway: "moss", material: "leather" })).toBe("?c=moss&m=leather");
  });

  it("falls back to defaults for missing or unknown values", () => {
    expect(parseConfig("")).toEqual({ colourway: "basalt", material: "knit" });
    expect(parseConfig("?c=purple&m=velvet")).toEqual({ colourway: "basalt", material: "knit" });
    expect(parseConfig("?c=signal")).toEqual({ colourway: "signal", material: "knit" });
  });

  it("is case-insensitive on input", () => {
    expect(parseConfig("?c=GLACIER&m=Leather")).toEqual({
      colourway: "glacier",
      material: "leather",
    });
  });

  it("keeps unrelated params", () => {
    const out = serializeConfig({ colourway: "glacier", material: "knit" }, "?perf=1&c=moss");
    const params = new URLSearchParams(out);
    expect(params.get("perf")).toBe("1");
    expect(params.get("c")).toBe("glacier");
  });
});
