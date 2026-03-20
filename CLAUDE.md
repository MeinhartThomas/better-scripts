# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Better Scripts** is a VS Code extension that replaces the built-in npm scripts sidebar with a richer interface supporting npm, pnpm, bun, and yarn. It provides dual view modes (tree view and webview tabs), favourites, and cross-platform external terminal support.

## Commands

```bash
bun install              # Install dependencies
bun run dev              # Watch mode development (esbuild with sourcemaps)
bun run build            # Production build (esbuild, minified)
bun run test             # Run tests (vitest)
bun run lint             # Type-check only (tsc --noEmit)
bun run format           # Format code (prettier)
bun run format:check     # Check formatting
bun run install:vscode   # Build, package, and install to VS Code
bun run install:cursor   # Build, package, and install to Cursor
```

## Architecture

This is a VS Code WebView Extension with two rendering modes sharing core logic:

- **List mode**: `ScriptTreeProvider` implements `TreeDataProvider` for a native tree view
- **Tabs mode**: `ScriptWebviewProvider` generates inline HTML/CSS/JS webview with tab switching

Both modes use the same shared modules:

- **`scriptRunner.ts`** — Terminal management (reuse/create), debug launch, external terminal execution with platform-specific paths (macOS AppleScript, Windows CMD, Linux xterm)
- **`packageJsonParser.ts`** — Discovers all workspace `package.json` files (excluding `node_modules`), parses scripts, creates file watchers
- **`packageManagerDetector.ts`** — Lockfile-based detection walking up the directory tree: `bun.lockb` → `bun.lock` → `pnpm-lock.yaml` → `yarn.lock` → `package-lock.json` → `packageManager` field → npm default
- **`iconResolver.ts`** — Pattern-matches script names/commands to 30+ icon types with light/dark variants
- **`FavouritesManager.ts`** — Persistent favourites via VS Code workspace state using composite keys (`${relativePath}::${scriptName}`)

Entry point is `extension.ts` which registers commands, sets up file watchers, and initializes both view providers with a 300ms debounced refresh.

## Build & Output

- esbuild bundles `src/extension.ts` → `dist/extension.js` (CJS, Node platform, `vscode` externalized)
- `.vsix` packages are created via `@vscode/vsce` with `--no-dependencies`
- No production dependencies — only VS Code API at runtime

## Testing

- Vitest with a full VS Code API mock at `src/test/__mocks__/vscode.ts`
- Mock is wired via path alias in `vitest.config.ts` so imports of `vscode` resolve to the mock
- Tests cover pure business logic (FavouritesManager, iconResolver) — no integration tests with VS Code runtime

## Code Style

- TypeScript strict mode
- Prettier: double quotes, semicolons, trailing commas, 80-char width
- Target: ES2022, CommonJS modules
- Webview uses nonce-based CSP and HTML-escapes user content
