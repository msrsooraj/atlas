import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Edge,
  type OnNodeDrag,
  type OnMove,
  type EdgeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { MemoryNode, type MemoryNodeType } from './MemoryNode'
import { ConnectionEdge } from './ConnectionEdge'
import { CanvasToolbar } from './CanvasToolbar'
import { AddLocationButton } from './AddLocationButton'
import { generateSkeleton } from '@/lib/skeletonGenerator'
import { useCanvas } from '@/hooks/useCanvas'
import { useUIStore } from '@/store/uiStore'
import { useCanvasStore } from '@/store/canvasStore'
import type { Route } from '@/types/trip'
import type { HeatmapMode } from '@/store/uiStore'

const nodeTypes = { memoryNode: MemoryNode }
const edgeTypes = { connectionEdge: ConnectionEdge }

const H_ARRANGE = 380
const V_ARRANGE = 260

function topoOrder(nodeIds: string[], routes: Route[]): string[] {
  const incoming = new Map<string, number>()
  const outgoing = new Map<string, string[]>()
  for (const id of nodeIds) { incoming.set(id, 0); outgoing.set(id, []) }
  for (const r of routes) {
    incoming.set(r.toLocationId, (incoming.get(r.toLocationId) ?? 0) + 1)
    const adj = outgoing.get(r.fromLocationId)
    if (adj) adj.push(r.toLocationId)
  }
  const queue = nodeIds.filter((id) => (incoming.get(id) ?? 0) === 0)
  const order: string[] = []
  const visited = new Set<string>()
  while (queue.length > 0) {
    const id = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    order.push(id)
    for (const next of outgoing.get(id) ?? []) {
      const c = (incoming.get(next) ?? 0) - 1
      incoming.set(next, c)
      if (c === 0) queue.push(next)
    }
  }
  for (const id of nodeIds) { if (!visited.has(id)) order.push(id) }
  return order
}

function snakeGridPos(order: string[]): Record<string, { x: number; y: number }> {
  const cols = Math.max(1, Math.ceil(Math.sqrt(order.length)))
  const posMap: Record<string, { x: number; y: number }> = {}
  order.forEach((id, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    posMap[id] = { x: row % 2 === 0 ? col * H_ARRANGE + 80 : (cols - 1 - col) * H_ARRANGE + 80, y: row * V_ARRANGE + 80 }
  })
  return posMap
}

function linePos(order: string[]): Record<string, { x: number; y: number }> {
  const posMap: Record<string, { x: number; y: number }> = {}
  order.forEach((id, i) => { posMap[id] = { x: i * H_ARRANGE + 80, y: 80 } })
  return posMap
}

function AutoArranger({ tripId, nodes }: { tripId: string; nodes: MemoryNodeType[] }) {
  const { setNodes, fitView } = useReactFlow()
  const arrangeMode = useCanvasStore((s) => s.arrangeMode)
  const previousPositions = useCanvasStore((s) => s.previousPositions)
  const storePreviousPositions = useCanvasStore((s) => s.storePreviousPositions)
  const clearPreviousPositions = useCanvasStore((s) => s.clearPreviousPositions)
  const nodesRef = useRef(nodes)
  const prevModeRef = useRef<typeof arrangeMode>('manual')
  nodesRef.current = nodes

  useEffect(() => {
    if (arrangeMode === prevModeRef.current) return
    const fromMode = prevModeRef.current
    prevModeRef.current = arrangeMode

    if (arrangeMode === 'manual') {
      const prev = previousPositions
      if (!prev) return
      setNodes((ns) => ns.map((n) => ({ ...n, position: prev[n.id] ?? n.position })))
      clearPreviousPositions()
      db.canvasLayouts.where('tripId').equals(tripId).first().then((layout) => {
        if (layout?.id != null) {
          db.canvasLayouts.update(layout.id, {
            nodes: layout.nodes.map((ln) => ({ ...ln, position: prev[ln.locationId] ?? ln.position })),
            updatedAt: Date.now(),
          })
        }
      })
      setTimeout(() => fitView({ padding: 0.12, duration: 400 }), 60)
      return
    }

    const apply = async () => {
      const cur = nodesRef.current
      const routes = await db.routes.where('tripId').equals(tripId).sortBy('order')

      if (fromMode === 'manual') {
        const prev: Record<string, { x: number; y: number }> = {}
        for (const n of cur) prev[n.id] = { ...n.position }
        storePreviousPositions(prev)
      }

      const order = topoOrder(cur.map((n) => n.id), routes)
      const posMap = arrangeMode === 'grid' ? snakeGridPos(order) : linePos(order)

      setNodes((ns) => ns.map((n) => ({ ...n, position: posMap[n.id] ?? n.position })))

      const layout = await db.canvasLayouts.where('tripId').equals(tripId).first()
      if (layout?.id != null) {
        await db.canvasLayouts.update(layout.id, {
          nodes: layout.nodes.map((ln) => ({ ...ln, position: posMap[ln.locationId] ?? ln.position })),
          updatedAt: Date.now(),
        })
      }

      setTimeout(() => fitView({ padding: 0.12, duration: 400 }), 60)
    }
    apply()
  }, [arrangeMode])

  return null
}

const NODE_W = 280
const NODE_H = 180

function getBestHandles(srcPos: { x: number; y: number }, tgtPos: { x: number; y: number }) {
  const dx = (tgtPos.x + NODE_W / 2) - (srcPos.x + NODE_W / 2)
  const dy = (tgtPos.y + NODE_H / 2) - (srcPos.y + NODE_H / 2)
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { sourceHandle: 'right', targetHandle: 'left' }
      : { sourceHandle: 'left', targetHandle: 'right' }
  }
  return dy >= 0
    ? { sourceHandle: 'bottom', targetHandle: 'top' }
    : { sourceHandle: 'top', targetHandle: 'bottom' }
}

function buildEdges(routes: Route[], nodes: MemoryNodeType[]): Edge[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  return routes.map((r, i) => {
    const src = nodeMap.get(r.fromLocationId)
    const tgt = nodeMap.get(r.toLocationId)
    const { sourceHandle, targetHandle } =
      src && tgt ? getBestHandles(src.position, tgt.position) : { sourceHandle: 'bottom', targetHandle: 'top' }
    return {
      id: `route-${i}-${r.id}`,
      source: r.fromLocationId,
      target: r.toLocationId,
      type: 'connectionEdge' as const,
      sourceHandle,
      targetHandle,
      data: { routeId: r.id },
    }
  })
}

interface TripCanvasProps {
  tripId: string
  tripName: string
}

function computeHeatmapScales(
  mode: HeatmapMode,
  locations: { id: string; rating?: number; dateFrom?: number; dateTo?: number }[],
  spots: { id: string; rating?: number; dateFrom?: number; dateTo?: number }[]
): Record<string, number> {
  if (mode === 'none') return {}
  const items = [...locations, ...spots]
  if (items.length === 0) return {}

  const msPerDay = 86_400_000
  const timeOf = (it: typeof items[0]) =>
    it.dateFrom && it.dateTo ? Math.max(0, (it.dateTo - it.dateFrom) / msPerDay) : 0

  let raws: number[]
  if (mode === 'rating') {
    raws = items.map((it) => it.rating ?? 0)
  } else if (mode === 'time') {
    raws = items.map(timeOf)
  } else {
    const ratings = items.map((it) => it.rating ?? 0)
    const times = items.map(timeOf)
    const maxR = Math.max(...ratings, 1)
    const maxT = Math.max(...times, 1)
    raws = items.map((_, i) => ratings[i]! / maxR + times[i]! / maxT)
  }

  const min = Math.min(...raws)
  const max = Math.max(...raws)
  const scales: Record<string, number> = {}
  items.forEach((it, i) => {
    scales[it.id] = min === max ? 1.0 : 0.5 + ((raws[i]! - min) / (max - min)) * 1.0
  })
  return scales
}

export function TripCanvas({ tripId, tripName }: TripCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<MemoryNodeType>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const { saveNodePosition, saveLayout } = useCanvas(tripId)
  const appMode = useUIStore((s) => s.appMode)
  const heatmapMode = useUIStore((s) => s.heatmapMode)
  const setHeatmapScales = useUIStore((s) => s.setHeatmapScales)
  const { openRoutePanel } = useCanvasStore()
  const routesRef = useRef<Route[]>([])

  const locations = useLiveQuery(
    () => db.locations.where('tripId').equals(tripId).sortBy('order'),
    [tripId]
  )

  const allSpots = useLiveQuery(
    () => db.spots.where('tripId').equals(tripId).toArray(),
    [tripId]
  )

  useEffect(() => {
    if (!locations || !allSpots) return
    setHeatmapScales(computeHeatmapScales(heatmapMode, locations, allSpots))
  }, [heatmapMode, locations, allSpots, setHeatmapScales])

  useEffect(() => {
    if (!locations) return

    const load = async () => {
      const layout = await db.canvasLayouts.where('tripId').equals(tripId).first()
      const routes = await db.routes.where('tripId').equals(tripId).sortBy('order')

      if (layout && layout.nodes.length > 0) {
        const rfNodes: MemoryNodeType[] = locations.map((loc) => {
          const canvasNode = layout.nodes.find((n) => n.locationId === loc.id)
          return {
            id: loc.id,
            type: 'memoryNode' as const,
            position: canvasNode?.position ?? { x: 0, y: 0 },
            data: { locationId: loc.id, label: loc.name, memoryCount: 0 },
          }
        })

        routesRef.current = routes
        const rfEdges = buildEdges(routes, rfNodes)

        setNodes(rfNodes)
        setEdges(rfEdges)
      } else {
        const { nodes: skelNodes, edges: skelEdges } = generateSkeleton(locations)
        setNodes(skelNodes)
        setEdges(skelEdges)

        await saveLayout(
          skelNodes.map((n) => ({
            locationId: n.id,
            position: n.position,
            width: 280,
            height: 180,
            zIndex: 1,
          })),
          { x: 0, y: 0, zoom: 1 }
        )
      }
    }

    load()
  }, [locations, tripId, setNodes, setEdges, saveLayout])

  // Recompute edge handles whenever node positions change (e.g. after drag)
  useEffect(() => {
    if (routesRef.current.length === 0 || nodes.length === 0) return
    setEdges(buildEdges(routesRef.current, nodes))
  }, [nodes, setEdges])

  const onEdgeClick: EdgeMouseHandler = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      if (appMode !== 'scrapbook') return
      const routeId = (edge.data as { routeId?: string } | undefined)?.routeId
      if (routeId) openRoutePanel(routeId)
    },
    [appMode, openRoutePanel]
  )

  const onNodeDragStop: OnNodeDrag<MemoryNodeType> = useCallback(
    async (_event, node) => {
      await saveNodePosition(node.id, node.position)
    },
    [saveNodePosition]
  )

  const onMoveEnd: OnMove = useCallback(
    async (_event, viewport) => {
      const layout = await db.canvasLayouts.where('tripId').equals(tripId).first()
      if (layout?.id != null) {
        await db.canvasLayouts.update(layout.id, {
          viewport: { x: viewport.x, y: viewport.y, zoom: viewport.zoom },
          updatedAt: Date.now(),
        })
      }
    },
    [tripId]
  )

  const defaultViewport = useMemo(() => ({ x: 80, y: 80, zoom: 0.9 }), [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onEdgeClick={onEdgeClick}
        onMoveEnd={onMoveEnd}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={defaultViewport}
        minZoom={0.1}
        maxZoom={4}
        panOnScroll
        zoomOnScroll
        panOnDrag
        nodesDraggable={appMode === 'scrapbook'}
        fitView={!locations || locations.length === 0}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1.2}
          color="var(--canvas-dot)"
        />
        <AutoArranger tripId={tripId} nodes={nodes} />
      </ReactFlow>

      <CanvasToolbar tripName={tripName} />
      {appMode === 'scrapbook' && <AddLocationButton tripId={tripId} />}
    </div>
  )
}
