import { useState, type KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface LocationInputProps {
  locations: string[]
  onChange: (locations: string[]) => void
}

export function LocationInput({ locations, onChange }: LocationInputProps) {
  const [inputValue, setInputValue] = useState('')

  const addLocation = () => {
    const trimmed = inputValue.trim()
    if (trimmed && !locations.includes(trimmed)) {
      onChange([...locations, trimmed])
      setInputValue('')
    }
  }

  const removeLocation = (index: number) => {
    onChange(locations.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addLocation()
    } else if (e.key === 'Backspace' && inputValue === '' && locations.length > 0) {
      removeLocation(locations.length - 1)
    }
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          padding: '12px 14px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          minHeight: 56,
          cursor: 'text',
        }}
        onClick={(e) => {
          const input = (e.currentTarget as HTMLElement).querySelector('input')
          input?.focus()
        }}
      >
        <AnimatePresence>
          {locations.map((loc, i) => (
            <motion.div
              key={loc}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px 4px 10px',
                background: 'var(--accent-soft)',
                border: '1px solid var(--accent)',
                borderRadius: 99,
                fontSize: '0.82rem',
                color: 'var(--accent)',
                fontWeight: 500,
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  color: 'var(--canvas-bg)',
                  fontSize: '0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              {loc}
              <button
                onClick={(e) => { e.stopPropagation(); removeLocation(i) }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--accent)',
                  padding: 0,
                  lineHeight: 1,
                  opacity: 0.7,
                  marginLeft: 2,
                }}
              >
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={locations.length === 0 ? 'Add locations… (Enter to add each)' : 'Add another…'}
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            minWidth: 180,
            flex: 1,
            padding: '2px 4px',
          }}
        />
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
        Press Enter or comma to add. Backspace removes the last one.
      </p>
    </div>
  )
}
