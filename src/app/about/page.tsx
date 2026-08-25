import styles from "./about.module.css";

const REPO = "https://github.com/EndPx/zkpayslip";

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <a className={styles.brand} href="/">
          <span className={styles.brandMark}>zk</span>
          <span className={styles.brandName}>Payslip</span>
        </a>
        <a className={styles.openApp} href="/">
          Open the app
        </a>
      </nav>

      {/* ─── Hero ─────────────────────────────────────────── */}
      <header className={`${styles.container} ${styles.hero}`}>
        <div className={styles.heroGrid}>
          <div>
            <div className={styles.tag}>Private payroll · Starknet mainnet</div>
            <h1 className={styles.heroTitle}>
              Salaries in the dark.
              <br />
              Proof in the <span className={styles.heroAccent}>open.</span>
            </h1>
            <p className={styles.heroSub}>
              zkPayslip runs payroll inside the STRK20 privacy pool. Nobody
              sees who was paid what — and any employee can still prove their
              income to exactly one verifier, exactly once.
            </p>
            <div className={styles.ctaRow}>
              <a className={styles.ctaPrimary} href="/">
                Open the app
              </a>
              <a
                className={styles.ctaSecondary}
                href={REPO}
                target="_blank"
                rel="noreferrer"
              >
                Source
              </a>
            </div>
          </div>

          {/* The payslip proof token — schematic */}
          <svg
            className={styles.schematic}
            viewBox="0 0 460 320"
            role="img"
            aria-label="Schematic of a zkPayslip proof: one fact, one verifier, an expiry, and a one-time nullifier"
          >
            <rect
              x="40"
              y="24"
              width="380"
              height="272"
              rx="12"
              fill="#141414"
              stroke="#262626"
            />
            <text
              x="64"
              y="62"
              className={styles.schematicText}
              fontSize="11"
              fill="#616161"
            >
              PAYSLIP PROOF
            </text>
            <text
              x="396"
              y="62"
              textAnchor="end"
              className={styles.schematicText}
              fontSize="11"
              fill="#536fe7"
            >
              № 0042
            </text>

            <g className={styles.schematicText} fontSize="12">
              <text x="64" y="108" fill="#616161">
                FACT
              </text>
              <text x="180" y="108" fill="#fafafa">
                INCOME ≥ 4,200 STRK / MO
              </text>

              <text x="64" y="146" fill="#616161">
                VERIFIER
              </text>
              <text x="180" y="146" fill="#fafafa">
                0x07d3…e91a
              </text>

              <text x="64" y="184" fill="#616161">
                EXPIRY
              </text>
              <text x="180" y="184" fill="#fafafa">
                2026-09-30
              </text>

              <text x="64" y="222" fill="#536fe7">
                NULLIFIER
              </text>
              <text x="180" y="222" fill="#536fe7">
                0x8f4a…c2
              </text>
            </g>
            {/* The nullifier burns — once, on redemption. */}
            <rect
              className={styles.burnLine}
              x="180"
              y="226"
              width="150"
              height="2"
              fill="#536fe7"
            />

            <rect
              x="64"
              y="250"
              width="118"
              height="26"
              rx="2"
              fill="none"
              stroke="#536fe7"
            />
            <text
              className={`${styles.schematicText} ${styles.sealPulse}`}
              x="123"
              y="267"
              textAnchor="middle"
              fontSize="10"
              fill="#536fe7"
            >
              VALID ONCE
            </text>
            <text
              x="396"
              y="267"
              textAnchor="end"
              className={styles.schematicText}
              fontSize="10"
              fill="#616161"
            >
              ONE FACT · ONE VERIFIER · ONE REDEMPTION
            </text>
          </svg>
        </div>
      </header>

      {/* ─── Problem ──────────────────────────────────────── */}
      <section className={`${styles.container} ${styles.section}`}>
        <div className={styles.tag}>The problem</div>
        <h2 className={styles.h2}>
          A wallet address is a financial strip-search.
        </h2>
        <p className={styles.lead}>
          When a bank asks for proof of income, an employee paid on-chain has
          two options today. Both of them cost something.
        </p>
        <div className={styles.paths}>
          <div className={styles.path}>
            <span className={styles.pathLabel}>Path A — comply</span>
            <span className={styles.pathText}>
              Hand over the wallet address. The entire financial history walks
              out with it: every deposit, every counterpart, every balance.
            </span>
          </div>
          <div className={styles.path}>
            <span className={styles.pathLabel}>Path B — refuse</span>
            <span className={styles.pathText}>
              Prove nothing. No loan, no lease, no visa, no job.
            </span>
          </div>
          <div className={`${styles.path} ${styles.pathC}`}>
            <span className={`${styles.pathLabel} ${styles.tableOrange}`}>
              Path C — zkPayslip
            </span>
            <span className={styles.pathCText}>
              Prove <em>the one fact</em> the verifier needs. Keep the rest in
              the dark.
            </span>
          </div>
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────── */}
      <section className={`${styles.container} ${styles.section}`}>
        <div className={styles.tag}>Mechanism</div>
        <h2 className={styles.h2}>Four moves. No leaks.</h2>
        <p className={styles.lead}>
          The payment rail already exists — STRK20 hides amounts and
          counterparties inside the pool. zkPayslip adds the missing piece:
          scoped, single-use income proofs on top.
        </p>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepTag}>Step 01</div>
            <div className={styles.stepWord}>Shield</div>
            <p className={styles.stepText}>
              The employer funds a treasury in the pool. One public deposit;
              everything after it stays dark.
            </p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepTag}>Step 02</div>
            <div className={styles.stepWord}>Pay</div>
            <p className={styles.stepText}>
              Each cycle, salary moves channel-to-channel inside the pool. No
              amounts, no counterparties on-chain.
            </p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepTag}>Step 03</div>
            <div className={styles.stepWord}>Prove</div>
            <p className={styles.stepText}>
              An employee mints a payslip proof: one fact, one verifier, an
              expiry, a nullifier.
            </p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepTag}>Step 04</div>
            <div className={styles.stepWord}>Verify</div>
            <p className={styles.stepText}>
              The verifier checks it in one click. No wallet, no history, no
              second read.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Hidden vs visible ────────────────────────────── */}
      <section className={`${styles.container} ${styles.section}`}>
        <div className={styles.tag}>Honesty</div>
        <h2 className={styles.h2}>
          What the pool hides. What stays public.
        </h2>
        <p className={styles.lead}>
          We state it plainly, because the honesty is the product. Only
          movement <em>inside</em> the pool is private — the edges are public
          by design.
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Aspect</th>
                <th>Stays in the dark</th>
                <th>Public by design</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Counterparties</td>
                <td>Who paid whom</td>
                <td>The shield deposit names the treasury, nobody else</td>
              </tr>
              <tr>
                <td>Amounts</td>
                <td>Each employee&apos;s salary</td>
                <td>Total budget at shield; amounts that unshield out</td>
              </tr>
              <tr>
                <td>Activity</td>
                <td>Which notes were spent</td>
                <td>That the pool is used, and when</td>
              </tr>
              <tr>
                <td>Proofs</td>
                <td>The payslip&apos;s single fact</td>
                <td>A payroll run&apos;s size (action count)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Escrow comparison ────────────────────────────── */}
      <section className={`${styles.container} ${styles.section}`}>
        <div className={styles.tag}>Why a new disclosure layer</div>
        <h2 className={styles.h2}>Why not just hand over the auditor key?</h2>
        <p className={styles.lead}>
          STRK20 ships a viewing-key escrow: at registration, each user&apos;s
          key is encrypted to an auditor, who can then decrypt that user&apos;s
          entire history. That is the right tool for lawful process — and the
          wrong tool for a bank loan.
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Aspect</th>
                <th>Viewing-key escrow</th>
                <th className={styles.tableOrange}>zkPayslip proof</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Scope</td>
                <td>One user&apos;s entire history</td>
                <td className={styles.tableOrange}>
                  One fact, chosen per proof
                </td>
              </tr>
              <tr>
                <td>Audience</td>
                <td>The auditor named by governance</td>
                <td className={styles.tableOrange}>
                  Any verifier the employee picks
                </td>
              </tr>
              <tr>
                <td>Access</td>
                <td>Standing while key access persists</td>
                <td className={styles.tableOrange}>
                  One redemption — then the nullifier burns
                </td>
              </tr>
              <tr>
                <td>Expiry</td>
                <td>None</td>
                <td className={styles.tableOrange}>Set per proof</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Status ───────────────────────────────────────── */}
      <section className={`${styles.container} ${styles.section}`}>
        <div className={styles.tag}>Where the build stands</div>
        <h2 className={styles.h2}>Live facts only.</h2>
        <p className={styles.lead}>
          Everything below reflects the repository as it is right now.
        </p>
        <div className={styles.statusGrid}>
          <div className={styles.statusCell}>
            <span className={`${styles.statusChip} ${styles.chipLive}`}>
              Live
            </span>
            <p className={styles.statusText}>
              <b>Public repo, MIT license</b> — registered for the Private
              Sprint hackathon (RFP-11, Payments).
            </p>
          </div>
          <div className={styles.statusCell}>
            <span className={`${styles.statusChip} ${styles.chipLive}`}>
              Live
            </span>
            <p className={styles.statusText}>
              <b>Wallet-API actions</b> — shield, private transfer, unshield,
              shielded balances through the user&apos;s own wallet.
            </p>
          </div>
          <div className={styles.statusCell}>
            <span className={`${styles.statusChip} ${styles.chipPending}`}>
              Pending
            </span>
            <p className={styles.statusText}>
              <b>Mainnet transactions</b> — the first pool-touching hashes land
              in <code>strk20.json</code> as they happen.
            </p>
          </div>
          <div className={styles.statusCell}>
            <span className={`${styles.statusChip} ${styles.chipPending}`}>
              Pending
            </span>
            <p className={styles.statusText}>
              <b>Batch benchmark</b> — recipients-per-transaction will be our
              own measured number, not a quoted one.
            </p>
          </div>
        </div>
        <p className={styles.statusNote}>
          Nothing on this page is a placeholder for a claim we cannot back.
          Numbers appear when measured; hashes appear when confirmed.
        </p>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────── */}
      <section className={`${styles.container} ${styles.section}`}>
        <div className={styles.tag}>Common questions</div>
        <h2 className={styles.h2}>Asked, answered.</h2>
        <div className={styles.faq}>
          <details className={styles.qa}>
            <summary>Can my employer see my balance?</summary>
            <p className={styles.answer}>
              No. Pool notes decrypt only with your viewing key, which never
              leaves your wallet — not even this application sees it. The
              employer sees their own treasury and commitments, nothing else.
            </p>
          </details>
          <details className={styles.qa}>
            <summary>Can a verifier reuse or forward my proof?</summary>
            <p className={styles.answer}>
              Redemption is single-use and bound to one verifier address; a
              second attempt fails on-chain. What a legitimate verifier
              retains after reading it is inherent to any disclosure — we say
              that plainly rather than overclaim.
            </p>
          </details>
          <details className={styles.qa}>
            <summary>Is this a mixer?</summary>
            <p className={styles.answer}>
              No. STRK20 is a note-based pool with on-chain STARK proof
              verification and mandatory deposit screening, enforced on-chain.
              Private from the public — not from lawful oversight.
            </p>
          </details>
          <details className={styles.qa}>
            <summary>What happens on August 31?</summary>
            <p className={styles.answer}>
              The hackathon submission closes at 23:59 UTC. Whatever the
              repository shows at that moment is the entry: the app, the
              mainnet hashes, the demo video, the documentation.
            </p>
          </details>
        </div>
      </section>

      {/* ─── Close ────────────────────────────────────────── */}
      <section className={`${styles.container} ${styles.close}`}>
        <h2 className={styles.closeTitle}>
          Pay the team.
          <br />
          Prove the salary.
          <br />
          <em>Nothing else.</em>
        </h2>
        <a className={styles.ctaPrimary} href="/">
          Open the app
        </a>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span>zkPayslip</span>
          <span className={styles.footerDot}>·</span>
          <span>Built on the STRK20 privacy pool</span>
          <span className={styles.footerDot}>·</span>
          <span>RFP-11 · Private Payroll</span>
          <span className={styles.footerDot}>·</span>
          <a className={styles.footerLink} href={REPO} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <span className={styles.footerDot}>·</span>
          <span>MIT</span>
        </div>
      </footer>
    </div>
  );
}
