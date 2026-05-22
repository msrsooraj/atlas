import { memo } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { useUIStore } from '@/store/uiStore'
import type { TransportMode } from '@/types/trip'

export const TRANSPORT_ICONS: Record<TransportMode, string> = {
  flight:  '✈️',
  bus:     '🚌',
  car:     '🚗',
  train:   '🚂',
  boat:    '⛵',
  cruise:  '🛳️',
  walk:    '🚶',
  other:   '🗺️',
}

function ConnectionEdgeComponent({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const appMode = useUIStore((s) => s.appMode)
  const routeId = (data as { routeId?: string } | undefined)?.routeId

  const route = useLiveQuery(
    () => (routeId ? db.routes.get(routeId) : undefined),
    [routeId]
  )

  const photoCount = useLiveQuery(
    () =>
      routeId
        ? db.memories.where('routeId').equals(routeId).filter((m) => m.type === 'photo').count()
        : Promise.resolve(0),
    [routeId]
  ) ?? 0

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const isScrapbook = appMode === 'scrapbook'
  const showBadge = route?.transport || photoCount > 0

  return (
    <>
      <BaseEdge
        path={edgePath}
        interactionWidth={isScrapbook ? 14 : 0}
        style={{
          stroke: 'var(--border-strong)',
          strokeWidth: 1.5,
          strokeDasharray: '5 4',
          cursor: isScrapbook ? 'pointer' : 'default',
        }}
      />

      {showBadge && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: 99,
                padding: '3px 9px',
                fontSize: '0.68rem',
                color: 'var(--text-secondary)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                whiteSpace: 'nowrap',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {route?.transport && (
                <span style={{ fontSize: '0.78rem', lineHeight: 1 }}>
                  {TRANSPORT_ICONS[route.transport]}
                </span>
              )}
              {photoCount > 0 && (
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                  {photoCount}
                </span>
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export const ConnectionEdge = memo(ConnectionEdgeComponent)
