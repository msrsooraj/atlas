export interface CanvasPosition {
  x: number
  y: number
}

export interface CanvasNodeLayout {
  locationId: string
  position: CanvasPosition
  width: number
  height: number
  zIndex: number
}

export interface CanvasViewport {
  x: number
  y: number
  zoom: number
}

export interface CanvasLayout {
  id?: number
  tripId: string
  nodes: CanvasNodeLayout[]
  viewport: CanvasViewport
  updatedAt: number
}

export interface MemoryNodeData {
  locationId: string
  label: string
  memoryCount: number
  coverThumbnail?: string
  [key: string]: unknown
}
