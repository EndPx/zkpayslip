"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./employee.module.css";
import u from "../uni.module.css";
import { useEmployee } from "@/lib/employee/store";
import {
  createDisclosureOnChain,
  deriveDisclosureFields,
  explainRevert,
} from "@/lib/contract/writes";
import { useStoreWallet } from "../components/Wallet/walletContext";
import AppNav from "../components/AppNav";
import ConnectGate, { useIsConnected } from "../components/ConnectGate";

function strk(n: bigint): string {
  return (Number(n) / 1e18).toFixed(2);
}

export default function EmployeePage() {
  const {
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
  const [verifierAddr, setVerifierAddr] = useState("");
  const [proving, setProving] = useState(false);
  const [proofErr, setProofErr] = useState<string | null>(null);
  const [proofTx, setProofTx] = useState<string | null>(null);

  // Unshielding and proof generation are signed actions; without a wallet
  // this portal is a read-only guest view.
  const myWalletAccount = useStoreWallet((s) => s.myWalletAccount);
  const connected = useIsConnected();

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

  /**
   * Generate a one-time, verifier-bound income proof.
   *
   * The fact travels as a commitment, never in the clear: the contract stores
   * hash(fact), and the verifier learns the number from the holder. Putting the
   * salary in public calldata would undo the entire product.
   *
   * With a wallet connected this is a real signed create_disclosure. Without
   * one it stays in memory and is labelled as such — a proof only this browser
   * can see is not a proof.
   */
  async function handleCreateDisclosure() {
    setProofErr(null);
    setProofTx(null);

    const verifier = verifierAddr.trim();
    if (!/^0x[0-9a-fA-F]{8,}$/.test(verifier)) {
      setProofErr("Enter the verifier's Starknet address (0x…). The proof binds to it.");
      return;
    }

    const expiresAt = Math.floor(Date.now() / 1000) + 86_400 * 30; // 30 days
    const fact = { kind: "threshold_met" as const, threshold: 42n * 10n ** 18n, from: 0, to: 0 };
    const factLabel = "income_ge_42_strk_per_cycle";

    // The store's id is the identity everywhere: toFelt() hashes it the same
    // way on the write and read paths, so /verify finds what was written.
    const localId = createDisclosure(fact, verifier, expiresAt, `null_${Date.now().toString(36)}`);

    if (!myWalletAccount) {
      setProofErr(
        "No wallet connected — this proof exists only in this browser. Connect a wallet to write it on-chain."
      );
      return;
    }

    setProving(true);
    try {
      const fields = deriveDisclosureFields({
        disclosureId: localId,
        factLabel,
        verifier,
        expiresAt,
        nullifierSeed: `null_${localId}`,
      });
      setProofTx(await createDisclosureOnChain(myWalletAccount, fields));
    } catch (err) {
      setProofErr(explainRevert(err));
    } finally {
      setProving(false);
    }
  }

  return (
    <div className={styles.page}>
      <AppNav active="/employee" />

      <main className={u.shell}>
        {/* Left rail: what you have. */}
        <div className={u.rail}>
          <h1 className={u.railHeading}>Employee</h1>
        {!connected && (
          <ConnectGate message="Balance, history, and proofs read only through your own wallet." />
        )}
        {/* Shielded balance — a guest sees the structure, not a number. */}
        <div className={styles.balanceCard}>
          <div className={styles.balanceLabel}>Shielded balance</div>
          <div className={styles.balanceValue}>
            {connected ? strk(shieldedBalance) : "—.—"}
            <span className={styles.balanceUnit}>STRK</span>
          </div>
          <div className={styles.balanceHint}>
            {connected
              ? "Decrypts on demand · discarded on unmount · never persisted"
              : "Connect your wallet to read your shielded balance from the pool"}
          </div>
        </div>

        </div>

        {/* Right column: what you can do. */}
        <div className={`${u.actionCol} ${u.listCap}`}>
        {/* Pay history */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Pay-period history</h2>
          {payHistory.length === 0 ? (
            <div className={styles.empty}>
              No payments yet — connect your wallet to load your pay history
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
              disabled={!connected || shieldedBalance === 0n}
              title={!connected ? "Connect your wallet to sign" : undefined}
            >
              Unshield
            </button>
          </div>
          {unshieldErr && <div className={styles.unshieldNote} style={{ color: "var(--bad)" }}>{unshieldErr}</div>}
          {unshieldOk && <div className={styles.unshieldNote} style={{ color: "var(--ok)" }}>✓ Unshield submitted (mock)</div>}
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
          <input
            className={styles.unshieldInput}
            value={verifierAddr}
            onChange={(e) => setVerifierAddr(e.target.value)}
            placeholder="Verifier address 0x…"
            spellCheck={false}
            style={{ width: "100%", boxSizing: "border-box", marginBottom: 6 }}
          />
          <div className={styles.unshieldNote} style={{ marginBottom: 12 }}>
            Only this wallet may ever burn the proof — anyone can still check
            it, but a leaked link is inert.
          </div>
          <button
            className={styles.unshieldBtn}
            onClick={handleCreateDisclosure}
            disabled={!connected || proving}
            title={!connected ? "Connect your wallet to sign" : undefined}
            style={{ marginBottom: 16 }}
          >
            {proving ? "Signing…" : "+ Generate proof"}
          </button>
          {!connected && (
            <div className={styles.unshieldNote} style={{ marginBottom: 14 }}>
              Generating a proof writes create_disclosure on-chain — it needs
              your signature.
            </div>
          )}
          {proofErr && (
            <div className={styles.unshieldNote} style={{ color: "var(--bad)", marginBottom: 14, maxWidth: "60ch" }}>
              {proofErr}
            </div>
          )}
          {proofTx && (
            <div className={styles.unshieldNote} style={{ marginBottom: 14, wordBreak: "break-all" }}>
              ✓ Written on-chain ·{" "}
              <a
                href={`https://sepolia.voyager.online/tx/${proofTx}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--accent)" }}
              >
                {proofTx.slice(0, 18)}…
              </a>
            </div>
          )}
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

        </div>
      </main>

      {/* Demo tools docked below the fold-independent — kept out of the shell
          so the dashboard itself never scrolls. */}
      <details style={{ margin: "0 auto 18px", maxWidth: "var(--max-w)", padding: "0 var(--gutter)" }}>
          <summary
            style={{
              cursor: "pointer",
              fontSize: 13,
              color: "var(--text-faint)",
              userSelect: "none",
            }}
          >
            Demo tools (synthetic data, not on-chain)
          </summary>
          <div className={styles.genBlock}>
            <button className={styles.genBtn} onClick={handleSimulatePay}>
              + Simulate incoming payment
            </button>
          </div>
        </details>
    </div>
  );
}