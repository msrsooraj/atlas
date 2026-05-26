# Contributing to Atlas

Atlas is a personal project, but contributions are welcome for bug fixes and improvements.

## Before You Start

- Check [existing issues](https://github.com/msrsooraj/atlas/issues) to avoid duplicates
- For significant changes, open an issue first to discuss

## Setup

```bash
git clone https://github.com/msrsooraj/atlas.git
cd atlas
npm install
npm run dev
```

Requires Node.js 18+.

## Making Changes

1. Fork the repository
2. Create a branch: `git checkout -b fix/your-description`
3. Make your changes
4. Ensure `npm run build` passes with no errors
5. Submit a pull request

## Pull Request Guidelines

- Keep PRs focused — one fix or feature per PR
- Describe what changed and why
- Screenshots for any UI changes

## Tech Stack

React 19 · TypeScript · Vite · React Flow · Zustand · Dexie.js · Tailwind CSS v4 · Framer Motion

## Local Data

Atlas stores all data in the browser's IndexedDB. No server, no accounts. Keep it that way.
