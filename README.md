# Phase 10 Scorekeeper

A mobile-first Progressive Web App (PWA) for tracking Phase 10 card game scores.

## Features

- **2-6 Players** with custom names and avatars
- **Auto-scoring** based on official Phase 10 rules:
  - Cards 1-9: 5 points each
  - Cards 10-12: 10 points each
  - Skip cards: 15 points each
  - Wild cards: 25 points each
- **Phase tracking** with automatic progression (1→10)
- **Dealer rotation** tracking per hand
- **Game variants**: Standard, Evens Only, Fixed 10 Hands
- **Betting support**: per-game or per-hand bets
- **History & Export**: view all hands, export to CSV
- **Offline-first**: works without internet, data stored locally
- **PWA**: installable on Android/iOS home screen

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output in `dist/` - deploy to any static host.

## Tech Stack

- React 18 + TypeScript
- Vite + vite-plugin-pwa
- Zustand (state management)
- localStorage (persistence)
