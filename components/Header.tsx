"use client";

import Link from "next/link";
import { useConfig } from "@/lib/configState";
import { serializeConfig } from "@/lib/configState";

export function Header() {
  const bagCount = useConfig((s) => s.bagCount);
  const colourway = useConfig((s) => s.colourway);
  const material = useConfig((s) => s.material);

  return (
    <header className="pointer-events-auto fixed inset-x-0 top-0 z-40">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6"
      >
        <Link href="/" className="font-display text-lg font-semibold tracking-tight">
          Orbit
        </Link>
        <div className="flex items-center gap-1 text-sm sm:gap-2">
          <Link href="/" className="rounded-full px-3 py-2 hover:bg-white/50">
            Story
          </Link>
          <Link
            href={`/configure${serializeConfig({ colourway, material })}`}
            className="rounded-full px-3 py-2 hover:bg-white/50"
          >
            Configure
          </Link>
          <span
            className="ml-1 flex items-center gap-2 rounded-full bg-ink px-3 py-2 text-white tabular-nums"
            aria-label={`Bag, ${bagCount} ${bagCount === 1 ? "item" : "items"}`}
          >
            <svg
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 7h12l-1 13H7L6 7Z" />
              <path d="M9 7a3 3 0 0 1 6 0" />
            </svg>
            <span key={bagCount} className="inline-block animate-[tick_400ms_ease-out]">
              {bagCount}
            </span>
          </span>
        </div>
      </nav>
    </header>
  );
}
