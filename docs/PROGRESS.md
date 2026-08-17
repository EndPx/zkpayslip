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
| 6 — Employer surfaces | UNVERIFIED | Built against mocked wallet state. Channel add verified on /invite; cross-route persistence of in-memory zustand state is flaky on hard navigation (Next refresh) — production state will be on-chain, not in-memory. |
| 7 — Employee portal | UNVERIFIED | Built against mocked wallet state. Simulate-payment → reveal → generate-proof flow verified in browser. |
| 8 — Disclosure and verifier | UNVERIFIED | Mock generate→check→redeem→second-attempt-revert flow verified end-to-end in browser; contract ready but not deployed. |
| 9 — Mainnet deployment | DEFERRED | Naturally last; runbook + demo video shot list in `DEFERRED.md`. |
| 10 — Documentation | DONE | README per spec, FINDINGS finalized to extent facts exist, PROGRESS current. Benchmark numbers PENDING. |

## Verification ledger

| Component | Verified how | State |
| --- | --- | --- |
| Starter kit boots, UI renders | Playwright browser check, http://localhost:3100 | VERIFIED 2026-08-17 |
| Any `strk20*` wallet call | — | UNVERIFIED until Step 1 connect |
| Employer dashboard flows | mock wallet only | UNVERIFIED |
| Employee portal flows | mock wallet only | UNVERIFIED |
| Disclosure generate/redeem | snforge tests + mock UI | UNVERIFIED on-chain |
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
