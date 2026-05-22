# Atlas — Travel Memory Journal

A local-first travel journal that lives entirely in your browser. Build a visual map of your trips, attach photos, notes, and ratings to every location and spot, and export everything as a single self-contained HTML file you can share with anyone.

> **Hosted version:** Not available yet. Run it locally using the instructions below, or self-host it with Docker.

---

## What it does

- **Visual canvas** — drag nodes representing locations onto a React Flow canvas, connect them with routes
- **Scrapbook mode** — add spots, photos, notes, audio, and links to any location or transit leg
- **Showcase mode** — heatmap visualization where node size reflects rating, time spent, or a combined score
- **Photo reel** — chronological album view of all memories across a trip
- **Backup & restore** — export/import `.atlas` files to keep your data safe
- **Export to HTML** — generate a fully self-contained static HTML file with your entire journal, no server required
- **100% offline** — all data stored in your browser's IndexedDB, nothing ever leaves your device

---

## Tech stack

| Layer | Library |
|---|---|
| UI framework | React 19 + TypeScript |
| Canvas | @xyflow/react (React Flow) |
| Local storage | Dexie (IndexedDB) |
| Animation | Framer Motion |
| State | Zustand |
| Build | Vite 6 |
| Container | Docker + nginx |

---

## Running locally

### Option 1 — Node directly (fastest)

**Prerequisites:** Node.js 18 or later, npm

```bash
git clone https://github.com/msrsooraj/atlas.git
cd atlas
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

### Option 2 — Docker (dev mode with hot reload)

**Prerequisites:** Docker and Docker Compose

```bash
git clone https://github.com/msrsooraj/atlas.git
cd atlas
docker compose up dev
```

Open [http://localhost:5173](http://localhost:5173).

Changes to source files are reflected immediately via volume mount.

---

### Option 3 — Docker (production build)

Builds and serves the optimized static bundle behind nginx.

```bash
docker compose up prod
```

Open [http://localhost:8080](http://localhost:8080).

---

### Build for production (no Docker)

```bash
npm run build      # outputs to dist/
npm run preview    # preview the built output locally
```

The `dist/` folder is a standard static site — drop it behind any web server (nginx, Caddy, GitHub Pages, Netlify, etc.).

---

## How to use

> This section describes the hosted or locally-running web app.

### 1. Create a journey

On the home screen click **New Journey**, give it a name, and you land on the canvas.

### 2. Add locations

In **Scrapbook** mode (pencil icon in the toolbar), click the **+** button at the bottom-right to add a location. Each location becomes a node on the canvas.

### 3. Connect locations with routes

Routes are drawn automatically between locations. Click any connecting line to open the **Route Panel** where you can record the transport mode (flight, train, car, …), add journey notes, and attach transit photos.

### 4. Add spots and memories to a location

Click a location node to open its detail panel. From there you can:
- Add **Spots** — specific places within a location (restaurants, hotels, viewpoints)
- Attach **Photos, Notes, Audio, or Links** to any spot or directly to the location
- Set a **Rating** (1–5 stars) and **date range** for the stay
- Add a **review** and **caption**

### 5. Showcase mode

Switch to **Showcase** mode (eye icon) to see a read-only view. Hover a node to see its spots orbit around it as a constellation.

Use the four heatmap buttons in the toolbar to resize nodes and spots by:
- **Equal** — all the same size
- **★ Rating** — higher rated = bigger (default)
- **⏱ Time** — longer stays = bigger
- **⚡ Aggregate** — rating + time combined

### 6. Arrange the canvas

The **Arrange** button (available in Scrapbook and Showcase modes) cycles through three layouts:
1. **Grid** — snake-pattern grid following route order
2. **Line** — straight horizontal line following route order
3. **Reset** — reverts to your previous manual layout

### 7. Photo reel

Switch to **Photo Reel** mode (grid icon) to see every photo across the trip in a scrollable album, with transit sections between locations.

### 8. Export to HTML

Click the **download** icon in the toolbar to export all your journeys as a single `.html` file. The file is fully self-contained (images embedded as base64) — open it in any browser, share it by email, or host it anywhere. It includes the canvas, photo reel, and theme toggle.

### 9. Backup and restore

- **Save backup** (floppy disk icon) — exports the current journey as a `.atlas` file
- **Import backup** (upload icon) — restores from a `.atlas` file; prompts before overwriting an existing journey

---

## Keyboard shortcuts

| Key | Action |
|---|---|
| `Escape` | Close panel / lightbox |
| `←` `→` | Navigate lightbox photos |
| Scroll | Zoom canvas |
| Click + drag canvas | Pan |

---

## Privacy

Atlas is **local-first**. See [PRIVACY.md](PRIVACY.md) for the full policy.

---

## License

MIT — see [LICENSE](LICENSE).

---

## Contributing

Issues and pull requests are welcome. Run `npm run typecheck` before submitting a PR to catch TypeScript errors.
