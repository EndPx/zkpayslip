"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./employee.module.css";
import { useEmployee } from "@/lib/employee/store";
import SelectWallet from "../components/client/WalletHandle/SelectWallet";

function strk(n: bigint): string {
  return (Number(n) / 1e18).toFixed(2);
}

export default function EmployeePage() {
  const {
    mockMode,
    shieldedBalance,
    payHistory,
    disclosures,
    unshield,
    createDisclosure,
  } = useEmployee();

  const [unshieldAmt, setUnshieldAmt] = useState("");
  const [revealId, setRevealId] = useState<string | null>(null);
  const [unshieldErr, setUnshieldErr] = useState<string | null>(null);
  const [unshieldOk, setUnshieldOk] = useState(false);

  function handleUnshield() {
    setUnshieldErr(null);
    setUnshieldOk(false);
    const amt = BigInt(Math.floor(Number(unshieldAmt) * 1e18));
    if (!amt || amt <= 0n) {
      setUnshieldErr("Enter an amount greater than zero.");
      return;
    }
    if (amt > shieldedBalance) {
      setUnshieldErr("Amount exceeds your shielded balance.");
      return;
    }
    const ok = unshield(amt);
    if (ok) {
      setUnshieldOk(true);
      setUnshieldAmt("");
      setTimeout(() => setUnshieldOk(false), 2500);
    } else {
      setUnshieldErr("Unshield failed (mock).");
    }
  }

  // Mock: simulate a private payment arriving (e.g. for the demo video)
  function handleSimulatePay() {
    useEmployee.getState().receivePayment("2026-08", 42n * 10n ** 18n, "ch_sim");
  }

  function handleCreateDisclosure() {
    // Generates a threshold-met fact: "income ≥ 42 STRK / MO"
    createDisclosure(
      { kind: "threshold_met", threshold: 42n * 10n ** 18n, from: 0, to: 0 },
      "0x000000000000000000000000000000000000000000000000000000000000BANK",
      Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days
      "MOCK_NULLIFIER_" + Math.random().toString(36).slice(2, 10)
    );
  }

  return (
    <div className={styles.page}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, padding: "0 var(--gutter)", borderBottom: "1px solid var(--line-subtle)", position: "sticky", top: 0, background: "rgba(13,13,13,0.92)", backdropFilter: "blur(8px)", zIndex: 20 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--text)" }}>
          <span style={{ display: "grid", placeItems: "center", width: 30, height: 30, background: "var(--accent)", color: "var(--selection-ink, #1a0a04)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, borderRadius: "var(--radius-btn)" }}>zk</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, letterSpacing: "0.24em", textTransform: "uppercase" }}>Payslip</span>
        </a>
        <div style={{ display: "flex", gap: 4, marginRight: "auto", marginLeft: 8 }}>
          <Link href="/employer" style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-dim)", textDecoration: "none", padding: "8px 12px" }}>Employer</Link>
          <Link href="/employee" style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text)", textDecoration: "none", padding: "8px 12px" }}>Employee</Link>
          <Link href="/verify" style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-dim)", textDecoration: "none", padding: "8px 12px" }}>Verify</Link>
        </div>
        <SelectWallet variant="nav" />
      </nav>

      <main className={styles.main}>
        <div className={styles.tag}>Employee portal</div>
        <h1 className={styles.h1}>Your shielded salary.</h1>
        <p className={styles.sub}>
          See your shielded balance, pay-period history, unshield to a public
          address, and generate a one-time income proof for a verifier.
        </p>

        {mockMode && (
          <div className={styles.mockBanner}>
            MOCK MODE — no wallet connected. Balance and history are synthetic.
            Connect a Ready wallet on Mainnet or Sepolia for real reads.
          </div>
        )}

        {/* Shielded balance */}
        <div className={styles.balanceCard}>
          <div className={styles.balanceLabel}>Shielded balance</div>
          <div className={styles.balanceValue}>
            {strk(shieldedBalance)}
            <span className={styles.balanceUnit}>STRK</span>
          </div>
          <div className={styles.balanceHint}>
            Decrypts on demand · discarded on unmount · never persisted
          </div>
          {/* Demo simulator — lets us see the flow without a wallet */}
          <div className={styles.genBlock}>
            <button className={styles.genBtn} onClick={handleSimulatePay}>
              + Simulate payment (demo)
            </button>
          </div>
        </div>

        {/* Pay history */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Pay-period history</h2>
          {payHistory.length === 0 ? (
            <div className={styles.empty}>
              No payments yet — simulate one above, or connect a wallet
            </div>
          ) : (
            <div className={styles.payList}>
              {payHistory.map((p, i) => {
                const revealed = revealId === `${i}`;
                return (
                  <div key={i} className={styles.payRow}>
                    <span className={styles.payCycle}>{p.cycle}</span>
                    <span className={styles.payMask}>
                      {revealed ? `${strk(p.amount)} STRK` : "••••••••"}
                    </span>
                    <button
                      className={styles.payReveal}
                      onClick={() => setRevealId(revealed ? null : `${i}`)}
                    >
                      {revealed ? "Hide" : "Reveal"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Unshield */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Unshield</h2>
          <div className={styles.unshieldBlock}>
            <input
              className={styles.unshieldInput}
              type="number"
              min="0"
              step="0.01"
              value={unshieldAmt}
              onChange={(e) => setUnshieldAmt(e.target.value)}
              placeholder="Amount in STRK"
            />
            <button
              className={styles.unshieldBtn}
              onClick={handleUnshield}
              disabled={shieldedBalance === 0n}
            >
              Unshield
            </button>
          </div>
          {unshieldErr && <div className={styles.unshieldNote} style={{ color: "var(--accent)" }}>{unshieldErr}</div>}
          {unshieldOk && <div className={styles.unshieldNote} style={{ color: "var(--text)" }}>✓ Unshield submitted (mock)</div>}
          <p className={styles.unshieldNote}>
            Unshielding reveals the amount at the public edge — by design.
          </p>
        </div>

        {/* Disclosures */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Payslip proofs</h2>
          <p className={styles.unshieldNote} style={{ marginBottom: 14, maxWidth: "60ch" }}>
            Generate a one-time, verifier-bound income proof. The proof opens to
            exactly one fact, expires, and burns its nullifier on redemption.
          </p>
          <button className={styles.unshieldBtn} onClick={handleCreateDisclosure} style={{ marginBottom: 16 }}>
            + Generate proof (demo)
          </button>
          {disclosures.length === 0 ? (
            <div className={styles.empty}>
              No proofs generated yet
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {disclosures.map((d) => (
                <div key={d.id} className={styles.disclosureRow}>
                  <div>
                    <div className={styles.disclosureFact}>
                      {d.fact.kind === "threshold_met"
                        ? `INCOME ≥ ${(Number(d.fact.threshold) / 1e18).toFixed(1)} STRK / MO`
                        : d.fact.kind}
                    </div>
                    <div className={styles.disclosureVerifier}>
                      → {d.verifierAddress.slice(0, 6)}…{d.verifierAddress.slice(-4)}
                    </div>
                  </div>
                  <Link href={`/verify?id=${d.id}`} className={styles.disclosureLink}>
                    Open verify →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}