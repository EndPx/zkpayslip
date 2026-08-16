"use client";

import styles from "./uni.module.css";
import SelectWallet from "./components/client/WalletHandle/SelectWallet";
import WalletAccountV6Tag from "./components/client/WalletHandle/WalletAccountV6Tag";

export default function Page() {
  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <a className={styles.brand} href="/">
          <span className={styles.brandMark}>zk</span>
          <span className={styles.brandName}>Payslip</span>
        </a>
        <div className={styles.navLinks}>
          <a className={styles.navLink} href="/about">
            About
          </a>
          <a className={styles.navLink} href="/bench">
            Bench
          </a>
        </div>
        <div className={styles.navRight}>
          <SelectWallet variant="nav" />
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.appTag}>Private payroll console</div>
        <h1 className={styles.appTitle}>Run payroll in the dark.</h1>
        <p className={styles.appSub}>
          Shield STRK, move it privately inside the STRK20 pool, and issue
          payslip proofs that open to exactly one verifier, once. Connect a
          Ready wallet on Mainnet or Sepolia to begin.
        </p>
        <WalletAccountV6Tag />
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span>zkPayslip</span>
          <span className={styles.footerDot}>·</span>
          <span>Hackathon build · RFP-11</span>
          <span className={styles.footerDot}>·</span>
          <a
            className={styles.footerLink}
            href="https://github.com/EndPx/zkpayslip"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <span className={styles.footerDot}>·</span>
          <a className={styles.footerLink} href="/about">
            How it works
          </a>
        </div>
      </footer>
    </div>
  );
}
