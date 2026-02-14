import { create } from "zustand";

export interface DomainData {
  id: string;
  name: string;
  status: string;
  expiresAt: string | null;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  plan: string | null;
  stripeCustomerId: string | null;
  domains: DomainData[];
}

interface UserStore {
  user: UserData | null;
  loading: boolean;
  fetched: boolean;
  fetchUser: () => Promise<void>;
  setUser: (user: UserData) => void;
  clear: () => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  loading: false,
  fetched: false,

  fetchUser: async () => {
    if (get().loading) return;
    set({ loading: true });

    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        set({ user: null, loading: false, fetched: true });
        return;
      }
      const data = await res.json();
      set({ user: data.user, loading: false, fetched: true });
    } catch {
      set({ user: null, loading: false, fetched: true });
    }
  },

  setUser: (user) => set({ user, fetched: true }),

  clear: () => set({ user: null, loading: false, fetched: false }),
}));
