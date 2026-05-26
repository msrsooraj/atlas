import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore, THEMES, type Theme } from '@/store/uiStore'

export function SettingsPanel() {
  const isOpen = useUIStore((s) => s.isSettingsPanelOpen)
  const close = useUIStore((s) => s.closeSettingsPanel)
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)
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
            style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(6px)' }}
          />

          <motion.div
            key="settings-panel"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 100,
              width: '100%',
              maxWidth: 440,
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
              {/* Header */}
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

              {/* Theme picker */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.10em', color: 'var(--text-muted)', marginBottom: 12 }}>
                  VISUAL THEME
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 8,
                  }}
                >
                  {THEMES.map((t) => (
                    <ThemeSwatch
                      key={t.id}
                      name={t.name}
                      bg={t.swatchBg}
                      accent={t.swatchAccent}
                      active={theme === t.id}
                      onClick={() => setTheme(t.id as Theme)}
                    />
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'var(--border)', marginBottom: 16 }} />

              {/* Toggle list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

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

function ThemeSwatch({
  name,
  bg,
  accent,
  active,
  onClick,
}: {
  name: string
  bg: string
  accent: string
  active: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      title={name}
      style={{
        background: 'none',
        border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 10,
        padding: 0,
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'border-color var(--transition)',
        position: 'relative',
      }}
    >
      {/* Color preview */}
      <div
        style={{
          height: 44,
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          position: 'relative',
        }}
      >
        {/* Mini node preview */}
        <div style={{
          width: 22,
          height: 14,
          borderRadius: 3,
          border: `1px solid ${accent}`,
          background: `${accent}22`,
        }} />
        <div style={{
          width: 14,
          height: 14,
          borderRadius: 3,
          border: `1px solid ${accent}`,
          background: `${accent}22`,
        }} />
        {/* Accent dot */}
        <div style={{
          position: 'absolute',
          bottom: 5,
          right: 6,
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: accent,
        }} />
        {/* Active checkmark */}
        {active && (
          <div style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
              <path d="M5 12l5 5L20 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>
      {/* Label */}
      <div style={{
        padding: '5px 4px 6px',
        fontSize: '0.60rem',
        fontWeight: active ? 700 : 500,
        color: active ? 'var(--accent)' : 'var(--text-muted)',
        letterSpacing: '0.03em',
        background: 'var(--surface)',
        lineHeight: 1.2,
        textAlign: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {name}
      </div>
    </motion.button>
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
