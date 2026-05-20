import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { useUIStore } from '@/store/uiStore'
import { useTripStore } from '@/store/tripStore'
import type { Memory, Spot, TripLocation } from '@/types/trip'
import { StarRating } from '@/components/ui/StarRating'

function formatDate(ts: number | undefined): string {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateRange(from: number | undefined, to: number | undefined): string {
  if (!from && !to) return ''
  if (from && !to) return formatDate(from)
  if (!from && to) return `Until ${formatDate(to)}`
  return `${formatDate(from)} – ${formatDate(to)}`
}

// Lazy blob image — loads from IndexedDB when visible
function LazyPhoto({
  memory,
  onClick,
}: {
  memory: Memory
  onClick: () => void
}) {
  const [url, setUrl] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!memory.thumbnailKey && !memory.blobKey) return
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      async ([entry]) => {
        if (entry.isIntersecting) {
          obs.disconnect()
          const key = memory.thumbnailKey || memory.blobKey
          if (!key) return
          const blob = await db.mediaBlobs.get(key)
          if (blob) setUrl(URL.createObjectURL(blob.blob))
        }
      },
      { threshold: 0.05, rootMargin: '200px' }
    )
    obs.observe(el)
    return () => {
      obs.disconnect()
      if (url) URL.revokeObjectURL(url)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memory.thumbnailKey, memory.blobKey])

  return (
    <div
      ref={ref}
      onClick={onClick}
      style={{
        aspectRatio: '1',
        borderRadius: 8,
        overflow: 'hidden',
        background: 'var(--surface)',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      {url ? (
        <motion.img
          src={url}
          alt={memory.caption ?? ''}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{ width: '100%', height: '100%', background: 'var(--accent-soft)' }} />
      )}
      {memory.caption && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '4px 6px',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
            fontSize: '0.65rem',
            color: '#fff',
            lineHeight: 1.3,
          }}
        >
          {memory.caption}
        </div>
      )}
    </div>
  )
}

// Full-screen lightbox
function Lightbox({
  memories,
  initialIndex,
  onClose,
}: {
  memories: Memory[]
  initialIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(initialIndex)
  const [url, setUrl] = useState<string | null>(null)
  const memory = memories[index]

  useEffect(() => {
    if (!memory) return
    setUrl(null)
    const key = memory.blobKey || memory.thumbnailKey
    if (!key) return
    let revokeUrl: string | null = null
    db.mediaBlobs.get(key).then((blob) => {
      if (blob) {
        revokeUrl = URL.createObjectURL(blob.blob)
        setUrl(revokeUrl)
      }
    })
    return () => {
      if (revokeUrl) URL.revokeObjectURL(revokeUrl)
    }
  }, [memory])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, memories.length - 1))
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0))
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [memories.length, onClose])

  if (!memory) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
        <AnimatePresence mode="wait">
          {url && (
            <motion.img
              key={index}
              src={url}
              alt={memory.caption ?? ''}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 12, display: 'block', objectFit: 'contain' }}
            />
          )}
        </AnimatePresence>

        {memory.caption && (
          <div style={{ textAlign: 'center', marginTop: 12, fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
            {memory.caption}
          </div>
        )}

        <div style={{ position: 'absolute', top: '50%', left: -44, transform: 'translateY(-50%)' }}>
          <button
            onClick={() => setIndex((i) => Math.max(i - 1, 0))}
            disabled={index === 0}
            style={navBtnStyle}
          >
            ‹
          </button>
        </div>
        <div style={{ position: 'absolute', top: '50%', right: -44, transform: 'translateY(-50%)' }}>
          <button
            onClick={() => setIndex((i) => Math.min(i + 1, memories.length - 1))}
            disabled={index === memories.length - 1}
            style={navBtnStyle}
          >
            ›
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 8, fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
          {index + 1} / {memories.length}
        </div>
      </div>

      <button
        onClick={onClose}
        style={{
          position: 'fixed', top: 20, right: 20,
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 99, width: 36, height: 36, cursor: 'pointer',
          color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        ×
      </button>
    </motion.div>
  )
}

function PhotoGrid({
  memories,
  onPhotoClick,
}: {
  memories: Memory[]
  onPhotoClick: (index: number, memories: Memory[]) => void
}) {
  const photos = memories.filter((m) => m.type === 'photo')
  if (photos.length === 0) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 6 }}>
      {photos.map((m, i) => (
        <LazyPhoto key={m.id} memory={m} onClick={() => onPhotoClick(i, photos)} />
      ))}
    </div>
  )
}

function SpotSection({
  spot,
  onPhotoClick,
}: {
  spot: Spot
  onPhotoClick: (index: number, memories: Memory[]) => void
}) {
  const memories = useLiveQuery(
    () => db.memories.where('spotId').equals(spot.id).filter((m) => m.type === 'photo').sortBy('createdAt'),
    [spot.id]
  )

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent)', flexShrink: 0,
          }}
        />
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{spot.name}</span>

        {spot.rating && <StarRating value={spot.rating} readonly size={12} />}

        {(spot.dateFrom || spot.dateTo) && (
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {formatDateRange(spot.dateFrom, spot.dateTo)}
          </span>
        )}
      </div>

      {spot.caption && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.55, fontStyle: 'italic' }}>
          {spot.caption}
        </p>
      )}

      {spot.review && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.55 }}>
          {spot.review}
        </p>
      )}

      {memories && memories.length > 0 ? (
        <PhotoGrid memories={memories} onPhotoClick={onPhotoClick} />
      ) : (
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No photos yet</p>
      )}
    </div>
  )
}

function LocationSection({
  location,
  onPhotoClick,
}: {
  location: TripLocation
  onPhotoClick: (index: number, memories: Memory[]) => void
}) {
  const spots = useLiveQuery(
    () => db.spots.where('locationId').equals(location.id).sortBy('order'),
    [location.id]
  )

  const ungrouped = useLiveQuery(
    () => db.memories
      .where('locationId').equals(location.id)
      .filter((m) => !m.spotId && m.type === 'photo')
      .sortBy('createdAt'),
    [location.id]
  )

  const dateRange = formatDateRange(location.dateFrom, location.dateTo)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      style={{
        borderRadius: 16,
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        overflow: 'hidden',
        marginBottom: 24,
      }}
    >
      {/* Location header */}
      <div
        style={{
          padding: '20px 24px 18px',
          background: 'var(--surface-raised)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div
            style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'var(--accent-soft)', border: '1px solid var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                fill="var(--accent)"
              />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
              {location.name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {location.rating && <StarRating value={location.rating} readonly size={13} />}
              {dateRange && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{dateRange}</span>
              )}
            </div>
            {location.caption && (
              <p style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55, fontStyle: 'italic' }}>
                {location.caption}
              </p>
            )}
            {location.review && (
              <p style={{ marginTop: 6, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {location.review}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Photos + spots */}
      <div style={{ padding: '16px 24px 20px' }}>
        {ungrouped && ungrouped.length > 0 && (
          <div style={{ marginBottom: spots && spots.length > 0 ? 20 : 0 }}>
            <PhotoGrid memories={ungrouped} onPhotoClick={onPhotoClick} />
          </div>
        )}

        {spots && spots.map((spot) => (
          <SpotSection key={spot.id} spot={spot} onPhotoClick={onPhotoClick} />
        ))}

        {(!ungrouped || ungrouped.length === 0) && (!spots || spots.length === 0) && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
            No photos yet — open this location in Scrapbook mode to add memories.
          </p>
        )}
      </div>
    </motion.div>
  )
}

export function AlbumView() {
  const activeTripId = useTripStore((s) => s.activeTripId)
  const setAppMode = useUIStore((s) => s.setAppMode)
  const [lightbox, setLightbox] = useState<{ memories: Memory[]; index: number } | null>(null)

  const trip = useLiveQuery(
    () => activeTripId ? db.trips.get(activeTripId) : undefined,
    [activeTripId]
  )

  const locations = useLiveQuery(
    () => activeTripId
      ? db.locations.where('tripId').equals(activeTripId).sortBy('order')
      : [],
    [activeTripId]
  )

  const openLightbox = (index: number, memories: Memory[]) => {
    setLightbox({ memories, index })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'var(--canvas-bg)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--surface-raised)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '18px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexShrink: 0,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--accent)', marginBottom: 3 }}>
            PHOTO REEL
          </div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {trip?.name ?? '…'}
          </h1>
        </div>

        <button
          onClick={() => setAppMode('scrapbook')}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 99,
            padding: '8px 16px',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to canvas
        </button>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, width: '100%', margin: '0 auto', padding: '32px 24px 80px' }}>
        {locations && locations.length > 0 ? (
          locations.map((loc) => (
            <LocationSection key={loc.id} location={loc} onPhotoClick={openLightbox} />
          ))
        ) : (
          <div style={{ textAlign: 'center', paddingTop: 80, color: 'var(--text-muted)' }}>
            No locations yet.
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <Lightbox
            memories={lightbox.memories}
            initialIndex={lightbox.index}
            onClose={() => setLightbox(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const navBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 99,
  width: 36,
  height: 36,
  cursor: 'pointer',
  color: '#fff',
  fontSize: '1.4rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 1,
}
