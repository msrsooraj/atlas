import { db } from '@/db/db'
import type { Trip, TripLocation, Spot, Memory, Route } from '@/types/trip'
import type { CanvasLayout } from '@/types/canvas'

const BACKUP_VERSION = 2

interface SerializedBlob {
  key: string
  mimeType: string
  data: string // base64, no data-url prefix
}

export interface AtlasBackup {
  version: number
  exportedAt: number
  trip: Trip
  locations: TripLocation[]
  spots: Spot[]
  memories: Memory[]
  routes: Route[]
  canvasLayout: Omit<CanvasLayout, 'id'> | null
  mediaBlobs: SerializedBlob[]
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(data: string, mimeType: string): Blob {
  const bytes = atob(data)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: mimeType })
}

export async function exportTrip(tripId: string): Promise<void> {
  const trip = await db.trips.get(tripId)
  if (!trip) throw new Error('Trip not found')

  const [locations, spots, memories, routes] = await Promise.all([
    db.locations.where('tripId').equals(tripId).toArray(),
    db.spots.where('tripId').equals(tripId).toArray(),
    db.memories.where('tripId').equals(tripId).toArray(),
    db.routes.where('tripId').equals(tripId).toArray(),
  ])

  const layout = await db.canvasLayouts.where('tripId').equals(tripId).first()

  // Collect all blob keys referenced by memories
  const blobKeys = new Set<string>()
  for (const m of memories) {
    if (m.blobKey) blobKeys.add(m.blobKey)
    if (m.thumbnailKey) blobKeys.add(m.thumbnailKey)
  }

  const serializedBlobs: SerializedBlob[] = []
  for (const key of blobKeys) {
    const record = await db.mediaBlobs.get(key)
    if (record) {
      const data = await blobToBase64(record.blob)
      serializedBlobs.push({ key, mimeType: record.mimeType, data })
    }
  }

  // Strip auto-increment id from canvas layout
  let canvasLayout: Omit<CanvasLayout, 'id'> | null = null
  if (layout) {
    const { id: _id, ...rest } = layout
    canvasLayout = rest
  }

  const backup: AtlasBackup = {
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    trip,
    locations,
    spots,
    memories,
    routes,
    canvasLayout,
    mediaBlobs: serializedBlobs,
  }

  const json = JSON.stringify(backup)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const safeName = trip.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  const date = new Date().toISOString().split('T')[0]
  a.href = url
  a.download = `${safeName}_${date}.atlas`
  a.click()
  URL.revokeObjectURL(url)
}

export type ImportResult =
  | { status: 'success'; tripId: string; tripName: string; isOverwrite: boolean }
  | { status: 'conflict'; tripName: string; existingName: string; backup: AtlasBackup }
  | { status: 'error'; message: string }

export async function parseBackupFile(file: File): Promise<AtlasBackup> {
  const text = await file.text()
  const data = JSON.parse(text) as AtlasBackup
  if (!data.version || !data.trip || !data.locations) {
    throw new Error('Invalid .atlas file')
  }
  return data
}

export async function restoreBackup(backup: AtlasBackup, overwrite: boolean): Promise<void> {
  const tripId = backup.trip.id

  await db.transaction('rw', [
    db.trips, db.locations, db.spots, db.memories,
    db.routes, db.canvasLayouts, db.mediaBlobs,
  ], async () => {
    if (overwrite) {
      await db.trips.delete(tripId)
      await db.locations.where('tripId').equals(tripId).delete()
      await db.spots.where('tripId').equals(tripId).delete()
      await db.memories.where('tripId').equals(tripId).delete()
      await db.routes.where('tripId').equals(tripId).delete()
      await db.canvasLayouts.where('tripId').equals(tripId).delete()
    }

    await db.trips.add(backup.trip)
    if (backup.locations.length) await db.locations.bulkAdd(backup.locations)
    if (backup.spots.length) await db.spots.bulkAdd(backup.spots)
    if (backup.memories.length) await db.memories.bulkAdd(backup.memories)
    if (backup.routes.length) await db.routes.bulkAdd(backup.routes)

    if (backup.canvasLayout) {
      await db.canvasLayouts.add(backup.canvasLayout)
    }

    for (const serialized of backup.mediaBlobs) {
      const blob = base64ToBlob(serialized.data, serialized.mimeType)
      await db.mediaBlobs.put({ key: serialized.key, blob, mimeType: serialized.mimeType })
    }
  })
}

export async function checkImport(file: File): Promise<ImportResult> {
  try {
    const backup = await parseBackupFile(file)
    const existing = await db.trips.get(backup.trip.id)
    if (existing) {
      return { status: 'conflict', tripName: backup.trip.name, existingName: existing.name, backup }
    }
    await restoreBackup(backup, false)
    return { status: 'success', tripId: backup.trip.id, tripName: backup.trip.name, isOverwrite: false }
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Unknown error' }
  }
}
