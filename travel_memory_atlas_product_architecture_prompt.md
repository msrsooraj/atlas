# Travel Memory Atlas — Product & Architecture Prompt

Build a browser-based local-first travel memory application focused on spatial storytelling, interactive memory exploration, and visual journey reconstruction.

This is NOT a traditional CRUD travel journal or itinerary planner.

The product should feel like:
- an interactive scrapbook
- a visual memory atlas
- a travel documentary board
- a spatial storytelling canvas

Users should create journeys visually using a freeform infinite canvas.

The emotional and exploratory experience is more important than rigid data structures.

---

# Core Product Philosophy

The application should prioritize:
- memories over files
- journeys over folders
- places over albums
- storytelling over automation
- creative freedom over rigid layouts

The application should NOT feel like:
- Notion
- Google Photos
- Trello
- itinerary software
- a spreadsheet

The canvas itself is the primary experience.

---

# UX / UI Direction (Important)

The application should feel like a modern 2026-era application.

The UI/UX should feel:
- immersive
- cinematic
- fluid
- tactile
- elegant
- spatial
- calm
- visually rich without feeling cluttered

Avoid:
- corporate SaaS aesthetics
- enterprise dashboard styling
- dense forms
- old-school CRUD interfaces
- generic admin-panel layouts

The interface should feel closer to:
- a creative tool
- a premium design application
- an interactive documentary experience
- a memory exploration environment

The visual language should prioritize:
- smooth animations
- depth and layering
- polished transitions
- modern typography
- responsive motion
- soft shadows and glass effects where appropriate
- contextual UI that appears only when needed
- distraction-free canvas interaction

The canvas should feel alive and responsive.

Important UX principles:
- progressive disclosure
- minimal friction
- emotional immersion
- direct manipulation
- spatial navigation
- uncluttered editing workflows

Interactions should feel modern and delightful:
- buttery smooth zoom/pan
- inertia/momentum where appropriate
- animated node expansion
- hover previews
- contextual overlays
- cinematic transitions
- polished drag-and-drop behavior

The experience should feel like a premium desktop-grade application running inside the browser.

---

# High-Level Requirements

## Local-First Architecture

The application must primarily run entirely inside the browser.

After initial application load:
- the app should function offline
- editing should not require a backend server
- data should persist locally
- all core functionality should work without internet

The browser is the primary runtime.

The server is optional and primarily used for:
- static hosting
- publishing exported trips
- optional backup/sync in the future

The system should be architected as a local-first application.

---

# Core User Flow

## Trip Creation

Users create a trip by entering:
- trip name
- countries
- cities/parks/stops
- optional dates

Example:

Kenya Safari 2026
- Nairobi
- Masai Mara
- Amboseli
- Diani

---

# Skeleton Generation

The app generates a minimal initial structure:
- connected route nodes
- timeline/order
- map references
- empty location containers

Example:

[Nairobi]
↓
[Masai Mara]
↓
[Amboseli]

This is intentionally lightweight.

Avoid excessive AI automation.

---

# Infinite Canvas

The main interface is an infinite freeform canvas.

Users must be able to:
- drag nodes freely
- resize nodes
- group memories
- create custom layouts
- zoom/pan smoothly
- create visual storytelling compositions

The canvas should feel fluid and tactile.

The visual arrangement itself is part of the storytelling process.

---

# Memory Nodes

Each location/node acts as a memory container.

Nodes can contain:
- photos
- videos
- audio clips
- text notes
- comments
- external links
- map references
- metadata
- tags

Nodes should support:
- thumbnails
- expandable galleries
- hover previews
- modal/detail views

---

# Media Handling

The app must support:
- drag/drop image import
- bulk media import
- thumbnails
- optimized previews
- optional external media linking

Support both:
1. Embedded media
2. External linked media

External providers may include:
- Google Drive
- Dropbox
- public URLs
- self-hosted assets

Do NOT tightly couple the app to Google Drive.

Treat cloud providers as optional asset providers.

---

# Publishing & Export

Trips should be portable.

A trip should be exportable as:
- self-contained HTML package
- static web bundle
- portable archive

Export should preserve:
- canvas layout
- interactions
- metadata
- thumbnails
- routes
- notes

The exported result should work as a static website.

Users should also be able to:
- publish trips to a hosted site
- self-host exported trips
- share exported packages offline

The application should conceptually treat:
“Trip = portable interactive web document”

NOT:
“Trip = database record on a server”

---

# Offline Capability

The application should continue functioning:
- on flights
- during poor connectivity
- completely offline

Support:
- offline persistence
- local caching
- local media storage
- optional offline maps later

---

# Important UX Direction

Avoid over-automation.

The system should assist users, not replace creativity.

The product should encourage:
- emotional organization
- spatial storytelling
- memory composition

NOT:
- automatic slideshow generation
- rigid timeline rendering
- AI-generated narratives

---

# Visual Interaction Requirements

Important interactions:
- hover previews
- expandable nodes
- smooth zoom/pan
- animated transitions
- draggable layout
- nested memory clusters
- route/path visualization

The experience should feel cinematic and immersive.

---

# Suggested Technical Direction

Cursor may choose the final stack, but the architecture should likely involve:

Frontend:
- modern component-based web framework
- canvas rendering library
- smooth animation support

Storage:
- browser-native persistent storage
- IndexedDB or equivalent abstraction
- support for large media storage
- local-first persistence model

Maps:
- open-source/offline-friendly map stack preferred

Publishing:
- static export generation
- self-contained bundles
- CDN-friendly output

Containerization:
- entire development environment should run via docker compose

---

# Data Model Philosophy

Separate:
1. Logical trip structure
from
2. Visual canvas layout

Example:

Logical:
- locations
- relationships
- timestamps
- media references

Visual:
- x/y position
- scale
- z-index
- grouping
- visual style

This separation is critical.

---

# Initial MVP Scope

Focus ONLY on:

1. Infinite canvas
2. Trip skeleton generation
3. Draggable location nodes
4. Image upload/import
5. Node detail panel
6. Local persistence
7. Export to static HTML
8. Responsive viewing mode
9. Smooth interactions
10. Docker-based development setup

Avoid:
- accounts
- authentication
- collaboration
- realtime sync
- advanced AI
- social features
- complex permissions

Keep the MVP focused and elegant.

---

# Desired Product Feel

The application should feel:
- calm
- immersive
- visual
- exploratory
- tactile
- memory-oriented

It should NOT feel corporate or productivity-focused.

Prioritize:
- fluidity
- emotional resonance
- visual storytelling
- delight in exploration

over enterprise-style architecture or business workflows.

