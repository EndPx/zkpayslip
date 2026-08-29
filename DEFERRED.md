# DEFERRED — actions that need the developer's wallet

Each entry states: which step, exactly what to click or run, what information
to bring back, and what happens once confirmed. Nothing here is done by the
agent — these move real funds or need keys that only the developer holds.

Work continues against mocked wallet state while these wait; every component
built that way is listed as UNVERIFIED in `docs/PROGRESS.md` until the matching
entry below is completed.

---

## Step 1 — Connect a supported wallet

**What you do**

1. Install the **Ready** wallet extension (Ready, formerly Argent) in your
   browser. Xverse also works once its Wallet API ships; test with Ready first.
2. With the dev server running (`npm run dev -- -p 3100`, see note below),
   open **http://localhost:3100** — not port 3000, another project on this
   machine occupies it.
3. Click **Connect a Wallet**, pick Ready, approve the connection.
4. Switch the wallet's network to **Sepolia** for development.

**Bring back**

- "Connected with Ready on Sepolia" plus the address you connected with.

**What happens next**

- All wallet-dependent components get re-tested for real and flipped from
  UNVERIFIED to VERIFIED in `docs/PROGRESS.md`; Step 1's exit condition closes.

---

## Step 2 — First mainnet contact (gate for scoring eligibility)

Budget: a few STRK you do not mind losing (the Day 0 guide says three
transactions of a few STRK each satisfy the rule). Suggested split: shield
2 STRK, transfer 1 STRK, keep 1 STRK for fees.

**What you do, in order**

1. **Fund**: get STRK on Starknet mainnet — withdraw from an exchange that
   supports Starknet withdrawals, or bridge from Ethereum. Do this in the
   Ready wallet's **main** account (this account plays the employer).
2. Switch Ready to **Mainnet**.
3. **Register** the main account's viewing key (once per account). Easiest
   path: the official app at `https://strk20.starknet.io/app` does
   registration and shielding through its UI. The wallet also registers on
   first STRK20 action.
4. **Shield** a small amount (e.g. 2 STRK) — via the official app or the
   starter-kit Shield tab at localhost:3100. **Record the tx hash (HASH 1).**
5. Open HASH 1 on Voyager (`https://voyager.online/tx/<hash>`): confirm the
   target contract is `0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a`
   (the published mainnet pool). Note anything unexpected.
6. **Second account**: create a test account in Ready (it plays the
   employee). It needs a little STRK for its registration fee — send it
   ~0.5 STRK publicly, then register its viewing key.
7. **Private transfer** 1 STRK from the main account to the test account.
   **Record the tx hash (HASH 2).** Confirm the test account's shielded
   balance shows the note.
8. **Negative test**: attempt a private transfer to any address that has
   never registered. Observe exactly where it fails (wallet refuses to
   build the action vs. on-chain revert) and grab the error text.

**Bring back**

- HASH 1, HASH 2, the pool address you saw on Voyager, and the
  unregistered-recipient failure observation (where it failed + error text).

**What happens next**

- `strk20.json` `transactions[]` gets the two hashes (third lands with
  Step 9); `docs/FINDINGS.md` "Mainnet day 0" section gets filled with real
  observations; Step 2's exit condition closes; Step 4 benchmark accounts
  can reuse these two registered accounts.

---

## Step 4 — Run the batch benchmark (needs your Ready wallet on Sepolia)

Agent-side execution was attempted and is **blocked on protocol
infrastructure, not on tooling**: no hosted Sepolia proving/discovery service
URL is published anywhere official (full analysis in
`docs/FINDINGS.md` → "SDK benchmark route"), and self-hosting the prover
stack is out of scope for the sprint. The wallet performs proving internally,
so the benchmark runs through the **/bench panel** with your wallet connected.

**Recommended scope — 10 recipients, not 20.** Registering recipients is the
expensive part (each needs its own wallet, faucet funding, and a viewing-key
registration). 2 / 5 / 10 still yields a measured curve; 20 is a bonus if the
first three go smoothly.

**What you do, in order**

1. Switch Ready to **Sepolia**; fund the main account from the faucet
   (`https://faucet.starknet.io` — 100 STRK per address per 24h).
2. In Ready, create **10** sub-accounts. Give each a dust of STRK
   (Ready can send to its own accounts) and open each once to trigger
   **registration** (viewing key) — the pool counts registration per account.
3. Shield ~2 STRK on the main account (the bench pays from the shielded
   balance). One shield is enough for all runs.
4. Open **http://localhost:3100/bench** (or the production URL), connect the
   main account, paste the 10 recipient addresses as a JSON array.
5. `sequential` → Run 2, Run 5, Run 10. Then `batch` (recipients-per-tx =
   run size) → Run 2, Run 5, Run 10 — stop at whichever count fails.
6. Click **Copy FINDINGS markdown** and send the table back.

**Bring back**

- The exported markdown table (or just "done" — the numbers are also visible
  in the panel).

**What happens next**

- FINDINGS benchmark tables go from PENDING to measured; the settled
  recipients-per-transaction number gets chosen with margin and written into
  the README. If this step is skipped, the README's benchmark section stays
  honestly marked PENDING — the submission gate does not require it.

---

### Step 5 — snforge tests + sepolia deploy: DONE (2026-08-17)

- scarb build: clean (284 lines)
- snforge test: 2/2 PASS via WSL (channel lifecycle + disclosure redeem-once)
- Sepolia deploy: contract live at `0x051c29216ddd5e9016fad4380db34e895dc8176f58ec4754cb3b4c4f14bda8b3`
- Class hash: `0x0189e68090e90293e589b03b6dfb18552da6ad381eeae104d562548e060b8582`
- Deployer account: `0x0235faa586929fcd7411fd3da2b446cdbbd7ff579c11e3672e5fb68ac753d84` (100 STRK funded from faucet)
- Verified: `get_channel(0x123)` returns zero struct — contract callable on Sepolia

**Remaining for Step 5**: mainnet deploy (handled in Step 9).

---

## Step 9 — Mainnet deployment + three pool transactions + demo

Depends on Steps 5 and 8. Naturally last. Budget: contract deploy fee + one
small payroll cycle (~3 STRK) + fees.

**What you do, in order**

1. Confirm Steps 5–8 exit conditions are green.
2. Deploy the payroll contract to mainnet with the prepared script
   (`npm run deploy -- --network mainnet` — script lands with Step 5); the
   deployer is your employer account. Bring back the contract address.
3. In the app (mainnet): shield a small amount, run a one-recipient payroll
   cycle to the test account (private transfer), unshield from the test
   account. Three pool-touching hashes total (Step 2's hashes already count
   toward the three if you prefer fewer spends).
4. Fill `strk20.json`: `transactions` (≥3), `contracts`, `demo_video`,
   `demo_url`; set the repository **Website** field to the demo URL.
5. Record the 3-minute demo video. Shot list (in order, ~30s each):
   - **The problem** (narrator over /about hero + paths A/B/C: "a wallet
     address is a financial strip-search").
   - **Employer runs payroll** (employer dashboard: add channel, activate,
     execute run — explorer shows nothing meaningful).
   - **Explorer view showing nothing** (Voyager tx: sender is a relayer,
     amounts/counterparties absent).
   - **Employee sees their own salary** (employee portal: shielded balance,
     reveal a pay-period row).
   - **Employee generates a proof** (generate disclosure → copy verify
     link).
   - **Verifier validates it** (verify page: paste id → VALID → fact
     revealed → redeem → second attempt = ALREADY_REDEEMED).

**Bring back**

- Contract address, the tx hashes, the demo URL, and the video URL.

**What happens next**

- Step 9's exit condition closes; the hub shows the submission complete.
