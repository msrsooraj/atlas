import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { nanoid } from 'nanoid'
import { LocationListEditor, type LocationItem } from './LocationListEditor'
import { useTrip } from '@/hooks/useTrip'
import { useUIStore } from '@/store/uiStore'

export function TripCreationModal() {
  const isOpen = useUIStore((s) => s.isCreationModalOpen)
  const closeCreationModal = useUIStore((s) => s.closeCreationModal)
  const { createTrip } = useTrip()

  const [step, setStep] = useState<1 | 2>(1)
  const [tripName, setTripName] = useState('')
  const [items, setItems] = useState<LocationItem[]>([{ id: nanoid(), name: '', isExisting: false }])
  const [isCreating, setIsCreating] = useState(false)

  const handleClose = () => {
    closeCreationModal()
    setTimeout(() => {
      setStep(1)
      setTripName('')
      setItems([{ id: nanoid(), name: '', isExisting: false }])
    }, 300)
  }

  const handleCreate = async () => {
    const names = items.map((it) => it.name.trim()).filter(Boolean)
    if (!tripName.trim() || names.length === 0) return
    setIsCreating(true)
    try {
      await createTrip(tripName.trim(), names)
      handleClose()
    } finally {
      setIsCreating(false)
    }
  }

  const canProceed = tripName.trim().length > 0
  const hasLocations = items.some((it) => it.name.trim().length > 0)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 100,
            }}
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 101,
              width: '100%',
              maxWidth: 540,
              padding: 16,
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: 24,
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
              <div style={{ padding: '28px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 5 }}>
                    NEW JOURNEY
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {step === 1 ? 'Name your journey' : 'Plan your route'}
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  style={{
                    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 99,
                    width: 34, height: 34, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  ×
                </button>
              </div>

              {/* Step indicators */}
              <div style={{ padding: '14px 28px 0', display: 'flex', gap: 6, flexShrink: 0 }}>
                {[1, 2].map((s) => (
                  <div
                    key={s}
                    style={{
                      height: 3, flex: 1, borderRadius: 99,
                      background: s <= step ? 'var(--accent)' : 'var(--border)',
                      transition: 'background var(--transition)',
                    }}
                  />
                ))}
              </div>

              {/* Scrollable content */}
              <div style={{ padding: '24px 28px 28px', overflowY: 'auto', flex: 1 }}>
                <AnimatePresence mode="wait">
                  {step === 1 ? (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.18 }}
                    >
                      <input
                        autoFocus
                        value={tripName}
                        onChange={(e) => setTripName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && canProceed && setStep(2)}
                        placeholder="e.g. Kenya Safari 2026"
                        style={{
                          width: '100%', padding: '14px 16px', fontSize: '1.05rem',
                          background: 'var(--surface)', border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-card)', color: 'var(--text-primary)', outline: 'none',
                          transition: 'border-color var(--transition)',
                        }}
                        onFocus={(e) => { e.target.style.borderColor = 'var(--accent)' }}
                        onBlur={(e) => { e.target.style.borderColor = 'var(--border)' }}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.18 }}
                    >
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                        Add locations in order. Drag ⠿ to reorder.
                      </p>
                      <LocationListEditor items={items} onChange={setItems} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                  {step === 2 && (
                    <button
                      onClick={() => setStep(1)}
                      style={{
                        padding: '9px 18px', background: 'none', border: '1px solid var(--border)',
                        borderRadius: 99, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.84rem',
                      }}
                    >
                      Back
                    </button>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={step === 1 ? () => setStep(2) : handleCreate}
                    disabled={step === 1 ? !canProceed : (!hasLocations || isCreating)}
                    style={{
                      padding: '9px 26px', background: 'var(--accent)', border: 'none', borderRadius: 99,
                      color: '#fff', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600,
                      opacity: (step === 1 ? !canProceed : (!hasLocations || isCreating)) ? 0.4 : 1,
                      transition: 'opacity var(--transition)',
                    }}
                  >
                    {step === 1 ? 'Continue' : isCreating ? 'Creating…' : 'Begin journey'}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
