# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**数字对决 Pro** - A number guessing battle game with AI and multiplayer modes.
- Version: 2.3.0
- Single-player (vs AI) and multiplayer (WebSocket) modes
- PWA with offline support for single-player mode

## Architecture

### Frontend
- **Single-file architecture**: All game logic in `index.html` with modular JS files in `js/`
- **Vanilla JS (ES6+)**: No framework, no build step required
- **Tailwind CSS**: Loaded via BootCDN (China-optimized)
- **PWA**: Service Worker for offline caching, Manifest for installation

### Key Frontend Modules (`js/`)
- `game.js` - Core game logic, input validation, hit/blow calculation
- `ai.js` - AI using Minimax + information entropy algorithm
- `network.js` - WebSocket client with auto-reconnect and weak network adaptation
- `audio.js` - Sound effects and vibration feedback
- `storage.js` - Game history persistence

### Backend (`server/`)
- **Node.js WebSocket server** using `ws` library
- **Redis integration** for distributed room state (optional, falls back to memory)
- **Features**: Room management, matchmaking, heartbeat, turn timeout

### Testing
- **Jest** for unit tests (`tests/*.test.js`)
- **Playwright** for E2E tests (`tests/*.spec.ts`)

## Common Commands

### Development
```bash
# Start local dev server (frontend only)
npm run dev

# Start WebSocket server locally
cd server && npm start

# Start server with auto-reload
cd server && npm run dev
```

### Testing
```bash
# Run all tests (Jest + Playwright)
npm test

# Run only Jest unit tests
npm run test:jest

# Run only Playwright E2E tests
npm run test:e2e

# Run Playwright with UI mode
npm run test:ui

# Run Playwright with headed browser
npm run test:headed
```

### Docker
```bash
# Start full stack (frontend + server + Redis)
docker-compose up -d

# Rebuild and restart
docker-compose up -d --build
```

## Key Implementation Details

### AI Algorithm
- First guess is hardcoded to `"0011"` (optimal opening)
- Uses Minimax to minimize worst-case remaining candidates
- Calculates information entropy to evaluate guesses
- See `js/ai.js:selectBestGuess()` and `calculateEntropy()`

### WebSocket Protocol
- Server supports `ws://` and `wss://`
- Message types: `createRoom`, `joinRoom`, `makeGuess`, `gameOver`, `heartbeat`
- Auto-reconnect with exponential backoff (max 5 attempts)
- 30-second heartbeat, 60-second turn timeout

### Input Validation Rules
- 4 digits, no repeats, first digit not 0
- Validation in `js/game.js:validateInput()`

### Color Theme (Tailwind)
- Primary: `indigo-500/600`
- AI/Opponent: `pink-500/rose-600`
- Success: `emerald-500/teal-600`
- Warning: `yellow-500/orange-600`
- Background: `slate-900` (dark theme)

### PWA Cache Strategy
- Core files (`index.html`, `manifest.json`): Cache First
- CDN resources: Stale While Revalidate
- Icons: Cache First
- See `service-worker.js` for `CACHE_VERSION` management

## File Structure

```
├── index.html              # Main game (single-page app)
├── service-worker.js       # PWA offline cache
├── manifest.json           # PWA manifest
├── offline.html            # Offline fallback page
├── js/
│   ├── game.js             # Core game logic
│   ├── ai.js               # AI algorithm
│   ├── network.js          # WebSocket client
│   ├── audio.js            # Sound effects
│   └── storage.js          # History storage
├── server/
│   ├── server.js           # WebSocket server
│   ├── logger.js           # Server logging
│   └── package.json        # Server dependencies
├── tests/
│   ├── *.test.js           # Jest unit tests
│   └── *.spec.ts           # Playwright E2E tests
├── nginx.conf              # Nginx reverse proxy config
├── docker-compose.yml      # Docker stack definition
└── jest.config.js          # Jest configuration
```

## Deployment Notes

### Frontend
- Static hosting: GitHub Pages, Gitee Pages, Netlify
- No build step required - deploy `index.html` directly

### WebSocket Server
- Environment variable: `REDIS_URL` for Redis connection
- Port: `8080` (configurable via `PORT` env var)
- Supports Render.com, Railway, Alibaba Cloud, etc.
- See `docs/DEPLOY_GUIDE.md` for detailed deployment instructions

### WebSocket URL Configuration
Update `GameConfig.wsServers` in `index.html`:
```javascript
const GameConfig = {
    wsServers: {
        development: 'ws://localhost:8080',
        production: 'wss://your-server.com'
    }
};
```

## Code Style
- ES6+ features: arrow functions, const/let, classes
- camelCase for methods/variables, PascalCase for classes
- DOM IDs use kebab-case
- Debug logs controlled by `DEBUG` flag (auto-disabled in production)

## Git Remote Repositories

This project has two remote repositories. **Always push to both remotes after commits:**

```bash
# Push to both remotes
git push origin main && git push gitee main
```

| Remote | URL | Platform |
|--------|-----|----------|
| `origin` | `git@github.com:CaoLiangqiang/number-guess-game.git` | GitHub |
| `gitee` | `git@gitee.com:hanzaiworld/number-guess-game.git` | Gitee |
