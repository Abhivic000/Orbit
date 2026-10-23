// Product data for the fictional Orbit Halo One. Single source of truth for
// colourways (product = shell colour, accent = cushions + trim, sweep = backdrop),
// headband materials, price and copy shared by story + configurator.

export const COLOURWAYS = [
  { id: "basalt", name: "Basalt", product: "#2B2D31", sweep: "#D6D8DB", accent: "#1C1E22" },
  { id: "glacier", name: "Glacier", product: "#CFE3EA", sweep: "#E4EEF1", accent: "#8FA5AE" },
  { id: "moss", name: "Moss", product: "#5E6B4A", sweep: "#DDE2D4", accent: "#353C2A" },
  { id: "signal", name: "Signal", product: "#F25C05", sweep: "#F3DDD0", accent: "#26282C" },
] as const;

export type ColourwayId = (typeof COLOURWAYS)[number]["id"];
export type Colourway = (typeof COLOURWAYS)[number];

export const HEADBAND_MATERIALS = [
  { id: "knit", name: "Knit fabric", priceDelta: 0 },
  { id: "leather", name: "Leather", priceDelta: 30 },
] as const;

export type HeadbandMaterialId = (typeof HEADBAND_MATERIALS)[number]["id"];

export const DEFAULT_COLOURWAY: ColourwayId = "basalt";
export const DEFAULT_MATERIAL: HeadbandMaterialId = "knit";
export const BASE_PRICE = 349;

export function getColourway(id: ColourwayId): Colourway {
  return COLOURWAYS.find((c) => c.id === id) ?? COLOURWAYS[0];
}

export function priceFor(material: HeadbandMaterialId): number {
  return BASE_PRICE + (HEADBAND_MATERIALS.find((m) => m.id === material)?.priceDelta ?? 0);
}

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

export const SPECS: { term: string; value: string }[] = [
  { term: "Drivers", value: "40 mm dynamic" },
  { term: "Battery", value: "40 h (ANC on)" },
  { term: "Charging", value: "USB-C, 10 min = 5 h" },
  { term: "Weight", value: "254 g" },
  { term: "Noise cancelling", value: "Adaptive, 6 mics" },
  { term: "Bluetooth", value: "5.4, multipoint" },
];
