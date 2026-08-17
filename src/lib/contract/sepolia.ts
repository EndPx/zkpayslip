"use client";

import { shortString, num, hash } from "starknet";

/**
 * Read-only access to the zkPayslip contract on Sepolia via raw RPC calls.
 *
 * No wallet needed — these are all read-only starknet_call requests, which is
 * the whole point of the verifier surface: a bank checks a proof without
 * installing anything.
 *
 * Privacy rule (AGENTS.md): never log an amount, an address, or note contents.
 * Errors surface as an error class name only, never a value.
 */

export const ZKPAYSLIP_SEPOLIA_ADDRESS =
  "0x051c29216ddd5e9016fad4380db34e895dc8176f58ec4754cb3b4c4f14bda8b3";

export const ZKPAYSLIP_CLASS_HASH =
  "0x0189e68090e90293e589b03b6dfb18552da6ad381eeae104d562548e060b8582";

/**
 * Public Sepolia node, no API key. Verified live 2026-08-17 at spec 0.10.2.
 *
 * Do NOT swap this for a Blast API endpoint: `blastapi.io` is decommissioned
 * (it answers every request with a "no longer available" error) and
 * `blastapi.org` does not resolve at all. See docs/FINDINGS.md.
 */
const SEPOLIA_RPC = "https://starknet-sepolia-rpc.publicnode.com";

/**
 * Block tags, in preference order.
 *
 * Spec 0.10.x renamed the `pending` tag to `pre_confirmed`; a node on that
 * version rejects `pending` outright with "unknown block tag", which is how
 * this call silently failed before. We ask for `pre_confirmed` first so a
 * freshly submitted disclosure is visible to its verifier immediately, and
 * fall back to `latest`, which every spec version accepts.
 */
const BLOCK_TAGS = ["pre_confirmed", "latest"] as const;

// Entry point selectors (starknet keccak of the function name).
const SEL_CHECK_DISCLOSURE = hash.starknetKeccak("check_disclosure").toString(16);
const SEL_GET_DISCLOSURE = hash.starknetKeccak("get_disclosure").toString(16);
const SEL_GET_CHANNEL = hash.starknetKeccak("get_channel").toString(16);
const SEL_GET_COMMITMENT = hash.starknetKeccak("get_commitment").toString(16);

/** Thrown when the node cannot be reached or refuses the request. */
export class ChainUnreachableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChainUnreachableError";
  }
}

async function rpcCall(method: string, params: unknown): Promise<any> {
  let resp: Response;
  try {
    resp = await fetch(SEPOLIA_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
    });
  } catch {
    throw new ChainUnreachableError("network request failed");
  }
  if (!resp.ok) throw new ChainUnreachableError(`node returned HTTP ${resp.status}`);

  const data = await resp.json();
  if (data.error) throw new ChainUnreachableError(data.error.message ?? "rpc error");
  return data.result;
}

/**
 * Read-only contract call. Tries each block tag in turn so one node's spec
 * version cannot silently break the verifier.
 */
async function callView(selectorHex: string, calldata: string[]): Promise<string[]> {
  let lastErr: unknown;
  for (const tag of BLOCK_TAGS) {
    try {
      const result = await rpcCall("starknet_call", {
        request: {
          contract_address: ZKPAYSLIP_SEPOLIA_ADDRESS,
          entry_point_selector: `0x${selectorHex}`,
          calldata,
        },
        block_id: tag,
      });
      return Array.isArray(result) ? result : [result];
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new ChainUnreachableError("all block tags rejected");
}

export interface ChainChannel {
  recipient: string;
  /** felt: 0 = pending_registration, 1 = active, 2 = terminated. */
  state: string;
  createdAt: number;
}

export interface ChainDisclosure {
  factHash: string;
  verifier: string;
  expiresAt: number;
  nullifier: string;
  redeemed: boolean;
}

/** The verdicts check_disclosure can return, plus a transport failure. */
export type ChainVerdict =
  | "VALID"
  | "EXPIRED"
  | "ALREADY_REDEEMED"
  | "NOT_FOUND"
  | "UNREACHABLE";

function feltToHex(v: string): string {
  try {
    return num.toHex(v);
  } catch {
    return v;
  }
}

function feltToString(v: string): string {
  try {
    return shortString.decodeShortString(v);
  } catch {
    return v;
  }
}

/** Map the contract's felt markers onto UI verdicts. */
function mapVerdict(marker: string): ChainVerdict {
  switch (marker) {
    case "VALID":
      return "VALID";
    case "EXP":
      return "EXPIRED";
    case "REDM":
      return "ALREADY_REDEEMED";
    case "NF":
    default:
      return "NOT_FOUND";
  }
}

/**
 * Coerce user input into a felt the node will accept.
 *
 * The employee portal hands out ids like `d_m4x1k2`, which are not felts at
 * all. Sending one raw makes the node reject the whole request, which the
 * caller would then read as "unreachable". Anything not already numeric is
 * hashed into felt space instead — the same derivation used when the
 * disclosure was created, so the two agree.
 */
export function toFelt(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (/^0x[0-9a-fA-F]+$/.test(v)) return v;
  if (/^\d+$/.test(v)) return num.toHex(v);
  try {
    return num.toHex(hash.starknetKeccak(v));
  } catch {
    return null;
  }
}

/**
 * Ask the contract whether a disclosure is live, spent, expired, or absent.
 *
 * Returns "UNREACHABLE" — never "NOT_FOUND" — when the node cannot answer, so
 * the caller can say "we could not check" instead of "no such proof". Reporting
 * a network failure as an absent proof would be a lie told to a verifier.
 */
export async function checkDisclosureOnChain(disclosureId: string): Promise<ChainVerdict> {
  const id = toFelt(disclosureId);
  if (!id) return "NOT_FOUND";
  try {
    const result = await callView(SEL_CHECK_DISCLOSURE, [id]);
    return mapVerdict(feltToString(result[0]));
  } catch (err: any) {
    // Privacy-safe: the error class only, never the disclosure id.
    console.error("[zkPayslip] on-chain check failed:", err?.name ?? "Error");
    return "UNREACHABLE";
  }
}

export async function getDisclosureOnChain(
  disclosureId: string
): Promise<ChainDisclosure | null> {
  const id = toFelt(disclosureId);
  if (!id) return null;
  try {
    const result = await callView(SEL_GET_DISCLOSURE, [id]);
    return {
      factHash: feltToHex(result[0]),
      verifier: feltToHex(result[1]),
      expiresAt: Number(BigInt(result[2])),
      nullifier: feltToHex(result[3]),
      redeemed: BigInt(result[4]) !== 0n,
    };
  } catch {
    return null;
  }
}

export async function getChannelOnChain(channelId: string): Promise<ChainChannel | null> {
  const id = toFelt(channelId);
  if (!id) return null;
  try {
    const result = await callView(SEL_GET_CHANNEL, [id]);
    return {
      recipient: feltToHex(result[0]),
      state: BigInt(result[1]).toString(),
      createdAt: Number(BigInt(result[2])),
    };
  } catch {
    return null;
  }
}

export async function getCommitmentOnChain(commitmentKey: string): Promise<string | null> {
  const key = toFelt(commitmentKey);
  if (!key) return null;
  try {
    const result = await callView(SEL_GET_COMMITMENT, [key]);
    return feltToHex(result[0]);
  } catch {
    return null;
  }
}

/** Live network status, for surfaces that show where their data came from. */
export async function chainReachable(): Promise<boolean> {
  try {
    await rpcCall("starknet_specVersion", []);
    return true;
  } catch {
    return false;
  }
}
