# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**数字对决 Pro** is a number-guessing battle game delivered in three forms:

- H5 Web app
- WeChat mini game
- Browser preview shell for the mini game

- Version: 2.4.25
- H5 carries AI play and multiplayer
- The WeChat mini game currently carries AI play and daily challenge
- The preview shell is a development aid, not a player-facing release target

## Current Product Rules

- Supports 3/4/5 digit games
- Repeated digits are allowed
- Leading zero is allowed
- AI opening guesses are optimized for the repeated-digit ruleset (`0011` for 4 digits)

## Architecture

### H5 Web

- Entry: `index.html`
- Core modules live in `js/`
- `js/config.js` contains environment detection, websocket URLs, version and commit metadata
- `service-worker.js` handles PWA caching

### WeChat Mini Game

- Entry: `miniprogram/game.js`
- `miniprogram/js/core/` holds rules and AI
- `miniprogram/js/engine/` holds renderer, scene manager, input, audio and storage
- `miniprogram/js/scenes/` holds menu/game/result/settings/history/guide scenes

### Preview Shell

- Entry: `miniprogram-preview.html`
- `js/miniprogram-preview/module-loader.js` loads mini game modules in the browser
- `js/miniprogram-preview/wx-shim.js` provides a minimal `wx` runtime
- `js/miniprogram-preview/seed-data.js` injects sample data
- `js/miniprogram-preview/app.js` wires controls, viewport switching and screenshot export

#### Preview Shell Module Loading Flow

```
miniprogram-preview.html
    ↓
module-loader.js     Loads miniprogram/game.js and modules
    ↓
wx-shim.js           Provides wx.* API compatibility layer for browser
    ↓
seed-data.js         Injects preset scene data (menu/settings/game/etc)
    ↓
miniprogram/js/      Mini game code runs in browser
```

Preview shell limitations:
- For development/UI validation only, not exposed to players
- WeChat container-specific behaviors (e.g., touch performance) still need validation in WeChat Developer Tools

### Backend

- `server/server.js` is the WebSocket service
- Optional Redis is used for shared room state
- HTTP health check is exposed at `/health`

## Common Commands

### Development

```bash
npm run dev
cd server && npm start
```

### Testing

```bash
npm test
npm run test:jest
npm run test:e2e
```

### Running Individual Tests

```bash
# Run single Jest test file
npx jest tests/ai.test.js

# Run single Playwright test file
npx playwright test tests/game.spec.ts

# Jest with verbose output
npx jest tests/ai.test.js --verbose
```

### WebSocket Server Development

```bash
# Install server dependencies
cd server && npm install

# Start WebSocket server (default port 3000)
npm start

# With Redis for shared state
REDIS_URL=redis://localhost:6379 npm start
```

Ensure `js/config.js` has `WS_URL` pointing to your local server for multiplayer development.

### Mini Game Preview Shell

```bash
npm run dev
# then open /miniprogram-preview.html
```

## Version Management

`package.json` is the version source.

`update-git-version.js` syncs version metadata into:

- `package-lock.json`
- `js/config.js`
- `service-worker.js`
- `server/package.json`
- `server/package-lock.json`
- `server/server.js`
- `miniprogram/game.js`
- `README.md`
- `CLAUDE.md`

## Git Workflow

### Dual Remote Push

This repository uses two remotes:
- `origin` → GitHub
- `gitee` → Gitee

Push branches to both remotes:

```bash
git push origin <branch>
git push gitee <branch>
```

### Release Process

1. Update version in `package.json`
2. Run `node update-git-version.js` to sync version to all files
3. Commit changes and tag: `git tag -a v2.4.25 -m "Version 2.4.25"`
4. Push tags to both remotes: `git push origin --tags && git push gitee --tags`
