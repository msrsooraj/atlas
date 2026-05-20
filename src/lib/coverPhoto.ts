import { db } from '@/db/db'
import type { TripLocation, Spot } from '@/types/trip'

export async function getSpotCoverUrl(spot: Spot): Promise<string | null> {
  // 1. Explicit cover
  if (spot.coverPhotoId) {
    const m = await db.memories.get(spot.coverPhotoId)
    if (m?.thumbnailKey) {
      const blob = await db.mediaBlobs.get(m.thumbnailKey)
      if (blob) return URL.createObjectURL(blob.blob)
    }
  }
  // 2. First photo fallback
  const first = await db.memories
    .where('spotId').equals(spot.id)
    .filter((m) => m.type === 'photo' && !!m.thumbnailKey)
    .first()
  if (first?.thumbnailKey) {
    const blob = await db.mediaBlobs.get(first.thumbnailKey)
    if (blob) return URL.createObjectURL(blob.blob)
  }
  return null
}

// Node cover: explicit coverPhotoId, else first photo from any spot.
// Ungrouped location photos are NEVER used as auto-fallback.
export async function getLocationCoverUrl(location: TripLocation): Promise<string | null> {
  // 1. Explicit cover (can be any photo, including ungrouped)
  if (location.coverPhotoId) {
    const m = await db.memories.get(location.coverPhotoId)
    if (m?.thumbnailKey) {
      const blob = await db.mediaBlobs.get(m.thumbnailKey)
      if (blob) return URL.createObjectURL(blob.blob)
    }
  }
  // 2. First photo from spots only
  const spots = await db.spots.where('locationId').equals(location.id).sortBy('order')
  for (const spot of spots) {
    const photo = await db.memories
      .where('spotId').equals(spot.id)
      .filter((m) => m.type === 'photo' && !!m.thumbnailKey)
      .first()
    if (photo?.thumbnailKey) {
      const blob = await db.mediaBlobs.get(photo.thumbnailKey)
      if (blob) return URL.createObjectURL(blob.blob)
    }
  }
  return null
}
