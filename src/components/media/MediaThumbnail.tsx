import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { db } from '@/db/db'
import type { Memory } from '@/types/trip'
import { useMedia } from '@/hooks/useMedia'

interface MediaThumbnailProps {
  memory: Memory
  onDelete?: () => void
  onSetCover?: () => void
  isCover?: boolean
  showCaption?: boolean
}

export function MediaThumbnail({ memory, onDelete, onSetCover, isCover, showCaption = true }: MediaThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [src, setSrc] = useState<string | null>(null)
  const [isEditingCaption, setIsEditingCaption] = useState(false)
  const [captionDraft, setCaptionDraft] = useState(memory.caption ?? '')
  const blobUrlRef = useRef<string | null>(null)
  const { updateCaption } = useMedia()

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) setIsVisible(true) },
      { threshold: 0.05, rootMargin: '120px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return
    let revoked = false

    const load = async () => {
      if (memory.thumbnailKey) {
        const blob = await db.mediaBlobs.get(memory.thumbnailKey)
        if (blob && !revoked) {
          const url = URL.createObjectURL(blob.blob)
          blobUrlRef.current = url
          setSrc(url)
          return
        }
      }
      if (memory.externalUrl && !revoked) setSrc(memory.externalUrl)
    }

    load()

    return () => {
      revoked = true
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [isVisible, memory.thumbnailKey, memory.externalUrl])

  useEffect(() => {
    setCaptionDraft(memory.caption ?? '')
  }, [memory.caption])

  const saveCaption = async () => {
    setIsEditingCaption(false)
    if (captionDraft !== memory.caption) {
      await updateCaption(memory.id, captionDraft)
    }
  }

  if (memory.type === 'note') {
    return (
      <div style={{ padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 5 }}>NOTE</div>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>{memory.caption}</p>
      </div>
    )
  }

  if (memory.type === 'link') {
    return (
      <a
        href={memory.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'block', padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', textDecoration: 'none' }}
      >
        <div style={{ fontSize: '0.68rem', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 4 }}>LINK</div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {memory.caption || memory.externalUrl}
        </p>
      </a>
    )
  }

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <motion.div
        whileHover={{ opacity: 0.95 }}
        style={{
          aspectRatio: '4/3',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: showCaption ? '8px 8px 0 0' : 8,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {src ? (
          <img src={src} alt={memory.caption ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {/* Cover crown badge */}
        {isCover && (
          <div
            style={{
              position: 'absolute', bottom: 5, left: 5,
              background: 'var(--accent)', borderRadius: 99,
              padding: '2px 6px', fontSize: '0.6rem', fontWeight: 700,
              color: '#fff', letterSpacing: '0.04em', pointerEvents: 'none',
            }}
          >
            COVER
          </div>
        )}

        {/* Action buttons (show on hover via CSS) */}
        <div className="thumb-actions">
          {onSetCover && !isCover && (
            <button
              onClick={(e) => { e.stopPropagation(); onSetCover() }}
              className="thumb-action-btn"
              title="Set as cover"
            >
              ★
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="thumb-action-btn"
              title="Delete"
            >
              ×
            </button>
          )}
        </div>
      </motion.div>

      {showCaption && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '5px 8px', minHeight: 28 }}>
          {isEditingCaption ? (
            <input
              autoFocus
              value={captionDraft}
              onChange={(e) => setCaptionDraft(e.target.value)}
              onBlur={saveCaption}
              onKeyDown={(e) => { if (e.key === 'Enter') saveCaption(); if (e.key === 'Escape') setIsEditingCaption(false) }}
              placeholder="Add caption…"
              style={{ width: '100%', background: 'none', border: 'none', outline: 'none', fontSize: '0.72rem', color: 'var(--text-primary)', padding: 0 }}
            />
          ) : (
            <button
              onClick={() => setIsEditingCaption(true)}
              style={{
                background: 'none', border: 'none', cursor: 'text', fontSize: '0.72rem',
                color: memory.caption ? 'var(--text-secondary)' : 'var(--text-muted)',
                padding: 0, width: '100%', textAlign: 'left',
                fontStyle: memory.caption ? 'normal' : 'italic',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              {memory.caption || 'Add caption…'}
            </button>
          )}
        </div>
      )}

      <style>{`
        .thumb-actions { position: absolute; top: 5px; right: 5px; display: flex; gap: 4px; opacity: 0; transition: opacity 0.15s; }
        div:hover > .thumb-actions { opacity: 1; }
        .thumb-action-btn {
          background: rgba(0,0,0,0.6); border: none; border-radius: 99;
          width: 22px; height: 22px; color: #fff; cursor: pointer; font-size: 0.75rem;
          display: flex; align-items: center; justify-content: center;
        }
        .thumb-action-btn:hover { background: var(--accent); }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
