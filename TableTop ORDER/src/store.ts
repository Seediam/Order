import { create } from "zustand";
import type { User, ViewState } from "../shared/types";
interface Store {
  user: User | null;
  campaign: ViewState | null;
  connected: boolean;
  toasts: { id: number; text: string; error: boolean }[];
  setUser: (user: User | null) => void;
  setCampaign: (campaign: ViewState | null) => void;
  setConnected: (v: boolean) => void;
  notify: (text: string, error?: boolean) => void;
}
export const useStore = create<Store>((set) => ({
  user: null,
  campaign: null,
  connected: false,
  toasts: [],
  setUser: (user) => set({ user }),
  setCampaign: (campaign) => set({ campaign }),
  setConnected: (connected) => set({ connected }),
  notify: (text, error = false) => {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts, { id, text, error }] }));
    setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      5000,
    );
  },
}));
