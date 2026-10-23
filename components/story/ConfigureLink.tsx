"use client";

import Link from "next/link";
import { serializeConfig, useConfig } from "@/lib/configState";
import { getColourway } from "@/lib/product";

/** Carries the colour picked in the story over to the configurator. */
export function ConfigureLink() {
  const colourway = useConfig((s) => s.colourway);
  const material = useConfig((s) => s.material);
  return (
    <Link
      href={`/configure${serializeConfig({ colourway, material })}`}
      className="inline-block rounded-full bg-ink px-6 py-3 font-semibold text-white transition hover:bg-black"
    >
      Configure Halo One in {getColourway(colourway).name}
    </Link>
  );
}
