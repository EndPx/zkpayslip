import type { RecipientResult, PayrollRunResult, TxRecord, PayrollRunOptions } from "./types";
import { transferAction, approxPayloadBytes } from "./actions";

/**
 * Batch strategy: many transfer actions inside one private transaction.
 *
 * The protocol allows multiple actions per transaction in fixed phase order;
 * what is NOT documented is the recipient count at which proving time or step
 * limits start failing — that is exactly what the benchmark measures. The
 * run splits into chunks of recipientsPerTx; a chunk that fails marks only
 * its own recipients failed and the run continues with the next chunk.
 */
export async function runBatch(opts: PayrollRunOptions): Promise<PayrollRunResult> {
  const started = Date.now();
  const perChunk = Math.max(1, opts.recipientsPerTx ?? opts.entries.length);
  const txHashes: string[] = [];
  const results: RecipientResult[] = [];
  const perTx: TxRecord[] = [];

  const chunks: typeof opts.entries[] = [];
  for (let i = 0; i < opts.entries.length; i += perChunk) {
    chunks.push(opts.entries.slice(i, i + perChunk));
  }

  for (const chunk of chunks) {
    const pairs = chunk
      .map((entry) => ({ entry, recipient: opts.recipients[entry.channelId] }))
      .filter((p) => {
        if (!p.recipient) {
          results.push({ channelId: p.entry.channelId, ok: false, error: "no recipient address" });
          return false;
        }
        return true;
      });
    if (!pairs.length) continue;

    const actions = pairs.map((p) => transferAction(p.entry, opts.token, p.recipient));
    try {
      const out = await opts.deps.invoke(actions);
      txHashes.push(out.txHash);
      perTx.push({
        txHash: out.txHash,
        actions: actions.length,
        provingMs: out.provingMs,
        calldataBytes: out.calldataBytes,
        fee: out.fee,
        reverted: out.reverted,
      });
      for (const p of pairs) {
        results.push({
          channelId: p.entry.channelId,
          ok: !out.reverted,
          txHash: out.txHash,
          error: out.reverted ? "transaction reverted" : undefined,
        });
      }
    } catch (err: any) {
      for (const p of pairs) {
        results.push({ channelId: p.entry.channelId, ok: false, error: err?.message ?? String(err) });
      }
    }
  }

  return {
    strategy: "batch",
    txHashes,
    results,
    perTx,
    totalMs: Date.now() - started,
    hasFailures: results.some((r) => !r.ok),
  };
}
