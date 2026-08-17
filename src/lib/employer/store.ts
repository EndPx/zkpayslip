"use client";

import { create } from "zustand";
import type { Channel, PayrollRun, PayrollEntry } from "../../../types/payroll";

/**
 * In-memory employer state. Mocked for development — no wallet, no contract.
 *
 * Privacy rule (AGENTS.md): amounts, addresses, and labels live in memory for
 * the session only. Nothing here is persisted to localStorage, a server, or
 * the console. A real wallet replaces `mockMode` with on-chain reads.
 */

let idCounter = 0;
const nextId = () => `ch_${Date.now().toString(36)}_${(idCounter++).toString(36)}`;

export interface EmployerState {
  /** Mock mode = true until a real wallet is connected and the contract is live. */
  mockMode: boolean;
  setMockMode: (mock: boolean) => void;

  /** Shielded treasury balance, smallest unit. Masked in UI by default. */
  treasuryBalance: bigint;
  setTreasuryBalance: (n: bigint) => void;

  /** Channels — in memory only. */
  channels: Channel[];
  addChannel: (recipientAddress: string, localLabel?: string) => void;
  activateChannel: (id: string) => void;
  terminateChannel: (id: string) => void;

  /** Payroll runs. */
  runs: PayrollRun[];
  startRun: (cycle: string, entries: PayrollEntry[]) => string;
  finishRun: (id: string, txHashes: string[]) => void;
  failRun: (id: string) => void;

  /** Convenience: active channels only (a payroll run includes only active). */
  activeChannels: () => Channel[];
  pendingChannels: () => Channel[];
}

export const useEmployer = create<EmployerState>((set, get) => ({
  mockMode: true,
  setMockMode: (mockMode) => set({ mockMode }),

  treasuryBalance: 0n,
  setTreasuryBalance: (treasuryBalance) => set({ treasuryBalance }),

  channels: [],
  addChannel: (recipientAddress, localLabel) => {
    const channel: Channel = {
      id: nextId(),
      recipientAddress,
      state: "pending_registration",
      localLabel,
      createdAt: Date.now(),
    };
    set((s) => ({ channels: [...s.channels, channel] }));
  },
  activateChannel: (id) =>
    set((s) => ({
      channels: s.channels.map((c) =>
        c.id === id && c.state === "pending_registration"
          ? { ...c, state: "active" }
          : c
      ),
    })),
  terminateChannel: (id) =>
    set((s) => ({
      channels: s.channels.map((c) =>
        c.id === id && c.state !== "terminated" ? { ...c, state: "terminated" } : c
      ),
    })),

  runs: [],
  startRun: (cycle, entries) => {
    const id = `run_${Date.now().toString(36)}`;
    const run: PayrollRun = {
      id,
      cycle,
      status: "submitting",
      entries,
      txHashes: [],
      createdAt: Date.now(),
    };
    set((s) => ({ runs: [run, ...s.runs] }));
    return id;
  },
  finishRun: (id, txHashes) =>
    set((s) => ({
      runs: s.runs.map((r) =>
        r.id === id ? { ...r, status: "confirmed", txHashes } : r
      ),
    })),
  failRun: (id) =>
    set((s) => ({
      runs: s.runs.map((r) => (r.id === id ? { ...r, status: "failed" } : r)),
    })),

  activeChannels: () => get().channels.filter((c) => c.state === "active"),
  pendingChannels: () => get().channels.filter((c) => c.state === "pending_registration"),
}));