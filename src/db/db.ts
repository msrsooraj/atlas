import Dexie, { type EntityTable } from 'dexie'
import type { Trip, TripLocation, Spot, Memory, Route, MediaBlob } from '@/types/trip'
import type { CanvasLayout } from '@/types/canvas'

class AtlasDB extends Dexie {
  trips!: EntityTable<Trip, 'id'>
  locations!: EntityTable<TripLocation, 'id'>
  spots!: EntityTable<Spot, 'id'>
  memories!: EntityTable<Memory, 'id'>
  routes!: EntityTable<Route, 'id'>
  canvasLayouts!: EntityTable<CanvasLayout, 'id'>
  mediaBlobs!: EntityTable<MediaBlob, 'key'>

  constructor() {
    super('atlas-db')

    this.version(1).stores({
      trips: 'id, name, createdAt, updatedAt',
      locations: 'id, tripId, order',
      memories: 'id, locationId, tripId, type, createdAt',
      routes: 'id, tripId, fromLocationId, toLocationId, order',
      canvasLayouts: '++id, tripId',
      mediaBlobs: 'key',
    })

    // v2: spots table + spotId index on memories
    this.version(2).stores({
      spots: 'id, locationId, tripId, order',
      memories: 'id, locationId, spotId, tripId, type, createdAt',
    })

    // v3: routeId index on memories (route transit photos); transport on routes
    this.version(3).stores({
      memories: 'id, locationId, spotId, routeId, tripId, type, createdAt',
    })
  }
}

export const db = new AtlasDB()
