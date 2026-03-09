import { create } from "zustand";
import type { PointHistory } from "../types";
import {
  mockExpiringDate,
  mockExpiringPoints,
  mockPointBalance,
  mockPointHistory,
} from "./mockData";

interface PointState {
  balance: number;
  history: PointHistory[];
  expiringPoints: number;
  expiringDate: string | null;
  redeemForBill: (points: number) => void;
  reset: () => void;
}

export const usePointStore = create<PointState>((set) => ({
  balance: mockPointBalance,
  history: mockPointHistory,
  expiringPoints: mockExpiringPoints,
  expiringDate: mockExpiringDate,
  redeemForBill: (points) =>
    set((state) => {
      const newEntry: PointHistory = {
        id: `ph-redeem-${crypto.randomUUID()}`,
        userId: "user-001",
        type: "used",
        amount: -points,
        description: "電気代充当",
        createdAt: new Date().toISOString(),
      };
      return {
        balance: state.balance - points,
        history: [newEntry, ...state.history],
      };
    }),
  reset: () =>
    set({
      balance: mockPointBalance,
      history: mockPointHistory,
      expiringPoints: mockExpiringPoints,
      expiringDate: mockExpiringDate,
    }),
}));
