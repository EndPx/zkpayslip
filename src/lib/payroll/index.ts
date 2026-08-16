import type { PayrollRunOptions, PayrollRunResult } from "./types";
import { runSequential } from "./sequential";
import { runBatch } from "./batch";

export { runSequential, runBatch };
export { createMockDeps } from "./mockDeps";
export { createWalletDeps } from "./walletDeps";
export { transferAction, approxPayloadBytes } from "./actions";
export type {
  StrategyName,
  PayrollDeps,
  InvokeOutcome,
  RecipientResult,
  TxRecord,
  PayrollRunResult,
  PayrollRunOptions,
} from "./types";

/**
 * Execute a payroll run: private transfers for every entry, via the chosen
 * strategy. Returns per-recipient results plus per-transaction metrics for
 * the benchmark. Never throws for a recipient-level failure — failures are
 * reported in results; only programmer errors (bad options) throw.
 */
export async function executePayrollRun(opts: PayrollRunOptions): Promise<PayrollRunResult> {
  switch (opts.strategy) {
    case "sequential":
      return runSequential(opts);
    case "batch":
      return runBatch(opts);
    default:
      throw new Error(`Unknown strategy: ${(opts as PayrollRunOptions).strategy}`);
  }
}
