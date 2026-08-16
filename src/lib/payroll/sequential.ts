import type { RecipientResult, PayrollRunResult, TxRecord } from "./types";
import { transferAction, approxPayloadBytes } from "./actions";
import type { PayrollRunOptions } from "./types";

/**
 * Sequential strategy: one private transfer per transaction.
 *
 * Guaranteed to work (no multi-action limits) and produces one mainnet hash
 * per recipient. Note: spending a note creates change that matures 10 blocks
 * later; the wallet enforces maturity client-side, so back-to-back runs may
 * include wallet-side waits. That wait time lands in provingMs and is part of
 * what the benchmark measures for the sequential route.
 */
export async function runSequential(opts: PayrollRunOptions): Promise<PayrollRunResult> {
  const started = Date.now();
  const txHashes: string[] = [];
  const results: RecipientResult[] = [];
  const perTx: TxRecord[] = [];

  for (const entry of opts.entries) {
    const recipient = opts.recipients[entry.channelId];
    if (!recipient) {
      results.push({ channelId: entry.channelId, ok: false, error: "no recipient address" });
      continue;
    }
    const actions = [transferAction(entry, opts.token, recipient)];
    try {
      const out = await opts.deps.invoke(actions);
      txHashes.push(out.txHash);
      perTx.push({
        txHash: out.txHash,
        actions: 1,
        provingMs: out.provingMs,
        calldataBytes: out.calldataBytes,
        fee: out.fee,
        reverted: out.reverted,
      });
      results.push({
        channelId: entry.channelId,
        ok: !out.reverted,
        txHash: out.txHash,
        error: out.reverted ? "transaction reverted" : undefined,
      });
    } catch (err: any) {
      results.push({
        channelId: entry.channelId,
        ok: false,
        error: err?.message ?? String(err),
      });
    }
  }

  return {
    strategy: "sequential",
    txHashes,
    results,
    perTx,
    totalMs: Date.now() - started,
    hasFailures: results.some((r) => !r.ok),
  };
}
