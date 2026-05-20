import type { Trip, TripLocation, Memory } from '@/types/trip'
import type { CanvasLayout } from '@/types/canvas'
import { db } from '@/db/db'
import { blobToDataURL } from './mediaProcessor'

interface ExportData {
  trip: Trip
  locations: TripLocation[]
  memories: Memory[]
  layout: CanvasLayout | undefined
  thumbnails: Record<string, string>
  originals: Record<string, string>
}

async function collectExportData(tripId: string): Promise<ExportData> {
  const [trip, locations, memories, layout] = await Promise.all([
    db.trips.get(tripId),
    db.locations.where('tripId').equals(tripId).sortBy('order'),
    db.memories.where('tripId').equals(tripId).toArray(),
    db.canvasLayouts.where('tripId').equals(tripId).first(),
  ])

  if (!trip) throw new Error('Trip not found')

  const thumbnails: Record<string, string> = {}
  const originals: Record<string, string> = {}

  for (const memory of memories) {
    if (memory.thumbnailKey) {
      const blob = await db.mediaBlobs.get(memory.thumbnailKey)
      if (blob) thumbnails[memory.thumbnailKey] = await blobToDataURL(blob.blob)
    }
    if (memory.blobKey && memory.type === 'photo') {
      const blob = await db.mediaBlobs.get(memory.blobKey)
      if (blob) originals[memory.blobKey] = await blobToDataURL(blob.blob)
    }
  }

  return { trip, locations, memories, layout, thumbnails, originals }
}

function nodePosition(
  loc: TripLocation,
  index: number,
  layout: CanvasLayout | undefined
): { x: number; y: number } {
  const n = layout?.nodes.find((n) => n.locationId === loc.id)
  if (n) return { x: Math.round(n.position.x * 0.45 + 40), y: Math.round(n.position.y * 0.45 + 80) }
  return { x: index * 340 + 40, y: 80 }
}

function renderMemories(memories: Memory[], thumbnails: Record<string, string>, originals: Record<string, string>): string {
  const photos = memories.filter((m) => m.type === 'photo')
  const notes = memories.filter((m) => m.type === 'note')
  const links = memories.filter((m) => m.type === 'link')

  const photoHTML = photos.map((m) => {
    const src = (m.blobKey && originals[m.blobKey]) || (m.thumbnailKey && thumbnails[m.thumbnailKey]) || ''
    if (!src) return ''
    return `
      <div class="photo-item">
        <img src="${src}" alt="${escapeHtml(m.caption ?? '')}" loading="lazy" onclick="openLightbox(this.src)" />
        ${m.caption ? `<p class="photo-caption">${escapeHtml(m.caption)}</p>` : ''}
      </div>`
  }).join('')

  const notesHTML = notes.map((m) =>
    `<div class="note-item"><p>${escapeHtml(m.caption ?? '')}</p></div>`
  ).join('')

  const linksHTML = links.map((m) =>
    `<a class="link-item" href="${escapeHtml(m.externalUrl ?? '')}" target="_blank" rel="noopener">
      ${escapeHtml(m.caption || m.externalUrl || '')}
    </a>`
  ).join('')

  return `
    ${photos.length > 0 ? `<div class="photos-section"><div class="photo-grid">${photoHTML}</div></div>` : ''}
    ${notes.length > 0 ? `<div class="notes-section">${notesHTML}</div>` : ''}
    ${links.length > 0 ? `<div class="links-section">${linksHTML}</div>` : ''}
  `
}

function renderExportHTML(data: ExportData): string {
  const { trip, locations, memories, layout, thumbnails, originals } = data

  const memoriesByLocation = locations.reduce<Record<string, Memory[]>>((acc, loc) => {
    acc[loc.id] = memories.filter((m) => m.locationId === loc.id)
    return acc
  }, {})

  const canvasWidth = Math.max(
    1400,
    ...locations.map((loc, i) => nodePosition(loc, i, layout).x + 360)
  )
  const canvasHeight = Math.max(
    900,
    ...locations.map((loc, i) => nodePosition(loc, i, layout).y + 500)
  )

  const nodesHTML = locations.map((loc, i) => {
    const { x, y } = nodePosition(loc, i, layout)
    const locMemories = memoriesByLocation[loc.id] ?? []
    const photos = locMemories.filter((m) => m.type === 'photo')
    const coverSrc = photos[0]?.thumbnailKey && thumbnails[photos[0].thumbnailKey]
      ? thumbnails[photos[0].thumbnailKey]
      : ''

    const previewStrip = photos.slice(0, 3).map((m) => {
      const src = m.thumbnailKey && thumbnails[m.thumbnailKey] ? thumbnails[m.thumbnailKey] : ''
      return src ? `<img src="${src}" class="preview-thumb" alt="" />` : ''
    }).join('')

    const memContent = renderMemories(locMemories, thumbnails, originals)
    const hasContent = locMemories.length > 0

    return `
      <div class="node" id="node-${i}" style="left:${x}px;top:${y}px" onclick="toggleNode(this, event)">
        ${coverSrc ? `
          <div class="node-cover">
            <img src="${coverSrc}" alt="" />
          </div>` : `
          <div class="node-cover-placeholder">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor" opacity="0.5"/>
            </svg>
          </div>`}

        <div class="node-body">
          <div class="node-header">
            <div>
              <div class="node-label">${escapeHtml(loc.name)}</div>
              <div class="node-meta">${locMemories.length} memor${locMemories.length !== 1 ? 'ies' : 'y'}</div>
            </div>
            ${hasContent ? `<span class="expand-icon" aria-hidden="true">+</span>` : ''}
          </div>

          ${previewStrip ? `<div class="preview-strip">${previewStrip}</div>` : ''}
        </div>

        ${hasContent ? `
          <div class="node-expanded">
            ${memContent}
          </div>` : ''}
      </div>`
  }).join('\n')

  // Route lines as SVG overlay
  const svgLines = locations.slice(0, -1).map((loc, i) => {
    const from = nodePosition(loc, i, layout)
    const to = nodePosition(locations[i + 1]!, i + 1, layout)
    const fx = from.x + 140
    const fy = from.y + 200
    const tx = to.x + 140
    const ty = to.y + 20
    const cy = (fy + ty) / 2
    return `<path d="M${fx},${fy} C${fx},${cy} ${tx},${cy} ${tx},${ty}" stroke="var(--border-strong)" stroke-width="1.5" stroke-dasharray="5 4" fill="none" />`
  }).join('\n')

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(trip.name)} — Atlas</title>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #0a0a0f;
  --surface: rgba(255,255,255,0.05);
  --surface-raised: rgba(18,18,28,0.95);
  --border: rgba(255,255,255,0.08);
  --border-strong: rgba(255,255,255,0.14);
  --text: #f0ede8;
  --muted: #9a9a9a;
  --accent: #f59e0b;
  --accent-soft: rgba(245,158,11,0.12);
  --radius: 20px;
  --dot: rgba(255,255,255,0.06);
}
[data-theme="light"] {
  --bg: #f5f0e8;
  --surface: rgba(255,255,255,0.9);
  --surface-raised: rgba(255,255,255,0.98);
  --border: rgba(0,0,0,0.08);
  --border-strong: rgba(0,0,0,0.14);
  --text: #1a1a1a;
  --muted: #6b6b6b;
  --accent: #c1440e;
  --accent-soft: rgba(193,68,14,0.1);
  --dot: rgba(0,0,0,0.08);
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
  overflow-x: auto;
}

/* Header */
header {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 18px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--surface-raised);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(20px);
}
.brand { font-size: 0.72rem; font-weight: 800; letter-spacing: 0.14em; color: var(--accent); }
header h1 { font-size: 1.1rem; font-weight: 700; letter-spacing: -0.02em; }
header p { font-size: 0.78rem; color: var(--muted); margin-top: 2px; }
.theme-btn {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 99px;
  padding: 6px 14px;
  cursor: pointer;
  color: var(--muted);
  font-size: 0.75rem;
}

/* Canvas */
.canvas-wrap { overflow: auto; position: relative; }
.canvas {
  position: relative;
  width: ${canvasWidth}px;
  height: ${canvasHeight}px;
  background-image: radial-gradient(circle, var(--dot) 1px, transparent 1px);
  background-size: 28px 28px;
}
.canvas svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }

/* Node */
.node {
  position: absolute;
  width: 280px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  backdrop-filter: blur(16px);
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
  box-shadow: 0 4px 24px rgba(0,0,0,0.2);
}
.node:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.3); border-color: var(--border-strong); }
.node.active { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-soft), 0 8px 32px rgba(0,0,0,0.3); }

.node-cover { height: 110px; overflow: hidden; }
.node-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
.node-cover-placeholder { height: 64px; background: var(--accent-soft); display: flex; align-items: center; justify-content: center; color: var(--accent); }

.node-body { padding: 14px 16px 16px; }
.node-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.node-label { font-size: 0.9rem; font-weight: 600; color: var(--text); letter-spacing: -0.01em; }
.node-meta { font-size: 0.7rem; color: var(--accent); margin-top: 3px; font-weight: 500; }
.expand-icon { font-size: 1.1rem; color: var(--muted); flex-shrink: 0; transition: transform 0.2s; user-select: none; }
.node.active .expand-icon { transform: rotate(45deg); color: var(--accent); }

.preview-strip { display: flex; gap: 3px; margin-top: 10px; border-radius: 8px; overflow: hidden; }
.preview-thumb { width: 33.33%; aspect-ratio: 1; object-fit: cover; display: block; flex: 1; }

/* Expanded content */
.node-expanded { display: none; border-top: 1px solid var(--border); padding: 16px; }
.node.active .node-expanded { display: block; }

.photos-section { margin-bottom: 12px; }
.photo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
.photo-item { position: relative; }
.photo-item img { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; border-radius: 6px; cursor: zoom-in; transition: opacity 0.15s; }
.photo-item img:hover { opacity: 0.9; }
.photo-caption { font-size: 0.7rem; color: var(--muted); margin-top: 4px; padding: 0 2px; }

.notes-section { margin-bottom: 10px; }
.note-item { background: var(--accent-soft); border-radius: 8px; padding: 10px 12px; margin-bottom: 6px; }
.note-item p { font-size: 0.82rem; color: var(--text); line-height: 1.6; }

.links-section { display: flex; flex-direction: column; gap: 6px; }
.link-item { display: block; padding: 8px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; text-decoration: none; font-size: 0.78rem; color: var(--accent); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Lightbox */
#lightbox {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.9);
  z-index: 9999;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
  padding: 32px;
}
#lightbox.open { display: flex; }
#lightbox img { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px; }

/* Footer */
footer { padding: 24px 32px; color: var(--muted); font-size: 0.75rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; }
footer a { color: var(--accent); text-decoration: none; }

/* Hint */
.hint {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: 99px;
  padding: 8px 18px;
  font-size: 0.75rem;
  color: var(--muted);
  backdrop-filter: blur(12px);
  pointer-events: none;
  animation: fadeout 4s 3s forwards;
}
@keyframes fadeout { to { opacity: 0; } }
</style>
</head>
<body>

<header>
  <div>
    <div class="brand">ATLAS</div>
    <h1>${escapeHtml(trip.name)}</h1>
    <p>${locations.length} location${locations.length !== 1 ? 's' : ''} · ${new Date(trip.createdAt).toLocaleDateString()}</p>
  </div>
  <button class="theme-btn" onclick="toggleTheme()">Toggle theme</button>
</header>

<div class="canvas-wrap">
  <div class="canvas">
    <svg><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="var(--border-strong)"/></marker></defs>
    ${svgLines}
    </svg>
    ${nodesHTML}
  </div>
</div>

<!-- Lightbox -->
<div id="lightbox" onclick="closeLightbox()">
  <img id="lightbox-img" src="" alt="" />
</div>

<div class="hint">Click any location to expand its memories</div>

<footer>
  <span>Exported from Atlas</span>
  <a href="https://github.com" onclick="return false;">Made with Atlas</a>
</footer>

<script>
function toggleNode(el, event) {
  if (event.target.closest('a')) return;
  const wasActive = el.classList.contains('active');
  document.querySelectorAll('.node.active').forEach(n => n.classList.remove('active'));
  if (!wasActive) el.classList.add('active');
}

function openLightbox(src) {
  event.stopPropagation();
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox').classList.add('open');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeLightbox();
    document.querySelectorAll('.node.active').forEach(n => n.classList.remove('active'));
  }
});

function toggleTheme() {
  const html = document.documentElement;
  html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
}
</script>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function exportTripAsHTML(tripId: string): Promise<void> {
  const data = await collectExportData(tripId)
  const html = renderExportHTML(data)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${data.trip.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-atlas.html`
  a.click()
  URL.revokeObjectURL(url)
}
