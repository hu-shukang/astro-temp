import { create } from "zustand";
import type { User } from "../types";
import { useContractStore } from "./contractStore";
import { mockUser } from "./mockData";
import { useNotificationStore } from "./notificationStore";
import { usePointStore } from "./pointStore";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: mockUser,
  isAuthenticated: true,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => {
    set({ user: null, isAuthenticated: false });
    useContractStore.getState().reset();
    useNotificationStore.getState().reset();
    usePointStore.getState().reset();
  },
}));
