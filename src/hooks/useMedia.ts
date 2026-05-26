import { nanoid } from 'nanoid'
import { db } from '@/db/db'
import type { Memory } from '@/types/trip'
import { generateThumbnail, isImageFile } from '@/lib/mediaProcessor'

export function useMedia() {
  async function uploadRouteFiles(
    files: File[],
    routeId: string,
    tripId: string
  ): Promise<Memory[]> {
    const now = Date.now()
    const memories: Memory[] = []

    for (const file of files) {
      const memoryId = nanoid()
      const blobKey = `blob-${memoryId}`
      let thumbnailKey: string | undefined
      let type: Memory['type'] = 'note'

      if (isImageFile(file)) {
        type = 'photo'
        const thumbKey = `thumb-${memoryId}`
        const thumbnail = await generateThumbnail(file)
        await db.mediaBlobs.add({ key: thumbKey, blob: thumbnail, mimeType: 'image/jpeg' })
        thumbnailKey = thumbKey
      } else if (file.type.startsWith('video/')) {
        type = 'video'
      } else if (file.type.startsWith('audio/')) {
        type = 'audio'
      }

      await db.mediaBlobs.add({ key: blobKey, blob: file, mimeType: file.type })

      const memory: Memory = {
        id: memoryId,
        routeId,
        tripId,
        type,
        blobKey,
        thumbnailKey,
        mimeType: file.type,
        fileName: file.name,
        fileSize: file.size,
        createdAt: now,
      }

      await db.memories.add(memory)
      memories.push(memory)
    }

    return memories
  }

  async function uploadFiles(
    files: File[],
    locationId: string | undefined,
    tripId: string,
    spotId?: string
  ): Promise<Memory[]> {
    const now = Date.now()
    const memories: Memory[] = []

    for (const file of files) {
      const memoryId = nanoid()
      const blobKey = `blob-${memoryId}`
      let thumbnailKey: string | undefined
      let type: Memory['type'] = 'note'

      if (isImageFile(file)) {
        type = 'photo'
        const thumbKey = `thumb-${memoryId}`
        const thumbnail = await generateThumbnail(file)
        await db.mediaBlobs.add({ key: thumbKey, blob: thumbnail, mimeType: 'image/jpeg' })
        thumbnailKey = thumbKey
      } else if (file.type.startsWith('video/')) {
        type = 'video'
      } else if (file.type.startsWith('audio/')) {
        type = 'audio'
      }

      await db.mediaBlobs.add({ key: blobKey, blob: file, mimeType: file.type })

      const memory: Memory = {
        id: memoryId,
        locationId,
        tripId,
        spotId,
        type,
        blobKey,
        thumbnailKey,
        mimeType: file.type,
        fileName: file.name,
        fileSize: file.size,
        createdAt: now,
      }

      await db.memories.add(memory)
      memories.push(memory)
    }

    return memories
  }

  async function addNote(
    caption: string,
    locationId: string,
    tripId: string,
    spotId?: string
  ): Promise<Memory> {
    const memory: Memory = {
      id: nanoid(),
      locationId,
      tripId,
      spotId,
      type: 'note',
      caption,
      createdAt: Date.now(),
    }
    await db.memories.add(memory)
    return memory
  }

  async function addLink(
    url: string,
    caption: string | undefined,
    locationId: string,
    tripId: string
  ): Promise<Memory> {
    const memory: Memory = {
      id: nanoid(),
      locationId,
      tripId,
      type: 'link',
      externalUrl: url,
      caption,
      createdAt: Date.now(),
    }
    await db.memories.add(memory)
    return memory
  }

  async function updateCaption(memoryId: string, caption: string): Promise<void> {
    await db.memories.update(memoryId, { caption })
  }

  async function deleteMemory(memoryId: string): Promise<void> {
    const memory = await db.memories.get(memoryId)
    if (!memory) return
    await db.memories.delete(memoryId)
    if (memory.blobKey) await db.mediaBlobs.delete(memory.blobKey)
    if (memory.thumbnailKey) await db.mediaBlobs.delete(memory.thumbnailKey)
  }

  async function getBlobURL(key: string): Promise<string | null> {
    const blob = await db.mediaBlobs.get(key)
    if (!blob) return null
    return URL.createObjectURL(blob.blob)
  }

  return { uploadFiles, uploadRouteFiles, addNote, addLink, updateCaption, deleteMemory, getBlobURL }
}
