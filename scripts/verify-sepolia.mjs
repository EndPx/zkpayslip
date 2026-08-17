// Exercise the deployed zkPayslip contract on Sepolia end to end.
//
// snforge already proves the contract's logic inside a local VM. This proves
// the *deployed* contract answers the same way on a real network — the claim
// the README makes to a judge. Run it and paste the printed hashes into
// docs/PROGRESS.md.
//
//   node scripts/verify-sepolia.mjs
//
// Needs .env (gitignored) with the Sepolia deployer account. Nothing here
// touches mainnet and nothing here moves anything of value: the account is
// faucet-funded testnet STRK.

import { readFileSync } from "node:fs";
import { RpcProvider, Account, hash, shortString, num } from "starknet";

const CONTRACT = "0x051c29216ddd5e9016fad4380db34e895dc8176f58ec4754cb3b4c4f14bda8b3";
const RPC = "https://starknet-sepolia-rpc.publicnode.com";

// ─── env ────────────────────────────────────────────────────────────────────

function loadEnv(path = ".env") {
  const out = {};
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    console.error(`Missing ${path}. Copy .env.example and fill in the Sepolia account.`);
    process.exit(1);
  }
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const env = loadEnv();
const ADDRESS = env.STARKNET_SEPOLIA_ACCOUNT_ADDRESS;
const PRIVATE_KEY = env.STARKNET_SEPOLIA_PRIVATE_KEY;

if (!ADDRESS || !PRIVATE_KEY) {
  console.error(
    "STARKNET_SEPOLIA_ACCOUNT_ADDRESS and STARKNET_SEPOLIA_PRIVATE_KEY must be set in .env"
  );
  process.exit(1);
}

const provider = new RpcProvider({ nodeUrl: RPC });
// starknet.js 10.x takes a single options object here, not positional args.
const account = new Account({ provider, address: ADDRESS, signer: PRIVATE_KEY });

// ─── helpers ────────────────────────────────────────────────────────────────

const results = [];

function record(step, ok, detail) {
  results.push({ step, ok, detail });
  console.log(`${ok ? "  PASS" : "  FAIL"}  ${step}${detail ? ` — ${detail}` : ""}`);
}

async function read(entrypoint, calldata) {
  // "pre_confirmed" is the spec-0.10 name for what used to be "pending".
  return provider.callContract(
    { contractAddress: CONTRACT, entrypoint, calldata },
    "pre_confirmed"
  );
}

async function write(entrypoint, calldata) {
  const { transaction_hash } = await account.execute({
    contractAddress: CONTRACT,
    entrypoint,
    calldata,
  });
  await provider.waitForTransaction(transaction_hash);
  return transaction_hash;
}

/** Run a write that is expected to revert. Resolves reverted:true when it does. */
async function expectRevert(entrypoint, calldata) {
  try {
    const h = await write(entrypoint, calldata);
    return { reverted: false, hash: h };
  } catch (err) {
    return { reverted: true, reason: String(err?.message ?? err).slice(0, 120) };
  }
}

const decode = (felt) => {
  try {
    return shortString.decodeShortString(felt);
  } catch {
    return felt;
  }
};

// Unique per run so a rerun never collides with the previous run's state.
const runTag = Date.now().toString(16);
const channelId = num.toHex(hash.starknetKeccak(`ch_verify_${runTag}`));
const disclosureId = num.toHex(hash.starknetKeccak(`d_verify_${runTag}`));
const nullifier = num.toHex(hash.starknetKeccak(`null_verify_${runTag}`));
const factHash = num.toHex(hash.starknetKeccak("income_ge_42_strk_per_cycle"));
const expiresAt = Math.floor(Date.now() / 1000) + 86_400; // 24h

// ─── run ────────────────────────────────────────────────────────────────────

console.log("zkPayslip — live verification against Sepolia");
console.log(`contract ${CONTRACT}\n`);

const hashes = {};

try {
  console.log("Channel lifecycle");

  hashes.add_channel = await write("add_channel", [channelId, ADDRESS]);
  {
    const ch = await read("get_channel", [channelId]);
    record("add_channel -> state pending (0)", BigInt(ch[1]) === 0n, `state=${BigInt(ch[1])}`);
  }

  hashes.activate_channel = await write("activate_channel", [channelId]);
  {
    const ch = await read("get_channel", [channelId]);
    record("activate_channel -> state active (1)", BigInt(ch[1]) === 1n, `state=${BigInt(ch[1])}`);
  }

  {
    const r = await expectRevert("add_channel", [channelId, ADDRESS]);
    record("re-adding the same channel reverts (EXISTS)", r.reverted);
  }

  console.log("\nDisclosure lifecycle - one fact, one verifier, one redemption");

  {
    const v = await read("check_disclosure", [disclosureId]);
    record("unknown proof reads NF", decode(v[0]) === "NF", decode(v[0]));
  }

  hashes.create_disclosure = await write("create_disclosure", [
    disclosureId,
    factHash,
    ADDRESS, // this account is the bound verifier
    String(expiresAt),
    nullifier,
  ]);
  {
    const v = await read("check_disclosure", [disclosureId]);
    record("after create -> VALID", decode(v[0]) === "VALID", decode(v[0]));
  }

  hashes.redeem_disclosure = await write("redeem_disclosure", [disclosureId]);
  {
    const v = await read("check_disclosure", [disclosureId]);
    record("after redeem -> REDM", decode(v[0]) === "REDM", decode(v[0]));
  }

  {
    const r = await expectRevert("redeem_disclosure", [disclosureId]);
    record("second redemption reverts (REDEEMED)", r.reverted);
  }

  {
    // A burned nullifier must not be reusable under a fresh disclosure id.
    const freshId = num.toHex(hash.starknetKeccak(`d_reuse_${runTag}`));
    const r = await expectRevert("create_disclosure", [
      freshId,
      factHash,
      ADDRESS,
      String(expiresAt),
      nullifier, // already burned above
    ]);
    record("burned nullifier cannot be reused (BURNED)", r.reverted);
  }
} catch (err) {
  console.error("\nRun aborted:", err?.message ?? err);
  process.exitCode = 1;
}

// ─── report ─────────────────────────────────────────────────────────────────

const passed = results.filter((r) => r.ok).length;
console.log(`\n${passed}/${results.length} checks passed`);

console.log("\nTransaction hashes (Sepolia):");
for (const [k, v] of Object.entries(hashes)) {
  console.log(`  ${k.padEnd(20)} ${v}`);
}
console.log("\nVoyager: https://sepolia.voyager.online/contract/" + CONTRACT);

if (passed !== results.length) process.exitCode = 1;
