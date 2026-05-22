import type { Trip, TripLocation, Spot, Memory, Route } from '@/types/trip'
import type { CanvasLayout } from '@/types/canvas'
import { db } from '@/db/db'
import { blobToDataURL } from './mediaProcessor'

interface ExportData {
  trip: Trip
  locations: TripLocation[]
  spots: Spot[]
  memories: Memory[]
  routes: Route[]
  layout: CanvasLayout | undefined
  images: Record<string, string>
  locationCovers: Record<string, string>
  spotCovers: Record<string, string>
}

async function collectTripData(tripId: string): Promise<ExportData | null> {
  const [trip, locations, spots, memories, routes, layout] = await Promise.all([
    db.trips.get(tripId),
    db.locations.where('tripId').equals(tripId).sortBy('order'),
    db.spots.where('tripId').equals(tripId).toArray(),
    db.memories.where('tripId').equals(tripId).toArray(),
    db.routes.where('tripId').equals(tripId).sortBy('order'),
    db.canvasLayouts.where('tripId').equals(tripId).first(),
  ])

  if (!trip) return null

  const keys = new Set<string>()
  for (const m of memories) {
    if (m.thumbnailKey) keys.add(m.thumbnailKey)
    if (m.blobKey) keys.add(m.blobKey)
  }

  const images: Record<string, string> = {}
  for (const key of keys) {
    const rec = await db.mediaBlobs.get(key)
    if (rec) images[key] = await blobToDataURL(rec.blob)
  }

  const spotsByLocation: Record<string, Spot[]> = {}
  for (const s of spots) (spotsByLocation[s.locationId] ??= []).push(s)

  const memoriesBySpot: Record<string, Memory[]> = {}
  for (const m of memories) {
    if (m.spotId) (memoriesBySpot[m.spotId] ??= []).push(m)
  }

  const locationCovers: Record<string, string> = {}
  for (const loc of locations) {
    if (loc.coverPhotoId) {
      const m = await db.memories.get(loc.coverPhotoId)
      if (m?.thumbnailKey && images[m.thumbnailKey]) { locationCovers[loc.id] = images[m.thumbnailKey]; continue }
    }
    for (const spot of (spotsByLocation[loc.id] ?? []).sort((a, b) => a.order - b.order)) {
      const photo = (memoriesBySpot[spot.id] ?? []).find(m => m.type === 'photo' && m.thumbnailKey && images[m.thumbnailKey])
      if (photo?.thumbnailKey) { locationCovers[loc.id] = images[photo.thumbnailKey]; break }
    }
  }

  const spotCovers: Record<string, string> = {}
  for (const spot of spots) {
    if (spot.coverPhotoId) {
      const m = await db.memories.get(spot.coverPhotoId)
      if (m?.thumbnailKey && images[m.thumbnailKey]) { spotCovers[spot.id] = images[m.thumbnailKey]; continue }
    }
    const first = (memoriesBySpot[spot.id] ?? []).find(m => m.type === 'photo' && m.thumbnailKey && images[m.thumbnailKey])
    if (first?.thumbnailKey) spotCovers[spot.id] = images[first.thumbnailKey]
  }

  return { trip, locations, spots, memories, routes, layout, images, locationCovers, spotCovers }
}

function serialiseTrip(data: ExportData): string {
  const { trip, locations, spots, memories, routes, layout, images, locationCovers, spotCovers } = data

  const memoriesStripped = memories.map(m => ({
    id: m.id,
    locationId: m.locationId ?? null,
    spotId: m.spotId ?? null,
    routeId: m.routeId ?? null,
    type: m.type, caption: m.caption ?? null,
    externalUrl: m.externalUrl ?? null,
    thumb: m.thumbnailKey ? (images[m.thumbnailKey] ?? null) : null,
    full: m.blobKey ? (images[m.blobKey] ?? null) : (m.thumbnailKey ? (images[m.thumbnailKey] ?? null) : null),
  }))

  const spotsData = spots.map(s => ({
    id: s.id, locationId: s.locationId, name: s.name,
    caption: s.caption ?? null, rating: s.rating ?? null,
    review: s.review ?? null, dateFrom: s.dateFrom ?? null, dateTo: s.dateTo ?? null,
    googlePlaceUrl: s.googlePlaceUrl ?? null, order: s.order,
    cover: spotCovers[s.id] ?? null,
  }))

  const locData = locations.map(loc => ({
    id: loc.id, name: loc.name, order: loc.order,
    caption: loc.caption ?? null, rating: loc.rating ?? null,
    review: loc.review ?? null, dateFrom: loc.dateFrom ?? null, dateTo: loc.dateTo ?? null,
    cover: locationCovers[loc.id] ?? null,
  }))

  const layoutData = layout ? {
    viewport: layout.viewport,
    nodes: layout.nodes,
  } : null

  return JSON.stringify({
    trip: { id: trip.id, name: trip.name, createdAt: trip.createdAt },
    locations: locData,
    spots: spotsData,
    memories: memoriesStripped,
    routes: routes.map(r => ({ id: r.id, fromLocationId: r.fromLocationId, toLocationId: r.toLocationId, transport: r.transport ?? null, caption: r.caption ?? null, order: r.order })),
    layout: layoutData,
    locationCovers,
    spotCovers,
  })
}

function renderSiteHTML(allData: ExportData[]): string {
  const allTripsJSON = `[${allData.map(serialiseTrip).join(',\n')}]`

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Atlas — My Journeys</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0a0a0f;--surface:rgba(255,255,255,.05);--surface-raised:rgba(18,18,28,.97);
  --border:rgba(255,255,255,.08);--border-strong:rgba(255,255,255,.16);
  --text:#f0ede8;--muted:#9a9a9a;--accent:#f59e0b;--accent-soft:rgba(245,158,11,.12);
  --radius:20px;--dot:rgba(255,255,255,.05);--shadow:0 4px 24px rgba(0,0,0,.3);
}
[data-theme=light]{
  --bg:#f5f0e8;--surface:rgba(255,255,255,.9);--surface-raised:rgba(255,255,255,.98);
  --border:rgba(0,0,0,.08);--border-strong:rgba(0,0,0,.16);
  --text:#1a1a1a;--muted:#6b6b6b;--accent:#c1440e;--accent-soft:rgba(193,68,14,.1);
  --dot:rgba(0,0,0,.06);--shadow:0 4px 24px rgba(0,0,0,.1);
}
html,body{height:100%;overflow:hidden;background:var(--bg);color:var(--text);
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased}

/* ── SHARED HEADER ── */
.site-hdr{
  position:fixed;top:0;left:0;right:0;z-index:200;height:56px;
  display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding:0 24px;background:var(--surface-raised);border-bottom:1px solid var(--border);
  backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
}
.brand{font-size:.68rem;font-weight:800;letter-spacing:.14em;color:var(--accent)}
.hdr-right{display:flex;align-items:center;gap:6px}
.hdr-btn{
  display:flex;align-items:center;gap:5px;padding:5px 12px;
  background:none;border:1px solid var(--border);border-radius:99px;
  cursor:pointer;color:var(--muted);font-size:.75rem;transition:.15s;
}
.hdr-btn:hover,.hdr-btn.active{border-color:var(--accent);color:var(--accent);background:var(--accent-soft)}
.hdr-back{
  display:flex;align-items:center;gap:6px;padding:5px 12px;
  background:none;border:1px solid var(--border);border-radius:99px;
  cursor:pointer;color:var(--muted);font-size:.75rem;transition:.15s;
}
.hdr-back:hover{border-color:var(--border-strong);color:var(--text)}
.hdr-sep{width:1px;height:20px;background:var(--border)}
.hdr-trip-name{font-size:.9rem;font-weight:600;letter-spacing:-.015em;color:var(--text)}

/* ── GALLERY ── */
#gallery{position:fixed;inset:0;top:56px;overflow-y:auto;display:block}
#gallery-inner{max-width:1100px;margin:0 auto;padding:40px 24px 80px}
.gallery-heading{font-size:1.5rem;font-weight:700;letter-spacing:-.03em;color:var(--text);margin-bottom:8px}
.gallery-sub{font-size:.88rem;color:var(--muted);margin-bottom:32px}
#trip-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px}
.trip-card{
  background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);
  overflow:hidden;cursor:pointer;transition:transform .18s,border-color .18s,box-shadow .18s;
  box-shadow:var(--shadow);
}
.trip-card:hover{transform:translateY(-3px) scale(1.01);border-color:var(--border-strong);box-shadow:0 8px 40px rgba(0,0,0,.35)}
.trip-card-cover{height:160px;overflow:hidden;background:var(--accent-soft)}
.trip-card-cover img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .3s}
.trip-card:hover .trip-card-cover img{transform:scale(1.04)}
.trip-card-cover-ph{
  height:100%;display:flex;align-items:center;justify-content:center;
  color:var(--accent);font-size:2.5rem;opacity:.4;
  background:linear-gradient(135deg,var(--accent-soft),transparent);
}
.trip-card-body{padding:14px 18px 18px}
.trip-card-name{font-size:1rem;font-weight:700;letter-spacing:-.02em;color:var(--text);margin-bottom:5px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.trip-card-meta{font-size:.72rem;color:var(--muted);display:flex;gap:6px;flex-wrap:wrap}
.trip-card-dates{font-size:.72rem;color:var(--muted);margin-top:3px;font-style:italic}
.empty-gallery{
  text-align:center;padding:80px 24px;color:var(--muted);
  font-size:.88rem;line-height:1.7;
}

/* ── VIEWER ── */
#viewer{position:fixed;inset:0;top:56px;display:none}

/* ── CANVAS MODE ── */
#canvas-mode{position:absolute;inset:0}
#canvas-wrap{
  position:absolute;inset:0;overflow:hidden;cursor:grab;user-select:none;
  background-image:radial-gradient(circle,var(--dot) 1px,transparent 1px);
  background-size:28px 28px;
}
#canvas-wrap.dragging{cursor:grabbing}
#canvas{position:absolute;top:0;left:0;transform-origin:0 0}

/* ── NODES ── */
.node{
  position:absolute;width:280px;background:var(--surface);border:1px solid var(--border);
  border-radius:var(--radius);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  overflow:hidden;cursor:pointer;transition:border-color .2s,box-shadow .2s,transform .3s;
  box-shadow:var(--shadow);transform:scale(var(--hs,1));transform-origin:top left;
}
.node:hover{transform:scale(var(--hs,1)) translateY(-2px);border-color:var(--border-strong)}
.node.active{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-soft),var(--shadow)}
.node-cover{height:120px;overflow:hidden}
.node-cover img{width:100%;height:100%;object-fit:cover;display:block}
.node-cover-ph{height:72px;background:var(--accent-soft);display:flex;align-items:center;justify-content:center;color:var(--accent)}
.node-body{padding:12px 16px 14px}
.node-name{font-size:.9rem;font-weight:600;color:var(--text);letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.node-meta{font-size:.7rem;color:var(--muted);margin-top:4px;display:flex;gap:6px}

/* ── SIDE PANEL ── */
#panel-bd{position:absolute;inset:0;z-index:100;display:none}
#panel-bd.open{display:block}
#panel{
  position:absolute;top:0;right:0;bottom:0;width:400px;z-index:101;
  display:flex;flex-direction:column;background:var(--surface-raised);
  border-left:1px solid var(--border);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  box-shadow:-8px 0 40px rgba(0,0,0,.2);
  transform:translateX(100%);transition:transform .3s cubic-bezier(.17,.84,.44,1);
}
#panel.open{transform:translateX(0)}
#panel-hdr{padding:18px 18px 14px;border-bottom:1px solid var(--border);flex-shrink:0}
#panel-body{flex:1;overflow-y:auto;padding:18px 18px 40px}
.pnl-close{position:absolute;top:16px;right:16px;background:var(--surface);border:1px solid var(--border);
  border-radius:99px;width:28px;height:28px;cursor:pointer;color:var(--muted);
  display:flex;align-items:center;justify-content:center;font-size:.9rem}
.pnl-loc-name{font-size:1rem;font-weight:700;letter-spacing:-.02em;color:var(--text);padding-right:36px}
.pnl-caption{font-size:.8rem;color:var(--muted);font-style:italic;margin-top:5px;line-height:1.55}
.pnl-review{font-size:.82rem;color:var(--text);line-height:1.6;margin-top:8px}
.pnl-meta-row{display:flex;align-items:center;gap:10px;margin-top:8px;flex-wrap:wrap}
.pnl-date{font-size:.72rem;color:var(--muted)}
.stars{color:var(--accent);font-size:.8rem;letter-spacing:1px}
.star-empty{opacity:.25}
.sec-label{font-size:.65rem;font-weight:700;letter-spacing:.1em;color:var(--muted);margin:16px 0 8px}
.photo-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:12px}
.photo-grid.three{grid-template-columns:1fr 1fr 1fr}
.photo-wrap{position:relative;cursor:zoom-in}
.photo-wrap img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block;border-radius:6px;transition:opacity .15s}
.photo-wrap img:hover{opacity:.88}
.photo-cap{font-size:.68rem;color:var(--muted);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.note-card{background:var(--accent-soft);border-radius:8px;padding:10px 12px;margin-bottom:6px;font-size:.82rem;color:var(--text);line-height:1.6}
.link-card{display:block;padding:9px 12px;background:var(--surface);border:1px solid var(--border);
  border-radius:8px;text-decoration:none;font-size:.78rem;color:var(--accent);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:5px}
.spot-card{border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:10px;background:var(--surface)}
.spot-hdr{padding:11px 14px;background:var(--surface-raised);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px}
.spot-icon{width:26px;height:26px;border-radius:50%;background:var(--accent-soft);border:1px solid var(--accent);
  display:flex;align-items:center;justify-content:center;flex-shrink:0}
.spot-name{font-size:.86rem;font-weight:600;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.spot-glink{display:flex;align-items:center;gap:3px;padding:3px 8px;background:var(--accent-soft);
  border:1px solid var(--accent);border-radius:99px;text-decoration:none;font-size:.65rem;color:var(--accent);font-weight:600;flex-shrink:0}
.spot-body{padding:12px 14px}

/* ── ALBUM MODE ── */
#album-mode{
  position:absolute;inset:0;overflow-y:auto;display:none;
  background:var(--bg);
}
#album-inner{max-width:760px;margin:0 auto;padding:28px 20px 80px}
.alb-section{border:1px solid var(--border);border-radius:16px;background:var(--surface);overflow:hidden;margin-bottom:24px}
.alb-sec-hdr{padding:18px 22px 16px;background:var(--surface-raised);border-bottom:1px solid var(--border);display:flex;align-items:flex-start;gap:14px}
.alb-pin{width:36px;height:36px;border-radius:50%;background:var(--accent-soft);border:1px solid var(--accent);
  display:flex;align-items:center;justify-content:center;flex-shrink:0}
.alb-sec-info{flex:1}
.alb-sec-name{font-size:1.05rem;font-weight:700;letter-spacing:-.02em;color:var(--text)}
.alb-sec-body{padding:14px 22px 18px}
.alb-spot-hdr{display:flex;align-items:center;gap:10px;margin:14px 0 8px}
.alb-spot-dot{width:6px;height:6px;border-radius:50%;background:var(--accent);flex-shrink:0}
.alb-spot-name{font-size:.84rem;font-weight:600;color:var(--text)}
.alb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:6px;margin-bottom:6px}
.alb-photo{position:relative;cursor:zoom-in}
.alb-photo img{width:100%;aspect-ratio:1;object-fit:cover;display:block;border-radius:7px;transition:opacity .15s}
.alb-photo img:hover{opacity:.88}
.alb-photo-cap{position:absolute;bottom:0;left:0;right:0;padding:3px 5px;background:linear-gradient(transparent,rgba(0,0,0,.55));
  font-size:.6rem;color:#fff;border-radius:0 0 7px 7px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.empty-notice{font-size:.78rem;color:var(--muted);font-style:italic;text-align:center;padding:20px 0}

/* ── LIGHTBOX ── */
#lb{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.92);
  display:none;flex-direction:column;align-items:center;justify-content:center;cursor:zoom-out}
#lb.open{display:flex}
#lb-img{max-width:90vw;max-height:85vh;object-fit:contain;border-radius:10px;display:block}
#lb-cap{margin-top:10px;font-size:.82rem;color:rgba(255,255,255,.65);max-width:600px;text-align:center;line-height:1.5}
#lb-count{margin-top:6px;font-size:.7rem;color:rgba(255,255,255,.35)}
.lb-nav{position:fixed;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.1);
  border:1px solid rgba(255,255,255,.2);border-radius:99px;width:38px;height:38px;
  cursor:pointer;color:#fff;font-size:1.4rem;display:flex;align-items:center;justify-content:center;z-index:10000}
.lb-nav:disabled{opacity:.2;cursor:default}
#lb-prev{left:16px}#lb-next{right:16px}
#lb-close{position:fixed;top:16px;right:16px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);
  border-radius:99px;width:34px;height:34px;cursor:pointer;color:#fff;font-size:.95rem;
  display:flex;align-items:center;justify-content:center;z-index:10000}
</style>
<style id="heat-style"></style>
</head>
<body>

<!-- Shared header -->
<header class="site-hdr">
  <div style="display:flex;align-items:center;gap:14px">
    <div class="brand">ATLAS</div>
    <button class="hdr-back" id="back-btn" onclick="backToGallery()" style="display:none">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      All Journeys
    </button>
    <span class="hdr-trip-name" id="viewer-title" style="display:none"></span>
  </div>
  <div class="hdr-right" id="hdr-controls">
    <!-- Gallery controls -->
    <div id="gallery-controls">
      <button class="hdr-btn" onclick="toggleTheme()">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    </div>
    <!-- Viewer controls -->
    <div id="viewer-controls" style="display:none;align-items:center;gap:6px">
      <button class="hdr-btn active" id="btn-canvas" onclick="setMode('canvas')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2"/><path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        Canvas
      </button>
      <button class="hdr-btn" id="btn-album" onclick="setMode('album')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/></svg>
        Photo Reel
      </button>
      <div class="hdr-sep"></div>
      <div id="heat-btns" style="display:none;align-items:center;gap:3px">
        <button class="hdr-btn" id="heat-none" onclick="setHeatmapMode('none')" title="Equal size">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="2"/><rect x="13" y="7" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="2"/></svg>
        </button>
        <button class="hdr-btn active" id="heat-rating" onclick="setHeatmapMode('rating')" title="Size by rating">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button class="hdr-btn" id="heat-time" onclick="setHeatmapMode('time')" title="Size by time spent">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button class="hdr-btn" id="heat-agg" onclick="setHeatmapMode('aggregate')" title="Rating + time">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
      <button class="hdr-btn" id="btn-arrange" onclick="cycleArrange()" style="display:none" title="Cycle layout">
        <svg id="arrange-icon" width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" stroke-width="2"/><rect x="15" y="3" width="6" height="6" rx="1" stroke="currentColor" stroke-width="2"/><rect x="9" y="15" width="6" height="6" rx="1" stroke="currentColor" stroke-width="2"/><path d="M6 9v3h12V9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="12" x2="12" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <span id="arrange-label">Grid</span>
      </button>
      <div class="hdr-sep"></div>
      <button class="hdr-btn" onclick="toggleTheme()">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    </div>
  </div>
</header>

<!-- Gallery section -->
<div id="gallery">
  <div id="gallery-inner">
    <h1 class="gallery-heading">My Journeys</h1>
    <p class="gallery-sub">Click a journey to explore it.</p>
    <div id="trip-grid"></div>
  </div>
</div>

<!-- Viewer section -->
<div id="viewer">
  <div id="canvas-mode">
    <div id="canvas-wrap">
      <div id="canvas"></div>
    </div>
    <div id="panel-bd" onclick="handleBdClick(event)">
      <div id="panel">
        <button class="pnl-close" onclick="closePanel()">×</button>
        <div id="panel-hdr"></div>
        <div id="panel-body"></div>
      </div>
    </div>
  </div>
  <div id="album-mode"></div>
</div>

<!-- Lightbox -->
<div id="lb" onclick="lbClickOutside(event)">
  <button class="lb-nav" id="lb-prev" onclick="lbNav(-1,event)">‹</button>
  <div style="display:flex;flex-direction:column;align-items:center">
    <img id="lb-img" src="" alt=""/>
    <div id="lb-cap"></div>
    <div id="lb-count"></div>
  </div>
  <button class="lb-nav" id="lb-next" onclick="lbNav(1,event)">›</button>
  <button id="lb-close" onclick="closeLb()">×</button>
</div>

<script>
const ALL_TRIPS = ${allTripsJSON};

// Active trip state
let DATA = null;
let locMap = {}, spotsByLoc = {}, memsByLoc = {}, memsBySpot = {};
let albumBuilt = false;

// Pan/zoom state
let tx = 60, ty = 60, sc = 0.9;
let dragging = false, lx = 0, ly = 0;

// Lightbox state
let lbPhotos = [], lbIdx = 0;
window.lbCurrent = [];

// ── Helpers ──────────────────────────────────────────────────────────────────
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function starsHTML(r) {
  if (!r) return '';
  return '<span class="stars">'+'★'.repeat(r)+'<span class="star-empty">'+'☆'.repeat(5-r)+'</span></span>';
}
function dateRng(from, to) {
  if (!from && !to) return '';
  const fmt = ts => new Date(ts).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  if (from && !to) return fmt(from);
  if (!from && to) return 'Until '+fmt(to);
  return fmt(from)+' – '+fmt(to);
}
function getNodePos(locationId, index) {
  if (!DATA || !DATA.layout) return { x: index * 380 + 60, y: 100 };
  const n = (DATA.layout.nodes ?? []).find(n => n.locationId === locationId);
  return n ? n.position : { x: index * 380 + 60, y: 100 };
}

// ── Lookups ───────────────────────────────────────────────────────────────────
let memsByRoute = {};
function initLookups() {
  locMap = Object.fromEntries(DATA.locations.map(l => [l.id, l]));
  spotsByLoc = {}; memsByLoc = {}; memsBySpot = {}; memsByRoute = {};
  DATA.spots.forEach(s => { (spotsByLoc[s.locationId] ??= []).push(s); });
  DATA.memories.forEach(m => {
    if (m.locationId) (memsByLoc[m.locationId] ??= []).push(m);
    if (m.spotId) (memsBySpot[m.spotId] ??= []).push(m);
    if (m.routeId) (memsByRoute[m.routeId] ??= []).push(m);
  });
}

// ── Gallery ───────────────────────────────────────────────────────────────────
function buildGallery() {
  const grid = document.getElementById('trip-grid');
  if (!ALL_TRIPS.length) {
    grid.innerHTML = '<div class="empty-gallery">No journeys in this export.</div>';
    return;
  }
  grid.innerHTML = ALL_TRIPS.map((t, i) => {
    const coverLocId = t.locations[0]?.id;
    const cover = coverLocId ? t.locationCovers[coverLocId] : null;
    const locCount = t.locations.length;
    const photoCount = t.memories.filter(m => m.type === 'photo').length;
    const allTs = t.locations.flatMap(l => [l.dateFrom, l.dateTo]).filter(Boolean).sort((a,b) => a-b);
    const dateStr = allTs.length ? dateRng(allTs[0], allTs[allTs.length-1]) : '';
    return '<div class="trip-card" onclick="openTrip('+i+')">'
      +'<div class="trip-card-cover">'+(cover ? '<img src="'+cover+'" alt=""/>' : '<div class="trip-card-cover-ph">✦</div>')+'</div>'
      +'<div class="trip-card-body">'
      +'<div class="trip-card-name">'+esc(t.trip.name)+'</div>'
      +'<div class="trip-card-meta">'
      +'<span>'+locCount+' location'+(locCount!==1?'s':'')+'</span>'
      +(photoCount ? '<span>· '+photoCount+' photo'+(photoCount!==1?'s':'')+'</span>' : '')
      +'</div>'
      +(dateStr ? '<div class="trip-card-dates">'+esc(dateStr)+'</div>' : '')
      +'</div></div>';
  }).join('');
}

// ── Trip viewer ───────────────────────────────────────────────────────────────
function openTrip(idx) {
  DATA = ALL_TRIPS[idx];
  initLookups();
  albumBuilt = false;
  document.getElementById('album-mode').innerHTML = '';

  document.getElementById('viewer-title').textContent = DATA.trip.name;
  document.getElementById('viewer-title').style.display = '';
  document.getElementById('back-btn').style.display = '';
  document.getElementById('gallery').style.display = 'none';
  document.getElementById('viewer').style.display = 'block';
  document.getElementById('gallery-controls').style.display = 'none';
  document.getElementById('viewer-controls').style.display = 'flex';

  renderCanvas();
  setMode('canvas');
  closePanel();
  applyHeatmap();
}

function backToGallery() {
  closePanel();
  closeLb();
  DATA = null;
  document.getElementById('viewer').style.display = 'none';
  document.getElementById('gallery').style.display = 'block';
  document.getElementById('back-btn').style.display = 'none';
  document.getElementById('viewer-title').style.display = 'none';
  document.getElementById('gallery-controls').style.display = '';
  document.getElementById('viewer-controls').style.display = 'none';
}

// ── Canvas rendering ──────────────────────────────────────────────────────────
const canvasEl = document.getElementById('canvas');
const wrap = document.getElementById('canvas-wrap');

function renderCanvas() {
  const { locations, locationCovers } = DATA;
  const positions = locations.map((l, i) => getNodePos(l.id, i));
  const maxX = Math.max(1800, ...positions.map(p => p.x + 500));
  const maxY = Math.max(1000, ...positions.map(p => p.y + 400));
  canvasEl.style.width = maxX + 'px';
  canvasEl.style.height = maxY + 'px';

  // SVG routes — dynamic handle selection matching the app behaviour
  const routeIdx = Object.fromEntries(locations.map((l, i) => [l.id, i]));
  const TRANSPORT_ICONS = {flight:'✈️',bus:'🚌',car:'🚗',train:'🚂',boat:'⛵',cruise:'🛳️',walk:'🚶',other:'🗺️'};
  const NW=280, NH=180;
  function edgePoints(fp, tp) {
    const dx=(tp.x+NW/2)-(fp.x+NW/2), dy=(tp.y+NH/2)-(fp.y+NH/2);
    if(Math.abs(dx)>=Math.abs(dy)) {
      return dx>=0
        ? {sx:fp.x+NW,sy:fp.y+NH/2,tx:tp.x,ty:tp.y+NH/2}
        : {sx:fp.x,sy:fp.y+NH/2,tx:tp.x+NW,ty:tp.y+NH/2};
    }
    return dy>=0
      ? {sx:fp.x+NW/2,sy:fp.y+NH,tx:tp.x+NW/2,ty:tp.y}
      : {sx:fp.x+NW/2,sy:fp.y,tx:tp.x+NW/2,ty:tp.y+NH};
  }
  let svgPaths = '';
  let routeBadgesHTML = '';
  (DATA.routes ?? []).forEach(r => {
    const fi = routeIdx[r.fromLocationId];
    const ti = routeIdx[r.toLocationId];
    if (fi === undefined || ti === undefined) return;
    const fp = getNodePos(r.fromLocationId, fi);
    const tp = getNodePos(r.toLocationId, ti);
    const {sx,sy,tx2:ex,ty2:ey} = (({sx,sy,tx:tx2,ty:ty2})=>({sx,sy,tx2,ty2}))(edgePoints(fp,tp));
    const cx=(sx+ex)/2, cy2=(sy+ey)/2;
    svgPaths += '<path d="M'+sx+','+sy+' C'+((sx+cx)/1.4+cx/3.6)+','+sy+' '+((ex+cx)/1.4+cx/3.6)+','+ey+' '+ex+','+ey+'" stroke="var(--border-strong)" stroke-width="1.5" stroke-dasharray="5 4" fill="none"/>';
    // Route badge
    const routePhotos = (memsByRoute[r.id] ?? []).filter(m => m.type==='photo');
    const icon = r.transport ? TRANSPORT_ICONS[r.transport] : null;
    if (icon || routePhotos.length) {
      const badge = (icon ? '<span style="font-size:.82rem">'+icon+'</span>' : '') + (routePhotos.length ? '<span style="color:var(--accent);font-weight:600;font-size:.68rem">'+routePhotos.length+'</span>' : '');
      routeBadgesHTML += '<div style="position:absolute;left:'+(cx-28)+'px;top:'+(cy2-11)+'px;background:var(--surface-raised);border:1px solid var(--border);border-radius:99px;padding:3px 9px;display:flex;align-items:center;gap:4px;backdrop-filter:blur(12px);pointer-events:none">'+badge+'</div>';
    }
  });

  // Nodes
  const pinSVG = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor" opacity=".5"/></svg>';
  let nodesHTML = '';
  locations.forEach((loc, i) => {
    const pos = getNodePos(loc.id, i);
    const cover = locationCovers[loc.id];
    const locSpots = (spotsByLoc[loc.id] ?? []).length;
    const memCount = (memsByLoc[loc.id] ?? []).length;
    nodesHTML += '<div class="node" id="nd-'+esc(loc.id)+'" style="left:'+pos.x+'px;top:'+pos.y+'px" data-lid="'+esc(loc.id)+'">'
      +(cover ? '<div class="node-cover"><img src="'+cover+'" alt=""/></div>' : '<div class="node-cover-ph">'+pinSVG+'</div>')
      +'<div class="node-body">'
      +'<div class="node-name">'+esc(loc.name)+'</div>'
      +'<div class="node-meta">'
      +'<span>'+memCount+' memor'+(memCount!==1?'ies':'y')+'</span>'
      +(locSpots ? '<span>· '+locSpots+' spot'+(locSpots!==1?'s':'')+'</span>' : '')
      +'</div></div></div>';
  });

  canvasEl.innerHTML = '<svg style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible">'+svgPaths+'</svg>'+routeBadgesHTML+nodesHTML;

  document.querySelectorAll('.node').forEach(node => {
    node.addEventListener('click', () => openPanel(node.dataset.lid));
  });

  const vp = DATA.layout?.viewport ?? { x: 60, y: 60, zoom: 0.9 };
  tx = vp.x; ty = vp.y; sc = vp.zoom;
  applyT();
}

// ── Pan / Zoom ────────────────────────────────────────────────────────────────
function applyT() {
  canvasEl.style.transform = 'translate('+tx+'px,'+ty+'px) scale('+sc+')';
}

wrap.addEventListener('wheel', e => {
  e.preventDefault();
  const rect = wrap.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  const delta = e.deltaY < 0 ? 1.08 : 0.93;
  const nsc = Math.max(0.08, Math.min(5, sc * delta));
  tx = mx - (mx - tx) * (nsc / sc);
  ty = my - (my - ty) * (nsc / sc);
  sc = nsc; applyT();
}, { passive: false });

wrap.addEventListener('mousedown', e => {
  if (e.target.closest('.node')) return;
  dragging = true; lx = e.clientX; ly = e.clientY;
  wrap.classList.add('dragging');
});
window.addEventListener('mousemove', e => {
  if (!dragging) return;
  tx += e.clientX-lx; ty += e.clientY-ly; lx = e.clientX; ly = e.clientY; applyT();
});
window.addEventListener('mouseup', () => { dragging = false; wrap.classList.remove('dragging'); });

// ── Panel ─────────────────────────────────────────────────────────────────────
let activeNode = null;
function openPanel(lid) {
  const loc = locMap[lid]; if (!loc) return;
  activeNode = lid;
  document.querySelectorAll('.node.active').forEach(n => n.classList.remove('active'));
  const el = document.getElementById('nd-'+lid);
  if (el) el.classList.add('active');

  const mems = memsByLoc[lid] ?? [];
  const ungrouped = mems.filter(m => !m.spotId);
  const locSpots = (spotsByLoc[lid] ?? []).slice().sort((a,b) => a.order - b.order);

  let hdr = '<div style="display:flex;align-items:flex-start;gap:10px">';
  hdr += '<div class="alb-pin" style="flex-shrink:0;margin-top:2px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="var(--accent)"/></svg></div>';
  hdr += '<div style="flex:1;min-width:0"><div class="pnl-loc-name">'+esc(loc.name)+'</div>';
  if (loc.caption) hdr += '<div class="pnl-caption">'+esc(loc.caption)+'</div>';
  let meta = '';
  if (loc.rating) meta += starsHTML(loc.rating);
  const dr = dateRng(loc.dateFrom, loc.dateTo);
  if (dr) meta += '<span class="pnl-date">'+esc(dr)+'</span>';
  if (meta) hdr += '<div class="pnl-meta-row">'+meta+'</div>';
  if (loc.review) hdr += '<div class="pnl-review">'+esc(loc.review)+'</div>';
  hdr += '</div></div>';
  document.getElementById('panel-hdr').innerHTML = hdr;

  let body = '';
  const allLbPhotos = [];

  const ugPhotos = ungrouped.filter(m => m.type === 'photo' && m.thumb);
  if (ugPhotos.length) {
    body += '<div class="sec-label">PHOTOS</div><div class="photo-grid">';
    ugPhotos.forEach(m => {
      const idx = allLbPhotos.length; allLbPhotos.push(m);
      body += '<div class="photo-wrap" onclick="openLb('+idx+',lbCurrent)"><img src="'+m.thumb+'" alt="'+(m.caption?esc(m.caption):'')+'"/>'+(m.caption?'<div class="photo-cap">'+esc(m.caption)+'</div>':'')+'</div>';
    });
    body += '</div>';
  }

  const ugNotes = ungrouped.filter(m => m.type === 'note');
  const ugLinks = ungrouped.filter(m => m.type === 'link');
  if (ugNotes.length || ugLinks.length) {
    body += '<div class="sec-label">NOTES & LINKS</div>';
    ugNotes.forEach(m => { body += '<div class="note-card">'+esc(m.caption??'')+'</div>'; });
    ugLinks.forEach(m => { body += '<a class="link-card" href="'+esc(m.externalUrl??'')+'" target="_blank" rel="noopener">'+esc(m.caption||m.externalUrl||'')+'</a>'; });
  }

  if (locSpots.length) {
    body += '<div class="sec-label">SPOTS</div>';
    locSpots.forEach(spot => {
      const spotMems = memsBySpot[spot.id] ?? [];
      const spotPhotos = spotMems.filter(m => m.type === 'photo' && m.thumb);
      body += '<div class="spot-card"><div class="spot-hdr">';
      body += '<div class="spot-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="var(--accent)"/></svg></div>';
      body += '<span class="spot-name">'+esc(spot.name)+'</span>';
      if (spot.googlePlaceUrl) body += '<a class="spot-glink" href="'+esc(spot.googlePlaceUrl)+'" target="_blank" rel="noopener" onclick="event.stopPropagation()"><svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Google</a>';
      body += '</div><div class="spot-body">';
      if (spot.caption) body += '<div style="font-style:italic;font-size:.8rem;color:var(--muted);margin-bottom:8px">'+esc(spot.caption)+'</div>';
      let smeta = '';
      if (spot.rating) smeta += starsHTML(spot.rating);
      const sdr = dateRng(spot.dateFrom, spot.dateTo);
      if (sdr) smeta += '<span class="pnl-date">'+esc(sdr)+'</span>';
      if (smeta) body += '<div class="pnl-meta-row" style="margin-bottom:8px">'+smeta+'</div>';
      if (spot.review) body += '<div class="pnl-review" style="margin-bottom:8px">'+esc(spot.review)+'</div>';
      if (spotPhotos.length) {
        body += '<div class="photo-grid three">';
        spotPhotos.forEach(m => {
          const idx = allLbPhotos.length; allLbPhotos.push(m);
          body += '<div class="photo-wrap" onclick="openLb('+idx+',lbCurrent)"><img src="'+m.thumb+'" alt="'+(m.caption?esc(m.caption):'')+'"/>'+(m.caption?'<div class="photo-cap">'+esc(m.caption)+'</div>':'')+'</div>';
        });
        body += '</div>';
      }
      body += '</div></div>';
    });
  }

  window.lbCurrent = allLbPhotos;
  document.getElementById('panel-body').innerHTML = body;
  document.getElementById('panel-bd').classList.add('open');
  document.getElementById('panel').classList.add('open');
}

function closePanel() {
  document.getElementById('panel-bd').classList.remove('open');
  document.getElementById('panel').classList.remove('open');
  if (activeNode) {
    const el = document.getElementById('nd-'+activeNode);
    if (el) el.classList.remove('active');
    activeNode = null;
  }
}
function handleBdClick(e) {
  if (!e.target.closest('#panel')) closePanel();
}

// ── Album ─────────────────────────────────────────────────────────────────────
function buildAlbum() {
  if (albumBuilt) return; albumBuilt = true;
  const allAlbumPhotos = [];
  let html = '';
  DATA.locations.forEach(loc => {
    const locSpots = (spotsByLoc[loc.id] ?? []).slice().sort((a,b) => a.order - b.order);
    const ungrouped = (memsByLoc[loc.id] ?? []).filter(m => !m.spotId && m.type==='photo' && m.thumb);
    const hasContent = ungrouped.length > 0 || locSpots.some(s => (memsBySpot[s.id]??[]).some(m => m.type==='photo' && m.thumb));
    if (!hasContent) return;
    html += '<div class="alb-section"><div class="alb-sec-hdr">';
    html += '<div class="alb-pin"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="var(--accent)"/></svg></div>';
    html += '<div class="alb-sec-info"><div class="alb-sec-name">'+esc(loc.name)+'</div>';
    let smeta = '';
    if (loc.rating) smeta += starsHTML(loc.rating);
    const dr = dateRng(loc.dateFrom, loc.dateTo);
    if (dr) smeta += '<span class="pnl-date">'+esc(dr)+'</span>';
    if (smeta) html += '<div class="pnl-meta-row" style="margin-top:5px">'+smeta+'</div>';
    if (loc.caption) html += '<div class="pnl-caption">'+esc(loc.caption)+'</div>';
    if (loc.review) html += '<div class="pnl-review">'+esc(loc.review)+'</div>';
    html += '</div></div><div class="alb-sec-body">';
    if (ungrouped.length) {
      html += '<div class="alb-grid">';
      ungrouped.forEach(m => {
        const idx = allAlbumPhotos.length; allAlbumPhotos.push(m);
        html += '<div class="alb-photo" onclick="openLb('+idx+',albPhotos)"><img src="'+m.thumb+'" alt=""/>'+(m.caption?'<div class="alb-photo-cap">'+esc(m.caption)+'</div>':'')+'</div>';
      });
      html += '</div>';
    }
    locSpots.forEach(spot => {
      const sPhotos = (memsBySpot[spot.id]??[]).filter(m => m.type==='photo' && m.thumb);
      if (!sPhotos.length) return;
      html += '<div class="alb-spot-hdr"><div class="alb-spot-dot"></div><div class="alb-spot-name">'+esc(spot.name)+'</div>';
      if (spot.rating) html += starsHTML(spot.rating);
      html += '</div>';
      if (spot.caption) html += '<div style="font-size:.78rem;color:var(--muted);font-style:italic;margin-bottom:8px">'+esc(spot.caption)+'</div>';
      html += '<div class="alb-grid">';
      sPhotos.forEach(m => {
        const idx = allAlbumPhotos.length; allAlbumPhotos.push(m);
        html += '<div class="alb-photo" onclick="openLb('+idx+',albPhotos)"><img src="'+m.thumb+'" alt=""/>'+(m.caption?'<div class="alb-photo-cap">'+esc(m.caption)+'</div>':'')+'</div>';
      });
      html += '</div>';
    });
    html += '</div></div>';

    // Transit section: outgoing route from this location
    const outRoute = (DATA.routes ?? []).find(r => r.fromLocationId === loc.id);
    if (outRoute) {
      const toLocName = locMap[outRoute.toLocationId]?.name;
      const routePhotos = (memsByRoute[outRoute.id] ?? []).filter(m => m.type==='photo' && m.thumb);
      const TICONS = {flight:'✈️',bus:'🚌',car:'🚗',train:'🚂',boat:'⛵',cruise:'🛳️',walk:'🚶',other:'🗺️'};
      if (outRoute.transport || outRoute.caption || routePhotos.length) {
        html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;margin:0 4px">';
        html += '<div style="flex:1;height:1px;background:var(--border)"></div>';
        if (outRoute.transport) html += '<span style="font-size:1.1rem">'+TICONS[outRoute.transport]+'</span>';
        if (toLocName) html += '<span style="font-size:.7rem;color:var(--muted)">→ '+esc(toLocName)+'</span>';
        html += '<div style="flex:1;height:1px;background:var(--border)"></div>';
        html += '</div>';
        if (outRoute.caption) html += '<div style="font-size:.78rem;color:var(--muted);font-style:italic;text-align:center;padding:0 8px 8px">'+esc(outRoute.caption)+'</div>';
        if (routePhotos.length) {
          html += '<div class="alb-grid" style="margin-bottom:16px">';
          routePhotos.forEach(m => {
            const idx = allAlbumPhotos.length; allAlbumPhotos.push(m);
            html += '<div class="alb-photo" onclick="openLb('+idx+',albPhotos)"><img src="'+m.thumb+'" alt=""/>'+(m.caption?'<div class="alb-photo-cap">'+esc(m.caption)+'</div>':'')+'</div>';
          });
          html += '</div>';
        }
      }
    }
  });
  if (!html) html = '<div class="empty-notice">No photos in this journey.</div>';
  window.albPhotos = allAlbumPhotos;
  document.getElementById('album-mode').innerHTML = '<div id="album-inner">'+html+'</div>';
}

// ── Mode switching ─────────────────────────────────────────────────────────────
function setMode(mode) {
  const isCanvas = mode === 'canvas';
  document.getElementById('canvas-mode').style.display = isCanvas ? 'block' : 'none';
  document.getElementById('album-mode').style.display = isCanvas ? 'none' : 'block';
  document.getElementById('btn-canvas').classList.toggle('active', isCanvas);
  document.getElementById('btn-album').classList.toggle('active', !isCanvas);
  document.getElementById('heat-btns').style.display = isCanvas ? 'flex' : 'none';
  document.getElementById('btn-arrange').style.display = isCanvas ? '' : 'none';
  if (!isCanvas) { buildAlbum(); closePanel(); }
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function openLb(idx, photos) {
  event.stopPropagation();
  lbPhotos = photos; lbIdx = idx;
  showLbPhoto();
  document.getElementById('lb').classList.add('open');
}
function showLbPhoto() {
  const m = lbPhotos[lbIdx];
  document.getElementById('lb-img').src = m.full || m.thumb || '';
  document.getElementById('lb-cap').textContent = m.caption || '';
  document.getElementById('lb-count').textContent = (lbIdx+1)+' / '+lbPhotos.length;
  document.getElementById('lb-prev').disabled = lbIdx === 0;
  document.getElementById('lb-next').disabled = lbIdx === lbPhotos.length - 1;
}
function lbNav(dir, e) { e.stopPropagation(); lbIdx = Math.max(0, Math.min(lbPhotos.length-1, lbIdx+dir)); showLbPhoto(); }
function closeLb() { document.getElementById('lb').classList.remove('open'); }
function lbClickOutside(e) { if (!e.target.closest('#lb-img')) closeLb(); }

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeLb(); closePanel(); }
  if (document.getElementById('lb').classList.contains('open')) {
    if (e.key === 'ArrowLeft') lbNav(-1, e);
    if (e.key === 'ArrowRight') lbNav(1, e);
  }
});

// ── Heatmap ───────────────────────────────────────────────────────────────────
let heatmapMode = 'rating';
function computeHeatScales() {
  if (!DATA || heatmapMode === 'none') return {};
  const msPerDay = 86400000;
  const timeOf = it => (it.dateFrom && it.dateTo) ? Math.max(0, (it.dateTo - it.dateFrom) / msPerDay) : 0;
  const items = [...DATA.locations, ...DATA.spots];
  let raws;
  if (heatmapMode === 'rating') {
    raws = items.map(it => it.rating ?? 0);
  } else if (heatmapMode === 'time') {
    raws = items.map(timeOf);
  } else {
    const ratings = items.map(it => it.rating ?? 0);
    const times = items.map(timeOf);
    const maxR = Math.max(...ratings, 1), maxT = Math.max(...times, 1);
    raws = items.map((_, i) => ratings[i] / maxR + times[i] / maxT);
  }
  const min = Math.min(...raws), max = Math.max(...raws);
  const scales = {};
  items.forEach((it, i) => { scales[it.id] = min === max ? 1 : 0.5 + (raws[i] - min) / (max - min) * 1.0; });
  return scales;
}
function applyHeatmap() {
  if (!DATA) return;
  const scales = computeHeatScales();
  let css = '';
  DATA.locations.forEach(loc => {
    const s = (scales[loc.id] ?? 1).toFixed(3);
    css += '#nd-' + loc.id + '{--hs:' + s + '}';
    css += '#nd-' + loc.id + ':hover{transform:scale(' + s + ') translateY(-2px)}';
  });
  document.getElementById('heat-style').textContent = css;
}
function setHeatmapMode(mode) {
  heatmapMode = mode;
  const modeToId = { none:'heat-none', rating:'heat-rating', time:'heat-time', aggregate:'heat-agg' };
  ['heat-none','heat-rating','heat-time','heat-agg'].forEach(id => {
    document.getElementById(id).classList.toggle('active', modeToId[mode] === id);
  });
  applyHeatmap();
}

// ── Auto-arrange ──────────────────────────────────────────────────────────────
let exportArrangeMode = 'manual';
let savedLayoutNodes = null;

function arrangeTopoOrder() {
  const locs = DATA.locations, routes = DATA.routes ?? [];
  const incoming = {}, outgoing = {};
  locs.forEach(l => { incoming[l.id] = 0; outgoing[l.id] = []; });
  routes.forEach(r => {
    incoming[r.toLocationId] = (incoming[r.toLocationId] ?? 0) + 1;
    if (outgoing[r.fromLocationId]) outgoing[r.fromLocationId].push(r.toLocationId);
  });
  const queue = locs.filter(l => (incoming[l.id] ?? 0) === 0).map(l => l.id);
  const order = [], visited = new Set();
  while (queue.length) {
    const id = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id); order.push(id);
    (outgoing[id] ?? []).forEach(next => { incoming[next]--; if (incoming[next] === 0) queue.push(next); });
  }
  locs.forEach(l => { if (!visited.has(l.id)) order.push(l.id); });
  return order;
}

function applyArrangeLayout(mode) {
  const locs = DATA.locations, H = 380, V = 260, order = arrangeTopoOrder(), posMap = {};
  if (mode === 'grid') {
    const cols = Math.max(1, Math.ceil(Math.sqrt(order.length)));
    order.forEach((id, i) => { const col = i % cols, row = Math.floor(i / cols); posMap[id] = { x: row % 2 === 0 ? col * H + 80 : (cols - 1 - col) * H + 80, y: row * V + 80 }; });
  } else {
    order.forEach((id, i) => { posMap[id] = { x: i * H + 80, y: 80 }; });
  }
  if (!DATA.layout) DATA.layout = { nodes: [], viewport: { x: 60, y: 60, zoom: 0.9 } };
  DATA.layout.nodes = locs.map(l => ({ locationId: l.id, position: posMap[l.id] ?? { x: 0, y: 0 }, width: 280, height: 180, zIndex: 1 }));
  renderCanvas(); applyHeatmap();
  const positions = locs.map((l, i) => getNodePos(l.id, i)), pad = 80;
  const minX = Math.min(...positions.map(p => p.x)) - pad, minY = Math.min(...positions.map(p => p.y)) - pad;
  const maxX = Math.max(...positions.map(p => p.x + 280)) + pad, maxY = Math.max(...positions.map(p => p.y + 180)) + pad;
  const wRect = wrap.getBoundingClientRect();
  sc = Math.min(wRect.width / (maxX - minX), wRect.height / (maxY - minY), 1.5);
  tx = wRect.width / 2 - (minX + (maxX - minX) / 2) * sc;
  ty = wRect.height / 2 - (minY + (maxY - minY) / 2) * sc;
  applyT();
}

function cycleArrange() {
  if (!DATA) return;
  const cycle = ['manual', 'grid', 'line'];
  const next = cycle[(cycle.indexOf(exportArrangeMode) + 1) % cycle.length];
  if (exportArrangeMode === 'manual') {
    savedLayoutNodes = DATA.layout ? JSON.parse(JSON.stringify(DATA.layout.nodes)) : null;
  }
  if (next === 'manual') {
    if (savedLayoutNodes && DATA.layout) DATA.layout.nodes = savedLayoutNodes;
    renderCanvas(); applyHeatmap();
    savedLayoutNodes = null;
  } else {
    applyArrangeLayout(next);
  }
  exportArrangeMode = next;
  const labels = { manual: 'Grid', grid: 'Line', line: 'Reset' };
  document.getElementById('arrange-label').textContent = labels[next];
  document.getElementById('btn-arrange').classList.toggle('active', next !== 'manual');
}

// ── Theme ──────────────────────────────────────────────────────────────────────
function toggleTheme() {
  const h = document.documentElement;
  h.dataset.theme = h.dataset.theme === 'dark' ? 'light' : 'dark';
}

// ── Init ───────────────────────────────────────────────────────────────────────
buildGallery();
</script>
</body>
</html>`
}

export async function exportSiteAsHTML(): Promise<void> {
  const trips = await db.trips.orderBy('createdAt').toArray()
  if (!trips.length) throw new Error('No journeys to export')

  const allData: ExportData[] = []
  for (const trip of trips) {
    const data = await collectTripData(trip.id)
    if (data) allData.push(data)
  }

  const html = renderSiteHTML(allData)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date().toISOString().split('T')[0]
  a.href = url
  a.download = `atlas-journeys-${date}.html`
  a.click()
  URL.revokeObjectURL(url)
}
