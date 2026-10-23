"use client";

import dynamic from "next/dynamic";

// r3f-perf in development only. The import is behind a NODE_ENV check so the
// production bundle never includes it. Hide with ?perf=0.
const PerfPanel = dynamic(() => import("r3f-perf").then((m) => m.Perf), { ssr: false });

export function Perf() {
  if (process.env.NODE_ENV !== "development") return null;
  if (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("perf") === "0"
  )
    return null;
  return <PerfPanel position="bottom-left" minimal={false} />;
}
