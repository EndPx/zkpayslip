import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono, Fraunces } from "next/font/google";
import "./globals.css";

// "Ember & bone" direction (2026-08-26, taste-driven): a high-contrast serif
// carries the voice (divine-editorial, not fintech), Inter keeps UI legible,
// IBM Plex Mono keeps the chain's numbers honest.
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
const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "zkPayslip — private payroll on Starknet",
  description:
    "Payroll inside the STRK20 privacy pool: nobody sees who was paid what, and any employee can still prove their income to exactly one verifier, once.",
  icons: {
    icon: "/Images/brand/logo-mark.png",
    apple: "/Images/brand/logo-mark.png",
  },
  openGraph: {
    title: "zkPayslip — private payroll on Starknet",
    description:
      "Salaries in the dark. Proof in the open — one fact, one verifier, once.",
    url: "https://zkpayslip.vercel.app",
    siteName: "zkPayslip",
    images: [
      {
        url: "/Images/brand/og-card.png",
        width: 1731,
        height: 909,
        alt: "A zkPayslip proof token: redacted payslip rows, the nullifier burning, VALID ONCE seal",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "zkPayslip — private payroll on Starknet",
    description:
      "Salaries in the dark. Proof in the open — one fact, one verifier, once.",
    images: ["/Images/brand/og-card.png"],
  },
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
      className={`${grotesk.variable} ${plexMono.variable} ${serif.variable}`}
      suppressHydrationWarning
    >
      <body>
        {
          // zkPayslip direction contract — "ember & bone" (2026-08-26,
          // taste-driven, replaces the Morpho-blue console)
          // THESIS: salaries move invisibly inside the STRK20 pool while
          //   income proofs open to exactly one verifier, once — the UI is
          //   that sentence: a void where one warm light opens.
          // OWN-WORLD: near-black void #05060a, bone-white #f4f1ea type,
          //   ONE warm light — gold #ffb24d owns every interactive element;
          //   red #ff2a2a appears exactly once (burned nullifier, failed
          //   verdict). Fraunces serif for display, Inter for UI, IBM Plex
          //   Mono for addresses/hashes. Film grain over the whole frame.
          // GRAMMAR (from the taste skill): hero-on-black — every surface
          //   opens on ONE centered object in negative space, not a card
          //   grid; hairline rules and editorial numbering instead of pill
          //   chips; one accent per view.
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
