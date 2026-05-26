import { useState, type DragEvent, type ChangeEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMedia } from '@/hooks/useMedia'

interface DropZoneProps {
  locationId?: string
  routeId?: string
  tripId: string
  spotId?: string
  onUploaded?: () => void
  compact?: boolean
}

export function DropZone({ locationId, routeId, tripId, spotId, onUploaded, compact }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { uploadFiles, uploadRouteFiles } = useMedia()

  const handleFiles = async (files: File[]) => {
    if (!files.length) return
    setIsUploading(true)
    try {
      if (routeId && !spotId) {
        await uploadRouteFiles(files, routeId, tripId)
      } else {
        await uploadFiles(files, locationId, tripId, spotId)
      }
      onUploaded?.()
    } finally {
      setIsUploading(false)
    }
  }

  const onDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = () => setIsDragging(false)

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    handleFiles(files)
    e.target.value = ''
  }

  return (
    <label
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        display: 'block',
        padding: compact ? '10px 14px' : '20px',
        border: `1.5px dashed ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-card)',
        background: isDragging ? 'var(--accent-soft)' : 'transparent',
        cursor: 'pointer',
        transition: 'all var(--transition)',
        textAlign: 'center',
      }}
    >
      <input
        type="file"
        multiple
        accept="image/*,video/*,audio/*"
        onChange={onInputChange}
        style={{ display: 'none' }}
      />

      <AnimatePresence mode="wait">
        {isUploading ? (
          <motion.div
            key="uploading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 500 }}
          >
            Uploading…
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div style={{ fontSize: '1.4rem', marginBottom: 6, opacity: 0.5 }}>+</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Drop photos here or <span style={{ color: 'var(--accent)' }}>browse</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </label>
  )
}
