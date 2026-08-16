# FINDINGS — measured facts, sources, and gaps

This file is a deliverable. It documents what the RFP promised, what the
protocol provides today, and the gap between them. Numbers we have not
measured ourselves are marked PENDING, never guessed.

## Mainnet day 0 (PENDING Step 2)

| Item | Value | Source |
| --- | --- | --- |
| Mainnet pool address | `0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a` | `docs/MAINNET-DAY-0.md`, starkience/strk20-hackathon (verified 2026-08-17) |
| Mainnet RPC | `https://rpc.starknet.lava.build` (public, no key) | same |
| CHAIN_ID | `SN_MAIN` (`0x534e5f4d41494e`) | same |
| Shield tx hash (HASH 1) | PENDING | Step 2 runbook, `DEFERRED.md` |
| Pool target cross-check on Voyager | PENDING | Step 2 |
| Private transfer tx hash (HASH 2) | PENDING | Step 2 |
| Unregistered-recipient failure point | PENDING | Step 2 |

## Protocol facts confirmed in documentation (2026-08-17)

- Registration (publishing a viewing key) must precede payment; a channel is
  ECDH-derived from the recipient's public viewing key, which only exists
  on-chain after `SetViewingKey`. There is no send-now-claim-later.
  Source: strk20-by-example.org (Concepts; Notes & Nullifiers; Channels),
  captured in the session skill references.
- Viewing keys are immutable (WriteOnce); the auditor escrow is
  all-or-nothing per user — the basis for building our own scoped
  disclosure layer instead of using escrow.
- One private transaction carries multiple actions in fixed phase order;
  at most one `InvokeExternal`/`ComputeAndInvoke` per transaction. The
  recipients-per-transaction limit is undocumented → benchmark task (below).
- Deposits are screened on-chain (FPI signs every deposit; pool verifies).
  A structurally valid deposit that reverts → suspect screening first.
- Private transactions are submitted by rotating shared relayers; the
  on-chain sender is never the user. Eligibility hashes are validated
  against the pool's `Deposit` event `user_addr`, not the tx sender.
- Employees need a small STRK balance to register (their wallet pays the
  fee) — onboarding must surface this.
- Mainnet discovery/indexer URL and mainnet proving service URL are not yet
  published (Day 0 guide). The Wallet API route is unaffected — the wallet
  handles proving and discovery. An SDK route would be blocked.

## Starter kit survey (2026-08-17)

- Source: `Akashneelesh/strk20-starter-kit` (MIT, © 2023 Philippe ROSTAN;
  bootstrapped from PhilippeR26/Starknet-WalletAccount). Imported verbatim
  at commit `123218a`; notices in `docs/THIRD-PARTY-NOTICES.md`.
- `starknet` exactly **10.4.0** (matches the project pin, no change needed);
  `@starknet-io/types-js` 0.10.3; get-starknet discovery/standard 6.0.2;
  Next 16 (webpack mode), React 19.2.1, zustand 5.
- Contract addresses live in `src/utils/constants.ts`: STRK ERC-20
  `0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d`,
  echo helper mainnet `0x78ae…735b` (class `0x2a44…137`). The **pool address
  is not in the kit** — expected on the Wallet API route (the wallet knows
  the pool).
- `.env.example`: `NEXT_PUBLIC_PROVIDER_URL` (Alchemy key; kit RPCs are
  Alchemy-based), optional sepolia echo helper address.
- Gotcha recorded from kit README: `invoke` calldata placeholders
  (`"OPEN"`, `"${poolAddress}"`, `"${openNoteIds[N]}"`) are literal strings
  resolved by the wallet — never hex-normalize them.

## Batch benchmark (PENDING Step 4 execution)

Method: `executePayrollRun` (src/lib/payroll) with swappable strategies;
Sepolia default. Target recipient counts 2 / 5 / 10 / 20 sequential, then
batch.

### Sequential strategy (one tx per recipient)

| Recipients | Proving time/tx (ms) | Total time (ms) | Calldata (B) | Cost/recipient | Result |
| --- | --- | --- | --- | --- | --- |
| 2 | PENDING | PENDING | PENDING | PENDING | PENDING |
| 5 | PENDING | PENDING | PENDING | PENDING | PENDING |
| 10 | PENDING | PENDING | PENDING | PENDING | PENDING |
| 20 | PENDING | PENDING | PENDING | PENDING | PENDING |

### Batch strategy (multiple actions per tx)

| Recipients/tx | Proving time (ms) | Total time (ms) | Calldata (B) | Cost/recipient | Result |
| --- | --- | --- | --- | --- | --- |
| 2 | PENDING | PENDING | PENDING | PENDING | PENDING |
| 5 | PENDING | PENDING | PENDING | PENDING | PENDING |
| 10 | PENDING | PENDING | PENDING | PENDING | PENDING |
| 20 | PENDING | PENDING | PENDING | PENDING | PENDING |

**Settled recipients-per-transaction (with margin): PENDING** — will be our
own measurement, not the RFP's figure of fifty.

## Open questions

- Public proving-service rate limits are undocumented; if a multi-recipient
  session hits a limit, self-hosting the prover is the escape route.
- USDC token address on Starknet: take only from official sources when
  needed (not yet needed — STRK is the demo token).
