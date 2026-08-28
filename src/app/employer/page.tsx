"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./employer.module.css";
import u from "../uni.module.css";
import { useEmployer } from "@/lib/employer/store";
import { executePayrollRun, createMockDeps, createWalletDeps } from "@/lib/payroll";
import {
  addChannelOnChain,
  activateChannelOnChain,
  terminateChannelOnChain,
  explainRevert,
} from "@/lib/contract/writes";
import { getChannelOnChain } from "@/lib/contract/sepolia";
import { useStoreWallet } from "../components/Wallet/walletContext";
import { addrSTRK, myFrontendProviders, Strk20Networks } from "@/utils/constants";
import AppNav from "../components/AppNav";
import ConnectGate, { useIsConnected } from "../components/ConnectGate";
import { useFrontendProvider } from "../components/client/provider/providerContext";

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

  // Every contract write is owner-only; without a wallet this surface is
  // read-only guest mode and the signing actions stay locked.
  const myWalletAccount = useStoreWallet((s) => s.myWalletAccount);
  const connected = useIsConnected();
  const providerIndex = useFrontendProvider((s) => s.currentFrontendProviderIndex);

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
    if (!connected || running || active.length === 0) return;
    setRunning(true);
    setRunNote(null);

    // Cycle identity is the calendar month, not the execution date.
    const now = new Date();
    const cycle = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

    // Amounts stay in the smallest unit and are never logged or persisted.
    const entries = active.map((c) => ({ channelId: c.id, amount: 10n ** 18n }));
    const recipients = Object.fromEntries(active.map((c) => [c.id, c.recipientAddress]));

    // A connected employer signs real pool actions through the wallet; the
    // mock transport only ever runs when nothing can sign.
    const networkLive =
      !!myWalletAccount && Strk20Networks[providerIndex] !== undefined;
    const deps =
      networkLive && myWalletAccount
        ? createWalletDeps(myWalletAccount, myFrontendProviders[providerIndex])
        : createMockDeps();

    const runId = startRun(cycle, entries);
    try {
      const result = await executePayrollRun({
        strategy: "sequential",
        deps,
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
          `${result.results.length} recipients paid in ${result.txHashes.length} tx · ${result.totalMs} ms · ${
            networkLive ? "wallet-signed" : "MOCK transport"
          }.`
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

      <main className={`${u.shell} ${u.shellWide}`}>
        <h1 className={u.railHeading}>Employer</h1>
        {/* ── Left rail: what the treasury looks like ── */}
        <div className={u.rail}>
          <div className={u.panel}>
            <div className={u.inputLabel}>Shielded treasury</div>
            <div className={u.bigValue} style={{ fontSize: 30 }}>
              {treasuryStrk}
            </div>
            <div className={u.subLine}>
              <span>STRK · inside the pool</span>
            </div>
            <div className={u.feeRow} style={{ borderTop: "none", borderBottom: "1px solid var(--line-subtle)", marginTop: 12, marginBottom: 0 }}>
              <span>Active</span>
              <span className={u.feeVal}>{active.length}</span>
            </div>
            <div className={u.feeRow} style={{ borderTop: "none" }}>
              <span>Pending</span>
              <span className={u.feeVal}>{pending.length}</span>
            </div>
          </div>

          <OnChainLookup />

          {/* Onboarding: the protocol's registration-first fact, folded away
              once it is known. The invite flow lives here, not on its own
              route — add a channel below, wait for the employee's viewing
              key, activate, then the channel joins a run. */}
          <details className={styles.onboardingNote} style={{ padding: "16px 18px" }}>
            <summary
              style={{
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--text-label)",
                userSelect: "none",
              }}
            >
              Onboarding — why channels start pending
            </summary>
            <h3>Registration precedes payment</h3>
            <p>
              A channel opens through ECDH: the pool derives a shared secret
              from the recipient&apos;s <em>public viewing key</em>, which only
              exists on-chain after the recipient runs <code>SetViewingKey</code>.
              Without it, no note can be created — there is no
              send-now-claim-later.
            </p>
            <p>
              Employees also need a small amount of <code>STRK</code> to
              register (their wallet pays the fee). If they have none, send
              them public STRK first — that flow stays visible here, not
              hidden.
            </p>
          </details>

          {!connected && (
            <ConnectGate message="Guest view — read everything, sign nothing. Writes need the employer's wallet." />
          )}
        </div>

        {/* ── Right column: what the employer does ── */}
        <div className={u.actionCol}>
          {runNote && (
            <div className={styles.mockBanner}>{runNote}</div>
          )}

          {chainErr && (
            <div className={styles.mockBanner} style={{ color: "var(--bad)" }}>
              ON-CHAIN WRITE REJECTED — {chainErr} The channel still stands locally.
            </div>
          )}

          {chainTx && (
            <div className={styles.mockBanner} style={{ wordBreak: "break-all" }}>
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

          <div className={u.panel} style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
            <div className={styles.sectionHead} style={{ marginBottom: 10 }}>
              <h2 className={styles.sectionTitle}>Employee channels</h2>
              <button
                className={styles.sectionAction}
                disabled={!connected || active.length === 0 || running}
                title={!connected ? "Connect the employer wallet to sign a payroll run" : undefined}
                onClick={handleExecuteRun}
              >
                {running ? "Running…" : "▶ Execute run"}
              </button>
            </div>

            <div className={u.listCap}>
              {channels.length === 0 ? (
                <div className={styles.empty}>
                  No channels yet — add one below
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
                            disabled={!connected}
                            title={!connected ? "Connect the employer wallet to sign" : undefined}
                            onClick={() => handleActivate(c.id)}
                          >
                            Activate
                          </button>
                        )}
                        {c.state === "active" && (
                          <button
                            className={styles.miniBtn}
                            disabled={!connected}
                            title={!connected ? "Connect the employer wallet to sign" : undefined}
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

              {runs.length > 0 && (
                <>
                  <div className={styles.sectionTitle} style={{ margin: "18px 0 8px" }}>
                    Run history
                  </div>
                  <div className={styles.runList}>
                    {runs.map((r) => (
                      <div key={r.id} className={styles.runRow}>
                        <span className={styles.runCycle}>{r.cycle}</span>
                        <span
                          className={`${styles.runStatus} ${
                            r.status === "confirmed"
                              ? styles.runStatusConfirmed
                              : r.status === "failed"
                                ? styles.runStatusFailed
                                : ""
                          }`}
                        >
                          {r.status} · {r.entries.length} recipients
                        </span>
                        <span className={styles.runTxs}>
                          {r.txHashes.length > 0 ? `${r.txHashes.length} tx` : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick add — compact, one row */}
          <form
            className={u.panel}
            style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}
            onSubmit={handleAddChannel}
          >
            <div style={{ flex: "2 1 220px" }}>
              <label className={styles.fieldLabel}>Recipient address</label>
              <input
                className={styles.fieldInput}
                value={newAddr}
                onChange={(e) => setNewAddr(e.target.value)}
                placeholder="0x…"
                spellCheck={false}
              />
              {addrError && <div className={styles.fieldHint} style={{ color: "var(--bad)" }}>{addrError}</div>}
            </div>
            <div style={{ flex: "1 1 140px" }}>
              <label className={styles.fieldLabel}>Label (memory only)</label>
              <input
                className={styles.fieldInput}
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Eng — A"
              />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={!connected}>
              Add
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

const CHAIN_STATE_LABEL: Record<string, string> = {
  "0": "pending registration",
  "1": "active",
  "2": "terminated",
};

/**
 * Read-only channel lookup against the deployed Sepolia contract.
 *
 * Guests can use it too — reads never need a wallet. The channel id is the
 * exact felt the channel was created with (the UI derives and shows it at
 * add time); anything unparseable just reports not found.
 */
function OnChainLookup() {
  const [id, setId] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "found" | "missing" | "error">("idle");
  const [result, setResult] = useState<{ recipient: string; state: string; createdAt: number } | null>(null);

  async function lookup() {
    if (!id.trim()) return;
    setState("loading");
    const r = await getChannelOnChain(id.trim());
    if (r) {
      setResult(r);
      setState("found");
    } else {
      setResult(null);
      setState("missing");
    }
  }

  return (
    <div className={styles.onchainCard}>
      <div className={styles.sectionTitle} style={{ marginBottom: 6 }}>
        On-chain channel lookup
      </div>
      <div className={styles.fieldHint} style={{ marginBottom: 12 }}>
        Reads a channel straight from the Sepolia contract — live proof this
        dashboard talks to the chain. No wallet needed; anyone can check.
      </div>
      <div className={styles.unshieldBlock ?? ""} style={{ display: "flex", gap: 10 }}>
        <input
          className={styles.fieldInput}
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="0x… channel id"
          spellCheck={false}
          style={{ flex: 1 }}
          onKeyDown={(e) => {
            if (e.key === "Enter") lookup();
          }}
        />
        <button className={styles.miniBtn} style={{ padding: "10px 18px" }} onClick={lookup} disabled={state === "loading"}>
          {state === "loading" ? "Reading…" : "Read chain"}
        </button>
      </div>
      {state === "found" && result && (
        <div className={styles.fieldHint} style={{ color: "var(--text-dim)", marginTop: 10 }}>
          recipient <span style={{ color: "var(--text)" }}>{shortAddr(result.recipient)}</span>
          {" · state "}
          <span style={{ color: "var(--accent)" }}>
            {CHAIN_STATE_LABEL[result.state] ?? result.state}
          </span>
          {result.createdAt > 0 && <> · created {new Date(result.createdAt * 1000).toISOString().slice(0, 10)}</>}
        </div>
      )}
      {state === "missing" && (
        <div className={styles.fieldHint} style={{ marginTop: 10 }}>
          No channel with that id on Sepolia.
        </div>
      )}
      {state === "error" && (
        <div className={styles.fieldHint} style={{ color: "var(--accent)", marginTop: 10 }}>
          Node unreachable — try again shortly.
        </div>
      )}
    </div>
  );
}