export type MemoryType = 'photo' | 'video' | 'audio' | 'note' | 'link'
export type TransportMode = 'flight' | 'bus' | 'car' | 'train' | 'boat' | 'cruise' | 'walk' | 'other'

export interface Trip {
  id: string
  name: string
  description?: string
  createdAt: number
  updatedAt: number
}

export interface TripLocation {
  id: string
  tripId: string
  name: string
  country?: string
  order: number
  tags: string[]
  caption?: string
  notes?: string
  rating?: number
  review?: string
  dateFrom?: number
  dateTo?: number
  coverPhotoId?: string
  createdAt: number
}

export interface Spot {
  id: string
  locationId?: string
  routeId?: string
  tripId: string
  name: string
  caption?: string
  googlePlaceUrl?: string
  rating?: number
  review?: string
  dateFrom?: number
  dateTo?: number
  coverPhotoId?: string
  order: number
  createdAt: number
}

export interface Memory {
  id: string
  locationId?: string
  tripId: string
  spotId?: string
  routeId?: string
  type: MemoryType
  caption?: string
  externalUrl?: string
  blobKey?: string
  thumbnailKey?: string
  mimeType?: string
  fileName?: string
  fileSize?: number
  createdAt: number
}

export interface Route {
  id: string
  tripId: string
  fromLocationId: string
  toLocationId: string
  order: number
  transport?: TransportMode
  caption?: string
}

export interface MediaBlob {
  key: string
  blob: Blob
  mimeType: string
}
