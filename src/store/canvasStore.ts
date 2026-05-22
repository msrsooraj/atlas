import { create } from 'zustand'

interface NodePos { x: number; y: number }
export type ArrangeMode = 'manual' | 'grid' | 'line'

interface CanvasState {
  selectedLocationId: string | null
  targetSpotId: string | null
  isPanelOpen: boolean
  selectedRouteId: string | null
  isRoutePanelOpen: boolean
  arrangeMode: ArrangeMode
  previousPositions: Record<string, NodePos> | null
  setSelectedLocation: (id: string | null) => void
  openPanel: (locationId: string) => void
  openPanelAtSpot: (locationId: string, spotId: string) => void
  clearTargetSpot: () => void
  closePanel: () => void
  openRoutePanel: (routeId: string) => void
  closeRoutePanel: () => void
  cycleArrangeMode: () => void
  storePreviousPositions: (pos: Record<string, NodePos>) => void
  clearPreviousPositions: () => void
}

const ARRANGE_CYCLE: ArrangeMode[] = ['manual', 'grid', 'line']

export const useCanvasStore = create<CanvasState>()((set) => ({
  selectedLocationId: null,
  targetSpotId: null,
  isPanelOpen: false,
  selectedRouteId: null,
  isRoutePanelOpen: false,
  arrangeMode: 'manual',
  previousPositions: null,
  setSelectedLocation: (id) => set({ selectedLocationId: id }),
  openPanel: (locationId) => set({ selectedLocationId: locationId, isPanelOpen: true, targetSpotId: null, isRoutePanelOpen: false, selectedRouteId: null }),
  openPanelAtSpot: (locationId, spotId) => set({ selectedLocationId: locationId, isPanelOpen: true, targetSpotId: spotId, isRoutePanelOpen: false, selectedRouteId: null }),
  clearTargetSpot: () => set({ targetSpotId: null }),
  closePanel: () => set({ isPanelOpen: false, selectedLocationId: null, targetSpotId: null }),
  openRoutePanel: (routeId) => set({ selectedRouteId: routeId, isRoutePanelOpen: true, isPanelOpen: false, selectedLocationId: null }),
  closeRoutePanel: () => set({ isRoutePanelOpen: false, selectedRouteId: null }),
  cycleArrangeMode: () => set((s) => ({
    arrangeMode: ARRANGE_CYCLE[(ARRANGE_CYCLE.indexOf(s.arrangeMode) + 1) % ARRANGE_CYCLE.length],
  })),
  storePreviousPositions: (pos) => set({ previousPositions: pos }),
  clearPreviousPositions: () => set({ previousPositions: null }),
}))
