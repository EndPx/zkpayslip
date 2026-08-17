"use client";

import { num, hash } from "starknet";
import { ZKPAYSLIP_SEPOLIA_ADDRESS, toFelt } from "./sepolia";

/**
 * Write path to the zkPayslip contract, through the user's connected wallet.
 *
 * The read side (./sepolia) needs no wallet — that is the verifier's whole
 * premise. Writes are different: every one of these is a signed transaction,
 * and the signature must come from the user's own wallet. This module never
 * sees a key; it hands the wallet a call and the wallet does the rest.
 *
 * The account is typed structurally rather than as WalletAccountV6 so the
 * caller can pass any signer-shaped object, matching how ../payroll/walletDeps
 * already does it.
 *
 * Privacy rule (AGENTS.md): nothing here logs an address, an amount, or a
 * disclosure's contents.
 */

interface Call {
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
}

/** The minimum this module needs from a connected wallet. */
export interface SignerLike {
  execute(calls: Call[]): Promise<{ transaction_hash: string }>;
}

export class WalletMissingError extends Error {
  constructor() {
    super("No wallet connected — this action must be signed.");
    this.name = "WalletMissingError";
  }
}

function call(entrypoint: string, calldata: string[]): Call {
  return { contractAddress: ZKPAYSLIP_SEPOLIA_ADDRESS, entrypoint, calldata };
}

async function send(
  account: SignerLike | undefined,
  entrypoint: string,
  calldata: string[]
): Promise<string> {
  if (!account) throw new WalletMissingError();
  const { transaction_hash } = await account.execute([call(entrypoint, calldata)]);
  return transaction_hash;
}

// ─── channels (employer; the contract enforces owner-only) ──────────────────

export function addChannelOnChain(
  account: SignerLike | undefined,
  channelId: string,
  recipient: string
): Promise<string> {
  const id = toFelt(channelId);
  if (!id) throw new Error("Invalid channel id.");
  return send(account, "add_channel", [id, recipient]);
}

export function activateChannelOnChain(
  account: SignerLike | undefined,
  channelId: string
): Promise<string> {
  const id = toFelt(channelId);
  if (!id) throw new Error("Invalid channel id.");
  return send(account, "activate_channel", [id]);
}

export function terminateChannelOnChain(
  account: SignerLike | undefined,
  channelId: string
): Promise<string> {
  const id = toFelt(channelId);
  if (!id) throw new Error("Invalid channel id.");
  return send(account, "terminate_channel", [id]);
}

// ─── disclosures (employee creates, verifier redeems) ────────────────────────

export interface DisclosureDraft {
  /** Local id, hashed into felt space so reads and writes agree on it. */
  disclosureId: string;
  /** Commitment to the fact being revealed — never the fact itself. */
  factHash: string;
  /** Only this address may redeem. Binding to it means a leaked link is inert. */
  verifier: string;
  /** Unix seconds. */
  expiresAt: number;
  /** One-time value, burned on redemption. */
  nullifier: string;
}

/**
 * Derive a disclosure's on-chain fields from its local draft.
 *
 * The fact is committed as a hash, never sent in the clear: the contract
 * stores a commitment, and the verifier learns the fact from the holder, not
 * from public calldata.
 */
export function deriveDisclosureFields(draft: {
  disclosureId: string;
  factLabel: string;
  verifier: string;
  expiresAt: number;
  nullifierSeed: string;
}): DisclosureDraft {
  const disclosureId = toFelt(draft.disclosureId);
  const nullifier = toFelt(draft.nullifierSeed);
  if (!disclosureId || !nullifier) throw new Error("Invalid disclosure id.");
  return {
    disclosureId,
    factHash: num.toHex(hash.starknetKeccak(draft.factLabel)),
    verifier: draft.verifier,
    expiresAt: draft.expiresAt,
    nullifier,
  };
}

export function createDisclosureOnChain(
  account: SignerLike | undefined,
  d: DisclosureDraft
): Promise<string> {
  return send(account, "create_disclosure", [
    d.disclosureId,
    d.factHash,
    d.verifier,
    String(d.expiresAt),
    d.nullifier,
  ]);
}

/**
 * Redeem a disclosure. The contract rejects this unless the caller is the
 * bound verifier, the window is open, and it has not been redeemed — then it
 * burns the nullifier, so a second attempt reverts. Verified against Sepolia
 * by scripts/verify-sepolia.mjs.
 */
export function redeemDisclosureOnChain(
  account: SignerLike | undefined,
  disclosureId: string
): Promise<string> {
  const id = toFelt(disclosureId);
  if (!id) throw new Error("Invalid disclosure id.");
  return send(account, "redeem_disclosure", [id]);
}

/**
 * Turn a contract revert into something a person can read.
 *
 * The contract's error constants are short strings (NOT_OWNER, REDEEMED,
 * WRONG_V…). Surfacing the raw revert would be both unfriendly and, for a
 * verifier, ambiguous about whose fault it was.
 */
export function explainRevert(err: unknown): string {
  const raw = String((err as Error)?.message ?? err);
  if (raw.includes("WRONG_V")) return "This proof was issued to a different verifier.";
  if (raw.includes("REDEEMED")) return "Already redeemed — the nullifier is burned.";
  if (raw.includes("EXPIRED")) return "This proof's window has closed.";
  if (raw.includes("BURNED")) return "That nullifier has already been burned.";
  if (raw.includes("D_EXISTS")) return "A proof with this id already exists.";
  if (raw.includes("NO_D")) return "No such proof on-chain.";
  if (raw.includes("NOT_OWNER")) return "Only the employer account can do that.";
  if (raw.includes("EXISTS")) return "That channel already exists.";
  if (raw.includes("NOT_ACTIVE")) return "That channel is not active.";
  if (raw.includes("NOT_PENDING")) return "That channel is not pending registration.";
  if (raw.includes("NO_CHANNEL")) return "No such channel.";
  if (/user (abort|reject)|rejected/i.test(raw)) return "Signature rejected in the wallet.";
  return "The transaction was rejected by the contract.";
}
