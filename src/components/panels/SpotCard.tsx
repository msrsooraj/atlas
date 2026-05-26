import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { Spot } from '@/types/trip'
import { MediaThumbnail } from '@/components/media/MediaThumbnail'
import { DropZone } from '@/components/media/DropZone'
import { useMedia } from '@/hooks/useMedia'
import { useSpot } from '@/hooks/useSpot'
import { StarRating } from '@/components/ui/StarRating'

interface SpotCardProps {
  spot: Spot
}

function tsToDateInput(ts: number | undefined): string {
  if (!ts) return ''
  return new Date(ts).toISOString().split('T')[0]
}

function dateInputToTs(val: string): number | undefined {
  if (!val) return undefined
  return new Date(val).getTime()
}

export function SpotCard({ spot }: SpotCardProps) {
  const [isEditingCaption, setIsEditingCaption] = useState(false)
  const [captionDraft, setCaptionDraft] = useState(spot.caption ?? '')
  const [isEditingUrl, setIsEditingUrl] = useState(false)
  const [urlDraft, setUrlDraft] = useState(spot.googlePlaceUrl ?? '')
  const [isEditingReview, setIsEditingReview] = useState(false)
  const [reviewDraft, setReviewDraft] = useState(spot.review ?? '')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { deleteMemory } = useMedia()
  const { updateSpot, deleteSpot } = useSpot()

  const photos = useLiveQuery(
    () => db.memories
      .where('spotId')
      .equals(spot.id)
      .filter((m) => m.type === 'photo')
      .sortBy('createdAt'),
    [spot.id]
  )

  const saveCaption = async () => {
    setIsEditingCaption(false)
    if (captionDraft !== spot.caption) {
      await updateSpot(spot.id, { caption: captionDraft })
    }
  }

  const saveUrl = async () => {
    setIsEditingUrl(false)
    const trimmed = urlDraft.trim()
    if (trimmed !== spot.googlePlaceUrl) {
      await updateSpot(spot.id, { googlePlaceUrl: trimmed || undefined })
    }
  }

  const saveReview = async () => {
    setIsEditingReview(false)
    if (reviewDraft !== spot.review) {
      await updateSpot(spot.id, { review: reviewDraft })
    }
  }

  const saveRating = async (rating: number) => {
    await updateSpot(spot.id, { rating: rating || undefined })
  }

  const saveDateFrom = async (val: string) => {
    await updateSpot(spot.id, { dateFrom: dateInputToTs(val) })
  }

  const saveDateTo = async (val: string) => {
    await updateSpot(spot.id, { dateTo: dateInputToTs(val) })
  }

  return (
    <div
      id={`spot-${spot.id}`}
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
        background: 'var(--surface)',
      }}
    >
      {/* Spot header */}
      <div
        style={{
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderBottom: isCollapsed ? 'none' : '1px solid var(--border)',
          background: 'var(--surface-raised)',
        }}
      >
        <div
          style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--accent-soft)', border: '1px solid var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
              fill="var(--accent)"
            />
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {spot.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            {spot.rating ? (
              <StarRating value={spot.rating} readonly size={11} />
            ) : (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {photos?.length ?? 0} photo{(photos?.length ?? 0) !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {spot.googlePlaceUrl && (
          <a
            href={spot.googlePlaceUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="View on Google"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex', alignItems: 'center', padding: '4px 8px',
              background: 'var(--accent-soft)', border: '1px solid var(--accent)',
              borderRadius: 99, textDecoration: 'none', fontSize: '0.68rem',
              color: 'var(--accent)', fontWeight: 600, flexShrink: 0,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ marginRight: 3 }}>
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Google
          </a>
        )}

        <motion.button
          animate={{ rotate: isCollapsed ? -90 : 0 }}
          onClick={() => setIsCollapsed((v) => !v)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: 2, display: 'flex', alignItems: 'center',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>

        <button
          onClick={() => {
            if (confirm(`Delete spot "${spot.name}" and all its photos?`)) {
              deleteSpot(spot.id)
            }
          }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: 2, fontSize: '0.85rem', lineHeight: 1,
          }}
          title="Delete spot"
        >
          ×
        </button>
      </div>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Caption */}
              <div>
                {isEditingCaption ? (
                  <textarea
                    autoFocus
                    value={captionDraft}
                    onChange={(e) => setCaptionDraft(e.target.value)}
                    onBlur={saveCaption}
                    onKeyDown={(e) => { if (e.key === 'Escape') setIsEditingCaption(false) }}
                    placeholder="Describe this spot…"
                    rows={2}
                    style={{
                      width: '100%', background: 'var(--surface)', border: '1px solid var(--accent)',
                      borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                      fontSize: '0.82rem', padding: '8px 10px', resize: 'none', outline: 'none', lineHeight: 1.55,
                    }}
                  />
                ) : (
                  <button
                    onClick={() => { setCaptionDraft(spot.caption ?? ''); setIsEditingCaption(true) }}
                    style={{
                      background: 'none', border: 'none', cursor: 'text', textAlign: 'left',
                      padding: 0, width: '100%', fontSize: '0.82rem',
                      color: spot.caption ? 'var(--text-secondary)' : 'var(--text-muted)',
                      fontStyle: spot.caption ? 'normal' : 'italic', lineHeight: 1.55,
                    }}
                  >
                    {spot.caption || 'Add a description…'}
                  </button>
                )}
              </div>

              {/* Rating */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StarRating value={spot.rating} onChange={saveRating} size={14} />
                {spot.rating ? (
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{spot.rating}/5</span>
                ) : (
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>rate this spot</span>
                )}
              </div>

              {/* Date range */}
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: 3, fontWeight: 600, letterSpacing: '0.06em' }}>VISITED FROM</div>
                  <input
                    type="date"
                    defaultValue={tsToDateInput(spot.dateFrom)}
                    onBlur={(e) => saveDateFrom(e.target.value)}
                    style={dateInputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: 3, fontWeight: 600, letterSpacing: '0.06em' }}>TO</div>
                  <input
                    type="date"
                    defaultValue={tsToDateInput(spot.dateTo)}
                    onBlur={(e) => saveDateTo(e.target.value)}
                    style={dateInputStyle}
                  />
                </div>
              </div>

              {/* Review */}
              <div>
                {isEditingReview ? (
                  <textarea
                    autoFocus
                    value={reviewDraft}
                    onChange={(e) => setReviewDraft(e.target.value)}
                    onBlur={saveReview}
                    onKeyDown={(e) => { if (e.key === 'Escape') setIsEditingReview(false) }}
                    placeholder="Write your review of this spot…"
                    rows={3}
                    style={{
                      width: '100%', background: 'var(--surface)', border: '1px solid var(--accent)',
                      borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                      fontSize: '0.8rem', padding: '8px 10px', resize: 'none', outline: 'none', lineHeight: 1.6,
                    }}
                  />
                ) : (
                  <button
                    onClick={() => { setReviewDraft(spot.review ?? ''); setIsEditingReview(true) }}
                    style={{
                      display: 'block', background: 'none', border: 'none', cursor: 'text',
                      padding: 0, textAlign: 'left', width: '100%', fontSize: '0.8rem',
                      color: spot.review ? 'var(--text-secondary)' : 'var(--text-muted)',
                      fontStyle: spot.review ? 'normal' : 'italic', lineHeight: 1.55,
                    }}
                  >
                    {spot.review || 'Write a review…'}
                  </button>
                )}
              </div>

              {/* Google Place URL editor */}
              {!spot.googlePlaceUrl && (
                <div>
                  {isEditingUrl ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        autoFocus
                        value={urlDraft}
                        onChange={(e) => setUrlDraft(e.target.value)}
                        onBlur={saveUrl}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveUrl(); if (e.key === 'Escape') setIsEditingUrl(false) }}
                        placeholder="https://maps.google.com/…"
                        style={{
                          flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                          fontSize: '0.78rem', padding: '7px 10px', outline: 'none',
                        }}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditingUrl(true)}
                      style={{
                        background: 'none', border: '1px dashed var(--border)', borderRadius: 99,
                        padding: '4px 12px', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--text-muted)',
                      }}
                    >
                      + Add Google Place link
                    </button>
                  )}
                </div>
              )}

              {/* Photo grid */}
              {photos && photos.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
                  {photos.map((memory, i) => (
                    <MediaThumbnail
                      key={memory.id}
                      memory={memory}
                      onDelete={() => deleteMemory(memory.id)}
                      onSetCover={() => updateSpot(spot.id, { coverPhotoId: memory.id })}
                      isCover={
                        spot.coverPhotoId
                          ? spot.coverPhotoId === memory.id
                          : i === 0
                      }
                      showCaption
                    />
                  ))}
                </div>
              )}

              <DropZone
                locationId={spot.locationId}
                routeId={spot.routeId}
                tripId={spot.tripId}
                spotId={spot.id}
                compact
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
