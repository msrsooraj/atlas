import { useState } from 'react'
import { motion } from 'framer-motion'

interface StarRatingProps {
  value?: number
  onChange?: (rating: number) => void
  size?: number
  readonly?: boolean
}

export function StarRating({ value = 0, onChange, size = 16, readonly = false }: StarRatingProps) {
  const [hover, setHover] = useState(0)

  return (
    <div
      style={{ display: 'flex', gap: 2, alignItems: 'center' }}
      onMouseLeave={() => !readonly && setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (hover || value) >= star
        return (
          <motion.button
            key={star}
            type="button"
            whileTap={readonly ? undefined : { scale: 0.85 }}
            onMouseEnter={() => !readonly && setHover(star)}
            onClick={() => !readonly && onChange?.(star === value ? 0 : star)}
            style={{
              background: 'none',
              border: 'none',
              padding: 1,
              cursor: readonly ? 'default' : 'pointer',
              color: filled ? 'var(--accent)' : 'var(--border)',
              display: 'flex',
              transition: 'color 0.12s',
            }}
          >
            <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </motion.button>
        )
      })}
    </div>
  )
}
