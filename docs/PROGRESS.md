# PROGRESS — zkPayslip build log

Status legend: DONE (exit condition met) · PARTIAL (some sub-items done) ·
DEFERRED (needs the developer's wallet — see `DEFERRED.md`) · UNVERIFIED
(built against mocked wallet state, awaiting a real wallet).

## Step status

| Step | Status | Notes |
| --- | --- | --- |
| 1 — Local environment | PARTIAL | Starter kit runs, UI verified in browser on port 3100. Wallet connect DEFERRED. |
| 2 — First mainnet contact | DEFERRED | Runbook in `DEFERRED.md`; waiting on funded Ready wallet. |
| 3 — Repository and registration | PARTIAL | Public repo + MIT license live; registry PR #71 applied (2026-08-17). `strk20.json` skeleton committed, hashes pending Step 2. Website field pending demo URL (Step 9). |
| 4 — Batch benchmark | PARTIAL | `executePayrollRun` + strategies + bench harness built; measured numbers DEFERRED. |
| 5 — Cairo contract | **DONE** | Contract written (284 lines), scarb build clean, snforge test 2/2 PASS via WSL, **deployed to Sepolia** (2026-08-17): address `0x051c29216ddd5e9016fad4380db34e895dc8176f58ec4754cb3b4c4f14bda8b3`, class `0x0189e68090e90293e589b03b6dfb18552da6ad381eeae104d562548e060b8582`. Verified callable. |
| 6 — Employer surfaces | PARTIAL | `Execute run` calls the real `executePayrollRun`, and since the console redesign it signs through `createWalletDeps` when a wallet is connected — the mock transport survives only as the fallback, and the run note names which one ran. Channel add/activate/terminate each send their signed contract call when a wallet is present, with owner-only reverts surfaced, not swallowed. **No browser wallet has signed one yet** — the same entrypoints are proven working by `scripts/verify-sepolia.mjs`. Cross-route persistence of in-memory zustand state stays flaky on hard navigation; production state is on-chain, not in-memory. |
| 7 — Employee portal | PARTIAL | Proof generation binds to a real verifier address and sends a signed `create_disclosure`; the fact travels as a commitment, never in the clear. Balance, history, and unshield remain mocked. **Untested with a browser wallet.** |
| 8 — Disclosure and verifier | **DONE** | Exit condition met **on-chain**: `scripts/verify-sepolia.mjs` runs generate→check→redeem→second-attempt-revert against the deployed Sepolia contract, 8/8 PASS (2026-08-17). Second redemption reverts; a burned nullifier cannot be reused. Verifier page reads `check_disclosure` over read-only RPC. The *browser write path* (employee generates, verifier redeems, each signing with a wallet) is still mocked — see the ledger below. |
| 9 — Mainnet deployment | DEFERRED | Naturally last; runbook + demo video shot list in `DEFERRED.md`. |
| 10 — Documentation | DONE | README per spec, FINDINGS finalized to extent facts exist, PROGRESS current. Benchmark numbers PENDING. |

## Ember & bone redesign — 2026-08-26

The Morpho-blue console read as generic dark fintech, so the direction was
re-decided first (taste discipline: name the genre before styling): angelcore
adapted to a ledger. Near-black void `#05060a`, bone-white `#f4f1ea` type,
one warm light — gold `#ffb24d` owns every interactive element; red `#ff2a2a`
survives only where something burns or fails. Fraunces serif carries display,
Inter keeps UI legible, IBM Plex Mono keeps the chain's numbers; film grain
sits over the frame.

- Grammar: hero-on-black openings and an editorial index instead of card
  grids — home's role doors are now numbered rows behind hairline rules.
- Landing and app split (2026-08-26, user-directed): `/` is now an animated
  explainer — floating proof token in the hero, three scroll-triggered
  stages (pool masking, proof burn, ECDH handshake) — and the console lives
  at `/app` behind "Open the app". All motion is CSS plus one
  IntersectionObserver; verified in the browser and by production build
  (10/10 routes) on 2026-08-26.
- One accent per view: gold interactive, pale-gold success, red burn only.
- Verified by a guest walkthrough of all seven routes in the browser
  (`/`, `/employer`, `/employee`, `/invite`, `/verify`, `/about`, `/bench`)
  plus typecheck + production build on 2026-08-26. Console clean apart from
  dev-only HMR preload noise.
- Found and fixed during the walkthrough: the /about schematic caption ran
  into the VALID ONCE seal at the card edge.
- Still true from the 08-24 pass: no browser wallet has signed anything —
  the write paths remain UNVERIFIED until Step 1 connects one.

## Console redesign — 2026-08-24

- Direction: Morpho-grade dark console — blue-tinted near-black canvas
  (`#0d0d12`), one interactive hue (`#536fe7`), soft status hues reserved for
  chips and verdicts, Inter for UI with tabular figures, IBM Plex Mono for
  addresses and hashes. Replaces the STRK20 orange brand system; the
  design-contract comment in `src/app/layout.tsx` records the terms.
- Guest mode: every surface renders read-only without a wallet behind a
  shared `ConnectGate`; signing actions stay visible but disabled with the
  reason, never hidden. Exactly one connect flow — gates raise the store's
  picker flag, `SelectWallet` owns the modal.
- Employer `Execute run` is wallet-signed when connected (`createWalletDeps`,
  network resolved from the provider context); mock transport is fallback only.
- Verified by typecheck + production build (10/10 routes) on 2026-08-25.
  **No browser walkthrough of the redesigned UI yet** — UNVERIFIED until one.

## Verification ledger

| Component | Verified how | State |
| --- | --- | --- |
| Starter kit boots, UI renders | Playwright browser check, http://localhost:3100 | VERIFIED 2026-08-17 |
| Any `strk20*` wallet call | — | UNVERIFIED until Step 1 connect |
| Employer dashboard flows | mock wallet only | UNVERIFIED |
| Employee portal flows | mock wallet only | UNVERIFIED |
| Disclosure lifecycle, contract level | `scripts/verify-sepolia.mjs`, 8/8 PASS against deployed Sepolia contract | **VERIFIED on-chain 2026-08-17** |
| Channel lifecycle, contract level | same run — add → pending, activate → active, duplicate add reverts | **VERIFIED on-chain 2026-08-17** |
| Verifier page read path | reads `check_disclosure` via read-only RPC, no wallet | VERIFIED (falls back to mock only when the node is unreachable, and says so) |
| Disclosure/redeem *from the browser* | write path built (`src/lib/contract/writes.ts`); typecheck + production build clean; no browser wallet has signed one | UNVERIFIED — needs Step 1 wallet connect |
| Channel writes *from the browser* | same module; owner-only reverts mapped to readable errors | UNVERIFIED — needs Step 1 wallet connect |
| Dead RPC endpoint | Blast API decommissioned on both TLDs; replaced with publicnode | FIXED 2026-08-17 |
| Batch benchmark numbers | — | PENDING Step 4 execution |

## Environment notes

- Node v24.18.0, npm 11.8.0, Windows.
- Port 3000 is occupied by another project on this machine; zkpayslip dev
  server runs on **3100** (`npx next dev --webpack -p 3100`).
- starknet.js pinned exactly 10.4.0 (starter kit ships it pinned).

## Assumptions taken

- The benchmark runs on Sepolia by default (proving behaviour is
  network-independent; Sepolia is free). A mainnet run is optional.
- `strk20.json` is committed with empty arrays until real hashes exist —
  the hackathon CONTRIBUTING states every field is optional and the hub
  shows what is missing.
