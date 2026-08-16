---
name: zkPayslip
description: Private payroll on Starknet — salaries in the dark, proof in the open.
colors:
  canvas-black: "#0d0d0d"
  raised-carbon: "#141414"
  raised-carbon-2: "#1a1a1a"
  hairline: "#262626"
  hairline-subtle: "rgba(250,250,250,0.05)"
  text-bright: "#fafafa"
  text-dim: "rgba(250,250,250,0.65)"
  text-label: "rgba(250,250,250,0.45)"
  text-ghost: "#616161"
  signal-orange: "#c53400"
  signal-orange-deep: "#a02a00"
  selection-ink: "#1a0a04"
typography:
  display:
    fontFamily: "Space Grotesk, 'Helvetica Neue', Arial, sans-serif"
    fontWeight: 700
    letterSpacing: "-0.03em"
    lineHeight: 1.02
    fontVariation: "uppercase"
  body:
    fontFamily: "Space Grotesk, 'Helvetica Neue', Arial, sans-serif"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
    fontWeight: 500
    letterSpacing: "0.16em-0.24em"
    fontVariation: "uppercase"
  data:
    fontFamily: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
    fontWeight: 400
    fontVariation: "tabular-nums"
rounded:
  control: "2px"
  container: "12px"
  pill: "999px"
spacing:
  gutter: "clamp(20px, 5vw, 72px)"
  container-max: "1280px"
  section-rhythm: "clamp(72px, 12vh, 128px)"
components:
  button-primary:
    backgroundColor: "{colors.signal-orange}"
    textColor: "{colors.text-bright}"
    rounded: "{rounded.control}"
    padding: "14px 26px"
  button-primary-hover:
    backgroundColor: "{colors.signal-orange-deep}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.text-dim}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-outline-hover:
    textColor: "{colors.signal-orange}"
  card:
    backgroundColor: "{colors.raised-carbon}"
    rounded: "{rounded.container}"
    padding: "26px"
  chip-pill:
    rounded: "{rounded.pill}"
    padding: "4px 12px"
---

# Design System: zkPayslip

## Overview

**Creative North Star: "The Sealed Ledger"**

zkPayslip renders payroll the way the STRK20 pool actually holds it: a
near-black protocol terminal where amounts sleep in encrypted notes and the
only light is a single signal orange — reserved for the one thing that
matters on screen: the interactive moment. The world is the STRK20 brand
system (strk20.starknet.io/brand) executed at the presentation-craft bar of
remlo.xyz: big tight uppercase display type, mono technical labels, honest
tables, and generous narrative rhythm. The visual anti-reference is the
generic dark-fintech dashboard (navy + green + soft glass cards); nothing
in this system may resemble it.

Key characteristics:

- Near-black canvas (#0d0d0d) with carbon raised surfaces; depth by
  tonal layering plus hairlines, never glass or gradients.
- One accent hue (signal orange) for every interactive/brand highlight.
- Uppercase Space Grotesk display, IBM Plex Mono labels with wide
  tracking, tabular mono for all data.
- Sharp corners: 2px on controls, 12px on containers, pills only for
  small status chips.
- Honesty as a design element: hidden-vs-visible tables are content,
  not fine print; PENDING is a first-class state, never a placeholder
  number.

## Colors

One accent carries the whole system; everything else is a warm-neutral
carbon scale.

### Primary
- **Signal Orange** (#c53400): every interactive element — CTAs, links,
  focus rings, active tab underlines, the nullifier burn, eyebrow ticks.
  Hover deepens to #a02a00. It glows (0 0 30px rgba(197,52,0,0.55)) only
  on the one authored hero moment.

### Neutral
- **Canvas Black** (#0d0d0d): page background.
- **Raised Carbon** (#141414) / **Carbon Two** (#1a1a1a): panels,
  receipts, inset surfaces.
- **Hairline** (#262626) and **Hairline Subtle** (rgba(250,250,250,0.05)):
  borders and dividers.
- **Bright** (#fafafa): primary text; **Dim** (rgba 0.65): secondary
  prose; **Label** (rgba 0.45): small informative labels (contrast-safe
  floor); **Ghost** (#616161): decorative tertiary only.
- **Selection Ink**: selection background is Signal Orange with
  #1a0a04 text — even the browser surface speaks the brand.

### Named Rules
**The One Flame Rule.** Signal Orange is the only hue on any screen. It
appears on ≤10% of the surface and always means "interactive or brand".
No green-for-success, no red-for-error — states speak through text and
icons in the carbon scale, with orange marking what needs attention.

**The Honest Edge Rule.** Anything the pool makes public gets displayed,
not hidden: deposits, timings, run sizes. The UI never uses color or
layout to imply privacy the protocol does not provide.

## Typography

**Display Font:** Space Grotesk (Helvetica Neue fallback)
**Body Font:** Space Grotesk (Helvetica Neue fallback)
**Label/Mono Font:** IBM Plex Mono (system mono fallback)

**Character:** A tight uppercase grotesk that reads like a protocol
stamp, paired with a mono that speaks in wide-tracked technical labels —
free stand-ins for the licensed brand faces (Unison Pro / Neue Montreal /
GT America Mono), chosen by the brand tokens' own fallback note.

### Hierarchy
- **Display** (700, clamp 42–84px, line-height 0.98–1.02, uppercase,
  tracking -0.035em): landing heroes and section statements.
- **Headline** (700, clamp 30–50px): section headings, max ~22ch.
- **Title** (600, 26px uppercase / 20px modal titles): step words, panel
  titles.
- **Body** (400, 14–19px, line-height 1.6, measure ≤62ch): all prose.
- **Label** (500, 10–12px, tracking 0.16–0.24em, uppercase mono): tags,
  table headers, receipt rows, buttons (0.04em).
- **Data** (mono, tabular-nums): amounts, hashes, addresses, metrics.

### Named Rules
**The Mono Speaks Rule.** Mono is the system's technical voice: labels,
buttons, data. Prose is never mono; data is never prose-font.

## Layout

Single-column narrative rhythm with a 1280px content cap inside a fluid
gutter (clamp 20–72px). Sections breathe at clamp(72px, 12vh, 128px) with
hairline separators and more space above a heading than below. The app
console (/) is a 720px column: tag, title, one-line sub, action panel.
The landing (/about) alternates density — hero grid (7/5), steps grid
(4-col → 2 → 1), full-width tables with horizontal scroll on narrow
screens. Breakpoints: 960px (hero stacks, steps 2-col), 600px (steps
1-col, paths stack).

## Elevation & Depth

Tonal layering first: canvas → raised carbon → carbon two, separated by
hairlines. One structural shadow exists — `0 40px 70px -30px
rgba(0,0,0,0.7)` on cards/panels — reading as ambient depth, not lift.
The orange glow (`0 0 30px rgba(197,52,0,0.55)`) is reserved for the
hero's authored moment only; it is decoration nowhere else.

### Named Rules
**The Flat Rest Rule.** Surfaces are flat at rest; hover changes border
or background color, never adds shadow.

## Shapes

Sharp, stamped geometry. Controls 2px; containers 12px; pills only for
small chips and status (7px dots). Borders are 1px; the only 2px line is
the active tab underline. No glass, no blur except the sticky nav's
functional 8px backdrop.

## Components

### Buttons
- **Shape:** sharp (2px radius), mono uppercase text (12–13px, 0.04em).
- **Primary:** signal orange fill, bright text, 14px/26px padding;
  hover deepens to #a02a00.
- **Outline:** transparent, hairline border, dim text; hover border +
  text turn orange.
- **Pill (nav connect):** 999px, hairline, hover orange.

### Chips
- **Status chips:** pill, 10px mono label; LIVE = hairline + dim,
  PENDING = orange border + orange text.

### Cards / Containers
- **Panel:** raised carbon, 1px hairline, 12px, 26px padding, ambient
  card shadow. Receipts: carbon two inside panels, same geometry.

### Inputs / Fields
- Carbon two fill, hairline border, 2px radius, mono text, orange caret;
  focus = 2px orange outline offset 2px.

### Navigation
- 64px sticky bar, blurred 92% canvas, hairline bottom. Brand = 30px
  orange square mark ("zk") + mono "PAYSIP" wordmark. Links: mono 11px
  dim → bright. Right side: connect pill or address pill (orange dot,
  hover-reveal DISCONNECT).

### Signature: The Proof Token
- Landing hero schematic: a payslip-proof card in pure geometry (12px
  card, mono field rows FACT / VERIFIER / EXPIRY / NULLIFIER). The
  authored motion moment: an orange strike line burns across the
  nullifier once (0.5s ease-out at 1.4s), a bordered "VALID ONCE" seal
  pulses once. Reduced-motion removes both.

## Do's and Don'ts

### Do:
- **Do** keep every interactive element in Signal Orange — it is the
  system's only flame.
- **Do** use mono uppercase labels with wide tracking for anything
  technical, and tabular mono for every number a judge might audit.
- **Do** state what stays public (honest tables) and mark unmeasured
  numbers PENDING.
- **Do** theme browser surfaces: orange selection, carbon scrollbars,
  orange focus rings.

### Don't:
- **Don't** introduce a second hue (no green/red status, no gradients,
  no glass cards, no navy+fintech-green anywhere).
- **Don't** round controls past 2px or containers past 12px.
- **Don't** log or persist amounts, addresses, or labels anywhere
  (product privacy rule that overrides any styling convenience).
- **Don't** ship SaaS-landing patterns: pricing, testimonials, logos,
  social proof (banned by product truth).
