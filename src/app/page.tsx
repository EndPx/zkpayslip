"use client";

import { useEffect, useRef, useState } from "react";
import AppNav from "./components/AppNav";
import styles from "./landing.module.css";

/**
 * The landing — the page that explains the project before the app asks
 * for a wallet. Ember & bone, hero-on-black grammar: one object per
 * stage, gold as the only interactive hue, red only where something
 * burns. The three explainers animate once, when scrolled into view;
 * the hero's token floats forever. All motion is CSS; this file only
 * watches for the stages arriving.
 */

/** Adds .live when the stage scrolls into view — one-shot, then done. */
function Stage({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLive(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${styles.stage} ${live ? styles.live : ""}`}>
      {children}
    </div>
  );
}

const GOLD = "#ffb24d";
const BONE = "#f4f1ea";
const FAINT = "#5b5e6d";
const LINE = "#1d2029";
const CARD = "#0a0c12";
const RED = "#ff2a2a";

export default function Landing() {
  return (
    <div className={styles.landing}>
      <AppNav />

      {/* ─── Hero: one floating object in the void ─────────────────── */}
      <header className={styles.wrap}>
        <div className={styles.hero}>
          <div>
            <div className={styles.kicker}>Private payroll on Starknet</div>
            <h1 className={styles.heroTitle}>
              Salaries in the dark.
              <br />
              Proof in the <span className={styles.heroTitleEm}>open.</span>
            </h1>
            <p className={styles.heroSub}>
              zkPayslip moves salaries through the STRK20 privacy pool —{" "}
              <b>nobody sees who was paid what</b> — while any employee can
              still prove their income to exactly one verifier, exactly once.
            </p>
            <div className={styles.ctas}>
              <a className={styles.btnGold} href="/app">
                Open the app
              </a>
              <a className={styles.btnGhost} href="/about">
                How it works
              </a>
            </div>
            <div className={styles.scrollCue} aria-hidden />
          </div>

          <div className={styles.heroStage} aria-hidden>
            {/* The payslip proof token — the product, floating. */}
            <svg className={styles.token} viewBox="0 0 460 320" role="presentation">
              <rect x="40" y="24" width="380" height="272" rx="12" fill={CARD} stroke={LINE} />
              <text x="64" y="62" className={styles.stageText} fontSize="11" fill={FAINT}>
                PAYSLIP PROOF
              </text>
              <text x="396" y="62" textAnchor="end" className={styles.stageText} fontSize="11" fill={GOLD}>
                № 0042
              </text>
              <g className={styles.stageText} fontSize="12">
                <text x="64" y="108" fill={FAINT}>FACT</text>
                <text x="180" y="108" fill={BONE}>INCOME ≥ 4,200 STRK / MO</text>
                <text x="64" y="146" fill={FAINT}>VERIFIER</text>
                <text x="180" y="146" fill={BONE}>0x07d3…e91a</text>
                <text x="64" y="184" fill={FAINT}>EXPIRY</text>
                <text x="180" y="184" fill={BONE}>2026-09-30</text>
                <text x="64" y="222" fill={GOLD}>NULLIFIER</text>
                <text x="180" y="222" fill={GOLD}>0x8f4a…c2</text>
              </g>
              <rect className={styles.burnLine} x="180" y="226" width="150" height="2" fill={GOLD} />
              <rect x="64" y="250" width="118" height="26" rx="2" fill="none" stroke={GOLD} />
              <text
                className={`${styles.stageText} ${styles.sealPulse}`}
                x="123" y="267" textAnchor="middle" fontSize="10" fill={GOLD}
              >
                VALID ONCE
              </text>
              <text
                x="396" y="267" textAnchor="end" className={styles.stageText}
                fontSize="10" fill={FAINT} style={{ letterSpacing: "0.04em" }}
              >
                ONE VERIFIER · ONE REDEMPTION
              </text>
            </svg>
          </div>
        </div>
      </header>

      {/* ─── 01 — The pool swallows the payroll ────────────────────── */}
      <section className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <div className={styles.kicker}>01 — Shielded payroll</div>
            <h2>
              The pool <em>swallows</em> the payroll.
            </h2>
            <p>
              Every salary enters the STRK20 pool as a private transaction.
              On-chain there are no amounts and no recipients — rotating
              relayers submit, the pool settles, and the ledger shows
              movement without meaning.
            </p>
          </div>

          <Stage>
            <svg viewBox="0 0 760 220" role="img" aria-label="Three salary notes enter the pool and emerge as anonymous payments">
              {/* Three salary chips, flying in and masking mid-flight. */}
              {[0, 1, 2].map((i) => (
                <g
                  key={i}
                  className={`${styles.chip} ${i === 1 ? styles.c2 : i === 2 ? styles.c3 : ""}`}
                  style={{ animationDelay: `${i * 1.1}s` }}
                >
                  <rect x="40" y={30 + i * 60} width="150" height="40" rx="6" fill={CARD} stroke={LINE} />
                  <text className={styles.stageText} x="56" y={50 + i * 60} fontSize="9" fill={FAINT}>
                    SALARY
                  </text>
                  <text
                    className={styles.amount}
                    style={{ animationDelay: `${i * 1.1}s` }}
                    x="56" y={62 + i * 60} fontSize="11" fill={BONE}
                    fontFamily="var(--font-mono)"
                  >
                    {`${[12, 7.5, 21][i]} STRK`}
                  </text>
                  <text
                    className={styles.masked}
                    style={{ animationDelay: `${i * 1.1}s` }}
                    x="56" y={62 + i * 60} fontSize="11" fill={GOLD}
                    fontFamily="var(--font-mono)"
                  >
                    •••• STRK
                  </text>
                </g>
              ))}

              {/* The pool — a ring that breathes around a void. */}
              <circle className={styles.poolRing} cx="400" cy="110" r="72" fill="none" stroke={GOLD} strokeWidth="1" />
              <circle cx="400" cy="110" r="72" fill="var(--bg-base)" opacity="0.85" />
              <text className={styles.stageText} x="400" y="114" textAnchor="middle" fontSize="10" fill={GOLD}>
                STRK20 POOL
              </text>
              <text className={styles.stageText} x="400" y="200" textAnchor="middle" fontSize="9" fill={FAINT}>
                RELAYERS SUBMIT · THE POOL SETTLES
              </text>

              {/* What the chain actually sees: anonymous outflows. */}
              {[0, 1, 2].map((i) => (
                <g key={i}>
                  <circle cx="560" cy={50 + i * 60} r="4" fill={GOLD} opacity="0.9" />
                  <line x1="570" y1={50 + i * 60} x2="700" y2={50 + i * 60} stroke={LINE} strokeWidth="1" />
                  <text className={styles.stageText} x="708" y={54 + i * 60} fontSize="9" fill={FAINT}>
                    ? STRK
                  </text>
                </g>
              ))}
            </svg>
          </Stage>
        </div>
      </section>

      {/* ─── 02 — The one-time proof ───────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <div className={styles.kicker}>02 — The one-time proof</div>
            <h2>
              One proof. One verifier. <em>Once.</em>
            </h2>
            <p>
              When a bank asks, the employee mints a proof bound to that
              single verifier. It reveals exactly one fact, it expires, and
              redemption burns the nullifier — a second read is impossible,
              and the contract enforces it.
            </p>
          </div>

          <Stage>
            <svg viewBox="0 0 760 260" role="img" aria-label="A proof arrives row by row, then the nullifier burns and the proof reads spent">
              <rect x="40" y="20" width="680" height="220" rx="12" fill={CARD} stroke={LINE} />
              <g className={styles.stageText} fontSize="13">
                <g className={`${styles.hold} ${styles.d1}`}>
                  <text x="72" y="72" fill={FAINT} fontSize="11">FACT</text>
                  <text x="220" y="72" fill={BONE}>INCOME ≥ 4,200 STRK / MO</text>
                </g>
                <g className={`${styles.hold} ${styles.d2}`}>
                  <text x="72" y="116" fill={FAINT} fontSize="11">VERIFIER</text>
                  <text x="220" y="116" fill={BONE}>0x07d3…e91a — only this address</text>
                </g>
                <g className={`${styles.hold} ${styles.d3}`}>
                  <text x="72" y="160" fill={FAINT} fontSize="11">EXPIRY</text>
                  <text x="220" y="160" fill={BONE}>2026-09-30</text>
                </g>
                <g className={`${styles.hold} ${styles.d4}`}>
                  <text x="72" y="204" fill={GOLD} fontSize="11">NULLIFIER</text>
                  <text x="220" y="204" fill={GOLD}>0x8f4a…c2</text>
                </g>
              </g>
              {/* The burn: red, once, after the rows have landed. */}
              <rect className={styles.burnStrike} x="218" y="209" width="150" height="3" fill={RED} />
              <text
                className={`${styles.stageText} ${styles.spent}`}
                x="688" y="208" textAnchor="end" fontSize="11" fill={RED}
              >
                REDEEMED — NULLIFIER BURNED
              </text>
            </svg>
          </Stage>
        </div>
      </section>

      {/* ─── 03 — Registration before payment ──────────────────────── */}
      <section className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <div className={styles.kicker}>03 — Registration before payment</div>
            <h2>
              A <em>handshake</em>, then the money.
            </h2>
            <p>
              A channel opens through ECDH: the pool derives the shared
              secret from the recipient&apos;s public viewing key, which only
              exists on-chain after they register. There is no
              send-now-claim-later — the handshake comes first.
            </p>
          </div>

          <Stage>
            <svg viewBox="0 0 760 220" role="img" aria-label="An employer and employee shake hands into an active channel">
              <circle cx="140" cy="110" r="46" fill={CARD} stroke={LINE} />
              <text className={styles.stageText} x="140" y="106" textAnchor="middle" fontSize="9" fill={FAINT}>
                EMPLOYER
              </text>
              <text className={styles.stageText} x="140" y="122" textAnchor="middle" fontSize="9" fill={BONE}>
                add_channel
              </text>

              <circle cx="620" cy="110" r="46" fill={CARD} stroke={LINE} />
              <text className={styles.stageText} x="620" y="106" textAnchor="middle" fontSize="9" fill={FAINT}>
                EMPLOYEE
              </text>
              <text className={styles.stageText} x="620" y="122" textAnchor="middle" fontSize="9" fill={BONE}>
                SetViewingKey
              </text>

              {/* The ECDH handshake draws itself. */}
              <path
                className={styles.arc}
                d="M 190 110 C 300 30, 460 30, 570 110"
                fill="none"
                stroke={GOLD}
                strokeWidth="1.5"
              />
              <text className={styles.stageText} x="380" y="38" textAnchor="middle" fontSize="9" fill={FAINT}>
                ECDH — PUBLIC VIEWING KEY
              </text>

              {/* State flip: pending registration → active. */}
              <text
                className={`${styles.stageText} ${styles.chanPending}`}
                x="380" y="196" textAnchor="middle" fontSize="10" fill={FAINT}
              >
                PENDING REGISTRATION
              </text>
              <text
                className={`${styles.stageText} ${styles.chanActive}`}
                x="380" y="196" textAnchor="middle" fontSize="10" fill={GOLD}
              >
                CHANNEL ACTIVE — PAYROLL CAN FLOW
              </text>
            </svg>
          </Stage>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────────── */}
      <section className={styles.ctaBand}>
        <div className={styles.wrap}>
          <h2>
            Step <em>inside</em> the dark.
          </h2>
          <p>
            The console is live on Sepolia. Walk it as a guest — every
            signing action unlocks with a wallet.
          </p>
          <div className={styles.ctas} style={{ justifyContent: "center" }}>
            <a className={styles.btnGold} href="/app">
              Open the app
            </a>
            <a className={styles.btnGhost} href="/about">
              How it works
            </a>
          </div>
        </div>
      </section>

      <footer className={styles.foot}>
        <div className={styles.footInner}>
          <span>zkPayslip</span>
          <span className={styles.footDot}>·</span>
          <span>Hackathon build · RFP-11</span>
          <span className={styles.footDot}>·</span>
          <a
            className={styles.footLink}
            href="https://github.com/EndPx/zkpayslip"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <span className={styles.footDot}>·</span>
          <a className={styles.footLink} href="/about">
            How it works
          </a>
        </div>
      </footer>
    </div>
  );
}
