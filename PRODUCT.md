# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Employer** — runs payroll for a small team; funds a treasury, maintains a
  recurring payment channel per employee, executes per-cycle disbursements.
- **Employee** — receives salary privately; views their own shielded balance
  and pay history; generates income proofs for third parties.
- **Verifier** — a bank, landlord, or tax office; receives a proof and checks
  it without a wallet, seeing only the single fact disclosed.

## Product Purpose

zkPayslip is private payroll on Starknet mainnet, built on the STRK20 privacy
pool. Each employee's salary is hidden from the public and from other
employees; the employer's total spend remains provable; each employee can
generate a cryptographic proof of income that opens to exactly one verifier,
one time. Success is the hackathon submission on August 31: app running on
mainnet, at least three pool-touching transaction hashes in `strk20.json`, a
public demo URL, a three-minute demo video, and a public licensed repo.

## Positioning

The payment rail is the engine; selective disclosure is the product. The
protocol's viewing-key escrow is all-or-nothing per user — right for a
regulator, far too blunt for an employee proving one number to one bank.
zkPayslip's disclosure layer delivers: one fact, one recipient, an expiry,
one redemption.

## Operating Context

Hackathon build (Private Sprint, STRK20). Privacy integration goes through
the Starknet Wallet API (starknet.js exactly 10.4.0) — the dapp never
touches a user's viewing key. One Cairo helper contract ≤ ~300 lines; the
pool custodies funds, the contract only stores commitments and verifies
disclosures. Everything touching sensitive data is client-side. Dev runs at
localhost:3100 (port 3000 is occupied by another project on this machine).

## Capabilities and Constraints

- Privacy rules: never log amounts/addresses/names; never persist them to
  storage or servers; no analytics/telemetry; masked amounts by default.
- Scope prohibitions: no escrow, no reputation/attestations/leaderboards,
  no pricing pages, testimonials, customer logos, or social-proof figures.
- Connect Wallet appears on the first screen; any landing page lives on a
  separate route (`/about`).
- Mainnet-affecting actions are gated behind explicit developer confirmation;
  benchmark numbers and mainnet hashes are PENDING until measured (never
  fabricated).
- Stack: Next.js 16 (webpack), React 19, TypeScript, zustand, CSS modules.

## Brand Commitments

- STRK20 brand tokens (`strk20.starknet.io/brand/tokens.json`): near-black
  canvas `#0d0d0d`, raised `#141414`, one orange accent `#c53400` for every
  interactive/brand highlight, sharp corners (buttons 2px, cards 10–12px),
  uppercase display + mono uppercase labels with wide tracking. Licensed
  brand faces fall back to free stand-ins: Space Grotesk (display) and
  IBM Plex Mono (labels).
- User-pinned presentation reference (2026-08-17): remlo.xyz — its
  structure, narrative arc, and information-presentation quality are the
  bar; its palette/typography are NOT the identity.
- All written UI copy and documents are in English.

## Evidence on Hand

- Real: verified mainnet pool address + public RPC (docs/FINDINGS.md),
  working starter-kit STRK20 actions (shield/send/unshield/echo/balances),
  live hackathon registry entry, public repo EndPx/zkpayslip.
- Absent and never to be fabricated: benchmark measurements (PENDING),
  mainnet transaction hashes (PENDING), customers, testimonials, usage
  figures.

## Product Principles

1. The application must never leak what the pool hides.
2. The pool custodies funds; our contract stores commitments and verifies
   disclosures only.
3. Disclosures are always scoped: one fact, one verifier, an expiry, one
   redemption.
4. State honestly what stays public — hidden-vs-visible is a first-class
   content element, not fine print.
5. Reaching the first real mainnet transaction outranks any feature.
