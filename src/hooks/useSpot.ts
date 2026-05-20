import { nanoid } from 'nanoid'
import { db } from '@/db/db'
import type { Spot } from '@/types/trip'

export function useSpot() {
  async function addSpot(
    locationId: string,
    tripId: string,
    name: string,
    options?: { caption?: string; googlePlaceUrl?: string }
  ): Promise<Spot> {
    const existing = await db.spots.where('locationId').equals(locationId).count()
    const spot: Spot = {
      id: nanoid(),
      locationId,
      tripId,
      name,
      caption: options?.caption,
      googlePlaceUrl: options?.googlePlaceUrl,
      order: existing,
      createdAt: Date.now(),
    }
    await db.spots.add(spot)
    return spot
  }

  async function updateSpot(
    spotId: string,
    updates: Partial<Pick<Spot, 'name' | 'caption' | 'googlePlaceUrl' | 'rating' | 'review' | 'dateFrom' | 'dateTo' | 'coverPhotoId'>>
  ): Promise<void> {
    await db.spots.update(spotId, updates)
  }

  async function deleteSpot(spotId: string): Promise<void> {
    const memories = await db.memories.where('spotId').equals(spotId).toArray()
    await db.transaction('rw', [db.spots, db.memories, db.mediaBlobs], async () => {
      for (const m of memories) {
        if (m.blobKey) await db.mediaBlobs.delete(m.blobKey)
        if (m.thumbnailKey) await db.mediaBlobs.delete(m.thumbnailKey)
      }
      await db.memories.where('spotId').equals(spotId).delete()
      await db.spots.delete(spotId)
    })
  }

  return { addSpot, updateSpot, deleteSpot }
}
