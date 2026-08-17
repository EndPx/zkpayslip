"use client";

import { create } from "zustand";
import type { DisclosureToken, DisclosureFact } from "../../../types/payroll";

/**
 * In-memory employee state. Mocked — no wallet, no pool reads.
 *
 * Privacy rule: shielded balance is decrypted on demand and discarded on
 * unmount. Nothing here is persisted. Mock amounts are clearly synthetic
 * (BENCH-like markers) so they can never be mistaken for real on-chain
 * state.
 */

export interface PayRecord {
  cycle: string; // e.g. "2026-08"
  // Masked by default in the UI; opens only after deliberate click.
  amount: bigint;
  channelId: string;
  commitmentHash?: string;
  receivedAt: number;
}

export interface EmployeeState {
  mockMode: boolean;
  shieldedBalance: bigint; // smallest unit
  payHistory: PayRecord[];
  disclosures: DisclosureToken[];

  /** Mock: simulate the wallet returning a shielded balance. */
  setShieldedBalance: (n: bigint) => void;

  /** Mock: simulate receiving a private payment into the pool. */
  receivePayment: (cycle: string, amount: bigint, channelId: string) => void;

  /** Mock: simulate unshielding — moves out of shielded balance. */
  unshield: (amount: bigint) => boolean;

  createDisclosure: (
    fact: DisclosureFact,
    verifierAddress: string,
    expiresAt: number,
    nullifier: string
  ) => string;
}

export const useEmployee = create<EmployeeState>((set, get) => ({
  mockMode: true,
  shieldedBalance: 0n,
  payHistory: [],
  disclosures: [],

  setShieldedBalance: (n) => set({ shieldedBalance: n }),

  receivePayment: (cycle, amount, channelId) => {
    set((s) => ({
      shieldedBalance: s.shieldedBalance + amount,
      payHistory: [
        { cycle, amount, channelId, receivedAt: Date.now() },
        ...s.payHistory,
      ],
    }));
  },

  unshield: (amount) => {
    if (amount > get().shieldedBalance) return false;
    set((s) => ({ shieldedBalance: s.shieldedBalance - amount }));
    return true;
  },

  createDisclosure: (fact, verifierAddress, expiresAt, nullifier) => {
    const id = `d_${Date.now().toString(36)}`;
    const token: DisclosureToken = {
      id,
      fact,
      verifierAddress,
      expiresAt,
      nullifier,
    };
    set((s) => ({ disclosures: [token, ...s.disclosures] }));
    return id;
  },
}));