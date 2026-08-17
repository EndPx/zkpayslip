"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "../employer/employer.module.css";
import { useEmployer } from "@/lib/employer/store";
import { addChannelOnChain, explainRevert } from "@/lib/contract/writes";
import { useStoreWallet } from "../components/Wallet/walletContext";
import AppNav from "../components/AppNav";

export default function InvitePage() {
  const { addChannel, pendingChannels, mockMode } = useEmployer();
  const [newAddr, setNewAddr] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chainTx, setChainTx] = useState<string | null>(null);

  // add_channel is owner-only on-chain; without a wallet the invite stays local.
  const myWalletAccount = useStoreWallet((s) => s.myWalletAccount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setChainTx(null);
    const addr = newAddr.trim();
    if (!/^0x[0-9a-fA-F]{8,}$/.test(addr)) {
      setError("Enter a valid Starknet address (0x…).");
      return;
    }
    addChannel(addr, newLabel.trim() || undefined);
    setDone(true);
    setNewAddr("");
    setNewLabel("");
    setTimeout(() => setDone(false), 2500);

    // Mirror the channel on-chain when a wallet can sign for it. add_channel is
    // owner-only, so a non-employer wallet reverts — reported, not swallowed.
    if (!myWalletAccount) return;
    const local = useEmployer.getState().channels.at(-1);
    if (!local) return;
    try {
      setChainTx(await addChannelOnChain(myWalletAccount, local.id, addr));
    } catch (err) {
      setError(explainRevert(err));
    }
  }

  return (
    <div className={styles.page}>
      <AppNav active="/invite" />

      <main className={styles.main}>
        <div className={styles.tag}>Onboarding</div>
        <h1 className={styles.h1}>Invite employees.</h1>
        <p className={styles.sub}>
          Add a channel for each employee. Registration must precede payment —
          the employee registers their viewing key in their wallet first.
          Until then the channel stays <em>pending registration</em>.
        </p>

        {mockMode && (
          <div className={styles.mockBanner}>
            MOCK MODE — channel is held in memory only; no on-chain state.
          </div>
        )}

        {/* Onboarding note: registration-first protocol fact */}
        <div className={styles.onboardingNote}>
          <h3>Why two phases?</h3>
          <p>
            A channel opens through ECDH: the pool derives a shared secret
            from the recipient&apos;s <em>public viewing key</em>, which only
            exists on-chain after the recipient runs <code>SetViewingKey</code>.
            Without it, no note can be created. There is no send-now-claim-later.
          </p>
          <p>
            Employees also need a small amount of <code>STRK</code> to register
            (their wallet pays the fee). If they have none, send them public
            STRK first — that flow must be visible here, not hidden.
          </p>
        </div>

        {/* Invite form */}
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Recipient address</label>
            <input
              className={styles.fieldInput}
              value={newAddr}
              onChange={(e) => setNewAddr(e.target.value)}
              placeholder="0x…"
              spellCheck={false}
            />
            {error && <div className={styles.fieldHint} style={{ color: "var(--accent)" }}>{error}</div>}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Local label (memory only, never persisted)</label>
            <input
              className={styles.fieldInput}
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Engineering — A"
            />
            <div className={styles.fieldHint}>
              Labels live in this browser session only — never sent to a server
              or written to storage.
            </div>
          </div>
          <button type="submit" style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            fontWeight: 600,
            background: "var(--accent)",
            border: "1px solid var(--accent)",
            borderRadius: "var(--radius-btn)",
            color: "var(--text)",
            padding: "12px 24px",
            cursor: "pointer",
          }}>
            Add channel
          </button>
          {done && (
            <div className={styles.fieldHint} style={{ color: "var(--accent)", marginTop: 10 }}>
              ✓ Channel added — waiting for registration
            </div>
          )}
          {chainTx && (
            <div className={styles.fieldHint} style={{ marginTop: 10, wordBreak: "break-all" }}>
              ✓ Written on-chain ·{" "}
              <a
                href={`https://sepolia.voyager.online/tx/${chainTx}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--accent)" }}
              >
                {chainTx.slice(0, 18)}…
              </a>
            </div>
          )}
        </form>

        {/* Pending list */}
        <div className={styles.sectionHead} style={{ marginTop: 16 }}>
          <h2 className={styles.sectionTitle}>Pending registration</h2>
          <Link href="/employer" className={styles.sectionAction}>
            Back to dashboard
          </Link>
        </div>
        {pendingChannels().length === 0 ? (
          <div className={styles.empty}>
            No pending channels — all invited employees have registered
          </div>
        ) : (
          <div className={styles.channelList}>
            {pendingChannels().map((c) => (
              <div key={c.id} className={styles.channelRow}>
                <div>
                  <div className={styles.channelAddr}>
                    {c.recipientAddress.length <= 13
                      ? c.recipientAddress
                      : `${c.recipientAddress.slice(0, 6)}…${c.recipientAddress.slice(-4)}`}
                  </div>
                  {c.localLabel && <div className={styles.channelLabel}>{c.localLabel}</div>}
                </div>
                <span className={`${styles.stateChip} ${styles.statePending}`}>
                  pending registration
                </span>
                <div></div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}