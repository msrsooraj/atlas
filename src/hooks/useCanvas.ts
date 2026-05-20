import { useCallback } from 'react'
import { db } from '@/db/db'
import type { CanvasNodeLayout, CanvasViewport } from '@/types/canvas'

export function useCanvas(tripId: string | null) {
  const saveLayout = useCallback(
    async (nodes: CanvasNodeLayout[], viewport: CanvasViewport) => {
      if (!tripId) return
      const existing = await db.canvasLayouts.where('tripId').equals(tripId).first()
      const now = Date.now()
      if (existing?.id != null) {
        await db.canvasLayouts.update(existing.id, { nodes, viewport, updatedAt: now })
      } else {
        await db.canvasLayouts.add({ tripId, nodes, viewport, updatedAt: now })
      }
    },
    [tripId]
  )

  const saveNodePosition = useCallback(
    async (locationId: string, position: { x: number; y: number }) => {
      if (!tripId) return
      const existing = await db.canvasLayouts.where('tripId').equals(tripId).first()
      const now = Date.now()
      if (existing?.id != null) {
        const updatedNodes = existing.nodes.map((n) =>
          n.locationId === locationId ? { ...n, position } : n
        )
        if (!updatedNodes.find((n) => n.locationId === locationId)) {
          updatedNodes.push({ locationId, position, width: 280, height: 180, zIndex: 1 })
        }
        await db.canvasLayouts.update(existing.id, { nodes: updatedNodes, updatedAt: now })
      } else {
        await db.canvasLayouts.add({
          tripId,
          nodes: [{ locationId, position, width: 280, height: 180, zIndex: 1 }],
          viewport: { x: 0, y: 0, zoom: 1 },
          updatedAt: now,
        })
      }
    },
    [tripId]
  )

  return { saveLayout, saveNodePosition }
}
