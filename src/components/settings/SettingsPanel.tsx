import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'

export function SettingsPanel() {
  const isOpen = useUIStore((s) => s.isSettingsPanelOpen)
  const close = useUIStore((s) => s.closeSettingsPanel)
  const theme = useUIStore((s) => s.theme)
  const toggleTheme = useUIStore((s) => s.toggleTheme)
  const showcaseShowPhotos = useUIStore((s) => s.showcaseShowPhotos)
  const toggleShowcasePhotos = useUIStore((s) => s.toggleShowcasePhotos)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
          />

          <motion.div
            key="settings-panel"
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 100,
              width: '100%',
              maxWidth: 360,
              padding: '0 16px',
            }}
          >
            <div
              style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: '24px 22px 20px',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              {/* Title row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)' }}>
                  SETTINGS
                </div>
                <button
                  onClick={close}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 99,
                    width: 26,
                    height: 26,
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                  }}
                >
                  ×
                </button>
              </div>

              {/* Toggle list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

                <SettingRow
                  label="Dark mode"
                  description="Switch between dark and light themes"
                  icon={theme === 'dark'
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  }
                  active={theme === 'dark'}
                  onToggle={toggleTheme}
                />

                <SettingRow
                  label="Showcase photos"
                  description="Show cover photos on spot orbs in Showcase mode"
                  icon={
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="3" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M3 17l4-4 3 3 4-5 4 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                    </svg>
                  }
                  active={showcaseShowPhotos}
                  onToggle={toggleShowcasePhotos}
                />

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function SettingRow({
  label,
  description,
  icon,
  active,
  onToggle,
}: {
  label: string
  description: string
  icon: React.ReactNode
  active: boolean
  onToggle: () => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 10px',
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'background var(--transition)',
      }}
      onClick={onToggle}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-soft)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      <div style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>{icon}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.86rem', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>{description}</div>
      </div>

      <Toggle active={active} />
    </div>
  )
}

function Toggle({ active }: { active: boolean }) {
  return (
    <div
      style={{
        width: 36,
        height: 20,
        borderRadius: 99,
        background: active ? 'var(--accent)' : 'var(--border)',
        position: 'relative',
        flexShrink: 0,
        transition: 'background 0.2s',
      }}
    >
      <motion.div
        animate={{ x: active ? 18 : 2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        style={{
          position: 'absolute',
          top: 2,
          width: 16,
          height: 16,
          borderRadius: 99,
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        }}
      />
    </div>
  )
}
