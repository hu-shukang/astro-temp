import { create } from "zustand";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface UiState {
  isMobileMenuOpen: boolean;
  activeDropdown: string | null;
  toasts: Toast[];
  toggleMobileMenu: () => void;
  setActiveDropdown: (key: string | null) => void;
  addToast: (message: string, type: "success" | "error" | "info") => void;
  removeToast: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isMobileMenuOpen: false,
  activeDropdown: null,
  toasts: [],
  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  setActiveDropdown: (key) => set({ activeDropdown: key }),
  addToast: (message, type) =>
    set((state) => {
      const id = `toast-${Date.now()}`;
      const toast: Toast = { id, message, type };
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, 3000);
      return { toasts: [...state.toasts, toast] };
    }),
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export type { Toast };
