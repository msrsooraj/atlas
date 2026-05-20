import { type CSSProperties } from 'react'

// ─── Shared nav styles ─────────────────────────────────────────────────────────

const navStyle: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 clamp(20px, 5vw, 64px)',
  height: 60,
  background: 'var(--canvas-bg)',
  borderBottom: '1px solid var(--border)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
}

const brandStyle: CSSProperties = {
  fontSize: '0.78rem',
  fontWeight: 800,
  letterSpacing: '0.18em',
  color: 'var(--accent)',
  textDecoration: 'none',
}

function Nav() {
  return (
    <nav style={navStyle}>
      <a href="/#/" style={brandStyle}>ATLAS</a>
      <a
        href="/#/"
        style={{
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to home
      </a>
    </nav>
  )
}

// ─── Section component ─────────────────────────────────────────────────────────

interface GuideSection {
  number: number
  title: string
  children: React.ReactNode
}

function Section({ number, title, children }: GuideSection) {
  return (
    <section
      style={{
        marginBottom: 60,
        paddingBottom: 60,
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 14,
          marginBottom: 20,
        }}
      >
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            letterSpacing: '0.14em',
            color: 'var(--accent)',
            opacity: 0.6,
            flexShrink: 0,
          }}
        >
          {String(number).padStart(2, '0')}
        </span>
        <h2
          style={{
            fontSize: '1.3rem',
            fontWeight: 700,
            color: 'var(--accent)',
            letterSpacing: '-0.015em',
            margin: 0,
          }}
        >
          {title}
        </h2>
      </div>
      <div
        style={{
          fontSize: '0.95rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.8,
        }}
      >
        {children}
      </div>
    </section>
  )
}

// ─── Inline note box ───────────────────────────────────────────────────────────

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--accent-soft)',
        border: '1px solid var(--accent-soft)',
        borderLeft: '3px solid var(--accent)',
        borderRadius: 8,
        padding: '12px 16px',
        marginTop: 16,
        fontSize: '0.88rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.7,
      }}
    >
      {children}
    </div>
  )
}

// ─── Text helpers ──────────────────────────────────────────────────────────────

const p: CSSProperties = { margin: '0 0 14px' }
const strong: CSSProperties = { color: 'var(--text-primary)', fontWeight: 600 }

// ─── Page ──────────────────────────────────────────────────────────────────────

export function GuidePage() {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        overflowY: 'auto',
        background: 'var(--canvas-bg)',
        color: 'var(--text-primary)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif",
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <Nav />

      <main
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: 'clamp(48px, 8vw, 88px) clamp(20px, 5vw, 48px)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 64 }}>
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              letterSpacing: '0.2em',
              color: 'var(--accent)',
              marginBottom: 16,
            }}
          >
            GUIDE
          </div>
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 2.8rem)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              margin: '0 0 16px',
            }}
          >
            How to use Atlas
          </h1>
          <p
            style={{
              fontSize: '1.05rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              margin: 0,
              maxWidth: 540,
            }}
          >
            A complete walkthrough — from your first journey to exporting a site
            you can share with the world.
          </p>
        </div>

        {/* Sections */}
        <Section number={1} title="Getting started">
          <p style={p}>
            When you open Atlas for the first time you'll see a blank canvas with a prompt to create your first journey.
            Click <span style={strong}>Begin your first journey</span> (or the <span style={strong}>+</span> button in the toolbar if you already have trips) and give it a name — "Japan 2025", "Road trip through Iceland", anything you like.
          </p>
          <p style={p}>
            Atlas creates an infinite canvas for that journey. From here you can drag the canvas, zoom in and out with your scroll wheel (or pinch on trackpad), and start dropping locations wherever feels right.
          </p>
          <Tip>
            You can have as many journeys as you like. Switch between them from the trip selector in the top toolbar.
          </Tip>
        </Section>

        <Section number={2} title="Adding locations">
          <p style={p}>
            A <span style={strong}>location</span> is a place you visited — a city, a national park, a neighbourhood. It appears as a card (node) on the canvas.
          </p>
          <p style={p}>
            To add one, click the <span style={strong}>Add location</span> button on the canvas. Give it a name and optionally a short description. Locations can be connected to each other to show your travel path — just drag from the handle at the edge of one card to another.
          </p>
          <p style={p}>
            Inside each location you can add as many <span style={strong}>spots</span> as you like — the individual places that made the visit memorable.
          </p>
        </Section>

        <Section number={3} title="Spots & memories">
          <p style={p}>
            A <span style={strong}>spot</span> is a specific place within a location: a restaurant, a viewpoint, a market stall, a hotel. Click the location card to open its detail panel, then add spots using the spot list.
          </p>
          <p style={p}>
            Each spot can hold:
          </p>
          <ul style={{ margin: '0 0 14px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li><span style={strong}>Photos</span> — drag and drop images or click to pick from your device.</li>
            <li><span style={strong}>Notes</span> — free-form text for memories, tips, or anything you want to remember.</li>
            <li><span style={strong}>A link</span> — attach a URL (website, Google Maps, etc.).</li>
            <li><span style={strong}>A rating and review</span> — 5-star rating and written review text.</li>
            <li><span style={strong}>Dates</span> — optional from / to dates for when you visited.</li>
          </ul>
          <Tip>
            All data is saved instantly as you type — there's no Save button to click.
          </Tip>
        </Section>

        <Section number={4} title="Rating & reviewing">
          <p style={p}>
            Both <span style={strong}>locations</span> and individual <span style={strong}>spots</span> can have a 5-star rating and a written review. Tap the stars to set a rating, then type your review in the text area below.
          </p>
          <p style={p}>
            Each location and spot also has optional <span style={strong}>date fields</span> (from / to). Use them to record when you visited — great for multi-day stays or long trips.
          </p>
          <p style={p}>
            Ratings appear on the exported site so readers can see your highlights at a glance.
          </p>
        </Section>

        <Section number={5} title="Cover photos">
          <p style={p}>
            Each location card shows a cover photo as a visual thumbnail on the canvas. You can set an explicit cover photo from the location's detail panel, or leave it unset and Atlas will automatically use the first photo from any of the location's spots.
          </p>
          <p style={p}>
            Cover photos make the canvas feel alive — especially in Showcase mode where they're revealed as you hover over location cards.
          </p>
        </Section>

        <Section number={6} title="Canvas modes">
          <p style={{ ...p }}>
            Atlas has three canvas modes, switchable from the toolbar:
          </p>
          <ul style={{ margin: '0 0 14px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <li>
              <span style={strong}>Scrapbook (default)</span> — The standard editing mode. Click any location card to open its detail panel. Drag nodes to rearrange. Add, edit, and delete everything.
            </li>
            <li>
              <span style={strong}>Showcase</span> — A read-only presentation mode. Hover over a location card and a radial constellation of its spots fans out around it, showing photos and names. Great for browsing and sharing your screen.
            </li>
            <li>
              <span style={strong}>Photo Reel</span> — A full-screen album view sorted by location then spot. Every photo in the journey is displayed in order, with notes and ratings visible. Ideal for a photo journal walkthrough.
            </li>
          </ul>
        </Section>

        <Section number={7} title="Exporting your site">
          <p style={p}>
            Click the <span style={strong}>Export</span> button in the toolbar. Atlas will bundle all your journeys — locations, spots, photos, notes, ratings — into a single self-contained HTML file and download it to your device.
          </p>
          <p style={p}>
            That file works completely offline. You can:
          </p>
          <ul style={{ margin: '0 0 14px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>Open it directly in any browser by double-clicking</li>
            <li>Upload it to <span style={strong}>GitHub Pages</span> (free, custom domain support)</li>
            <li>Deploy it to <span style={strong}>Cloudflare Pages</span> in seconds</li>
            <li>Share it as an email attachment or through any file-sharing service</li>
          </ul>
          <Tip>
            No build step, no framework, no server required. One file, fully self-contained.
          </Tip>
        </Section>

        <Section number={8} title="Backup & restore">
          <p style={p}>
            Atlas lets you save your data as a <span style={strong}>.atlas file</span> — a portable backup format that contains all your journeys in a structured, readable form.
          </p>
          <p style={p}>
            To save a backup, click <span style={strong}>Backup</span> in the toolbar. To restore, click <span style={strong}>Restore</span> and pick your .atlas file. Your journeys will be imported back exactly as you left them.
          </p>
          <p style={p}>
            The .atlas format is designed to be human-readable and editable — you can open it in any text editor if you want to inspect or modify your data directly.
          </p>
          <Tip>
            Keep regular .atlas backups, especially before clearing your browser data. This is your portable data format.
          </Tip>
        </Section>

        <Section number={9} title="Persistence & browser storage">
          <p style={p}>
            All your data lives in your browser's <span style={strong}>IndexedDB</span> — a local database built into every modern browser. It persists across page reloads and browser restarts automatically.
          </p>
          <p style={p}>
            However, browser storage can be cleared in a few ways:
          </p>
          <ul style={{ margin: '0 0 14px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>Manually clearing site data in browser settings</li>
            <li>Using "Clear All Data" in browser privacy tools</li>
            <li>Some browsers clear storage for sites not visited in a long time</li>
          </ul>
          <p style={p}>
            <span style={strong}>Always keep .atlas backups</span> as your source of truth. Think of IndexedDB as a working cache and your .atlas files as the permanent record.
          </p>
          <Tip>
            Cloud sync (coming in Pro) will solve this entirely — your data will be backed up automatically and accessible from any device.
          </Tip>
        </Section>

        {/* Footer CTA */}
        <div
          style={{
            textAlign: 'center',
            padding: '48px 0 24px',
          }}
        >
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 }}>
            Ready to start?
          </p>
          <a
            href="/#/app"
            style={{
              display: 'inline-block',
              padding: '13px 32px',
              background: 'var(--accent)',
              color: '#fff',
              borderRadius: 99,
              fontWeight: 700,
              fontSize: '0.95rem',
              textDecoration: 'none',
            }}
          >
            Open Atlas
          </a>
        </div>
      </main>
    </div>
  )
}
