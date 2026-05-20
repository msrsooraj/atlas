import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TripState {
  activeTripId: string | null
  setActiveTripId: (id: string | null) => void
}

export const useTripStore = create<TripState>()(
  persist(
    (set) => ({
      activeTripId: null,
      setActiveTripId: (id) => set({ activeTripId: id }),
    }),
    { name: 'atlas-active-trip' }
  )
)
