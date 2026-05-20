import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { MediaThumbnail } from '@/components/media/MediaThumbnail'
import { DropZone } from '@/components/media/DropZone'
import { useMedia } from '@/hooks/useMedia'
import type { TripLocation } from '@/types/trip'

interface MediaGalleryProps {
  location: TripLocation
}

export function MediaGallery({ location }: MediaGalleryProps) {
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [isAddingLink, setIsAddingLink] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkCaption, setLinkCaption] = useState('')
  const { addNote, addLink, deleteMemory } = useMedia()

  const memories = useLiveQuery(
    () => db.memories.where('locationId').equals(location.id).filter((m) => !m.spotId).sortBy('createdAt'),
    [location.id]
  )

  const handleAddNote = async () => {
    if (!noteText.trim()) return
    await addNote(noteText.trim(), location.id, location.tripId)
    setNoteText('')
    setIsAddingNote(false)
  }

  const handleAddLink = async () => {
    if (!linkUrl.trim()) return
    await addLink(linkUrl.trim(), linkCaption.trim() || undefined, location.id, location.tripId)
    setLinkUrl('')
    setLinkCaption('')
    setIsAddingLink(false)
  }

  const setNodeCover = async (memoryId: string) => {
    await db.locations.update(location.id, { coverPhotoId: memoryId })
  }

  const photos = memories?.filter((m) => m.type === 'photo') ?? []
  const others = memories?.filter((m) => m.type !== 'photo') ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <DropZone locationId={location.id} tripId={location.tripId} />

      {photos.length > 0 && (
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 10 }}>
            PHOTOS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {photos.map((memory) => (
              <MediaThumbnail
                key={memory.id}
                memory={memory}
                onDelete={() => deleteMemory(memory.id)}
                onSetCover={() => setNodeCover(memory.id)}
                isCover={location.coverPhotoId === memory.id}
                showCaption
              />
            ))}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 10 }}>
            NOTES & LINKS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {others.map((memory) => (
              <MediaThumbnail key={memory.id} memory={memory} onDelete={() => deleteMemory(memory.id)} />
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <ActionButton onClick={() => { setIsAddingNote(true); setIsAddingLink(false) }}>+ Note</ActionButton>
        <ActionButton onClick={() => { setIsAddingLink(true); setIsAddingNote(false) }}>+ Link</ActionButton>
      </div>

      <AnimatePresence>
        {isAddingNote && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
            <textarea
              autoFocus value={noteText} onChange={(e) => setNoteText(e.target.value)}
              placeholder="Write your memory…" rows={3}
              style={{ width: '100%', padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem', resize: 'none', outline: 'none', lineHeight: 1.6, marginBottom: 8 }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <SmallButton onClick={() => setIsAddingNote(false)}>Cancel</SmallButton>
              <SmallButton accent onClick={handleAddNote}>Save</SmallButton>
            </div>
          </motion.div>
        )}

        {isAddingLink && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input autoFocus value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" style={inputStyle} />
            <input value={linkCaption} onChange={(e) => setLinkCaption(e.target.value)} placeholder="Label (optional)" style={inputStyle} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <SmallButton onClick={() => setIsAddingLink(false)}>Cancel</SmallButton>
              <SmallButton accent onClick={handleAddLink}>Save</SmallButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', background: 'var(--surface)',
  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none',
}

function ActionButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ padding: '7px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 99, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, transition: 'all var(--transition)' }}>
      {children}
    </button>
  )
}

function SmallButton({ onClick, children, accent }: { onClick: () => void; children: React.ReactNode; accent?: boolean }) {
  return (
    <button onClick={onClick} style={{ padding: '6px 16px', background: accent ? 'var(--accent)' : 'none', border: `1px solid ${accent ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 99, color: accent ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500 }}>
      {children}
    </button>
  )
}
