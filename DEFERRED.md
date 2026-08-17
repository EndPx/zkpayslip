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

## Step 4 — Run the batch benchmark (needs registered recipients)

The benchmark measures proving time / calldata / limits per recipient count.
Proving behaviour is network-independent, so the default run is **Sepolia**
(free via faucet); a mainnet run is optional.

**What you do, in order (Sepolia default)**

1. Switch Ready to **Sepolia**; fund both accounts from the Starknet Sepolia
   faucet (`https://starknet-faucet.com` or the faucet linked in Ready).
2. Create up to **20 extra accounts** in Ready (the bench targets 2/5/10/20
   recipients). Fund each with a dust amount and **register every one**
   (viewing key) — registration must precede payment; this is the Step 7b
   "fund and register benchmark accounts" work.
3. Open **http://localhost:3100/bench**, paste the recipient addresses as a
   JSON array, pick `sequential`, click **Run 2** — then Run 5 / 10 / 20.
   Switch to `batch`, set recipients-per-tx equal to the run size, repeat
   2 / 5 / 10 / 20 until a count starts failing.
4. Click **Copy FINDINGS markdown** and paste the block into
   `docs/FINDINGS.md` (or just confirm and the agent files it).

**Bring back**

- Nothing manual beyond the runs — the exported table carries the numbers.

**What happens next**

- FINDINGS benchmark tables go from PENDING to measured; the settled
  recipients-per-transaction number gets chosen with margin and written into
  the README.

---

### Step 5 — snforge tests (blocker), sepolia deploy, class declaration

Starknet Foundry has no Windows build as of v0.63.0 — `scarb build` passes
but `snforge test` is blocked on this OS. Two options, both yours to run:

1. Install snforge inside **WSL** (`curl -L https://raw.githubusercontent.com/foundry-rs/starknet-foundry/master/scripts/install.sh | bash`), then `cd cairo && snforge test`.
2. Or run the contract as-is and discover errors on-chain instead of in unit tests.

Two cryptographic states were simplified to make this deployable today: (a)
the employer links a disclosure to a channel off-chain, not via an on-chain
proof; (b) vesting is a binary claim. A full cryptographically-linked
disclosure is a post-hackathon item.

**What you do, in order**

1. Write `tests.cairo` if you want unit coverage beyond the build. A starter test would assert that `add_channel` then `activate_channel` moves the state Pending→Active, and that a second `redeem_disclosure` reverts.
2. Declare the class on Sepolia: `sncast declare --network sepolia`.
3. Deploy with the employer address as the constructor arg: `sncast deploy --network sepolia --class-hash <hash> --constructor-calldata <employer>`.
4. Bring back the contract address and class hash.

**Bring back**

- Class hash, deployed address, and any test pass/fail output.

**What happens next**

- The TypeScript integration code gets the address wired in; Step 5's exit condition "tests pass" flips to verified once you confirm the snforge output from WSL.

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
5. Record the 3-minute demo video. Shot list (in order): the problem →
   employer runs payroll → explorer view showing nothing → employee sees
   their own salary → employee generates a proof → verifier validates it.

**Bring back**

- Contract address, the tx hashes, the demo URL, and the video URL.

**What happens next**

- Step 9's exit condition closes; the hub shows the submission complete.
