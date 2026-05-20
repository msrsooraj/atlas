import type { TripLocation } from '@/types/trip'
import type { Edge } from '@xyflow/react'
import type { MemoryNodeType } from '@/components/canvas/MemoryNode'

const H_SPACING = 380
const V_SPACING = 260

export function generateSkeleton(
  locations: TripLocation[]
): { nodes: MemoryNodeType[]; edges: Edge[] } {
  const cols = Math.max(1, Math.ceil(Math.sqrt(locations.length)))

  const nodes: MemoryNodeType[] = locations.map((loc, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = row % 2 === 0
      ? col * H_SPACING + 80
      : (cols - 1 - col) * H_SPACING + 80
    const y = row * V_SPACING + 80

    return {
      id: loc.id,
      type: 'memoryNode' as const,
      position: { x, y },
      data: {
        locationId: loc.id,
        label: loc.name,
        memoryCount: 0,
      },
    }
  })

  const edges: Edge[] = locations.slice(0, -1).map((_, i) => ({
    id: `route-${i}-${locations[i]!.id}`,
    source: locations[i]!.id,
    target: locations[i + 1]!.id,
    type: 'connectionEdge',
    animated: false,
  }))

  return { nodes, edges }
}
