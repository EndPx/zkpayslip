"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEmployee } from "@/lib/employee/store";
import { checkDisclosureOnChain, getDisclosureOnChain } from "@/lib/contract/sepolia";
import { redeemDisclosureOnChain, explainRevert } from "@/lib/contract/writes";
import { useStoreWallet } from "../components/Wallet/walletContext";
import type { DisclosureToken } from "../../../types/payroll";
import styles from "../employee/employee.module.css";
import AppNav from "../components/AppNav";

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
    case "UNREACHABLE":
      return "Could not check — the node did not answer";
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

  const [checking, setChecking] = useState(false);
  const [source, setSource] = useState<"chain" | "mock" | null>(null);
  /** True when the node failed to answer — keeps the footer note honest. */
  const [chainDown, setChainDown] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemErr, setRedeemErr] = useState<string | null>(null);
  const [redeemTx, setRedeemTx] = useState<string | null>(null);

  // Checking a proof needs no wallet. Redeeming one does — it burns a nullifier.
  const myWalletAccount = useStoreWallet((s) => s.myWalletAccount);

  // Mock lookup: the employee store holds the token. A real verifier reads
  // from the chain (read-only call to check_disclosure), not the store.
  const { disclosures } = useEmployee();

  async function check() {
    setVerdict(null);
    setRevealedFact(null);
    setSource(null);
    const id = inputId.trim();
    if (!id) {
      setVerdict("NOT_FOUND");
      return;
    }
    setChecking(true);
    setChainDown(false);

    // The chain is the authority. Ask it first — read-only, no wallet needed.
    const chainVerdict = await checkDisclosureOnChain(id);

    // A definite answer about a real on-chain disclosure ends the check here.
    // "NOT_FOUND" is not definite enough to stop: the demo's proofs live in
    // the in-memory store, so we still look there before reporting nothing.
    if (chainVerdict === "VALID" || chainVerdict === "EXPIRED" || chainVerdict === "ALREADY_REDEEMED") {
      setVerdict(chainVerdict);
      setSource("chain");
      if (chainVerdict === "VALID") {
        const detail = await getDisclosureOnChain(id);
        if (detail) {
          setRevealedFact({
            id,
            fact: { kind: "threshold_met", threshold: 0n, from: 0, to: 0 },
            verifierAddress: detail.verifier,
            expiresAt: detail.expiresAt,
            nullifier: detail.nullifier,
          });
        }
      }
      setChecking(false);
      return;
    }

    // Remember whether the chain actually answered. If it did not, we must not
    // let a mock miss masquerade as "no such proof on-chain".
    if (chainVerdict === "UNREACHABLE") setChainDown(true);

    // Fallback to mock (in-memory employee store).
    const d = disclosures.find((x) => x.id === id);
    if (!d) {
      setVerdict(chainVerdict === "UNREACHABLE" ? "UNREACHABLE" : "NOT_FOUND");
      setSource(chainVerdict === "UNREACHABLE" ? null : "chain");
      setChecking(false);
      return;
    }
    if (redeemedId === d.id) {
      setVerdict("ALREADY_REDEEMED");
      setSource("mock");
      setChecking(false);
      return;
    }
    // Mock: check expiry
    if (d.expiresAt && Math.floor(Date.now() / 1000) >= d.expiresAt) {
      setVerdict("EXPIRED");
      setSource("mock");
      setChecking(false);
      return;
    }
    setVerdict("VALID");
    setRevealedFact(d);
    setSource("mock");
    setChecking(false);
  }

  /**
   * Burn the nullifier.
   *
   * When the verdict came from the chain, this is a real signed transaction:
   * the contract checks that the caller is the bound verifier, that the window
   * is open, and that it has not already been spent, then burns the nullifier
   * so a second attempt reverts. Redeeming therefore needs a wallet, even
   * though *checking* deliberately does not.
   *
   * A mock verdict stays local — there is nothing on-chain to burn.
   */
  async function redeem() {
    setRedeemErr(null);

    if (source !== "chain") {
      if (revealedFact) setRedeemedId(revealedFact.id);
      setVerdict("ALREADY_REDEEMED");
      setRevealedFact(null);
      return;
    }

    if (!myWalletAccount) {
      setRedeemErr(
        "Connect the verifier wallet to redeem. Checking a proof needs no wallet; burning its nullifier is a signed transaction."
      );
      return;
    }

    setRedeeming(true);
    try {
      const txHash = await redeemDisclosureOnChain(myWalletAccount, inputId.trim());
      setRedeemTx(txHash);
      // Re-read rather than assume: the chain is the authority on the outcome.
      setVerdict(await checkDisclosureOnChain(inputId.trim()));
      setRevealedFact(null);
    } catch (err) {
      setRedeemErr(explainRevert(err));
    } finally {
      setRedeeming(false);
    }
  }

  return (
    <div className={styles.page}>
      <AppNav active="/verify" />

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
            disabled={checking}
          >
            {checking ? "Checking…" : "Check proof"}
          </button>
        </div>

        {/* Verdict */}
        {verdict && (
          <div
            style={{
              background: "var(--bg-raised)",
              border: `1px solid ${verdict === "VALID" ? "rgba(255, 207, 154, 0.45)" : "var(--line)"}`,
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
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 36,
                  height: 36,
                  border: `1px solid ${verdict === "VALID" ? "rgba(255, 207, 154, 0.45)" : "var(--line)"}`,
                  borderRadius: "var(--radius-btn)",
                  color: verdict === "VALID" ? "var(--ok)" : "var(--text-faint)",
                  fontSize: 18,
                  flex: "none",
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
              {source && (
                <span
                  style={{
                    marginLeft: "auto",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: source === "chain" ? "var(--ok)" : "var(--text-faint)",
                    border: `1px solid ${source === "chain" ? "rgba(255, 207, 154, 0.45)" : "var(--line)"}`,
                    borderRadius: "var(--radius-pill)",
                    padding: "3px 10px",
                  }}
                >
                  {source === "chain" ? "Sepolia" : "Mock"}
                </span>
              )}
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
                    color: "var(--text)",
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
                  disabled={!myWalletAccount || redeeming}
                  title={!myWalletAccount ? "Connect the verifier wallet to redeem" : undefined}
                  style={{ marginTop: 20 }}
                >
                  {redeeming ? "Burning…" : "Redeem (burn nullifier)"}
                </button>
                {!myWalletAccount && (
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--text-faint)",
                      marginTop: 10,
                      maxWidth: "58ch",
                    }}
                  >
                    🔒 Redeeming is a signed transaction — connect the verifier
                    wallet. Checking, as you just did, never needs one.
                  </p>
                )}
                {redeemErr && (
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--accent)",
                      marginTop: 10,
                      maxWidth: "58ch",
                    }}
                  >
                    {redeemErr}
                  </p>
                )}
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

        {/* Source note */}
        <div className={styles.mockBanner} style={{ marginTop: 36, borderColor: "var(--line)", color: "var(--text-dim)" }}>
          {chainDown
            ? "NODE UNREACHABLE — the Sepolia node did not answer, so nothing here has been checked against the chain. This is not a verdict."
            : source === "chain"
              ? "ON-CHAIN — verdict read from check_disclosure on the zkPayslip contract at Sepolia via read-only RPC (no wallet)."
              : source === "mock"
                ? "MOCK — this proof exists only in this browser's in-memory store, not on-chain. A real verifier reads check_disclosure from the Cairo contract."
                : "Paste a proof id to check it against the zkPayslip contract on Sepolia. No wallet required."}
        </div>

        {redeemTx && (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--text-faint)",
              marginTop: 12,
              wordBreak: "break-all",
            }}
          >
            NULLIFIER BURNED ON-CHAIN ·{" "}
            <a
              href={`https://sepolia.voyager.online/tx/${redeemTx}`}
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--accent)" }}
            >
              {redeemTx.slice(0, 18)}…
            </a>
          </div>
        )}
      </main>
    </div>
  );
}