import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ReactFlowProvider } from '@xyflow/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { useTripStore } from '@/store/tripStore'
import { useUIStore } from '@/store/uiStore'
import { TripCanvas } from '@/components/canvas/TripCanvas'
import { NodeDetailPanel } from '@/components/panels/NodeDetailPanel'
import { TripCreationModal } from '@/components/creation/TripCreationModal'
import { AlbumView } from '@/components/views/AlbumView'

function EmptyState() {
  const openCreationModal = useUIStore((s) => s.openCreationModal)
  const toggleTheme = useUIStore((s) => s.toggleTheme)
  const theme = useUIStore((s) => s.theme)

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
      }}
    >
      {/* Theme toggle top right */}
      <button
        onClick={toggleTheme}
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 99,
          padding: '8px 14px',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          fontSize: '0.78rem',
        }}
      >
        {theme === 'dark' ? 'Light' : 'Dark'}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ textAlign: 'center', maxWidth: 420, padding: '0 24px' }}
      >
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            letterSpacing: '0.16em',
            color: 'var(--accent)',
            marginBottom: 24,
          }}
        >
          ATLAS
        </div>

        <h1
          style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            marginBottom: 16,
          }}
        >
          Your journeys,
          <br />
          <span style={{ color: 'var(--accent)' }}>mapped</span> and remembered.
        </h1>

        <p
          style={{
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            marginBottom: 36,
          }}
        >
          An infinite canvas for spatial storytelling.
          <br />
          Local-first. No account needed.
        </p>

        <motion.button
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={openCreationModal}
          style={{
            padding: '14px 36px',
            background: 'var(--accent)',
            border: 'none',
            borderRadius: 99,
            color: '#fff',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 24px var(--accent-soft)',
          }}
        >
          Begin your first journey
        </motion.button>
      </motion.div>

      {/* Subtle decorative dots */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: `radial-gradient(circle, var(--canvas-dot) 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
          opacity: 0.5,
          zIndex: -1,
        }}
      />
    </div>
  )
}

export function App() {
  const activeTripId = useTripStore((s) => s.activeTripId)
  const setActiveTripId = useTripStore((s) => s.setActiveTripId)
  const theme = useUIStore((s) => s.theme)
  const appMode = useUIStore((s) => s.appMode)

  // Sync theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Load all trips
  const trips = useLiveQuery(() => db.trips.orderBy('createdAt').toArray(), [])
  const activeTrip = useLiveQuery(
    () => activeTripId ? db.trips.get(activeTripId) : undefined,
    [activeTripId]
  )

  // Auto-select most recent trip if none selected
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
            style={{ width: '100%', height: '100%' }}
          >
            <EmptyState />
          </motion.div>
        )}
      </AnimatePresence>

      {appMode === 'scrapbook' && <NodeDetailPanel />}
      <TripCreationModal />

      <AnimatePresence>
        {appMode === 'album' && activeTripId && <AlbumView />}
      </AnimatePresence>
    </>
  )
}
