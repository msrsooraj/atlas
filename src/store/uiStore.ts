import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light'
export type AppMode = 'scrapbook' | 'showcase' | 'album'

interface UIState {
  theme: Theme
  appMode: AppMode
  showcaseShowPhotos: boolean
  isCreationModalOpen: boolean
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  setAppMode: (mode: AppMode) => void
  toggleShowcasePhotos: () => void
  openCreationModal: () => void
  closeCreationModal: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      appMode: 'scrapbook',
      showcaseShowPhotos: true,
      isCreationModalOpen: false,
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
    }),
    {
      name: 'atlas-ui',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
)
