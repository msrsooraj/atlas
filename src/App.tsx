import { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ReactFlowProvider } from '@xyflow/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { useTripStore } from '@/store/tripStore'
import { useUIStore } from '@/store/uiStore'
import { TripCanvas } from '@/components/canvas/TripCanvas'
import { NodeDetailPanel } from '@/components/panels/NodeDetailPanel'
import { RoutePanel } from '@/components/panels/RoutePanel'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { TripCreationModal } from '@/components/creation/TripCreationModal'
import { AlbumView } from '@/components/views/AlbumView'
import { LandingPage } from '@/pages/LandingPage'
import { GuidePage } from '@/pages/GuidePage'
import { PrivacyPage } from '@/pages/PrivacyPage'

function AppCanvas() {
  const activeTripId = useTripStore((s) => s.activeTripId)
  const setActiveTripId = useTripStore((s) => s.setActiveTripId)
  const appMode = useUIStore((s) => s.appMode)
  const openCreationModal = useUIStore((s) => s.openCreationModal)

  const trips = useLiveQuery(() => db.trips.orderBy('createdAt').toArray(), [])
  const activeTrip = useLiveQuery(
    () => (activeTripId ? db.trips.get(activeTripId) : undefined),
    [activeTripId]
  )

  useEffect(() => {
    if (trips && trips.length > 0 && !activeTripId) {
      const last = trips[trips.length - 1]
      if (last) setActiveTripId(last.id)
    }
  }, [trips, activeTripId, setActiveTripId])

  const showCanvas = activeTripId && activeTrip

  return (
    <>
      <AnimatePresence mode="wait">
        {showCanvas ? (
          <motion.div
            key={activeTripId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%', height: '100%' }}
          >
            <ReactFlowProvider>
              <TripCanvas tripId={activeTripId} tripName={activeTrip.name} />
            </ReactFlowProvider>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 20,
              backgroundImage: 'radial-gradient(circle, var(--canvas-dot) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.14em', color: 'var(--accent)', marginBottom: 16 }}>
                ATLAS
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                No journeys yet
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 28 }}>
                Create your first journey to get started.
              </p>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={openCreationModal}
                style={{
                  padding: '12px 32px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: 99,
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                New journey
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(appMode === 'scrapbook' || appMode === 'showcase') && <NodeDetailPanel />}
      {appMode === 'scrapbook' && <RoutePanel />}
      <SettingsPanel />
      <TripCreationModal />

      <AnimatePresence>
        {appMode === 'album' && activeTripId && <AlbumView />}
      </AnimatePresence>
    </>
  )
}

export function App() {
  const theme = useUIStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Sync on first mount (persisted store may differ from html default attr)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<AppCanvas />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </HashRouter>
  )
}
