import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Free stand-ins for the licensed STRK20 brand faces (per brand tokens note):
// display/body → Space Grotesk (for Unison Pro / Neue Montreal), labels → IBM
// Plex Mono (for GT America Mono).
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-grotesk",
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
          // zkPayslip direction contract (recorded in docs/DESIGN.md)
          // THESIS: salaries move invisibly inside the STRK20 pool while
          //   income proofs open to exactly one verifier, once — this build
          //   refuses the generic dark-fintech dashboard default.
          // OWN-WORLD: STRK20 brand tokens — near-black #0d0d0d canvas, a
          //   single orange #c53400 accent on every interactive element,
          //   sharp 2px corners, uppercase Space Grotesk display, IBM Plex
          //   Mono labels with wide tracking; presentation craft bar set by
          //   remlo.xyz.
          // STORY: the app itself is the first screen (Connect Wallet up
          //   front); /about carries the narrative — problem, mechanism,
          //   hidden vs visible, escrow comparison, status, FAQ.
          // FIRST VIEWPORT: app console — nav (brand, About, Bench,
          //   connect), one-line product statement, STRK20 action panel; on
          //   /about, the proof-token schematic with the burning nullifier.
          // FORM: user-pinned "Remlo × STRK20" (2026-08-17); no roll — a
          //   brief-pinned direction beat the dice.
          // FINISH: unreviewed and undocumented is unfinished; this build
          //   ends with the finish review, the verdict, and DESIGN.md.
        }
        {children}
      </body>
    </html>
  );
}
