import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { LocationListEditor, type LocationItem } from '@/components/creation/LocationListEditor'
import { useTrip } from '@/hooks/useTrip'

interface Props {
  tripId: string
}

export function AddLocationButton({ tripId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [items, setItems] = useState<LocationItem[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const { saveLocationChanges } = useTrip()

  const existingLocations = useLiveQuery(
    () => db.locations.where('tripId').equals(tripId).sortBy('order'),
    [tripId]
  )

  const open = () => {
    const initial: LocationItem[] = (existingLocations ?? []).map((loc) => ({
      id: loc.id,
      name: loc.name,
      isExisting: true,
    }))
    setItems(initial)
    setIsOpen(true)
  }

  const close = () => setIsOpen(false)

  const save = async () => {
    if (isSaving) return
    setIsSaving(true)
    try {
      await saveLocationChanges(tripId, items)
      close()
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges = (() => {
    if (!existingLocations) return false
    const existing = existingLocations.map((l) => l.name)
    const current = items.filter((it) => it.name.trim())
    if (current.length !== existing.length) return true
    return current.some((it, i) => it.name.trim() !== existing[i] || !it.isExisting)
  })()

  return (
    <>
      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        onClick={open}
        title="Manage locations"
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          zIndex: 10,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'var(--accent)',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-md)',
          pointerEvents: 'all',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              style={{
                position: 'fixed', inset: 0, zIndex: 200,
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
              }}
            />

            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.93, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 201,
                width: '100%',
                maxWidth: 500,
                padding: 16,
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  borderRadius: 22,
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  boxShadow: 'var(--shadow-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  maxHeight: '100%',
                }}
              >
                {/* Header */}
                <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 4 }}>
                      MANAGE LOCATIONS
                    </div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                      Reorder or add stops
                    </h2>
                  </div>
                  <button
                    onClick={close}
                    style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 99, width: 32, height: 32, cursor: 'pointer',
                      color: 'var(--text-secondary)', fontSize: '0.9rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    ×
                  </button>
                </div>

                {/* Scrollable list */}
                <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                    Drag ⠿ to reorder. "saved" locations already exist on the canvas.
                  </p>
                  <LocationListEditor items={items} onChange={setItems} />
                </div>

                {/* Footer */}
                <div
                  style={{
                    padding: '16px 24px',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    gap: 10,
                    justifyContent: 'flex-end',
                    flexShrink: 0,
                  }}
                >
                  <button
                    onClick={close}
                    style={{
                      padding: '8px 18px', background: 'none', border: '1px solid var(--border)',
                      borderRadius: 99, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.84rem',
                    }}
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={save}
                    disabled={!hasChanges || isSaving}
                    style={{
                      padding: '8px 22px', background: 'var(--accent)', border: 'none', borderRadius: 99,
                      color: '#fff', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600,
                      opacity: !hasChanges || isSaving ? 0.4 : 1,
                      transition: 'opacity var(--transition)',
                    }}
                  >
                    {isSaving ? 'Saving…' : 'Save changes'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
