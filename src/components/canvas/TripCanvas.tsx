import { useCallback, useEffect, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Edge,
  type OnNodeDrag,
  type OnMove,
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
const nodeTypes = { memoryNode: MemoryNode }
const edgeTypes = { connectionEdge: ConnectionEdge }

interface TripCanvasProps {
  tripId: string
  tripName: string
}

export function TripCanvas({ tripId, tripName }: TripCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<MemoryNodeType>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const { saveNodePosition, saveLayout } = useCanvas(tripId)
  const appMode = useUIStore((s) => s.appMode)

  const locations = useLiveQuery(
    () => db.locations.where('tripId').equals(tripId).sortBy('order'),
    [tripId]
  )

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

        const rfEdges: Edge[] = routes.map((r, i) => ({
          id: `route-${i}-${r.id}`,
          source: r.fromLocationId,
          target: r.toLocationId,
          type: 'connectionEdge',
        }))

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
      </ReactFlow>

      <CanvasToolbar tripName={tripName} />
      {appMode === 'scrapbook' && <AddLocationButton tripId={tripId} />}
    </div>
  )
}
