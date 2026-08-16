import { num } from "starknet";
import type { WALLET_API } from "@starknet-io/types-js";
import type { PayrollEntry } from "../../../types/payroll";

/**
 * Build the private-transfer action for one entry.
 *
 * Amounts are hex-normalized; recipients are plain addresses. No placeholders
 * are involved in a plain transfer action ("OPEN" / "${poolAddress}" only
 * appear in invoke actions, which payroll transfers never use).
 */
export function transferAction(
  entry: Pick<PayrollEntry, "amount">,
  token: string,
  recipient: string
): WALLET_API.STRK20_ACTION {
  return {
    type: "transfer",
    token,
    amount: num.toHex(entry.amount),
    recipient,
  };
}

/**
 * Approximate the serialized size of an action payload in bytes.
 *
 * The Wallet API route never exposes the raw calldata; JSON length is a stable
 * lower-bound proxy so the benchmark can compare sequential vs batch payload
 * growth. Documented as an approximation in docs/FINDINGS.md.
 */
export function approxPayloadBytes(actions: WALLET_API.STRK20_ACTION[]): number {
  return JSON.stringify(actions).length;
}
