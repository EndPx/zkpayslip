"use client";

import { useCallback, useEffect, useState } from "react";
import { num } from "starknet";
import type { WalletAccountV6 } from "starknet";
import * as constants from "@/utils/constants";
import { useStoreWallet } from "./Wallet/walletContext";
import ConnectGate, { useIsConnected } from "./ConnectGate";
import styles from "../uni.module.css";

/**
 * The left rail of every dashboard: the connected wallet's shielded STRK
 * balance, read straight from the pool via the wallet's discovery.
 *
 * Privacy rule (AGENTS.md): the balance lives in this component's state only —
 * never in a store, never persisted, never logged. It refetches on connect and
 * on demand; nothing caches it across unmount.
 */

function fmtStrk(amount: bigint): string {
  const whole = amount / 10n ** 18n;
  const frac = (amount % 10n ** 18n).toString().padStart(18, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac.slice(0, 4)}` : `${whole}`;
}

export default function BalanceCard() {
  const myWalletAccount = useStoreWallet((s) => s.myWalletAccount);
  const connected = useIsConnected();
  const [balance, setBalance] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const read = useCallback(async () => {
    const account = myWalletAccount as WalletAccountV6 | undefined;
    if (!account) return;
    setLoading(true);
    setFailed(false);
    try {
      const rows = (await account.strk20Balances([])) as any;
      const list = Array.isArray(rows) ? rows : (rows?.value ?? []);
      let total = 0n;
      for (const row of list) {
        const token = row?.token ?? row?.token_address ?? row?.[0];
        const amount = row?.amount ?? row?.balance ?? row?.[1];
        try {
          if (num.toBigInt(token) === num.toBigInt(constants.addrSTRK)) {
            total += num.toBigInt(amount);
          }
        } catch {
          /* skip a row whose shape we cannot parse — never guess a value */
        }
      }
      setBalance(total);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [myWalletAccount]);

  useEffect(() => {
    if (connected) void read();
    else setBalance(null);
  }, [connected, read]);

  return (
    <div className={styles.panel}>
      <div className={styles.inputLabel}>Shielded balance</div>
      {connected ? (
        <>
          <div className={styles.bigValue} style={{ fontSize: 52 }}>
            {loading && balance === null
              ? "…"
              : failed && balance === null
                ? "—"
                : balance !== null
                  ? fmtStrk(balance)
                  : "0"}
          </div>
          <div className={styles.subLine}>
            <span>STRK · inside the pool</span>
            <button
              className={styles.btn}
              onClick={() => void read()}
              disabled={loading}
              title="Re-read from the pool"
            >
              {loading ? "…" : "↻"}
            </button>
          </div>
          <div className={styles.subLine} style={{ marginTop: 4 }}>
            <span style={{ color: "var(--text-faint)", fontSize: 12 }}>
              Decrypts in your wallet — never stored here.
            </span>
          </div>
        </>
      ) : (
        <div style={{ marginTop: 6 }}>
          <ConnectGate message="Your shielded balance reads through your wallet — nothing is stored on this page." />
        </div>
      )}
    </div>
  );
}
