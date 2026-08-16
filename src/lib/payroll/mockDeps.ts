import type { WALLET_API } from "@starknet-io/types-js";
import type { InvokeOutcome, PayrollDeps } from "./types";
import { approxPayloadBytes } from "./actions";

/**
 * Mock payroll deps for UI development without a wallet.
 *
 * Every hash is prefixed MOCK_ so a mocked run can never be mistaken for a
 * real chain transaction — in the UI, in exported benchmark JSON, or in logs.
 * Mocking for development is expected; claiming an exit condition on mocked
 * output is not, and nothing downstream treats these hashes as real.
 */
export function createMockDeps(opts?: { delayMs?: number }): PayrollDeps {
  const base = opts?.delayMs ?? 900;
  let counter = 0;
  return {
    async invoke(actions: WALLET_API.STRK20_ACTION[]): Promise<InvokeOutcome> {
      // Simulated proving latency grows with the action count, like real proofs.
      const delay = base + actions.length * 350;
      await new Promise((r) => setTimeout(r, delay));
      counter += 1;
      const txHash = `MOCK_${Date.now().toString(36)}_${counter}`;
      return {
        txHash,
        provingMs: delay,
        calldataBytes: approxPayloadBytes(actions),
      };
    },
  };
}
