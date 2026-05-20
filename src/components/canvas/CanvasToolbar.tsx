import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { useUIStore, type AppMode } from '@/store/uiStore'
import { useExport } from '@/hooks/useExport'
import { useTrip } from '@/hooks/useTrip'
import { useBackup } from '@/hooks/useBackup'
import { useTripStore } from '@/store/tripStore'
import { useIdleHide } from '@/hooks/useIdleHide'
import { db } from '@/db/db'

interface CanvasToolbarProps {
  tripName?: string
}

export function CanvasToolbar({ tripName }: CanvasToolbarProps) {
  const openCreationModal = useUIStore((s) => s.openCreationModal)
  const toggleTheme = useUIStore((s) => s.toggleTheme)
  const theme = useUIStore((s) => s.theme)
  const appMode = useUIStore((s) => s.appMode)
  const setAppMode = useUIStore((s) => s.setAppMode)
  const showcaseShowPhotos = useUIStore((s) => s.showcaseShowPhotos)
  const toggleShowcasePhotos = useUIStore((s) => s.toggleShowcasePhotos)
  const activeTripId = useTripStore((s) => s.activeTripId)
  const setActiveTripId = useTripStore((s) => s.setActiveTripId)
  const { exportSite, isExporting } = useExport()
  const { deleteTrip } = useTrip()
  const { exportBackup, importBackup, resolveConflict, pendingConflict, setPendingConflict, isExporting: isBackupExporting, isImporting } = useBackup()
  const isIdle = useIdleHide()
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  const showToast = (message: string, ok: boolean) => {
    setToast({ message, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const result = await importBackup(file)
    if (result.status === 'success') showToast(`"${result.tripName}" imported`, true)
    else if (result.status === 'error') showToast(result.message, false)
    // conflict handled by pendingConflict modal
  }

  const trips = useLiveQuery(
    () => db.trips.orderBy('createdAt').reverse().toArray(),
    []
  )

  return (
    <motion.div
      animate={{ opacity: isIdle ? 0.15 : 1 }}
      whileHover={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        pointerEvents: 'all',
      }}
    >
      {/* Trip switcher popover */}
      <AnimatePresence>
        {showSwitcher && trips && trips.length > 0 && (
          <motion.div
            key="switcher"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--surface-raised)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: 'var(--shadow-lg)',
              minWidth: 240,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '10px 14px 8px',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              YOUR JOURNEYS
            </div>

            {trips.map((trip) => (
              <div
                key={trip.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--border)',
                  background: trip.id === activeTripId ? 'var(--accent-soft)' : 'transparent',
                  transition: 'background var(--transition)',
                }}
              >
                <button
                  onClick={() => {
                    setActiveTripId(trip.id)
                    setShowSwitcher(false)
                  }}
                  style={{
                    flex: 1,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                    fontWeight: trip.id === activeTripId ? 600 : 400,
                    color: trip.id === activeTripId ? 'var(--accent)' : 'var(--text-primary)',
                    padding: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {trip.name}
                </button>

                {trips.length > 1 && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation()
                      if (confirm(`Delete "${trip.name}"? This cannot be undone.`)) {
                        await deleteTrip(trip.id)
                        setShowSwitcher(false)
                      }
                    }}
                    title="Delete journey"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      padding: '2px 4px',
                      borderRadius: 4,
                      flexShrink: 0,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={() => {
                setShowSwitcher(false)
                openCreationModal()
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.82rem',
                color: 'var(--accent)',
                fontWeight: 500,
              }}
            >
              + New journey
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--surface-raised)',
          border: '1px solid var(--border)',
          borderRadius: 99,
          padding: '8px 16px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <a
          href="/#/"
          title="Back to home"
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'var(--accent)',
            marginRight: 4,
            textDecoration: 'none',
          }}
        >
          ATLAS
        </a>

        {tripName && (
          <>
            <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
            <button
              onClick={() => setShowSwitcher((v) => !v)}
              title="Switch journey"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span
                style={{
                  fontSize: '0.82rem',
                  color: showSwitcher ? 'var(--accent)' : 'var(--text-secondary)',
                  maxWidth: 180,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  transition: 'color var(--transition)',
                }}
              >
                {tripName}
              </span>
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                style={{
                  color: 'var(--text-muted)',
                  transform: showSwitcher ? 'rotate(180deg)' : 'none',
                  transition: 'transform var(--transition)',
                  flexShrink: 0,
                }}
              >
                <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}

        <div style={{ width: 1, height: 16, background: 'var(--border)', marginLeft: 4 }} />

        {/* Mode toggle */}
        {(
          [
            { mode: 'scrapbook' as AppMode, title: 'Scrapbook (edit)', icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )},
            { mode: 'showcase' as AppMode, title: 'Showcase', icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
              </svg>
            )},
            { mode: 'album' as AppMode, title: 'Photo reel', icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
              </svg>
            )},
          ] as const
        ).map(({ mode, title, icon }) => (
          <motion.button
            key={mode}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setAppMode(mode)}
            title={title}
            style={{
              background: appMode === mode ? 'var(--accent-soft)' : 'none',
              border: appMode === mode ? '1px solid var(--accent)' : '1px solid transparent',
              cursor: 'pointer',
              color: appMode === mode ? 'var(--accent)' : 'var(--text-secondary)',
              padding: '4px',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color var(--transition), background var(--transition)',
            }}
          >
            {icon}
          </motion.button>
        ))}

        {/* Showcase-only: photo toggle */}
        {appMode === 'showcase' && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            onClick={toggleShowcasePhotos}
            title={showcaseShowPhotos ? 'Hide photos in orbs' : 'Show photos in orbs'}
            style={{
              background: showcaseShowPhotos ? 'var(--accent-soft)' : 'none',
              border: showcaseShowPhotos ? '1px solid var(--accent)' : '1px solid transparent',
              cursor: 'pointer',
              color: showcaseShowPhotos ? 'var(--accent)' : 'var(--text-secondary)',
              padding: '4px',
              borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'color var(--transition), background var(--transition)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M3 17l4-4 3 3 4-5 4 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
            </svg>
          </motion.button>
        )}

        <div style={{ width: 1, height: 16, background: 'var(--border)' }} />

        <ToolbarButton onClick={openCreationModal} title="New journey">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => exportSite().then(() => showToast('Site exported', true)).catch((e) => showToast(e?.message ?? 'Export failed', false))}
          title="Export site — all journeys as one HTML file"
          disabled={isExporting}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </ToolbarButton>

        {activeTripId && (
          <ToolbarButton
            onClick={() => exportBackup(activeTripId).then(() => showToast('Backup saved', true)).catch(() => showToast('Backup failed', false))}
            title="Save backup (.atlas)"
            disabled={isBackupExporting}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="7 3 7 8 15 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </ToolbarButton>
        )}

        {/* Hidden file input for import */}
        <input
          ref={importInputRef}
          type="file"
          accept=".atlas"
          style={{ display: 'none' }}
          onChange={handleImportFile}
        />
        <ToolbarButton
          onClick={() => importInputRef.current?.click()}
          title="Import backup (.atlas)"
          disabled={isImporting}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </ToolbarButton>

        <ToolbarButton onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
              <path
                d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </ToolbarButton>
      </div>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: toast.ok ? 'var(--accent)' : '#c0392b',
              color: '#fff',
              borderRadius: 99,
              padding: '6px 16px',
              fontSize: '0.78rem',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conflict modal */}
      <AnimatePresence>
        {pendingConflict && (
          <>
            <motion.div
              key="conflict-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
            />
            <motion.div
              key="conflict-dialog"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              style={{
                position: 'fixed', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                zIndex: 301, width: '100%', maxWidth: 380, padding: 16,
              }}
            >
              <div style={{
                background: 'var(--surface-raised)', border: '1px solid var(--border)',
                borderRadius: 20, padding: '28px 24px',
                backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                boxShadow: 'var(--shadow-lg)',
              }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 8 }}>
                  IMPORT CONFLICT
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
                  Journey already exists
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
                  <strong>"{pendingConflict.trip.name}"</strong> is already in your library.
                  Overwriting will permanently replace all its data with the backup.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => { setPendingConflict(null); showToast('Import cancelled', false) }}
                    style={{ padding: '8px 18px', background: 'none', border: '1px solid var(--border)', borderRadius: 99, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.84rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => resolveConflict(true).then((r) => {
                      if (r.status === 'success') showToast(`"${r.tripName}" restored`, true)
                      else showToast('Restore failed', false)
                    })}
                    style={{ padding: '8px 20px', background: '#c0392b', border: 'none', borderRadius: 99, color: '#fff', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600 }}
                  >
                    Overwrite
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ToolbarButton({
  onClick,
  title,
  children,
  disabled,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background: 'none',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: 'var(--text-secondary)',
        padding: '4px',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : 1,
        transition: 'color var(--transition)',
      }}
    >
      {children}
    </motion.button>
  )
}
