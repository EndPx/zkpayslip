"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEmployee } from "@/lib/employee/store";
import type { DisclosureToken } from "../../../types/payroll";
import styles from "../employee/employee.module.css";

/**
 * Verifier page — the most minimal public surface.
 * One input to paste a proof id, one verdict. No wallet required to read.
 *
 * In a real deployment, this reads check_disclosure(disclosure_id) from the
 * Cairo contract via a read-only call — no wallet, no signature. For the
 * mock, it reads from the in-memory employee store (the same browser that
 * created it) which is obviously not how production works; a real verifier
 * reads from the chain.
 */

function verdictLabel(v: string): string {
  switch (v) {
    case "VALID":
      return "Valid — proof is live and unspent";
    case "EXPIRED":
      return "Expired — the proof window has closed";
    case "ALREADY_REDEEMED":
      return "Already redeemed — the nullifier is burned";
    case "WRONG_VERIFIER":
      return "Wrong verifier — this proof was issued to someone else";
    case "NOT_FOUND":
    default:
      return "Not found — no such proof on-chain";
  }
}

function verdictSymbol(v: string): string {
  switch (v) {
    case "VALID":
      return "✓";
    case "NOT_FOUND":
      return "?";
    default:
      return "✕";
  }
}

function fmtFact(d: DisclosureToken): string {
  if (d.fact.kind === "threshold_met") {
    return `Income ≥ ${(Number(d.fact.threshold) / 1e18).toFixed(1)} STRK / cycle`;
  }
  if (d.fact.kind === "total_received") {
    return `Total received between ${d.fact.from} and ${d.fact.to}`;
  }
  if (d.fact.kind === "employment_active") {
    return `Employment active as of ${d.fact.asOf}`;
  }
  return "Unknown fact";
}

function fmtExpiry(unix: number): string {
  if (unix === 0) return "—";
  const d = new Date(unix * 1000);
  return d.toISOString().slice(0, 10);
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div style={{ padding: 64, color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>Loading…</div>}>
      <VerifyInner />
    </Suspense>
  );
}

function VerifyInner() {
  const search = useSearchParams();
  const initialId = search.get("id") ?? "";
  const [inputId, setInputId] = useState(initialId);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [revealedFact, setRevealedFact] = useState<DisclosureToken | null>(null);
  const [redeemedId, setRedeemedId] = useState<string | null>(null);

  // Mock lookup: the employee store holds the token. A real verifier reads
  // from the chain (read-only call to check_disclosure), not the store.
  const { disclosures } = useEmployee();

  function check() {
    setVerdict(null);
    setRevealedFact(null);
    const id = inputId.trim();
    if (!id) {
      setVerdict("NOT_FOUND");
      return;
    }
    const d = disclosures.find((x) => x.id === id);
    if (!d) {
      setVerdict("NOT_FOUND");
      return;
    }
    if (redeemedId === d.id) {
      setVerdict("ALREADY_REDEEMED");
      return;
    }
    // Mock: check expiry
    if (d.expiresAt && Math.floor(Date.now() / 1000) >= d.expiresAt) {
      setVerdict("EXPIRED");
      return;
    }
    setVerdict("VALID");
    setRevealedFact(d);
  }

  function redeem() {
    if (revealedFact) {
      setRedeemedId(revealedFact.id);
    }
    setVerdict("ALREADY_REDEEMED");
    setRevealedFact(null);
  }

  return (
    <div className={styles.page}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, padding: "0 var(--gutter)", borderBottom: "1px solid var(--line-subtle)", position: "sticky", top: 0, background: "rgba(13,13,13,0.92)", backdropFilter: "blur(8px)", zIndex: 20 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--text)" }}>
          <span style={{ display: "grid", placeItems: "center", width: 30, height: 30, background: "var(--accent)", color: "var(--selection-ink, #1a0a04)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, borderRadius: "var(--radius-btn)" }}>zk</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, letterSpacing: "0.24em", textTransform: "uppercase" }}>Payslip · Verify</span>
        </a>
      </nav>

      <main className={styles.main} style={{ maxWidth: 620 }}>
        <div className={styles.tag}>Verifier</div>
        <h1 className={styles.h1}>Check a proof.</h1>
        <p className={styles.sub}>
          Paste a payslip proof id below. The verdict is a read-only check —
          no wallet needed. A valid proof reveals its single fact; redemption
          burns the nullifier once.
        </p>

        {/* Proof input */}
        <div className={styles.section}>
          <label
            style={{
              display: "block",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "var(--text-label)",
              marginBottom: 8,
            }}
          >
            Proof id
          </label>
          <input
            className={styles.unshieldInput}
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            placeholder="d_…"
            spellCheck={false}
            style={{ width: "100%", boxSizing: "border-box", marginBottom: 10 }}
          />
          <button
            className={styles.unshieldBtn}
            onClick={check}
          >
            Check proof
          </button>
        </div>

        {/* Verdict */}
        {verdict && (
          <div
            style={{
              background: "var(--bg-raised)",
              border: `1px solid ${verdict === "VALID" ? "var(--accent)" : "var(--line)"}`,
              borderRadius: "var(--radius-card)",
              padding: "26px 28px",
              marginTop: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: revealedFact ? 18 : 0,
              }}
            >
              <span
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 36,
                  height: 36,
                  border: `1px solid ${verdict === "VALID" ? "var(--accent)" : "var(--line)"}`,
                  borderRadius: "var(--radius-btn)",
                  color: verdict === "VALID" ? "var(--accent)" : "var(--text-faint)",
                  fontSize: 18,
                }}
              >
                {verdictSymbol(verdict)}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 18,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "-0.01em",
                  color: verdict === "VALID" ? "var(--text)" : "var(--text-dim)",
                }}
              >
                {verdictLabel(verdict)}
              </span>
            </div>

            {/* If valid, reveal the fact */}
            {revealedFact && (
              <div style={{ borderTop: "1px solid var(--line-subtle)", paddingTop: 18 }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    letterSpacing: "0.24em",
                    textTransform: "uppercase",
                    color: "var(--text-label)",
                    marginBottom: 8,
                  }}
                >
                  Fact
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 16,
                    color: "var(--accent)",
                    marginBottom: 18,
                  }}
                >
                  {fmtFact(revealedFact)}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr",
                    gap: "8px 16px",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: "var(--text-label)" }}>VERIFIER</span>
                  <span style={{ color: "var(--text)" }}>
                    {revealedFact.verifierAddress.slice(0, 10)}…
                    {revealedFact.verifierAddress.slice(-6)}
                  </span>
                  <span style={{ color: "var(--text-label)" }}>EXPIRY</span>
                  <span style={{ color: "var(--text)" }}>
                    {fmtExpiry(revealedFact.expiresAt)}
                  </span>
                  <span style={{ color: "var(--text-label)" }}>NULLIFIER</span>
                  <span style={{ color: "var(--text-faint)" }}>
                    {revealedFact.nullifier.slice(0, 22)}…
                  </span>
                </div>
                <button
                  className={styles.unshieldBtn}
                  onClick={redeem}
                  style={{ marginTop: 20 }}
                >
                  Redeem (burn nullifier)
                </button>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "var(--text-faint)",
                    marginTop: 10,
                    maxWidth: "58ch",
                  }}
                >
                  Redemption is single-use and bound to this verifier. A
                  second attempt will revert. A legitimate verifier can still
                  retain what they saw — inherent to any disclosure.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Mock note */}
        <div className={styles.mockBanner} style={{ marginTop: 36 }}>
          MOCK — lookup is in-memory. A real verifier reads check_disclosure
          from the Cairo contract via a read-only RPC call (no wallet).
        </div>
      </main>
    </div>
  );
}