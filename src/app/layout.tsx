import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Morpho-grade console direction (2026-08-24 redesign): display/body → Inter,
// a neutral sans with tabular figures for dense data surfaces; labels and
// hashes stay in IBM Plex Mono.
const grotesk = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono-ui",
  display: "swap",
});

export const metadata: Metadata = {
  title: "zkPayslip — private payroll on Starknet",
  description:
    "Payroll inside the STRK20 privacy pool: nobody sees who was paid what, and any employee can still prove their income to exactly one verifier, once.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${grotesk.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        {
          // zkPayslip direction contract (2026-08-24 redesign, user-pinned)
          // THESIS: salaries move invisibly inside the STRK20 pool while
          //   income proofs open to exactly one verifier, once — rendered as
          //   a Morpho-grade console a guest can walk through end to end,
          //   where every signing action stays locked until a wallet connects.
          // OWN-WORLD: blue-tinted near-black #0d0d12 canvas, Morpho-blue
          //   #536fe7 as the single interactive hue, soft status hues for
          //   chips and verdicts only, 8px controls on 12px cards, Inter for
          //   UI with tabular figures, IBM Plex Mono for addresses/hashes.
          // STORY: the app itself is the first screen (Connect up front);
          //   guests browse real read-only chain data — verdicts, structure,
          //   empty states that say what connecting unlocks. Nothing synthetic
          //   masquerades as live state.
          // FIRST VIEWPORT: nav (brand, surfaces, connect) + role doors to
          //   employer / employee / verifier; /about carries the narrative.
          // FINISH: unreviewed and undocumented is unfinished.
        }
        {children}
      </body>
    </html>
  );
}
