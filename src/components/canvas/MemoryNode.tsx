import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Handle, Position, useReactFlow, type NodeProps, type Node } from '@xyflow/react'

const ALL_POSITIONS = [
  { id: 'top',    pos: Position.Top    },
  { id: 'right',  pos: Position.Right  },
  { id: 'bottom', pos: Position.Bottom },
  { id: 'left',   pos: Position.Left   },
] as const
import { motion, AnimatePresence } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import type { MemoryNodeData } from '@/types/canvas'
import type { Spot } from '@/types/trip'
import { useCanvasStore } from '@/store/canvasStore'
import { useUIStore } from '@/store/uiStore'
import { db } from '@/db/db'
import { StarRating } from '@/components/ui/StarRating'
import { getSpotCoverUrl, getLocationCoverUrl } from '@/lib/coverPhoto'

export type MemoryNodeType = Node<MemoryNodeData, 'memoryNode'>

// ─── Spot hover card (edit mode popup row) ───────────────────────────────────
function SpotHoverRow({ spot, onClick }: { spot: Spot; onClick: () => void }) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const urlRef = useRef<string | null>(null)

  const photoCount = useLiveQuery(
    () => db.memories.where('spotId').equals(spot.id).filter((m) => m.type === 'photo').count(),
    [spot.id],
    0
  )

  useEffect(() => {
    let active = true
    getSpotCoverUrl(spot).then((url) => {
      if (!active) { if (url) URL.revokeObjectURL(url); return }
      urlRef.current = url
      setCoverUrl(url)
    })
    return () => {
      active = false
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [spot.id, spot.coverPhotoId])

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      whileHover={{ background: 'var(--accent-soft)' }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', cursor: 'pointer', borderRadius: 8,
        transition: 'background var(--transition)',
      }}
    >
      {/* Cover thumbnail */}
      <div style={{ width: 42, height: 42, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {coverUrl ? (
          <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)" opacity="0.7">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {spot.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          {spot.rating ? (
            <StarRating value={spot.rating} readonly size={10} />
          ) : null}
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            {photoCount ?? 0} photo{(photoCount ?? 0) !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Arrow */}
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </motion.div>
  )
}

// ─── Showcase orb (with optional cover photo) ────────────────────────────────
function ShowcaseOrb({
  spot,
  style,
  showPhoto,
  heatScale,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  spot: Spot
  style: React.CSSProperties
  showPhoto: boolean
  heatScale: number
  onClick: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!showPhoto) {
      if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null }
      setCoverUrl(null)
      return
    }
    let active = true
    getSpotCoverUrl(spot).then((url) => {
      if (!active) { if (url) URL.revokeObjectURL(url); return }
      urlRef.current = url
      setCoverUrl(url)
    })
    return () => {
      active = false
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [spot.id, spot.coverPhotoId, showPhoto])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.55 * heatScale }}
      animate={{ opacity: 1, scale: heatScale }}
      exit={{ opacity: 0, scale: 0.55 * heatScale }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        ...style,
        position: 'absolute',
        background: 'var(--surface-raised)',
        border: '1px solid var(--accent)',
        borderRadius: 12,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        overflow: 'hidden',
        cursor: 'pointer',
        transformOrigin: 'center center',
      }}
    >
      {showPhoto && coverUrl && (
        <div style={{ width: '100%', height: 56, overflow: 'hidden', flexShrink: 0 }}>
          <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      )}
      <div style={{ padding: showPhoto && coverUrl ? '7px 10px 8px' : '8px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="var(--accent)">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {spot.name}
          </span>
        </div>
        {spot.rating ? (
          <StarRating value={spot.rating} readonly size={10} />
        ) : (
          <span style={{ fontSize: '0.63rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>no rating</span>
        )}
      </div>
    </motion.div>
  )
}

// ─── Main MemoryNode ──────────────────────────────────────────────────────────
function MemoryNodeComponent({ id, data, selected }: NodeProps<MemoryNodeType>) {
  const { openPanel, openPanelAtSpot } = useCanvasStore()
  const appMode = useUIStore((s) => s.appMode)
  const showcaseShowPhotos = useUIStore((s) => s.showcaseShowPhotos)
  const heatmapMode = useUIStore((s) => s.heatmapMode)
  const heatmapScales = useUIStore((s) => s.heatmapScales)
  const { setNodes } = useReactFlow()

  const [coverURL, setCoverURL] = useState<string | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const coverUrlRef = useRef<string | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reactive counts / data
  const memCount = useLiveQuery(
    () => db.memories.where('locationId').equals(data.locationId).count(),
    [data.locationId],
    0
  )

  const spotPhotoCount = useLiveQuery(
    () => db.memories.where('locationId').equals(data.locationId)
      .filter((m) => m.type === 'photo' && !!m.spotId).count(),
    [data.locationId],
    0
  )

  const spots = useLiveQuery(
    () => db.spots.where('locationId').equals(data.locationId).sortBy('order'),
    [data.locationId]
  )

  const location = useLiveQuery(
    () => db.locations.get(data.locationId),
    [data.locationId]
  )

  // Reload cover when location coverPhotoId or spot photos change
  useEffect(() => {
    if (!location) return
    let active = true
    let created: string | null = null

    getLocationCoverUrl(location).then((url) => {
      if (!active) { if (url) URL.revokeObjectURL(url); return }
      created = url
      if (coverUrlRef.current) URL.revokeObjectURL(coverUrlRef.current)
      coverUrlRef.current = url
      setCoverURL(url)
    })

    return () => {
      active = false
      if (created) URL.revokeObjectURL(created)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.locationId, location?.coverPhotoId, spotPhotoCount])

  useEffect(() => {
    return () => {
      if (coverUrlRef.current) URL.revokeObjectURL(coverUrlRef.current)
    }
  }, [])

  // Hover state with delay — prevents popup disappearing when crossing the gap
  const handleMouseEnter = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    setIsHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    hideTimerRef.current = setTimeout(() => setIsHovered(false), 120)
  }, [])

  useEffect(() => {
    setNodes((ns) => ns.map((n) => n.id === id ? { ...n, zIndex: isHovered ? 1000 : 1 } : n))
  }, [isHovered, id, setNodes])

  const isShowcase = appMode === 'showcase'
  const hasSpots = spots && spots.length > 0
  const orbW = showcaseShowPhotos ? 152 : 148
  const orbH = showcaseShowPhotos ? 110 : 60
  const nodeHeatScale = isShowcase && heatmapMode !== 'none' ? (heatmapScales[data.locationId] ?? 1.0) : 1.0

  return (
    <>
      {ALL_POSITIONS.map(({ id, pos }) => (
        <Handle key={`t-${id}`} type="target" id={id} position={pos} style={{ opacity: 0, pointerEvents: 'none' }} />
      ))}

      <div style={{ position: 'relative', width: 280 }}>

        {/* ── EDIT MODE: spot hover popup (above node) ───────────────────── */}
        <AnimatePresence>
          {!isShowcase && isHovered && hasSpots && (
            <motion.div
              key="spot-popup"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ type: 'spring', stiffness: 340, damping: 26 }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 6px)',
                left: 0, right: 0,
                zIndex: 20,
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: 'var(--shadow-lg)',
                padding: '6px 0',
                pointerEvents: 'all',
              }}
            >
              <div style={{ padding: '4px 12px 6px', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                SPOTS
              </div>
              {spots.slice(0, 5).map((spot) => (
                <SpotHoverRow
                  key={spot.id}
                  spot={spot}
                  onClick={() => openPanelAtSpot(data.locationId, spot.id)}
                />
              ))}
              {spots.length > 5 && (
                <div style={{ padding: '4px 12px 6px', fontSize: '0.68rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  +{spots.length - 5} more — click node to open
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SHOWCASE MODE: constellation orbs ─────────────────────────── */}
        <AnimatePresence>
          {isShowcase && isHovered && hasSpots && (
            <>
              <svg style={{ position: 'absolute', left: 0, top: 0, width: 1, height: 1, overflow: 'visible', pointerEvents: 'none', zIndex: 25 }}>
                {spots.map((spot, i) => {
                  const angle = (i / spots.length) * Math.PI * 2 - Math.PI / 2
                  const radius = 220
                  const cx = 140, cy = 90
                  return (
                    <motion.line
                      key={spot.id}
                      x1={cx} y1={cy}
                      x2={cx + radius * Math.cos(angle)}
                      y2={cy + radius * Math.sin(angle)}
                      stroke="var(--accent)" strokeWidth="1" strokeDasharray="4 4"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.35 }}
                      exit={{ pathLength: 0, opacity: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.04 }}
                    />
                  )
                })}
              </svg>

              {spots.map((spot, i) => {
                const angle = (i / spots.length) * Math.PI * 2 - Math.PI / 2
                const radius = 220
                const cx = 140, cy = 90
                const x = cx + radius * Math.cos(angle) - orbW / 2
                const y = cy + radius * Math.sin(angle) - orbH / 2
                const spotHeatScale = isShowcase && heatmapMode !== 'none' ? (heatmapScales[spot.id] ?? 1.0) : 1.0
                return (
                  <ShowcaseOrb
                    key={spot.id}
                    spot={spot}
                    showPhoto={showcaseShowPhotos}
                    heatScale={spotHeatScale}
                    style={{ left: x, top: y, width: orbW, zIndex: 30 }}
                    onClick={() => openPanelAtSpot(data.locationId, spot.id)}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  />
                )
              })}
            </>
          )}
        </AnimatePresence>

        {/* ── Main node card ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: nodeHeatScale * (isShowcase && isHovered ? 1.04 : 1.0), opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => { if (appMode === 'scrapbook') openPanel(data.locationId) }}
          style={{
            width: 280,
            cursor: isShowcase ? 'default' : 'pointer',
            background: 'var(--surface)',
            border: `1px solid ${selected ? 'var(--accent)' : isShowcase && isHovered ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-node)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: selected
              ? '0 0 0 2px var(--accent-soft), var(--shadow-md)'
              : isShowcase && isHovered
                ? '0 0 0 2px var(--accent-soft), var(--shadow-lg)'
                : 'var(--shadow-md)',
            overflow: 'hidden',
            transition: 'border-color var(--transition), box-shadow var(--transition)',
          }}
        >
          {coverURL ? (
            <div style={{ height: 120, overflow: 'hidden', position: 'relative' }}>
              <img src={coverURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.28) 100%)' }} />
            </div>
          ) : (
            <div style={{ height: 72, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="var(--accent)" opacity="0.6" />
              </svg>
            </div>
          )}

          <div style={{ padding: '12px 16px 14px' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {data.label}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.72rem', color: (memCount ?? 0) > 0 ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 500 }}>
                {(memCount ?? 0) > 0 ? `${memCount} memor${memCount === 1 ? 'y' : 'ies'}` : 'No memories yet'}
              </span>

              {location?.rating ? <StarRating value={location.rating} readonly size={11} /> : null}

              {!isShowcase && hasSpots && (
                <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)', padding: '2px 8px', background: 'var(--accent-soft)', borderRadius: 99 }}>
                  {spots.length} spot{spots.length !== 1 ? 's' : ''}
                </span>
              )}

              {!isShowcase && !hasSpots && (
                <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)', padding: '2px 8px', background: 'var(--accent-soft)', borderRadius: 99 }}>
                  Open
                </span>
              )}

              {isShowcase && hasSpots && (
                <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {spots.length} spot{spots.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {ALL_POSITIONS.map(({ id, pos }) => (
        <Handle key={`s-${id}`} type="source" id={id} position={pos} style={{ opacity: 0, pointerEvents: 'none' }} />
      ))}
    </>
  )
}

export const MemoryNode = memo(MemoryNodeComponent)
