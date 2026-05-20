import { nanoid } from 'nanoid'
import { db } from '@/db/db'
import type { Trip, TripLocation, Route } from '@/types/trip'
import type { LocationItem } from '@/components/creation/LocationListEditor'
import { useTripStore } from '@/store/tripStore'

export function useTrip() {
  const { activeTripId, setActiveTripId } = useTripStore()

  async function createTrip(
    name: string,
    locationNames: string[]
  ): Promise<string> {
    const tripId = nanoid()
    const now = Date.now()

    const trip: Trip = {
      id: tripId,
      name,
      createdAt: now,
      updatedAt: now,
    }

    const locations: TripLocation[] = locationNames.map((locName, i) => ({
      id: nanoid(),
      tripId,
      name: locName,
      order: i,
      tags: [],
      createdAt: now,
    }))

    const routes: Route[] = locations.slice(0, -1).map((_, i) => ({
      id: nanoid(),
      tripId,
      fromLocationId: locations[i]!.id,
      toLocationId: locations[i + 1]!.id,
      order: i,
    }))

    await db.transaction('rw', [db.trips, db.locations, db.routes], async () => {
      await db.trips.add(trip)
      await db.locations.bulkAdd(locations)
      if (routes.length) await db.routes.bulkAdd(routes)
    })

    setActiveTripId(tripId)
    return tripId
  }

  async function deleteTrip(tripId: string): Promise<void> {
    await db.transaction('rw', [db.trips, db.locations, db.memories, db.routes, db.canvasLayouts], async () => {
      await db.trips.delete(tripId)
      await db.locations.where('tripId').equals(tripId).delete()
      await db.memories.where('tripId').equals(tripId).delete()
      await db.routes.where('tripId').equals(tripId).delete()
      await db.canvasLayouts.where('tripId').equals(tripId).delete()
    })
    if (activeTripId === tripId) {
      const remaining = await db.trips.orderBy('createdAt').last()
      setActiveTripId(remaining?.id ?? null)
    }
  }

  async function addLocation(tripId: string, name: string): Promise<void> {
    const now = Date.now()
    const locationId = nanoid()

    const existing = await db.locations.where('tripId').equals(tripId).sortBy('order')
    const lastLocation = existing[existing.length - 1]
    const newOrder = existing.length

    const newLocation: TripLocation = {
      id: locationId,
      tripId,
      name,
      order: newOrder,
      tags: [],
      createdAt: now,
    }

    // Smart canvas position: offset from last known node
    const layout = await db.canvasLayouts.where('tripId').equals(tripId).first()
    let newPosition = { x: 80, y: 80 }

    if (layout && layout.nodes.length > 0) {
      const lastCanvasNode = lastLocation
        ? layout.nodes.find((n) => n.locationId === lastLocation.id)
        : null

      if (lastCanvasNode) {
        newPosition = {
          x: lastCanvasNode.position.x + 380,
          y: lastCanvasNode.position.y,
        }
      } else {
        const maxX = Math.max(...layout.nodes.map((n) => n.position.x))
        newPosition = { x: maxX + 380, y: layout.nodes[0]!.position.y }
      }
    }

    const newCanvasNode = {
      locationId,
      position: newPosition,
      width: 280,
      height: 180,
      zIndex: 1,
    }

    await db.transaction('rw', [db.locations, db.routes, db.canvasLayouts], async () => {
      await db.locations.add(newLocation)

      if (lastLocation) {
        await db.routes.add({
          id: nanoid(),
          tripId,
          fromLocationId: lastLocation.id,
          toLocationId: locationId,
          order: newOrder - 1,
        })
      }

      if (layout?.id != null) {
        await db.canvasLayouts.update(layout.id, {
          nodes: [...layout.nodes, newCanvasNode],
          updatedAt: now,
        })
      } else {
        await db.canvasLayouts.add({
          tripId,
          nodes: [newCanvasNode],
          viewport: { x: 0, y: 0, zoom: 1 },
          updatedAt: now,
        })
      }
    })
  }

  async function saveLocationChanges(tripId: string, orderedItems: LocationItem[]): Promise<void> {
    const now = Date.now()
    const layout = await db.canvasLayouts.where('tripId').equals(tripId).first()

    // Separate existing vs new
    const existingItems = orderedItems.filter((it) => it.isExisting && it.name.trim())
    const newItems = orderedItems.filter((it) => !it.isExisting && it.name.trim())

    // Build new location records for new items
    const newLocations: TripLocation[] = newItems.map((it, i) => ({
      id: it.id,
      tripId,
      name: it.name.trim(),
      order: existingItems.length + i,
      tags: [],
      createdAt: now,
    }))

    // Smart canvas positions for new nodes
    const existingCanvasNodes = layout?.nodes ?? []
    const lastExistingCanvasNode = existingItems.length > 0
      ? existingCanvasNodes.find((n) => n.locationId === existingItems[existingItems.length - 1]!.id)
      : existingCanvasNodes[existingCanvasNodes.length - 1]

    const newCanvasNodes = newLocations.map((loc, i) => {
      const baseX = lastExistingCanvasNode ? lastExistingCanvasNode.position.x : 80
      const baseY = lastExistingCanvasNode ? lastExistingCanvasNode.position.y : 80
      return {
        locationId: loc.id,
        position: { x: baseX + (i + 1) * 380, y: baseY },
        width: 280,
        height: 180,
        zIndex: 1,
      }
    })

    // All ordered location ids in new order
    const allOrderedIds = orderedItems
      .filter((it) => it.name.trim())
      .map((it) => it.id)

    await db.transaction('rw', [db.locations, db.routes, db.canvasLayouts], async () => {
      // Update order for all existing locations
      for (let i = 0; i < orderedItems.length; i++) {
        const it = orderedItems[i]!
        if (it.isExisting && it.name.trim()) {
          await db.locations.update(it.id, { order: i, name: it.name.trim() })
        }
      }

      // Add new locations
      if (newLocations.length > 0) {
        await db.locations.bulkAdd(newLocations)
      }

      // Rebuild all routes in new order
      await db.routes.where('tripId').equals(tripId).delete()
      const routes: Route[] = allOrderedIds.slice(0, -1).map((id, i) => ({
        id: nanoid(),
        tripId,
        fromLocationId: id,
        toLocationId: allOrderedIds[i + 1]!,
        order: i,
      }))
      if (routes.length) await db.routes.bulkAdd(routes)

      // Update canvas layout
      if (newCanvasNodes.length > 0) {
        const allNodes = [...existingCanvasNodes, ...newCanvasNodes]
        if (layout?.id != null) {
          await db.canvasLayouts.update(layout.id, { nodes: allNodes, updatedAt: now })
        } else {
          await db.canvasLayouts.add({
            tripId,
            nodes: allNodes,
            viewport: { x: 0, y: 0, zoom: 1 },
            updatedAt: now,
          })
        }
      }
    })
  }

  return { createTrip, deleteTrip, addLocation, saveLocationChanges }
}
