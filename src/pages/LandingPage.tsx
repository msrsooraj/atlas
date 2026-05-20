import { type CSSProperties } from 'react'

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function IconCanvas() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}

function IconLock() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function IconExport() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function IconBackup() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
      <path d="M22 12A10 10 0 1 1 12 2" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// ─── Shared styles ─────────────────────────────────────────────────────────────

const navStyle: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 clamp(20px, 5vw, 64px)',
  height: 60,
  background: 'var(--bg, var(--canvas-bg))',
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

const navLinkStyle: CSSProperties = {
  fontSize: '0.85rem',
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  transition: 'color var(--transition)',
}

const accentBtnStyle: CSSProperties = {
  display: 'inline-block',
  padding: '8px 20px',
  background: 'var(--accent)',
  color: '#fff',
  borderRadius: 99,
  fontSize: '0.85rem',
  fontWeight: 600,
  textDecoration: 'none',
  transition: 'opacity var(--transition)',
}

const sectionStyle: CSSProperties = {
  maxWidth: 1100,
  margin: '0 auto',
  padding: '80px clamp(20px, 5vw, 48px)',
}

const cardStyle: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-card)',
  padding: '28px 24px',
  boxShadow: 'var(--shadow-md)',
}

// ─── Nav ───────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <nav style={navStyle}>
      <a href="/#/" style={brandStyle}>ATLAS</a>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <a href="/#/guide" style={navLinkStyle}>How it works</a>
        <a href="/#/privacy" style={navLinkStyle}>Privacy</a>
        <a href="/#/app" style={accentBtnStyle}>Open App</a>
      </div>
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  const dotBg: CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'radial-gradient(circle, var(--canvas-dot) 1px, transparent 1px)',
    backgroundSize: '28px 28px',
    pointerEvents: 'none',
    zIndex: 0,
  }

  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '88vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <div style={dotBg} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 70% 60% at 50% 40%, transparent 0%, var(--canvas-bg, #0a0a0f) 100%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 720, padding: '0 clamp(20px, 5vw, 48px)' }}>
        <div
          style={{
            display: 'inline-block',
            fontSize: '0.7rem',
            fontWeight: 800,
            letterSpacing: '0.2em',
            color: 'var(--accent)',
            marginBottom: 28,
            padding: '6px 14px',
            border: '1px solid var(--accent-soft)',
            borderRadius: 99,
            background: 'var(--accent-soft)',
          }}
        >
          LOCAL-FIRST TRAVEL JOURNAL
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.4rem, 6vw, 4rem)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            lineHeight: 1.08,
            margin: '0 0 24px',
          }}
        >
          Your journeys,{' '}
          <span style={{ color: 'var(--accent)' }}>mapped</span>
          {' '}and remembered.
        </h1>

        <p
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            margin: '0 0 44px',
            maxWidth: 560,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          An infinite canvas for spatial storytelling. Plot locations, add spots and memories,
          attach photos and reviews — then export it all as a beautiful static site.
          No account. No server. Just your stories.
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="/#/app"
            style={{
              padding: '14px 32px',
              background: 'var(--accent)',
              color: '#fff',
              borderRadius: 99,
              fontWeight: 700,
              fontSize: '1rem',
              textDecoration: 'none',
              boxShadow: '0 4px 24px var(--accent-soft)',
              transition: 'opacity var(--transition)',
            }}
          >
            Start journaling — it's free
          </a>
          <a
            href="/#/guide"
            style={{
              padding: '14px 32px',
              background: 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: 99,
              fontWeight: 600,
              fontSize: '1rem',
              textDecoration: 'none',
              transition: 'border-color var(--transition)',
            }}
          >
            See how it works
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────

const features = [
  {
    icon: <IconCanvas />,
    title: 'Infinite Canvas',
    body: 'Drag, connect, and arrange locations freely on a spatial canvas. Your journeys take shape exactly as you remember them.',
  },
  {
    icon: <IconLock />,
    title: 'Local-first',
    body: 'No account, no server, no cloud. Everything lives in your browser. You own your data completely.',
  },
  {
    icon: <IconExport />,
    title: 'Beautiful Exports',
    body: 'Export any journey as a single self-contained HTML file. Host it on GitHub Pages, Cloudflare Pages, or share it as-is.',
  },
  {
    icon: <IconBackup />,
    title: 'Backup & Restore',
    body: 'Save your journals as .atlas files — a portable, editable format. Import them back any time to restore everything.',
  },
]

function Features() {
  return (
    <section style={{ ...sectionStyle }}>
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <h2
          style={{
            fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.025em',
            margin: '0 0 14px',
          }}
        >
          Everything you need, nothing you don't.
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>
          Atlas is focused, fast, and free. Every core feature is available with no subscription.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20,
        }}
      >
        {features.map((f) => (
          <div key={f.title} style={cardStyle}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: 'var(--accent-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
                marginBottom: 18,
              }}
            >
              {f.icon}
            </div>
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 8px',
                letterSpacing: '-0.01em',
              }}
            >
              {f.title}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
              {f.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── How it works ──────────────────────────────────────────────────────────────

const steps = [
  {
    number: '01',
    title: 'Create a journey',
    body: 'Give your trip a name. Atlas sets up an infinite canvas ready for your story.',
  },
  {
    number: '02',
    title: 'Add locations & spots',
    body: 'Drop location nodes on the canvas. Within each location, add individual spots — restaurants, viewpoints, hidden gems — with photos, notes, and 5-star reviews.',
  },
  {
    number: '03',
    title: 'Export your site',
    body: 'Hit export and download a single HTML file containing everything. Publish it anywhere — no build step needed.',
  },
]

function HowItWorks() {
  return (
    <section
      style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ ...sectionStyle }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2
            style={{
              fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.025em',
              margin: '0 0 14px',
            }}
          >
            How it works
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 32,
          }}
        >
          {steps.map((step) => (
            <div key={step.number} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div
                style={{
                  fontSize: '2.4rem',
                  fontWeight: 800,
                  color: 'var(--accent)',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  opacity: 0.5,
                }}
              >
                {step.number}
              </div>
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                {step.title}
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Pricing ───────────────────────────────────────────────────────────────────

const freeFeatures = [
  'Unlimited journeys',
  'Unlimited spots, memories, photos',
  '5-star ratings and reviews per location and spot',
  'Date tracking (from / to)',
  'Export as a single shareable HTML file',
  'Host on GitHub Pages or Cloudflare Pages',
  'Backup & restore with .atlas files',
  'Showcase mode — radial constellation of spots',
  'Photo Reel mode — full-screen album view',
  'Works completely offline, no account needed',
]

const proFeatures = [
  'Cloud sync — access from any device',
  'Automatic cloud backups',
  'One-click publish to a custom domain',
  'Collaboration — share with a travel partner',
]

function CheckRow({ text, muted = false }: { text: string; muted?: boolean }) {
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        fontSize: '0.9rem',
        color: muted ? 'var(--text-muted)' : 'var(--text-secondary)',
        lineHeight: 1.5,
        padding: '4px 0',
        listStyle: 'none',
      }}
    >
      <span
        style={{
          color: muted ? 'var(--text-muted)' : 'var(--accent)',
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        <IconCheck />
      </span>
      {text}
    </li>
  )
}

function Pricing() {
  return (
    <section style={{ ...sectionStyle }}>
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <h2
          style={{
            fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.025em',
            margin: '0 0 14px',
          }}
        >
          Simple, honest pricing
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, maxWidth: 460, margin: '0 auto' }}>
          The core Atlas experience is free, forever. Pro cloud features are opt-in when they launch.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24,
          maxWidth: 780,
          margin: '0 auto',
        }}
      >
        {/* Free column */}
        <div
          style={{
            ...cardStyle,
            border: '1.5px solid var(--accent)',
            boxShadow: '0 0 0 4px var(--accent-soft), var(--shadow-md)',
          }}
        >
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                display: 'inline-block',
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.14em',
                color: 'var(--accent)',
                background: 'var(--accent-soft)',
                padding: '3px 10px',
                borderRadius: 99,
                marginBottom: 12,
              }}
            >
              AVAILABLE NOW
            </div>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              Free, forever
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              No credit card. No account.
            </div>
          </div>

          <ul style={{ margin: 0, padding: 0 }}>
            {freeFeatures.map((f) => (
              <CheckRow key={f} text={f} />
            ))}
          </ul>

          <a
            href="/#/app"
            style={{
              display: 'block',
              marginTop: 28,
              padding: '12px 0',
              textAlign: 'center',
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

        {/* Pro column */}
        <div
          style={{
            ...cardStyle,
            opacity: 0.65,
          }}
        >
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                display: 'inline-block',
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.14em',
                color: 'var(--text-muted)',
                background: 'var(--border)',
                padding: '3px 10px',
                borderRadius: 99,
                marginBottom: 12,
              }}
            >
              COMING SOON
            </div>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              Pro
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              Cloud features, collaboration, and more.
            </div>
          </div>

          <ul style={{ margin: 0, padding: 0 }}>
            {proFeatures.map((f) => (
              <CheckRow key={f} text={f} muted />
            ))}
          </ul>

          <button
            onClick={() => alert('Waitlist coming soon!')}
            style={{
              display: 'block',
              width: '100%',
              marginTop: 28,
              padding: '12px 0',
              textAlign: 'center',
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              borderRadius: 99,
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            Join the waitlist
          </button>
        </div>
      </div>
    </section>
  )
}

// ─── Privacy block ─────────────────────────────────────────────────────────────

function PrivacyBlock() {
  return (
    <section
      style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          maxWidth: 640,
          margin: '0 auto',
          padding: '80px clamp(20px, 5vw, 48px)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            background: 'var(--accent-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
            margin: '0 auto 24px',
          }}
        >
          <IconLock />
        </div>

        <h2
          style={{
            fontSize: 'clamp(1.4rem, 3.5vw, 2rem)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.025em',
            margin: '0 0 16px',
          }}
        >
          Your data never leaves your browser.
        </h2>
        <p
          style={{
            fontSize: '0.95rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.75,
            margin: '0 0 12px',
          }}
        >
          Atlas stores everything in your browser's IndexedDB. No network requests are ever made
          with your data. When you export an HTML site or save a .atlas backup, that file is
          generated on your device and downloaded directly — we never see it.
        </p>
        <p
          style={{
            fontSize: '0.95rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.75,
            margin: 0,
          }}
        >
          No analytics. No tracking. No accounts.{' '}
          <a href="/#/privacy" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Read the full privacy policy.
          </a>
        </p>
      </div>
    </section>
  )
}

// ─── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        padding: '32px clamp(20px, 5vw, 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}
    >
      <div>
        <a href="/#/" style={{ ...brandStyle, textDecoration: 'none' }}>ATLAS</a>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
          © 2026 Atlas. All rights reserved.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        <a href="/#/guide" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
          Guide
        </a>
        <a href="/#/privacy" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
          Privacy
        </a>
      </div>
    </footer>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function LandingPage() {
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
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <PrivacyBlock />
      <Footer />
    </div>
  )
}
