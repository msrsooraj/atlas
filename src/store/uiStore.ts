import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light'
export type AppMode = 'scrapbook' | 'showcase' | 'album'
export type HeatmapMode = 'none' | 'rating' | 'time' | 'aggregate'

interface UIState {
  theme: Theme
  appMode: AppMode
  showcaseShowPhotos: boolean
  isCreationModalOpen: boolean
  isSettingsPanelOpen: boolean
  heatmapMode: HeatmapMode
  heatmapScales: Record<string, number>
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  setAppMode: (mode: AppMode) => void
  toggleShowcasePhotos: () => void
  openCreationModal: () => void
  closeCreationModal: () => void
  openSettingsPanel: () => void
  closeSettingsPanel: () => void
  setHeatmapMode: (mode: HeatmapMode) => void
  setHeatmapScales: (scales: Record<string, number>) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      appMode: 'scrapbook',
      showcaseShowPhotos: true,
      isCreationModalOpen: false,
      isSettingsPanelOpen: false,
      heatmapMode: 'rating',
      heatmapScales: {},
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: next })
        document.documentElement.setAttribute('data-theme', next)
      },
      setTheme: (theme) => {
        set({ theme })
        document.documentElement.setAttribute('data-theme', theme)
      },
      setAppMode: (mode) => set({ appMode: mode }),
      toggleShowcasePhotos: () => set((s) => ({ showcaseShowPhotos: !s.showcaseShowPhotos })),
      openCreationModal: () => set({ isCreationModalOpen: true }),
      closeCreationModal: () => set({ isCreationModalOpen: false }),
      openSettingsPanel: () => set({ isSettingsPanelOpen: true }),
      closeSettingsPanel: () => set({ isSettingsPanelOpen: false }),
      setHeatmapMode: (mode) => set({ heatmapMode: mode }),
      setHeatmapScales: (scales) => set({ heatmapScales: scales }),
    }),
    {
      name: 'atlas-ui',
      partialize: (state) => ({ theme: state.theme, heatmapMode: state.heatmapMode }),
    }
  )
)
