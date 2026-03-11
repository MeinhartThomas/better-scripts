# Better Scripts

A VS Code extension that replaces the built-in npm scripts sidebar with a richer, more capable alternative.

## Features

- **Auto-detects your package manager** -- supports npm, pnpm, bun, and yarn out of the box. Detection is based on lockfiles (`bun.lockb`, `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`) and the `packageManager` field in `package.json`.
- **One-click run** -- click any script to immediately run it in an integrated terminal.
- **Debug mode** -- hover over a script to reveal a debug button that launches the script with Node.js debugging attached.
- **Go to definition** -- hover to reveal a button that jumps directly to the script in its `package.json`.
- **Contextual icons** -- each script gets an icon based on what it does: test, build, lint, format, Docker, Prisma, Playwright, i18n, deploy, TypeScript, Storybook, and more. Falls back to your package manager's icon.
- **Multi-root support** -- automatically discovers and groups scripts from every `package.json` in your workspace (excluding `node_modules`).
- **Live updates** -- the tree refreshes automatically when any `package.json` changes.

## Getting Started

1. Install the extension
2. Open a project with a `package.json`
3. Find **Better Scripts** in the Explorer sidebar
4. Click a script to run it

## Commands

| Command                                | Description                                   |
| -------------------------------------- | --------------------------------------------- |
| `Better Scripts: Run Script`           | Run the selected script in a terminal         |
| `Better Scripts: Debug Script`         | Run the script with Node.js debugger attached |
| `Better Scripts: Open in package.json` | Jump to the script definition                 |
| `Better Scripts: Refresh`              | Manually refresh the script list              |

## Package Manager Detection

The extension checks for lockfiles in this order:

1. `bun.lockb` / `bun.lock` → **bun**
2. `pnpm-lock.yaml` → **pnpm**
3. `yarn.lock` → **yarn**
4. `package-lock.json` → **npm**
5. `packageManager` field in root `package.json` → corresponding manager
6. Fallback → **npm**

## Development

```bash
bun install
bun run dev     # watch mode
# Press F5 in VS Code to launch the Extension Development Host
```

## License

MIT
