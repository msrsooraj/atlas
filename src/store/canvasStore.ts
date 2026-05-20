import { create } from 'zustand'

interface CanvasState {
  selectedLocationId: string | null
  targetSpotId: string | null
  isPanelOpen: boolean
  setSelectedLocation: (id: string | null) => void
  openPanel: (locationId: string) => void
  openPanelAtSpot: (locationId: string, spotId: string) => void
  clearTargetSpot: () => void
  closePanel: () => void
}

export const useCanvasStore = create<CanvasState>()((set) => ({
  selectedLocationId: null,
  targetSpotId: null,
  isPanelOpen: false,
  setSelectedLocation: (id) => set({ selectedLocationId: id }),
  openPanel: (locationId) => set({ selectedLocationId: locationId, isPanelOpen: true, targetSpotId: null }),
  openPanelAtSpot: (locationId, spotId) => set({ selectedLocationId: locationId, isPanelOpen: true, targetSpotId: spotId }),
  clearTargetSpot: () => set({ targetSpotId: null }),
  closePanel: () => set({ isPanelOpen: false, selectedLocationId: null, targetSpotId: null }),
}))
