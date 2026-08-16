import type { InvokeOutcome, PayrollDeps } from "./types";
import { approxPayloadBytes } from "./actions";

/**
 * Real wallet deps: submit STRK20 actions through the connected
 * WalletAccountV6 instance and read the receipt for fee/status.
 *
 * provingMs is wall-clock from call to response — on the Wallet API route
 * this includes the wallet-side STARK proof generation, which is exactly the
 * number the benchmark wants. Fee parsing is best-effort: a receipt that
 * cannot be read leaves fee undefined and the run still reports.
 */
export function createWalletDeps(
  account: { strk20InvokeTransaction(a: any): Promise<{ transaction_hash: string }> },
  provider?: { waitForTransaction(h: string, o: any): Promise<any> }
): PayrollDeps {
  return {
    async invoke(actions): Promise<InvokeOutcome> {
      const t0 = Date.now();
      const r = await account.strk20InvokeTransaction(actions);
      const provingMs = Date.now() - t0;
      const txHash = r.transaction_hash;

      let fee: bigint | undefined;
      let reverted: boolean | undefined;
      try {
        if (provider) {
          const receipt: any = await provider.waitForTransaction(txHash, {
            retries: 400,
            retryInterval: 3000,
          });
          const rec = receipt?.value ?? receipt;
          const feeRaw = rec?.actual_fee?.amount ?? rec?.actual_fee;
          if (feeRaw !== undefined && feeRaw !== null) fee = BigInt(String(feeRaw));
          reverted = rec?.execution_status === "REVERTED";
        }
      } catch {
        /* fee/status stay undefined — metrics above are still valid */
      }
      return { txHash, provingMs, calldataBytes: approxPayloadBytes(actions), fee, reverted };
    },
  };
}
