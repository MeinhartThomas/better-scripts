# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Better Scripts is a VS Code extension that replaces the built-in npm scripts sidebar with richer features: auto-detection of npm/pnpm/bun/yarn, contextual icons, favourites, and one-click run/debug. Published as `MeinhartThomas.better-scripts`.

## Commands

```bash
npm run dev          # Watch mode with source maps (esbuild)
npm run build        # Production build (esbuild, minified)
npm run package      # Build + vsce package to .vsix
npm run test         # Run all tests (vitest)
npx vitest run src/test/iconResolver.test.ts  # Run a single test file
npm run lint         # Type-check only (tsc --noEmit)
npm run format:check # Prettier check
npm run format       # Prettier fix
npm run install:vscode  # Package and install into VS Code
npm run install:cursor  # Package and install into Cursor
```

## Architecture

The extension activates on `workspaceContains:**/package.json` and offers two UI modes controlled by the `betterScripts.viewMode` setting:

- **Tree view** (`ScriptTreeProvider.ts`) — standard VS Code TreeDataProvider, flat or grouped list
- **Webview tabs** (`ScriptWebviewProvider.ts`) — custom HTML tabs UI with inline SVG icons and VS Code theme integration

Both views consume the same data pipeline:

1. **`packageJsonParser.ts`** discovers all `package.json` files (excluding `node_modules`), parses scripts, and builds display labels with collision detection (`buildPackageLabelMap`).
2. **`packageManagerDetector.ts`** walks up from each `package.json` checking lockfiles (bun → pnpm → yarn → npm) and the `packageManager` field.
3. **`iconResolver.ts`** maps script names/commands to icons via 32+ priority-ordered rules with dark/light theme variants.
4. **`FavouritesManager.ts`** persists favourites to workspace state using `relativePath::scriptName` composite keys, with EventEmitter for reactive updates.
5. **`scriptRunner.ts`** handles terminal creation/reuse, debug configuration for all 4 package managers, and external terminal support (platform-specific: macOS iTerm/Warp/Terminal.app, Windows, Linux).

`extension.ts` wires everything together: registers commands (10 total), sets up a debounced file watcher (300ms), and manages the lifecycle.

## Key Data Types

- **`ScriptEntry`**: `{ name, command, packageJsonUri, relativePath, packageManager }`
- **`PackageJsonEntry`**: `{ uri, relativePath, scripts: ScriptEntry[], packageManager }`
- **`PackageManager`**: `"bun" | "pnpm" | "yarn" | "npm"`

## Testing

Tests use Vitest with a complete VS Code API mock at `src/test/__mocks__/vscode.ts`. The `vitest.config.ts` aliases the `vscode` module to this mock. Three test suites cover: FavouritesManager (persistence, events), iconResolver (rule matching, priority), packageJsonParser (label generation, collisions).

## Code Style

Prettier config: semicolons, double quotes, trailing commas, 80 char width, 2-space indent. No ESLint — linting is type-checking only via `tsc --noEmit`.
