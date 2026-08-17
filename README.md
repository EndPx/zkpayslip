# zkPayslip

Private payroll on Starknet: salaries move invisibly inside the STRK20 privacy pool while any employee can still prove their income to exactly one verifier, once.

## Live deployment

| Contract | Network | Address | Explorer |
| --- | --- | --- | --- |
| zkPayslip payroll helper | Sepolia | _PENDING deploy_ | — |
| zkPayslip payroll helper | Mainnet | _PENDING deploy_ | — |
| STRK20 privacy pool | Mainnet | `0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a` | [Voyager](https://voyager.online/contract/0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a) |

Mainnet transaction hashes (at least three, touching the pool) land in [`strk20.json`](./strk20.json) as they happen — none yet.

Demo URL and video appear in `strk20.json` once live.

## Architecture

```
                         ┌─────────────────────────────┐
                         │       Employer wallet        │
                         │  (Ready / Xverse, mainnet)   │
                         └───────────────┬─────────────┘
                                  shield │ STRK ERC-20
                                         ▼
            ┌──────────────────────────────────────────────┐
            │           STRK20 privacy pool (mainnet)       │
            │   encrypted notes · nullifiers · STARK proofs │
            │   sender/receiver/amount hidden inside pool    │
            └──────┬──────────────────────┬─────────────────┘
        notes →  │ private transfer      │ unshield →
                   ▼                        ▼
          ┌──────────────┐          ┌──────────────────┐
          │ Employee     │          │ public edge      │
          │ wallet       │          │ (visible)        │
          └──────┬───────┘          └──────────────────┘
                 │ generate
                 ▼
          ┌──────────────────────────────────────────┐
          │  zkPayslip Cairo helper (sepolia/mainnet) │
          │  · per-payment commitments (completeness) │
          │  · channel lifecycle + cliff vesting       │
          │  · disclosure (one fact, one verifier,     │
          │    one nullifier, one redemption)          │
          └────────────────────┬─────────────────────┘
                               │ read-only
                               ▼
                        ┌─────────────┐
                        │  Verifier   │  (no wallet)
                        │  one-click  │
                        │  verdict    │
                        └─────────────┘
```

The pool custodies funds. The helper contract stores commitments and verifies disclosures — it never holds tokens between calls.

## Hidden vs visible

Be precise: only movement **inside** the pool is private. The edges are public by design.

| Stays in the dark | Public by design |
| --- | --- |
| Who paid whom | The shield deposit names the treasury |
| Each employee's salary | Total budget at shield; amounts that unshield out |
| Which notes were spent | That the pool is used, and when |
| The payslip's single fact on check | A payroll run's size (action count) |

## Correlation

Honesty obliges us to raise this before a judge does.

- **Timing correlation.** If every employee unshields on the same date, the pattern is readable even with private amounts. Mitigation: spread setup and movement over time; shield ahead of payroll, not during it.
- **Small anonymity set.** The pool has only been live a few months; low transaction variety makes correlation by timing and amount range easier. This improves as pool usage grows.
- **Fee trace.** Fees paid from the employer's public wallet are a correlatable trace. A paymaster decouples the submitter's address and is the recommended mitigation (see Roadmap).

## Why this disclosure layer needs to exist

STRK20 ships a viewing-key escrow: at registration, each user's private viewing key is encrypted to an auditor, who can then decrypt that user's entire history. The protocol documentation describes this as scoped, but scoped means **scoped to one user**, not scoped to a particular fact within that user's history.

That is the right tool for a regulator responding to legal process. It is far too blunt for an employee who only wants to prove one number to one bank. zkPayslip's disclosure layer delivers what the escrow cannot: one fact, one verifier, an expiry, and a nullifier that burns on redemption.

## Status against RFP-11 outcomes

| Outcome | Status |
| --- | --- |
| Private per-employee salary | **Built** — private transfers inside the pool |
| Provable total employer spend | **Built** — shield leg is public by design |
| Per-payment completeness commitments | **Built** — Cairo contract records per (channel, cycle) |
| One-time verifier-bound income proof | **Built** — disclosure + nullifier burn (mocked UI, contract ready) |
| Paymaster-sponsored recipient discovery | **Not achieved** — research shows registration cannot be delegated; written up as a finding, not a failure |

## Trust boundaries

- **The pool custodies funds** — the helper contract only stores commitments and verifies disclosures.
- **The proving service is a centralized off-chain component** — it can be operated by any party and self-hosted. If it is down, payroll runs do not execute.
- **The auditor can read but cannot spend** — a viewing key is view-only; spending requires an account signature verified inside the proof.
- **Governance can upgrade without delay** — users have no on-chain reaction window to governance changes.

## Local setup

```bash
git clone https://github.com/EndPx/zkpayslip.git
cd zkpayslip
npm install
cp .env.example .env.local     # add your Alchemy Starknet RPC key
npm run dev -- -p 3100         # http://localhost:3100
```

Pinned versions (do not upgrade):
- starknet.js: **exactly 10.4.0**
- Wallet API spec: **v0.10.3**
- Scarb: **2.18.0** (for the Cairo contract)
- Node.js: **≥ 24** (v24.18.0 tested)

Install a privacy-enabled wallet (Ready) and switch to Mainnet or Sepolia. STRK for gas and shielding comes from a CEX that supports Starknet withdrawals or bridged from Ethereum.

### Cairo contract

```bash
cd cairo
scarb build                    # verified clean
# snforge test                 # blocked on Windows (no binary); run via WSL
# sncast declare --network sepolia
# sncast deploy --network sepolia --constructor-calldata <employer_address>
```

## Benchmark

Recipients-per-transaction is a measured number, not the RFP's figure of fifty. The benchmark harness lives at `/bench`; numbers land here once run on Sepolia with registered recipients.

| Strategy | Recipients/tx | Proving avg (ms) | Total (ms) | Calldata avg (B) | Fee/recipient (STRK) | Result |
| --- | --- | --- | --- | --- | --- | --- |
| sequential | 1 | _PENDING_ | _PENDING_ | _PENDING_ | _PENDING_ | _PENDING_ |
| batch | _PENDING_ | _PENDING_ | _PENDING_ | _PENDING_ | _PENDING_ | _PENDING_ |

Settled limit (with margin): **_PENDING measurement_**.

## Roadmap

- **Session-key admin tooling** — scoped to a cycle budget; an expensive auth layer invisible in a three-minute demo, deferred.
- **Paymaster sponsorship** — decouple the submitter address; research shows registration cannot be delegated, documented as a finding.
- **Tiered vesting** — the current contract ships a binary cliff; partial unlocks come later.
- **Payments by identifier** — the current flow uses wallet addresses; identifier-based onboarding is a future item.
- **Full cryptographically-linked disclosure** — the on-chain disclosure is commitment-based; a fully zero-knowledge proof binding the disclosure to a specific channel's commitment set is a post-hackathon item.

## Acknowledgements

Bootstrapped from the [STRK20 Starter Kit](https://github.com/Akashneelesh/strk20-starter-kit) (MIT, © 2023 Philippe ROSTAN — see [docs/THIRD-PARTY-NOTICES.md](./docs/THIRD-PARTY-NOTICES.md)). Built on the [STRK20 privacy pool](https://strk20.starknet.io). Implementation of [RFP-11 — Private Payroll](https://strk20.starknet.io/rfp/private-payroll).

## License

[MIT](./LICENSE)