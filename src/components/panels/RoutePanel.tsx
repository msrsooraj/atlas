import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { useCanvasStore } from '@/store/canvasStore'
import { useMedia } from '@/hooks/useMedia'
import type { TransportMode } from '@/types/trip'
import { TRANSPORT_ICONS } from '@/components/canvas/ConnectionEdge'

const TRANSPORT_OPTIONS: { mode: TransportMode; label: string }[] = [
  { mode: 'flight',  label: 'Flight'  },
  { mode: 'bus',     label: 'Bus'     },
  { mode: 'car',     label: 'Drive'   },
  { mode: 'train',   label: 'Train'   },
  { mode: 'boat',    label: 'Boat'    },
  { mode: 'cruise',  label: 'Cruise'  },
  { mode: 'walk',    label: 'Walk'    },
  { mode: 'other',   label: 'Other'   },
]

export function RoutePanel() {
  const { selectedRouteId, isRoutePanelOpen, closeRoutePanel } = useCanvasStore()
  const { uploadRouteFiles, deleteMemory } = useMedia()
  const dropRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [captionValue, setCaptionValue] = useState('')

  const route = useLiveQuery(
    () => (selectedRouteId ? db.routes.get(selectedRouteId) : undefined),
    [selectedRouteId]
  )

  const fromLocation = useLiveQuery(
    () => (route?.fromLocationId ? db.locations.get(route.fromLocationId) : undefined),
    [route?.fromLocationId]
  )

  const toLocation = useLiveQuery(
    () => (route?.toLocationId ? db.locations.get(route.toLocationId) : undefined),
    [route?.toLocationId]
  )

  const photos = useLiveQuery(
    () =>
      selectedRouteId
        ? db.memories.where('routeId').equals(selectedRouteId).filter((m) => m.type === 'photo').toArray()
        : [],
    [selectedRouteId]
  ) ?? []

  useEffect(() => {
    if (route) setCaptionValue(route.caption ?? '')
  }, [route?.id])

  const setTransport = useCallback(
    async (mode: TransportMode) => {
      if (!selectedRouteId) return
      const next = route?.transport === mode ? undefined : mode
      await db.routes.update(selectedRouteId, { transport: next })
    },
    [selectedRouteId, route?.transport]
  )

  const saveCaption = useCallback(async () => {
    if (!selectedRouteId) return
    await db.routes.update(selectedRouteId, { caption: captionValue || undefined })
  }, [selectedRouteId, captionValue])

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || !selectedRouteId || !route?.tripId) return
      await uploadRouteFiles(Array.from(files), selectedRouteId, route.tripId)
    },
    [selectedRouteId, route?.tripId, uploadRouteFiles]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  if (!isRoutePanelOpen) return null

  return (
    <AnimatePresence>
      {isRoutePanelOpen && (
        <>
          <motion.div
            key="route-panel-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeRoutePanel}
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          />

          <motion.div
            key="route-panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 400,
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--surface-raised)',
              borderLeft: '1px solid var(--border)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '20px 20px 16px',
                borderBottom: '1px solid var(--border)',
                flexShrink: 0,
              }}
            >
              <button
                onClick={closeRoutePanel}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 99,
                  width: 28,
                  height: 28,
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                }}
              >
                ×
              </button>

              <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 8 }}>
                JOURNEY
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 36 }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {fromLocation?.name ?? '…'}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'right' }}>
                  {toLocation?.name ?? '…'}
                </span>
              </div>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 40px' }}>

              {/* Transport mode */}
              <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10 }}>
                HOW DID YOU GET THERE?
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 20 }}>
                {TRANSPORT_OPTIONS.map(({ mode, label }) => {
                  const active = route?.transport === mode
                  return (
                    <motion.button
                      key={mode}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => setTransport(mode)}
                      style={{
                        background: active ? 'var(--accent-soft)' : 'var(--surface)',
                        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 10,
                        padding: '8px 4px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        transition: 'border-color var(--transition), background var(--transition)',
                      }}
                    >
                      <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{TRANSPORT_ICONS[mode]}</span>
                      <span style={{ fontSize: '0.6rem', color: active ? 'var(--accent)' : 'var(--text-muted)', fontWeight: active ? 600 : 400 }}>
                        {label}
                      </span>
                    </motion.button>
                  )
                })}
              </div>

              {/* Caption / notes */}
              <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>
                JOURNEY NOTES
              </div>
              <textarea
                value={captionValue}
                onChange={(e) => setCaptionValue(e.target.value)}
                onBlur={saveCaption}
                placeholder="How was the journey? Any tips?"
                rows={3}
                style={{
                  width: '100%',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.84rem',
                  lineHeight: 1.6,
                  resize: 'vertical',
                  outline: 'none',
                  fontFamily: 'inherit',
                  marginBottom: 20,
                  boxSizing: 'border-box',
                }}
              />

              {/* Photo upload */}
              <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>
                TRANSIT PHOTOS
              </div>

              <div
                ref={dropRef}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `1px dashed ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 12,
                  padding: '18px 12px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: isDragging ? 'var(--accent-soft)' : 'transparent',
                  transition: 'border-color var(--transition), background var(--transition)',
                  marginBottom: 14,
                }}
              >
                <div style={{ fontSize: '1.2rem', marginBottom: 6 }}>📷</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Drop photos or <span style={{ color: 'var(--accent)' }}>click to browse</span>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => handleFiles(e.target.files)}
              />

              {/* Photo grid */}
              {photos.length > 0 && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 6,
                  }}
                >
                  {photos.map((photo) => (
                    <PhotoThumb key={photo.id} blobKey={photo.thumbnailKey ?? photo.blobKey ?? ''} onDelete={() => deleteMemory(photo.id)} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function PhotoThumb({ blobKey, onDelete }: { blobKey: string; onDelete: () => void }) {
  const [url, setUrl] = useState<string | null>(null)
  const urlRef = useRef<string | null>(null)
  const { getBlobURL } = useMedia()

  useEffect(() => {
    let active = true
    getBlobURL(blobKey).then((u) => {
      if (!active) { if (u) URL.revokeObjectURL(u); return }
      urlRef.current = u
      setUrl(u)
    })
    return () => {
      active = false
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [blobKey])

  return (
    <div style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', background: 'var(--accent-soft)' }}>
      {url && <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
      <button
        onClick={onDelete}
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          width: 20,
          height: 20,
          borderRadius: 99,
          background: 'rgba(0,0,0,0.55)',
          border: 'none',
          color: '#fff',
          fontSize: '0.7rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ×
      </button>
    </div>
  )
}
