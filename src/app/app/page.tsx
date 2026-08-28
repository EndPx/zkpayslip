"use client";

import styles from "../uni.module.css";
import WalletAccountV6Tag from "../components/client/WalletHandle/WalletAccountV6Tag";
import AppNav from "../components/AppNav";
import BalanceCard from "../components/BalanceCard";

/**
 * The app console — one viewport, no scroll.
 *
 * Left rail: what you have (shielded balance, network). Right column: what
 * you can do (the STRK20 pool actions). Roles live in the nav; this page is
 * a dashboard, not an index.
 */
export default function Page() {
  return (
    <div className={styles.page}>
      <AppNav active="/app" />

      <main className={styles.shell}>
        <div className={styles.rail}>
          <BalanceCard />
          <div className={styles.panel}>
            <div className={styles.inputLabel}>Network</div>
            <div className={styles.subLine}>
              <span>Starknet Sepolia / Mainnet</span>
              <span style={{ color: "var(--accent)" }}>●</span>
            </div>
            <div className={styles.subLine} style={{ marginTop: 4 }}>
              <span style={{ color: "var(--text-faint)", fontSize: 12 }}>
                Switch network in your wallet — actions follow it.
              </span>
            </div>
          </div>
        </div>

        <div className={`${styles.actionCol} ${styles.listCap}`}>
          <WalletAccountV6Tag />
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span>zkPayslip</span>
          <span className={styles.footerDot}>·</span>
          <span>RFP-11</span>
          <span className={styles.footerDot}>·</span>
          <a
            className={styles.footerLink}
            href="https://github.com/EndPx/zkpayslip"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
