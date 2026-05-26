import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme =
  | 'dark'
  | 'light'
  | 'glass-atlas'
  | 'dark-expedition'
  | 'museum'
  | 'memory-film'
  | 'neo-terrain'
  | 'atlas-os'

export const THEMES: { id: Theme; name: string; dark: boolean; swatchBg: string; swatchAccent: string }[] = [
  { id: 'dark',           name: 'Classic Dark',    dark: true,  swatchBg: '#0a0a0f', swatchAccent: '#f59e0b' },
  { id: 'light',          name: 'Classic Light',   dark: false, swatchBg: '#f5f0e8', swatchAccent: '#c1440e' },
  { id: 'glass-atlas',    name: 'Glass Atlas',     dark: true,  swatchBg: '#030508', swatchAccent: '#6BA3FF' },
  { id: 'dark-expedition',name: 'Dark Expedition', dark: true,  swatchBg: '#0A0B0C', swatchAccent: '#E8621A' },
  { id: 'museum',         name: 'Museum',          dark: false, swatchBg: '#F8F6F1', swatchAccent: '#1A3066' },
  { id: 'memory-film',    name: 'Memory Film',     dark: true,  swatchBg: '#1A1510', swatchAccent: '#F07030' },
  { id: 'neo-terrain',    name: 'Neo Terrain',     dark: false, swatchBg: '#FAFAFA', swatchAccent: '#0A0A08' },
  { id: 'atlas-os',       name: 'Atlas OS',        dark: true,  swatchBg: '#111213', swatchAccent: '#4D9EFF' },
]

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
        const current = get().theme
        const next = (current === 'dark' || THEMES.find(t => t.id === current)?.dark) ? 'light' : 'dark'
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
