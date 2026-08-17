"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./employer.module.css";
import { useEmployer } from "@/lib/employer/store";
import { executePayrollRun, createMockDeps } from "@/lib/payroll";
import {
  addChannelOnChain,
  activateChannelOnChain,
  terminateChannelOnChain,
  explainRevert,
} from "@/lib/contract/writes";
import { useStoreWallet } from "../components/Wallet/walletContext";
import { addrSTRK } from "@/utils/constants";
import AppNav from "../components/AppNav";

function shortAddr(a: string): string {
  if (!a) return "—";
  return a.length <= 13 ? a : `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function stateClass(state: string): string {
  if (state === "active") return styles.stateActive;
  if (state === "terminated") return styles.stateTerminated;
  return styles.statePending;
}

function stateLabel(state: string): string {
  return state.replace("_", " ");
}

export default function EmployerPage() {
  const {
    mockMode,
    treasuryBalance,
    channels,
    addChannel,
    activateChannel,
    terminateChannel,
    runs,
    startRun,
    finishRun,
    failRun,
    activeChannels,
    pendingChannels,
  } = useEmployer();

  const [newAddr, setNewAddr] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [addrError, setAddrError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [runNote, setRunNote] = useState<string | null>(null);
  const [chainErr, setChainErr] = useState<string | null>(null);
  const [chainTx, setChainTx] = useState<string | null>(null);

  // Channel writes are owner-only on-chain; without a wallet they stay local.
  const myWalletAccount = useStoreWallet((s) => s.myWalletAccount);

  const treasuryStrk = (Number(treasuryBalance) / 1e18).toFixed(2);
  const active = activeChannels();
  const pending = pendingChannels();

  function handleAddChannel(e: React.FormEvent) {
    e.preventDefault();
    setAddrError(null);
    const addr = newAddr.trim();
    if (!/^0x[0-9a-fA-F]{8,}$/.test(addr)) {
      setAddrError("Enter a valid Starknet address (0x…).");
      return;
    }
    addChannel(addr, newLabel.trim() || undefined);
    setNewAddr("");
    setNewLabel("");

    // Mirror the channel on-chain when a wallet can sign for it. The contract
    // enforces owner-only, so a non-employer wallet reverts with NOT_OWNER —
    // reported, not swallowed. The local channel stands either way; the store
    // is the UI's state, the contract is the record.
    if (myWalletAccount) {
      const local = useEmployer.getState().channels.at(-1);
      if (local) void writeChannel(() => addChannelOnChain(myWalletAccount, local.id, addr));
    }
  }

  /**
   * Run one channel write and surface its outcome.
   *
   * Every channel action is owner-only on-chain, so failure here is ordinary
   * and must be legible rather than silent.
   */
  async function writeChannel(action: () => Promise<string>) {
    setChainErr(null);
    setChainTx(null);
    try {
      setChainTx(await action());
    } catch (err) {
      setChainErr(explainRevert(err));
    }
  }

  function handleActivate(id: string) {
    activateChannel(id);
    if (myWalletAccount) void writeChannel(() => activateChannelOnChain(myWalletAccount, id));
  }

  function handleTerminate(id: string) {
    terminateChannel(id);
    if (myWalletAccount) void writeChannel(() => terminateChannelOnChain(myWalletAccount, id));
  }

  /**
   * Execute a payroll cycle over every active channel.
   *
   * This calls the real executePayrollRun — the same function a wallet-backed
   * run uses — and only the transport is swapped. With no wallet connected it
   * runs on mock deps, whose hashes are all prefixed MOCK_ so a mocked run can
   * never be mistaken for a chain transaction. Connecting a wallet swaps in
   * createWalletDeps and nothing else about this path changes.
   */
  async function handleExecuteRun() {
    if (running || active.length === 0) return;
    setRunning(true);
    setRunNote(null);

    // Cycle identity is the calendar month, not the execution date.
    const now = new Date();
    const cycle = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

    // Amounts stay in the smallest unit and are never logged or persisted.
    const entries = active.map((c) => ({ channelId: c.id, amount: 10n ** 18n }));
    const recipients = Object.fromEntries(active.map((c) => [c.id, c.recipientAddress]));

    const runId = startRun(cycle, entries);
    try {
      const result = await executePayrollRun({
        strategy: "sequential",
        deps: createMockDeps(),
        token: addrSTRK,
        entries,
        recipients,
      });
      if (result.hasFailures) {
        failRun(runId);
        const failed = result.results.filter((r) => !r.ok).length;
        setRunNote(`${failed} of ${result.results.length} recipients failed — run marked failed.`);
      } else {
        finishRun(runId, result.txHashes);
        setRunNote(
          `${result.results.length} recipients paid in ${result.txHashes.length} tx · ${result.totalMs} ms · MOCK transport (no wallet connected).`
        );
      }
    } catch {
      failRun(runId);
      setRunNote("Run failed before submission.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className={styles.page}>
      <AppNav active="/employer" />

      <main className={styles.main}>
        <div className={styles.headerRow}>
          <div className={styles.titleBlock}>
            <div className={styles.tag}>Employer console</div>
            <h1 className={styles.h1}>Treasury &amp; channels</h1>
            <p className={styles.sub}>
              Fund the treasury, add employee channels, track registration, and
              run a payroll cycle. Amounts are masked until you open a single
              channel.
            </p>
          </div>
        </div>

        {mockMode && (
          <div className={styles.mockBanner}>
            MOCK MODE — no wallet connected. Channel state is in-memory only
            and never touches the pool. Connect a Ready wallet to verify.
          </div>
        )}

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Shielded treasury</div>
            <div className={styles.statValue}>
              {treasuryStrk} <span style={{ fontSize: 14, color: "var(--text-faint)" }}>STRK</span>
            </div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Active channels</div>
            <div className={styles.statValue}>{active.length}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Pending registration</div>
            <div className={styles.statValue + (pending.length === 0 ? ` ${styles.statValueMuted}` : "")}>
              {pending.length}
            </div>
          </div>
        </div>

        {/* Channels */}
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Employee channels</h2>
          <Link href="/invite" className={styles.sectionAction}>
            + Add channel
          </Link>
        </div>

        {channels.length === 0 ? (
          <div className={styles.empty}>
            No channels yet — add one from the invite page
          </div>
        ) : (
          <div className={styles.channelList}>
            {channels.map((c) => (
              <div key={c.id} className={styles.channelRow}>
                <div style={{ minWidth: 0 }}>
                  <div className={styles.channelAddr}>{shortAddr(c.recipientAddress)}</div>
                  {c.localLabel && <div className={styles.channelLabel}>{c.localLabel}</div>}
                </div>
                <span className={`${styles.stateChip} ${stateClass(c.state)}`}>
                  {stateLabel(c.state)}
                </span>
                <div className={styles.channelActions}>
                  {c.state === "pending_registration" && (
                    <button
                      className={styles.miniBtn}
                      onClick={() => handleActivate(c.id)}
                    >
                      Activate
                    </button>
                  )}
                  {c.state === "active" && (
                    <button
                      className={styles.miniBtn}
                      onClick={() => handleTerminate(c.id)}
                    >
                      Terminate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Run history */}
        <div className={styles.sectionHead} style={{ marginTop: 8 }}>
          <h2 className={styles.sectionTitle}>Run history</h2>
          <button
            className={styles.sectionAction}
            disabled={active.length === 0 || running}
            style={{
              opacity: active.length === 0 || running ? 0.4 : 1,
              cursor: active.length === 0 || running ? "not-allowed" : "pointer",
              background: "transparent",
            }}
            onClick={handleExecuteRun}
          >
            {running ? "Running…" : "▶ Execute run"}
          </button>
        </div>

        {runNote && (
          <div className={styles.mockBanner} style={{ marginBottom: 12 }}>
            {runNote}
          </div>
        )}

        {chainErr && (
          <div className={styles.mockBanner} style={{ marginBottom: 12, color: "var(--accent)" }}>
            ON-CHAIN WRITE REJECTED — {chainErr} The channel still stands locally.
          </div>
        )}

        {chainTx && (
          <div className={styles.mockBanner} style={{ marginBottom: 12, wordBreak: "break-all" }}>
            ✓ Channel written on-chain ·{" "}
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

        {runs.length === 0 ? (
          <div className={styles.empty}>
            No payroll runs yet — add active channels and execute a run
          </div>
        ) : (
          <div className={styles.runList}>
            {runs.map((r) => (
              <div key={r.id} className={styles.runRow}>
                <span className={styles.runCycle}>{r.cycle}</span>
                <span className={`${styles.runStatus} ${r.status === "confirmed" ? styles.runStatusConfirmed : ""}`}>
                  {r.status} · {r.entries.length} recipients
                </span>
                <span className={styles.runTxs}>
                  {r.txHashes.length > 0 ? `${r.txHashes.length} tx` : "—"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Quick add form (also on /invite) */}
        <form className={styles.form} style={{ marginTop: 36 }} onSubmit={handleAddChannel}>
          <h2 className={styles.sectionTitle} style={{ marginBottom: 16 }}>Quick add</h2>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Recipient address</label>
            <input
              className={styles.fieldInput}
              value={newAddr}
              onChange={(e) => setNewAddr(e.target.value)}
              placeholder="0x…"
              spellCheck={false}
            />
            {addrError && <div className={styles.fieldHint} style={{ color: "var(--accent)" }}>{addrError}</div>}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Local label (memory only, never persisted)</label>
            <input
              className={styles.fieldInput}
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Engineering — A"
            />
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
        </form>
      </main>
    </div>
  );
}