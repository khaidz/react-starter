import { create } from 'zustand'

interface LoadingStore {
  count: number
  show: () => void
  hide: () => void
}

export const useLoadingStore = create<LoadingStore>((set) => ({
  count: 0,
  show: () => set((s) => ({ count: s.count + 1 })),
  hide: () => set((s) => ({ count: Math.max(0, s.count - 1) })),
}))

/** Dùng ngoài React component (axios interceptor, utility fn...) */
export const globalLoading = {
  show: () => useLoadingStore.getState().show(),
  hide: () => useLoadingStore.getState().hide(),
}
