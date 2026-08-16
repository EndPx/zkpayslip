export type ChannelState = 'pending_registration' | 'active' | 'terminated';

export interface Channel {
  id: string;
  recipientAddress: string;
  state: ChannelState;
  /** Local label, memory only. Never persisted anywhere. */
  localLabel?: string;
  createdAt: number;
  /** Present only when the channel carries a vesting schedule. */
  vesting?: VestingCommitment;
}

export interface VestingCommitment {
  /** Unix seconds. Before this, the contract rejects claims. */
  cliffAt: number;
  /** Commitment hash of the schedule. Raw parameters stay encrypted. */
  commitmentHash: string;
  claimed: boolean;
}

export type RunStatus = 'draft' | 'submitting' | 'confirmed' | 'failed';

export interface PayrollRun {
  id: string;
  /** e.g. "2026-08". Cycle identity, not execution date. */
  cycle: string;
  status: RunStatus;
  entries: PayrollEntry[];
  /** Populated once confirmed. May hold several if the run was split. */
  txHashes: string[];
  createdAt: number;
}

export interface PayrollEntry {
  channelId: string;
  /** Amount in the token's smallest unit. UI must mask this by default. */
  amount: bigint;
  /** Per-payment commitment. Basis for proof of completeness. */
  commitmentHash?: string;
}

export type DisclosureFact =
  | { kind: 'total_received'; from: number; to: number }
  | { kind: 'threshold_met'; threshold: bigint; from: number; to: number }
  | { kind: 'employment_active'; asOf: number };

export interface DisclosureToken {
  id: string;
  fact: DisclosureFact;
  /** Only this address may redeem. */
  verifierAddress: string;
  /** Unix seconds. */
  expiresAt: number;
  /** One-time value. Burned on redemption. */
  nullifier: string;
  redeemedAt?: number;
}

export type VerdictStatus =
  | 'valid'
  | 'expired'
  | 'already_redeemed'
  | 'wrong_verifier'
  | 'not_found';

export interface DisclosureVerdict {
  status: VerdictStatus;
  /** Present only when status is valid. Answers the fact — never raw data. */
  answer?: string;
  verifiedAt?: number;
}

export interface BatchBenchmark {
  recipientCount: number;
  provingTimeMs: number;
  totalTimeMs: number;
  calldataBytes: number;
  succeeded: boolean;
}
