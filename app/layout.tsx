import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import { CanvasRoot } from "@/components/canvas/CanvasRoot";
import { Header } from "@/components/Header";
import { EARLY_TIER_SCRIPT, QualityGate } from "@/components/QualityGate";
import { SmoothScroll } from "@/components/Deferred";
import { SweepSync } from "@/components/SweepSync";
import "./globals.css";

// Display face (static width; animating the wdth axis made headlines re-wrap mid-scroll).
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const title = "Orbit Halo One — Sound that stays out of your way";
const description =
  "Orbit Halo One over-ear wireless headphones. A fictional product with a 3D scroll story and configurator.";

export const metadata: Metadata = {
  // Vercel sets VERCEL_PROJECT_PRODUCTION_URL at build time; used for absolute share URLs.
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000",
  ),
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    images: [
      { url: "/fallback/hero-basalt.webp", width: 1200, height: 900, alt: "Orbit Halo One" },
    ],
  },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  themeColor: "#DCE0E5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the early script may set data-tier before hydration.
    <html
      lang="en"
      className={`${bricolage.variable} ${manrope.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: EARLY_TIER_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        <QualityGate />
        <a
          href="#main"
          className="sr-only-focusable fixed top-3 left-3 z-50 rounded bg-ink px-3 py-2 text-sm text-white"
        >
          Skip to content
        </a>
        {/* One fixed canvas for every route: lazy-mounted after the text paints. */}
        <CanvasRoot />
        <SmoothScroll />
        <SweepSync />
        <Header />
        {children}
      </body>
    </html>
  );
}
