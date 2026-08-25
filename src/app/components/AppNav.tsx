"use client";

import styles from "../uni.module.css";
import SelectWallet from "./client/WalletHandle/SelectWallet";

/**
 * The nav shared by every product surface.
 *
 * It existed four times as inline styles — one copy per page — which had
 * drifted: /invite offered no route to the employee portal or the verifier and
 * carried no connect button at all, so an employer who landed there could not
 * reach the rest of the app or sign anything.
 *
 * Using the same CSS module classes as the console means one definition of the
 * bar, and the surfaces inherit its responsive behaviour: the link row is
 * hidden below 600px, where five items would push the document wider than the
 * viewport and scroll the whole page sideways.
 */

const LINKS = [
  { href: "/employer", label: "Employer" },
  { href: "/invite", label: "Invite" },
  { href: "/employee", label: "Employee" },
  { href: "/verify", label: "Verify" },
  { href: "/about", label: "About" },
  { href: "/bench", label: "Bench" },
];

export default function AppNav({ active }: { active?: string }) {
  return (
    <nav className={styles.nav}>
      <a className={styles.brand} href="/">
        <span className={styles.brandMark}>zk</span>
        <span className={styles.brandName}>Payslip</span>
      </a>

      <div className={styles.navLinks}>
        {LINKS.map((l) => (
          <a
            key={l.href}
            className={styles.navLink}
            href={l.href}
            // The current page reads at full contrast; the rest stay dimmed.
            style={l.href === active ? { color: "var(--text)" } : undefined}
            aria-current={l.href === active ? "page" : undefined}
          >
            {l.label}
          </a>
        ))}
      </div>

      <div className={styles.navRight}>
        <SelectWallet variant="nav" />
      </div>
    </nav>
  );
}
