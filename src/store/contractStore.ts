import { create } from "zustand";
import type { Contract } from "../types";
import { mockContracts } from "./mockData";

interface ContractState {
  contracts: Contract[];
  selectedContractId: string | null;
  isLoading: boolean;
  setSelectedContract: (id: string) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useContractStore = create<ContractState>((set) => ({
  contracts: mockContracts,
  selectedContractId: mockContracts[0]?.id ?? null,
  isLoading: false,
  setSelectedContract: (id) => {
    set({ selectedContractId: id, isLoading: true });
    setTimeout(() => set({ isLoading: false }), 200);
  },
  setLoading: (loading) => set({ isLoading: loading }),
  reset: () =>
    set({
      contracts: mockContracts,
      selectedContractId: mockContracts[0]?.id ?? null,
      isLoading: false,
    }),
}));
