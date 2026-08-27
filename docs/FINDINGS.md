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

## Deployed-contract verification (2026-08-17)

`scripts/verify-sepolia.mjs` exercises the deployed contract from the terminal,
so the README's claims rest on the deployed bytecode rather than on snforge's
local VM. **8/8 checks passed** against
`0x051c29216ddd5e9016fad4380db34e895dc8176f58ec4754cb3b4c4f14bda8b3`.

| Check | Result | Tx |
| --- | --- | --- |
| `add_channel` → state 0 (pending) | PASS | `0x58468fc90fc7deb58f848545afb7a6dbd6d81a05a4ebab1f55c70e5044a572e` |
| `activate_channel` → state 1 (active) | PASS | `0x35767130ec6b33e12e2be5150031de19502e215c4b4ae75b0d3267b1b37b83a` |
| duplicate `add_channel` reverts (`EXISTS`) | PASS | — (reverted) |
| unknown disclosure reads `NF` | PASS | — (read-only) |
| `create_disclosure` → `VALID` | PASS | `0x92bf077f0ccdaf0f80870ae47b170c3f8e59e7a1896c0a725d3ca6c60f8853` |
| `redeem_disclosure` → `REDM` | PASS | `0x5c142a0d7e033adc007dffb1969fc29776a1c683d5a3daca2bd17d976833357` |
| second redemption reverts (`REDEEMED`) | PASS | — (reverted) |
| burned nullifier rejected on a fresh id (`BURNED`) | PASS | — (reverted) |

These are **Sepolia** hashes. They do not count toward the three mainnet
pool-touching transactions the submission gate requires.

## Verifier surface verified against the live contract (2026-08-17)

The `/verify` page — the surface a bank actually uses — was exercised in a
real browser against the deployed Sepolia contract. Checks ran with **no
wallet installed on the page**: the verdict comes from a read-only
`starknet_call` over public RPC, which is the product claim working as
designed.

| Step | Action | Result |
| --- | --- | --- |
| 1 | `create_disclosure(id=0x42)` via deployer account | tx `0x02eb2428d086e7368b197b406aef0e0de19001b73903f443dc30fc8485f1dab6` |
| 2 | Browser: check `0x42` on `/verify` | **VALID** · source badge "Sepolia" · opaque fact hash rendered honestly |
| 3 | `redeem_disclosure(0x42)` via deployer account | tx `0x01433562a2b3842cab793685dea9205a97168764b7781214980ae31238a5fb49` |
| 4 | Browser: re-check `0x42` | **ALREADY_REDEEMED** — "the nullifier is burned" |
| 5 | `redeem_disclosure(0x42)` again (negative test) | **reverted** with contract error `'REDEEMED'` — the one-time guarantee holds on-chain |
| 6 | `create_disclosure(id=0x43)` for the live-valid state | tx `0x00ef85ef1ebcb33b33b6007a069cd9096b9d6a0ea8f5dabf0912d26088b8568e` |
| 7 | Browser: check `0x43` | **VALID** with `FACT HASH 0x5354…433` + verifier address shown |

Notes worth keeping:

- The page renders the on-chain fact as an **opaque hash**, never as an
  invented sentence about it — the chain stores `fact_hash`; the human
  sentence lives in the proof bundle the verifier receives alongside.
- Redemption from the page is a signed transaction and stays disabled until
  the verifier connects a wallet; checking never needs one. This is the
  "no wallet to read" claim, enforced in UI.
- A network failure surfaces as `UNREACHABLE` ("we could not check"), never
  as "no such proof" — reporting a transport failure as an absent proof
  would lie to a verifier.

## Tooling gotchas worth publishing (2026-08-17)

Three cost us time; all three are cheap for another team to avoid.

- **`block_id: "pending"` is gone.** Nodes on JSON-RPC spec 0.10.x reject it
  with `unknown block tag 'pending'`; the tag was renamed **`pre_confirmed`**.
  Verified against `starknet-sepolia-rpc.publicnode.com` (spec 0.10.2), where
  `pre_confirmed`, `latest`, and `l1_accepted` all answer and `pending` alone
  fails. This is nastier than a plain error, because code that catches the
  failure and falls back to a mock looks like it is working.
- **Blast API is decommissioned.** `starknet-*.public.blastapi.io` now answers
  every request with `"Blast API is no longer available… use Alchemy"`, and
  `blastapi.org` does not resolve at all. The starter kit still ships a Blast
  URL at provider index 1 in `src/utils/constants.ts`.
- **starknet.js 10.x changed the `Account` constructor** to a single options
  object: `new Account({ provider, address, signer })`. The old positional form
  `new Account(provider, address, pk)` does not throw a helpful error — it
  reads argument one as the options bag and dies on `address.toLowerCase()`
  of `undefined`.

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
