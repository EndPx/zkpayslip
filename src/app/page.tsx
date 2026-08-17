"use client";

import styles from "./uni.module.css";
import SelectWallet from "./components/client/WalletHandle/SelectWallet";
import WalletAccountV6Tag from "./components/client/WalletHandle/WalletAccountV6Tag";

/**
 * The console is the first screen, so it has to answer "who are you and what
 * are you here to do" before it offers any primitive.
 *
 * It previously opened straight onto the starter kit's pool tabs — shield,
 * send, unshield, balances — with no route to the employer dashboard, the
 * employee portal, or the verifier page at all. Those three are the product,
 * and they were unreachable from here: a judge opening the demo URL landed on
 * a generic privacy-pool toolbox and stopped.
 *
 * So: roles first, plumbing second.
 */

const ROLES = [
  {
    href: "/employer",
    label: "Employer",
    title: "Run payroll",
    body: "Fund a shielded treasury, keep a channel per employee, execute a cycle. Amounts stay masked until you open one channel.",
  },
  {
    href: "/employee",
    label: "Employee",
    title: "See your salary",
    body: "Your shielded balance and pay history, visible only to you — and a one-time income proof when a bank asks.",
  },
  {
    href: "/verify",
    label: "Verifier",
    title: "Check a proof",
    body: "Paste a proof id for a read-only verdict. No wallet, no history, no second read.",
  },
];

export default function Page() {
  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <a className={styles.brand} href="/">
          <span className={styles.brandMark}>zk</span>
          <span className={styles.brandName}>Payslip</span>
        </a>
        <div className={styles.navLinks}>
          <a className={styles.navLink} href="/employer">
            Employer
          </a>
          <a className={styles.navLink} href="/employee">
            Employee
          </a>
          <a className={styles.navLink} href="/verify">
            Verify
          </a>
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
          Salaries move invisibly inside the STRK20 privacy pool, and any
          employee can still prove their income to exactly one verifier, once.
          Pick where you are starting from.
        </p>

        {/* Roles — the three product surfaces, the reason anyone is here. */}
        <div className={styles.roles}>
          {ROLES.map((r) => (
            <a key={r.href} href={r.href} className={styles.roleCard}>
              <span className={styles.roleLabel}>{r.label}</span>
              <span className={styles.roleTitle}>{r.title}</span>
              <span className={styles.roleBody}>{r.body}</span>
              <span className={styles.roleGo}>Open →</span>
            </a>
          ))}
        </div>

        {/* Pool tools — the raw STRK20 actions. Real payroll steps (an employer
            shields the treasury; an employee unshields their pay) but plumbing,
            not the entry point, so they sit below the roles and say so. */}
        <div className={styles.poolTools}>
          <div className={styles.poolLabel}>Pool tools</div>
          <p className={styles.poolNote}>
            Direct STRK20 actions against the pool — funding a treasury, taking
            pay out, reading a shielded balance. The payroll surfaces above use
            these underneath; they are exposed here for setup and for checking
            the protocol directly.
          </p>
          <WalletAccountV6Tag />
        </div>
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
