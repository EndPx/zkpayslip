"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "../uni.module.css";
import * as constants from "@/utils/constants";
import { useStoreWallet } from "../components/Wallet/walletContext";
import { useFrontendProvider } from "../components/client/provider/providerContext";
import AppNav from "../components/AppNav";
import { executePayrollRun, createMockDeps, createWalletDeps } from "@/lib/payroll";
import type { StrategyName } from "@/lib/payroll";

// Benchmark amount per recipient. Deliberately small and fixed; amounts are
// never rendered in the results — metrics only (privacy rules).
const BENCH_AMOUNT_STRK = "0.1";

function strkToBaseUnits(strk: string): bigint {
  const [whole, frac = ""] = strk.split(".");
  const fracPadded = (frac + "0".repeat(18)).slice(0, 18);
  return BigInt(whole || "0") * 10n ** 18n + BigInt(fracPadded || "0");
}

function baseUnitsToStrk(u: bigint): string {
  const whole = u / 10n ** 18n;
  const frac = (u % 10n ** 18n).toString().padStart(18, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : `${whole}`;
}

type BenchRow = {
  strategy: StrategyName;
  recipients: number;
  perTx: number;
  provingAvgMs: number;
  totalMs: number;
  calldataAvgBytes: number;
  feeAvgStrk: string | "n/a";
  ok: number;
  failed: number;
  mock: boolean;
};

export default function BenchPage() {
  const myWalletAccount = useStoreWallet((s) => s.myWalletAccount);
  const isConnected = useStoreWallet((s) => s.isConnected);
  const providerIndex = useFrontendProvider((s) => s.currentFrontendProviderIndex);

  const [recipientsText, setRecipientsText] = useState("");
  const [strategy, setStrategy] = useState<StrategyName>("sequential");
  const [recipientsPerTx, setRecipientsPerTx] = useState(2);
  const [rows, setRows] = useState<BenchRow[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const networkName = constants.Strk20Networks[providerIndex];
  const parsedRecipients = useMemo<string[]>(() => {
    try {
      const v = JSON.parse(recipientsText);
      if (Array.isArray(v) && v.every((x) => typeof x === "string")) return v;
    } catch {
      /* not valid JSON yet */
    }
    return [];
  }, [recipientsText]);

  const realMode = isConnected && !!myWalletAccount && networkName !== undefined;

  async function runCount(count: number) {
    setError(null);
    if (parsedRecipients.length < count) {
      setError(`Need ${count} recipient addresses — parsed ${parsedRecipients.length}.`);
      return;
    }
    setRunning(true);
    try {
      const recipients = parsedRecipients.slice(0, count);
      const amount = strkToBaseUnits(BENCH_AMOUNT_STRK);
      const entries = recipients.map((_, i) => ({ channelId: `bench-${i}`, amount }));
      const recipientMap = Object.fromEntries(recipients.map((addr, i) => [`bench-${i}`, addr]));

      const deps = realMode
        ? createWalletDeps(
            myWalletAccount as any,
            constants.myFrontendProviders[providerIndex] as any
          )
        : createMockDeps();

      const result = await executePayrollRun({
        strategy,
        deps,
        token: constants.addrSTRK,
        recipientsPerTx,
        entries,
        recipients: recipientMap,
      });

      const perTx = result.perTx;
      const provingAvg = perTx.length
        ? Math.round(perTx.reduce((s, t) => s + t.provingMs, 0) / perTx.length)
        : 0;
      const calldataAvg = perTx.length
        ? Math.round(perTx.reduce((s, t) => s + t.calldataBytes, 0) / perTx.length)
        : 0;
      const fees = perTx.filter((t) => t.fee !== undefined).map((t) => t.fee!);
      const feeAvg = fees.length ? fees.reduce((a, b) => a + b, 0n) / BigInt(fees.length) : undefined;
      const okCount = result.results.filter((r) => r.ok).length;

      setRows((prev) => [
        ...prev,
        {
          strategy,
          recipients: count,
          perTx: strategy === "batch" ? recipientsPerTx : 1,
          provingAvgMs: provingAvg,
          totalMs: result.totalMs,
          calldataAvgBytes: calldataAvg,
          feeAvgStrk: feeAvg !== undefined ? baseUnitsToStrk(feeAvg) : "n/a",
          ok: okCount,
          failed: result.results.length - okCount,
          mock: !realMode,
        },
      ]);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setRunning(false);
    }
  }

  function exportMarkdown(): string {
    const header =
      "| strategy | recipients | per-tx | proving avg (ms) | total (ms) | calldata avg (B) | fee avg (STRK) | ok/failed | mode |\n" +
      "| --- | --- | --- | --- | --- | --- | --- | --- | --- |";
    const body = rows
      .map(
        (r) =>
          `| ${r.strategy} | ${r.recipients} | ${r.perTx} | ${r.provingAvgMs} | ${r.totalMs} | ${r.calldataAvgBytes} | ${r.feeAvgStrk} | ${r.ok}/${r.failed} | ${r.mock ? "MOCK" : "real"} |`
      )
      .join("\n");
    return header + "\n" + body;
  }

  return (
    <div className={styles.page}>
      <AppNav active="/bench" />
      <main className={styles.main}>
        <div className={styles.panel}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "-0.02em" }}>
          Batch benchmark
        </h2>
        <Link href="/" style={{ color: "var(--accent)", fontFamily: "var(--font-mono)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", textDecoration: "none" }}>
          ← App
        </Link>
      </div>
      <p style={{ color: "var(--text-dim)", fontSize: 14, marginTop: 10 }}>
        Measures proving time, total time, payload size and fee per recipient count for the
        two payroll strategies. Target counts: 2 / 5 / 10 / 20.
      </p>

      <div
        className={styles.warn}
        style={{
          borderColor: realMode ? "var(--line)" : "var(--accent)",
          marginBottom: 12,
        }}
      >
        {realMode
          ? `REAL MODE — wallet connected on ${networkName}. Every run moves real funds (${BENCH_AMOUNT_STRK} STRK per recipient).`
          : "MOCK MODE — no wallet connected. Hashes are fake (MOCK_*) and numbers are simulated. Connect a wallet on Mainnet or Sepolia for real measurements."}
      </div>

      <label style={{ display: "block", fontSize: 13, color: "var(--text-dim)", marginBottom: 4 }}>
        Recipient addresses (JSON array; every recipient must be registered in the pool)
      </label>
      <textarea
        value={recipientsText}
        onChange={(e) => setRecipientsText(e.target.value)}
        rows={4}
        spellCheck={false}
        style={{
          width: "100%",
          boxSizing: "border-box",
          background: "var(--bg-raised2)",
          color: "var(--text)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-btn)",
          padding: 10,
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          marginBottom: 12,
        }}
        placeholder='["0xabc...", "0xdef..."]'
      />
      <div style={{ fontSize: 12, color: "var(--text-label)", marginBottom: 12, fontFamily: "var(--font-mono)" }}>
        Parsed: {parsedRecipients.length} addresses
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <div>
          <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Strategy</label>
          <div className={styles.tabs} style={{ margin: 0 }}>
            {(["sequential", "batch"] as StrategyName[]).map((s) => (
              <button
                key={s}
                className={`${styles.tab} ${strategy === s ? styles.tabActive : ""}`}
                onClick={() => setStrategy(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        {strategy === "batch" && (
          <div>
            <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Recipients per tx</label>
            <input
              type="number"
              min={1}
              value={recipientsPerTx}
              onChange={(e) => setRecipientsPerTx(Math.max(1, Number(e.target.value) || 1))}
              style={{
                background: "var(--bg-raised2)",
                color: "var(--text)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius-btn)",
                padding: "8px 10px",
                fontFamily: "var(--font-mono)",
                width: 90,
              }}
            />
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {[2, 5, 10, 20].map((n) => (
          <button
            key={n}
            className={styles.btn}
            disabled={running}
            onClick={() => runCount(n)}
          >
            Run {n}
          </button>
        ))}
        {running && <span style={{ color: "var(--text-dim)", alignSelf: "center" }}>running…</span>}
      </div>

      {error && (
        <div className={styles.warn} style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
          {error}
        </div>
      )}

      {rows.length > 0 && (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 8 }}>
            <thead>
              <tr style={{ color: "var(--text-label)", textAlign: "left", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 10 }}>
                <th style={th}>strategy</th>
                <th style={th}>recipients</th>
                <th style={th}>per-tx</th>
                <th style={th}>proving avg (ms)</th>
                <th style={th}>total (ms)</th>
                <th style={th}>calldata avg (B)</th>
                <th style={th}>fee avg (STRK)</th>
                <th style={th}>ok/failed</th>
                <th style={th}>mode</th>
              </tr>
            </thead>
            <tbody style={{ fontFamily: "var(--font-mono)" }}>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--line-subtle)" }}>
                  <td style={td}>{r.strategy}</td>
                  <td style={td}>{r.recipients}</td>
                  <td style={td}>{r.perTx}</td>
                  <td style={td}>{r.provingAvgMs}</td>
                  <td style={td}>{r.totalMs}</td>
                  <td style={td}>{r.calldataAvgBytes}</td>
                  <td style={td}>{r.feeAvgStrk}</td>
                  <td style={td}>
                    {r.ok}/{r.failed}
                  </td>
                  <td style={{ ...td, color: r.mock ? "var(--accent)" : "var(--text)" }}>
                    {r.mock ? "MOCK" : "real"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            className={styles.btn}
            style={{ marginTop: 12 }}
            onClick={() => navigator.clipboard.writeText(exportMarkdown())}
          >
            Copy FINDINGS markdown
          </button>
        </>
      )}
        </div>
      </main>
    </div>
  );
}

const th: React.CSSProperties = { padding: "6px 8px", fontWeight: 500 };
const td: React.CSSProperties = { padding: "6px 8px" };
