"use client";

import styles from "./uni.module.css";
import WalletAccountV6Tag from "./components/client/WalletHandle/WalletAccountV6Tag";
import AppNav from "./components/AppNav";

/**
 * The console is the first screen, so it has to answer "who are you and what
 * are you here to do" before it offers any primitive.
 *
 * Roles first, plumbing second: the three product surfaces lead, and the raw
 * STRK20 pool actions sit below them as setup tooling. A guest can open every
 * door from here — each surface renders read-only until a wallet connects.
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
      <AppNav />

      <main className={styles.main}>
        <div className={styles.appTag}>Private payroll console</div>
        <h1 className={styles.appTitle}>Run payroll in the dark.</h1>
        <p className={styles.appSub}>
          Salaries move invisibly inside the STRK20 privacy pool, and any
          employee can still prove their income to exactly one verifier, once.
          Browse everything as a guest — signing unlocks with a wallet.
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
