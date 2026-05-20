import { type CSSProperties } from 'react'

// ─── Nav ───────────────────────────────────────────────────────────────────────

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

// ─── Section ───────────────────────────────────────────────────────────────────

interface PrivacySectionProps {
  title: string
  children: React.ReactNode
}

function PrivacySection({ title, children }: PrivacySectionProps) {
  return (
    <section style={{ marginBottom: 48, paddingBottom: 48, borderBottom: '1px solid var(--border)' }}>
      <h2
        style={{
          fontSize: '1.15rem',
          fontWeight: 700,
          color: 'var(--accent)',
          letterSpacing: '-0.01em',
          margin: '0 0 14px',
        }}
      >
        {title}
      </h2>
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

// ─── Text helpers ──────────────────────────────────────────────────────────────

const p: CSSProperties = { margin: '0 0 12px' }
const strong: CSSProperties = { color: 'var(--text-primary)', fontWeight: 600 }

// ─── Page ──────────────────────────────────────────────────────────────────────

export function PrivacyPage() {
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
            PRIVACY POLICY
          </div>
          <h1
            style={{
              fontSize: 'clamp(1.8rem, 4.5vw, 2.6rem)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              margin: '0 0 16px',
            }}
          >
            We don't collect your data. Full stop.
          </h1>
          <p
            style={{
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              margin: '0 0 20px',
            }}
          >
            This is the complete Atlas privacy policy. It's short because there isn't much to say.
          </p>
          <p
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              margin: 0,
            }}
          >
            Effective date: May 2026
          </p>
        </div>

        {/* Sections */}
        <PrivacySection title="No data collection">
          <p style={p}>
            Atlas does not collect any personal data. We don't know who you are, where you are,
            or what you've written in your journals. There are no user accounts, no sign-up forms,
            and no identifiers assigned to you.
          </p>
          <p style={p}>
            The app runs entirely in your browser. Every feature — creating journeys, adding spots,
            uploading photos, writing reviews — happens on your device without any communication to
            our servers.
          </p>
        </PrivacySection>

        <PrivacySection title="Local storage only">
          <p style={p}>
            All your data is stored in your browser's <span style={strong}>IndexedDB</span> — a
            standard local database built into every modern browser. This data never leaves your
            device as part of normal app usage.
          </p>
          <p style={p}>
            No network requests are made with your data. The only network activity Atlas performs
            is loading the application itself (HTML, CSS, JavaScript) from the host server when
            you first open it. After that, everything is local.
          </p>
        </PrivacySection>

        <PrivacySection title="Your exports">
          <p style={p}>
            When you click <span style={strong}>Export</span>, Atlas generates a static HTML file
            on your device using your locally-stored data. That file is downloaded directly to
            your computer — it never passes through any server.
          </p>
          <p style={p}>
            The same applies to <span style={strong}>.atlas backup files</span>. They are generated
            and saved entirely on your device. We never see the contents of your exported or backed-up
            files.
          </p>
          <p style={p}>
            If you choose to host your exported HTML on a service like GitHub Pages or Cloudflare Pages,
            that is a separate service with its own privacy policy. Atlas has no involvement or visibility
            into that hosting.
          </p>
        </PrivacySection>

        <PrivacySection title="No analytics">
          <p style={p}>
            There are no analytics, telemetry, or tracking of any kind in Atlas. Specifically:
          </p>
          <ul style={{ margin: '0 0 12px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>No Google Analytics or any analytics platform</li>
            <li>No error tracking services (Sentry, Datadog, etc.)</li>
            <li>No session recording (Hotjar, FullStory, etc.)</li>
            <li>No advertising pixels or retargeting</li>
            <li>No cookies set by the application</li>
          </ul>
          <p style={p}>
            We have no visibility into how you use the app.
          </p>
        </PrivacySection>

        <PrivacySection title="Future cloud features">
          <p style={p}>
            Atlas is working on optional Pro cloud features — including cloud sync, automatic backups,
            and one-click publishing to custom domains. These features do not exist yet.
          </p>
          <p style={p}>
            When they are launched:
          </p>
          <ul style={{ margin: '0 0 12px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>Participation will be entirely <span style={strong}>opt-in</span>.</li>
            <li>A separate, detailed privacy policy will apply to cloud features.</li>
            <li>Free users who do not opt in are completely unaffected. This policy continues to apply to them.</li>
            <li>No data will be transmitted from free users to any server without explicit consent.</li>
          </ul>
          <p style={p}>
            We will communicate clearly before any data practices change.
          </p>
        </PrivacySection>

        <PrivacySection title="Data retention & deletion">
          <p style={p}>
            Since we store no data, there is nothing to retain or delete on our end.
          </p>
          <p style={p}>
            Your local data can be deleted by clearing your browser's site data for the Atlas domain.
            Your .atlas backup files and exported HTML files are yours — stored wherever you saved them,
            under your full control.
          </p>
        </PrivacySection>

        <PrivacySection title="Contact">
          <p style={p}>
            If you have any questions about this privacy policy, reach out directly:
          </p>
          <p style={{ margin: 0 }}>
            <a
              href="mailto:msrsooraj@hotmail.com"
              style={{
                color: 'var(--accent)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              msrsooraj@hotmail.com
            </a>
          </p>
        </PrivacySection>

        {/* Footer note */}
        <p
          style={{
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            marginTop: 8,
          }}
        >
          This policy is intentionally plain English. If something here is unclear or you believe
          it's incomplete, please get in touch.
        </p>
      </main>
    </div>
  )
}
