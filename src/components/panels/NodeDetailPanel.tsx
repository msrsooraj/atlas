import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { TripLocation } from '@/types/trip'
import { useCanvasStore } from '@/store/canvasStore'
import { useSpot } from '@/hooks/useSpot'
import { SpotCard } from './SpotCard'
import { MediaGallery } from './MediaGallery'
import { StarRating } from '@/components/ui/StarRating'

export function NodeDetailPanel() {
  const { isPanelOpen, selectedLocationId, targetSpotId, clearTargetSpot, closePanel } = useCanvasStore()
  const panelBodyRef = useRef<HTMLDivElement>(null)

  const location = useLiveQuery(
    () => selectedLocationId ? db.locations.get(selectedLocationId) : undefined,
    [selectedLocationId]
  )

  const spots = useLiveQuery(
    () => selectedLocationId
      ? db.spots.where('locationId').equals(selectedLocationId).sortBy('order')
      : [],
    [selectedLocationId]
  )

  // Scroll to target spot after panel opens and spots are loaded
  useEffect(() => {
    if (!targetSpotId || !spots || spots.length === 0) return
    const frame = requestAnimationFrame(() => {
      const el = document.getElementById(`spot-${targetSpotId}`)
      if (el && panelBodyRef.current) {
        const panelTop = panelBodyRef.current.getBoundingClientRect().top
        const elTop = el.getBoundingClientRect().top
        panelBodyRef.current.scrollTop += (elTop - panelTop) - 12
        clearTargetSpot()
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [targetSpotId, spots, clearTargetSpot])

  return (
    <AnimatePresence>
      {isPanelOpen && location && (
        <>
          <motion.div
            key="panel-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePanel}
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          />

          <motion.div
            key="panel"
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
            <PanelHeader location={location} onClose={closePanel} />

            <div ref={panelBodyRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 40px' }}>
              <MediaGallery location={location} />

              {spots && spots.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <SectionLabel>SPOTS</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                    {spots.map((spot) => (
                      <SpotCard key={spot.id} spot={spot} />
                    ))}
                  </div>
                </div>
              )}

              <AddSpotRow locationId={location.id} tripId={location.tripId} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function tsToDateInput(ts: number | undefined): string {
  if (!ts) return ''
  return new Date(ts).toISOString().split('T')[0]
}

function dateInputToTs(val: string): number | undefined {
  if (!val) return undefined
  return new Date(val).getTime()
}

function PanelHeader({
  location,
  onClose,
}: {
  location: TripLocation
  onClose: () => void
}) {
  const [isEditingCaption, setIsEditingCaption] = useState(false)
  const [captionDraft, setCaptionDraft] = useState(location.caption ?? '')
  const [isEditingReview, setIsEditingReview] = useState(false)
  const [reviewDraft, setReviewDraft] = useState(location.review ?? '')

  const saveCaption = async () => {
    setIsEditingCaption(false)
    if (captionDraft !== location.caption) {
      await db.locations.update(location.id, { caption: captionDraft })
    }
  }

  const saveReview = async () => {
    setIsEditingReview(false)
    if (reviewDraft !== location.review) {
      await db.locations.update(location.id, { review: reviewDraft })
    }
  }

  const saveRating = async (rating: number) => {
    await db.locations.update(location.id, { rating: rating || undefined })
  }

  const saveDateFrom = async (val: string) => {
    await db.locations.update(location.id, { dateFrom: dateInputToTs(val) })
  }

  const saveDateTo = async (val: string) => {
    await db.locations.update(location.id, { dateTo: dateInputToTs(val) })
  }

  return (
    <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div
          style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'var(--accent-soft)', border: '1px solid var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, marginTop: 2,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
              fill="var(--accent)"
            />
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)',
              letterSpacing: '-0.02em', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {location.name}
          </h2>

          {isEditingCaption ? (
            <textarea
              autoFocus
              value={captionDraft}
              onChange={(e) => setCaptionDraft(e.target.value)}
              onBlur={saveCaption}
              onKeyDown={(e) => { if (e.key === 'Escape') setIsEditingCaption(false) }}
              placeholder="Add a caption…"
              rows={2}
              style={{
                width: '100%', marginTop: 6,
                background: 'var(--surface)', border: '1px solid var(--accent)',
                borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)',
                fontSize: '0.8rem', padding: '6px 8px', resize: 'none', outline: 'none', lineHeight: 1.55,
              }}
            />
          ) : (
            <button
              onClick={() => { setCaptionDraft(location.caption ?? ''); setIsEditingCaption(true) }}
              style={{
                display: 'block', marginTop: 4, background: 'none', border: 'none',
                cursor: 'text', padding: 0, textAlign: 'left', fontSize: '0.8rem',
                color: location.caption ? 'var(--text-secondary)' : 'var(--text-muted)',
                fontStyle: location.caption ? 'normal' : 'italic', lineHeight: 1.5,
              }}
            >
              {location.caption || 'Add caption…'}
            </button>
          )}

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <StarRating value={location.rating} onChange={saveRating} size={16} />
            {location.rating ? (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{location.rating}/5</span>
            ) : (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>rate this location</span>
            )}
          </div>

          {/* Date range */}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: 3, fontWeight: 600, letterSpacing: '0.06em' }}>FROM</div>
              <input
                type="date"
                defaultValue={tsToDateInput(location.dateFrom)}
                onBlur={(e) => saveDateFrom(e.target.value)}
                style={dateInputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: 3, fontWeight: 600, letterSpacing: '0.06em' }}>TO</div>
              <input
                type="date"
                defaultValue={tsToDateInput(location.dateTo)}
                onBlur={(e) => saveDateTo(e.target.value)}
                style={dateInputStyle}
              />
            </div>
          </div>

          {/* Review */}
          <div style={{ marginTop: 10 }}>
            {isEditingReview ? (
              <textarea
                autoFocus
                value={reviewDraft}
                onChange={(e) => setReviewDraft(e.target.value)}
                onBlur={saveReview}
                onKeyDown={(e) => { if (e.key === 'Escape') setIsEditingReview(false) }}
                placeholder="Write your review…"
                rows={3}
                style={{
                  width: '100%', background: 'var(--surface)', border: '1px solid var(--accent)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                  fontSize: '0.8rem', padding: '8px 10px', resize: 'none', outline: 'none', lineHeight: 1.6,
                }}
              />
            ) : (
              <button
                onClick={() => { setReviewDraft(location.review ?? ''); setIsEditingReview(true) }}
                style={{
                  display: 'block', background: 'none', border: 'none', cursor: 'text',
                  padding: 0, textAlign: 'left', width: '100%', fontSize: '0.8rem',
                  color: location.review ? 'var(--text-secondary)' : 'var(--text-muted)',
                  fontStyle: location.review ? 'normal' : 'italic', lineHeight: 1.55,
                }}
              >
                {location.review || 'Write a review…'}
              </button>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 99,
            width: 30, height: 30, cursor: 'pointer', color: 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}

function AddSpotRow({ locationId, tripId }: { locationId: string; tripId: string }) {
  const [isAdding, setIsAdding] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const { addSpot } = useSpot()

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed || isSaving) return
    setIsSaving(true)
    try {
      await addSpot(locationId, tripId, trimmed, { googlePlaceUrl: url.trim() || undefined })
      setName('')
      setUrl('')
      setIsAdding(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div style={{ marginTop: 20 }}>
      <AnimatePresence mode="wait">
        {isAdding ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                border: '1px solid var(--border)', borderRadius: 'var(--radius-card)',
                padding: 14, background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 8,
              }}
            >
              <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                NEW SPOT
              </div>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setIsAdding(false) }}
                placeholder="e.g. Carnivore Restaurant"
                style={fieldStyle}
              />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Google Maps URL (optional)"
                style={fieldStyle}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <SmallBtn onClick={() => setIsAdding(false)}>Cancel</SmallBtn>
                <SmallBtn accent onClick={save} disabled={!name.trim() || isSaving}>
                  {isSaving ? 'Adding…' : 'Add spot'}
                </SmallBtn>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setIsAdding(true)}
            style={{
              width: '100%', padding: '10px', background: 'none',
              border: '1.5px dashed var(--border)', borderRadius: 'var(--radius-card)',
              cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'border-color var(--transition), color var(--transition)',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--accent)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Add a spot
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
      {children}
    </div>
  )
}

const dateInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  fontSize: '0.78rem',
  outline: 'none',
  colorScheme: 'dark',
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  fontSize: '0.84rem',
  outline: 'none',
}

function SmallBtn({
  onClick,
  children,
  accent,
  disabled,
}: {
  onClick: () => void
  children: React.ReactNode
  accent?: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '6px 14px',
        background: accent ? 'var(--accent)' : 'none',
        border: `1px solid ${accent ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 99,
        color: accent ? '#fff' : 'var(--text-secondary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '0.78rem',
        fontWeight: accent ? 600 : 400,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  )
}
