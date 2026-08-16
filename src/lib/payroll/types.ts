import type { WALLET_API } from "@starknet-io/types-js";
import type { PayrollEntry } from "../../../types/payroll";

/** Strategy identifiers for executePayrollRun. */
export type StrategyName = "sequential" | "batch";

/** What one wallet invocation reports back. Times are wall-clock ms. */
export interface InvokeOutcome {
  txHash: string;
  /** Wall-clock ms from invoke() call to response (includes wallet-side proving). */
  provingMs: number;
  /** Approximate serialized size of the action payload, bytes. */
  calldataBytes: number;
  /** Network fee actually paid, smallest unit, when a receipt was readable. */
  fee?: bigint;
  reverted?: boolean;
}

/** Everything the strategies need from the outside world — real wallet or mock. */
export interface PayrollDeps {
  invoke(actions: WALLET_API.STRK20_ACTION[]): Promise<InvokeOutcome>;
}

/** Per-recipient outcome inside a run. */
export interface RecipientResult {
  channelId: string;
  ok: boolean;
  txHash?: string;
  error?: string;
}

/** One submitted transaction within a run. */
export interface TxRecord {
  txHash: string;
  actions: number;
  provingMs: number;
  calldataBytes: number;
  fee?: bigint;
  reverted?: boolean;
}

/** Result of a whole payroll run. */
export interface PayrollRunResult {
  strategy: StrategyName;
  txHashes: string[];
  results: RecipientResult[];
  perTx: TxRecord[];
  totalMs: number;
  /** True when any recipient failed. */
  hasFailures: boolean;
}

/** Options for executePayrollRun. */
export interface PayrollRunOptions {
  strategy: StrategyName;
  deps: PayrollDeps;
  token: string;
  /** Batch strategy only: transfer actions per transaction. */
  recipientsPerTx?: number;
  /** Skipped by the caller (active channels only reach here), kept for type clarity. */
  entries: PayrollEntry[];
  /** Recipient address per channel id — the caller maps channels to addresses. */
  recipients: Record<string, string>;
}
