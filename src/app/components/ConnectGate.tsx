"use client";

import { useStoreWallet } from "./Wallet/walletContext";
import styles from "../uni.module.css";

/**
 * Guest mode, shared by every surface.
 *
 * A guest can walk the whole app and read everything the chain gives up
 * without a signature — verdicts, structure, empty states that say what
 * connecting unlocks. Anything that needs one renders this gate: what is
 * locked, why, and the connect action one click away.
 *
 * The button only raises the wallet store's picker flag; SelectWallet owns
 * the modal itself, so there is exactly one connect flow in the app.
 *
 * Privacy rule (AGENTS.md): this component holds and logs nothing.
 */

export function useIsConnected(): boolean {
  const isConnected = useStoreWallet((s) => s.isConnected);
  const address = useStoreWallet((s) => s.address);
  return isConnected && !!address;
}

export default function ConnectGate({ message }: { message: string }) {
  const setSelectWalletUI = useStoreWallet((s) => s.setSelectWalletUI);

  return (
    <div className={styles.gate}>
      <span className={styles.gateLock} aria-hidden>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <rect x="4" y="11" width="16" height="9" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </span>
      <p className={styles.gateText}>{message}</p>
      <button className={styles.gateBtn} onClick={() => setSelectWalletUI(true)}>
        Connect wallet
      </button>
    </div>
  );
}
