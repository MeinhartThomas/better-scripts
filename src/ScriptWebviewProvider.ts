import * as vscode from "vscode";
import {
  findAllPackageJsons,
  type PackageJsonEntry,
  type ScriptEntry,
} from "./packageJsonParser";
import { resolveIconName } from "./iconResolver";
import { FavouritesManager, compositeKey } from "./FavouritesManager";
import {
  runScriptEntry,
  debugScriptEntry,
  openScriptEntryInPackageJson,
  openInExternalTerminalEntry,
} from "./scriptRunner";

interface WebviewMessage {
  type:
    | "run"
    | "runDefault"
    | "debug"
    | "open"
    | "openExternal"
    | "openPackageJson"
    | "toggleFavourite"
    | "selectTab";
  relativePath?: string;
  scriptName?: string;
  tabIndex?: number;
}

// Inline SVG icons (from VS Code codicons)
const SVG_PLAY =
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3.78 2L3 2.41v12l.78.42 9-6v-.83l-9-6zM4 13.48V3.35l7.6 5.07L4 13.48z"/></svg>';
const SVG_DEBUG =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.854 13.9605L13.2105 17.697C12.954 17.22 12.5505 16.8345 12.039 16.641L12.054 16.626L19.1175 12.6525C19.6275 12.366 19.6275 11.6325 19.1175 11.3445L7.11751 4.59599C6.61801 4.31399 6.00001 4.67549 6.00001 5.24999V10.5C5.46901 10.5 4.97401 10.6215 4.50001 10.791V5.24999C4.50001 3.52949 6.35251 2.44499 7.85251 3.28949L19.8525 10.0395C21.381 10.899 21.381 13.101 19.8525 13.962L19.854 13.9605ZM10.5 16.0605V18H11.25C11.664 18 12 18.336 12 18.75C12 19.164 11.664 19.5 11.25 19.5H10.5C10.5 20.076 10.3905 20.625 10.1925 21.132L11.781 22.7205C12.0735 23.013 12.0735 23.4885 11.781 23.781C11.634 23.928 11.442 24 11.25 24C11.058 24 10.866 23.9265 10.719 23.781L9.39151 22.4535C8.56651 23.4 7.35151 24.0015 6.00001 24.0015C4.64851 24.0015 3.43351 23.4015 2.60851 22.4535L1.28101 23.781C1.13401 23.928 0.942009 24 0.750009 24C0.558009 24 0.366009 23.9265 0.219009 23.781C-0.0734912 23.4885-0.0734912 23.013 0.219009 22.7205L1.80751 21.132C1.60951 20.625 1.50001 20.076 1.50001 19.5H0.750009C0.336009 19.5 8.78423e-06 19.164 8.78423e-06 18.75C8.78423e-06 18.336 0.336009 18 0.750009 18H1.50001V16.0605L0.219009 14.7795C-0.0734912 14.487-0.0734912 14.0115 0.219009 13.719C0.511509 13.4265 0.987009 13.4265 1.27951 13.719L2.56051 15H3.00001C3.00001 13.3455 4.34551 12 6.00001 12C7.65451 12 9.00001 13.3455 9.00001 15H9.43951L10.7205 13.719C11.013 13.4265 11.4885 13.4265 11.781 13.719C12.0735 14.0115 12.0735 14.487 11.781 14.7795L10.5 16.0605ZM4.50001 15H7.50001C7.50001 14.172 6.82801 13.5 6.00001 13.5C5.17201 13.5 4.50001 14.172 4.50001 15ZM9.00001 16.5H3.00001V19.5C3.00001 21.1545 4.34551 22.5 6.00001 22.5C7.65451 22.5 9.00001 21.1545 9.00001 19.5V16.5Z"/></svg>';
const SVG_GO_TO_FILE =
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.58594 1.00098C8.98394 1.00098 9.36646 1.15943 9.64746 1.44043L12.5605 4.35352C12.8415 4.63552 13.001 5.01704 13.001 5.41504V13.001C13.001 14.106 12.106 15.001 11.001 15.001H5.00098C3.89599 15.001 3.00098 14.106 3.00098 13.001V6.00098H4.00098V13.001C4.00098 13.553 4.44899 14.001 5.00098 14.001H11.001C11.553 14.001 12.001 13.553 12.001 13.001V6.00098H9.50098C8.67299 6.00096 8.00098 5.32897 8.00098 4.50098V2.00098C7.99198 1.97699 7.98265 1.9527 7.97266 1.92871C7.89674 1.74704 7.78717 1.5812 7.64746 1.44238L7.20605 1.00098H8.58594ZM9 4.5C9 4.776 9.224 5 9.5 5H11.793L9 2.20703V4.5Z"/><path d="M4.5 0C4.63299 0 4.75952 0.0534683 4.85352 0.147461L6.85352 2.14746C6.90042 2.19336 6.93789 2.24775 6.96289 2.30859C6.98789 2.36959 7.00097 2.43498 7.00098 2.50098C7.00098 2.56698 6.98789 2.63236 6.96289 2.69336C6.93789 2.75323 6.90043 2.80956 6.85352 2.85547L4.85352 4.85547C4.75956 4.94917 4.63278 5.00195 4.5 5.00195C4.36722 5.00195 4.24044 4.94917 4.14648 4.85547C4.05248 4.76147 3.99902 4.63398 3.99902 4.50098C3.99903 4.36799 4.05249 4.24146 4.14648 4.14746L5.29297 3.00098H2.5C2.10201 3.00098 1.72045 3.15944 1.43945 3.44043C1.15846 3.72242 1.00001 4.10298 1 4.50098V5.50098C1 5.63398 0.947516 5.76147 0.853516 5.85547C0.759563 5.94817 0.632774 6.00098 0.5 6.00098C0.367225 6.00098 0.240437 5.94917 0.146484 5.85547C0.0534844 5.76147 0 5.63398 0 5.50098V4.50098C6.17892e-06 3.83799 0.263427 3.20239 0.732422 2.7334C1.20142 2.26441 1.83701 2.00098 2.5 2.00098H5.29297L4.14648 0.855469C4.05248 0.761469 3.99902 0.633977 3.99902 0.500977C3.99903 0.367985 4.05249 0.241455 4.14648 0.147461C4.24048 0.0534683 4.36701 0 4.5 0Z"/></svg>';
const SVG_TERMINAL =
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M1 3h14v10H1V3zm1 1v8h12V4H2zm1.854.646l-.707.708L5.293 7.5 3.147 9.646l.707.707L6.707 7.5 3.854 4.646zM7 10h4v1H7v-1z"/></svg>';
const SVG_STAR_EMPTY =
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M7.19 1.8l-1.5 3.59-3.89.33c-.7.06-.98.93-.44 1.38l2.96 2.48-1.27 4.46c-.2.66.56 1.19 1.13.8l3.57-2.35 3.57 2.35c.56.38 1.32-.14 1.12-.8l-1.27-4.46L14.14 7.1c.54-.45.26-1.32-.44-1.38l-3.89-.33-1.5-3.59a.78.78 0 00-1.44 0h.32zm.56 1.2l1.2 2.86.15.35.38.03 3.1.27-2.36 1.98-.28.24.08.37 1.02 3.56-2.84-1.88-.32-.21-.32.21-2.84 1.88 1.01-3.56.09-.37-.29-.24L2.42 6.5l3.1-.26.38-.03.15-.36 1.2-2.86h.5z"/></svg>';
const SVG_STAR_FULL =
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M7.19 1.8l-1.5 3.59-3.89.33c-.7.06-.98.93-.44 1.38l2.96 2.48-1.27 4.46c-.2.66.56 1.19 1.13.8l3.57-2.35 3.57 2.35c.56.38 1.32-.14 1.12-.8l-1.27-4.46L14.14 7.1c.54-.45.26-1.32-.44-1.38l-3.89-.33-1.5-3.59a.78.78 0 00-1.44 0h.32z"/></svg>';

export class ScriptWebviewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private packageJsonEntries: PackageJsonEntry[] = [];
  private activeTabIndex = 0;

  constructor(
    private extensionUri: vscode.Uri,
    private favouritesManager: FavouritesManager,
  ) {}

  async refresh(): Promise<void> {
    this.packageJsonEntries = await findAllPackageJsons();
    if (this.activeTabIndex >= this.packageJsonEntries.length) {
      this.activeTabIndex = 0;
    }
    this.updateWebview();
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "icons")],
    };

    webviewView.webview.onDidReceiveMessage((msg: WebviewMessage) => {
      this.handleMessage(msg);
    });

    this.updateWebview();
  }

  private handleMessage(msg: WebviewMessage): void {
    switch (msg.type) {
      case "selectTab":
        if (msg.tabIndex !== undefined) {
          this.activeTabIndex = msg.tabIndex;
          this.updateWebview();
        }
        break;
      case "run":
        if (msg.relativePath && msg.scriptName) {
          const script = this.findScript(msg.relativePath, msg.scriptName);
          if (script) {
            runScriptEntry(script);
          }
        }
        break;
      case "runDefault": {
        if (msg.relativePath && msg.scriptName) {
          const script = this.findScript(msg.relativePath, msg.scriptName);
          if (script) {
            const action = vscode.workspace
              .getConfiguration("betterScripts")
              .get<string>("defaultClickAction", "integratedTerminal");
            if (action === "externalTerminal") {
              openInExternalTerminalEntry(script);
            } else {
              runScriptEntry(script);
            }
          }
        }
        break;
      }
      case "debug":
        if (msg.relativePath && msg.scriptName) {
          const script = this.findScript(msg.relativePath, msg.scriptName);
          if (script) {
            debugScriptEntry(script);
          }
        }
        break;
      case "open":
        if (msg.relativePath && msg.scriptName) {
          const script = this.findScript(msg.relativePath, msg.scriptName);
          if (script) {
            openScriptEntryInPackageJson(script);
          }
        }
        break;
      case "openExternal":
        if (msg.relativePath && msg.scriptName) {
          const script = this.findScript(msg.relativePath, msg.scriptName);
          if (script) {
            openInExternalTerminalEntry(script);
          }
        }
        break;
      case "openPackageJson":
        if (msg.relativePath) {
          const entry = this.packageJsonEntries.find(
            (e) => e.relativePath === msg.relativePath,
          );
          if (entry) {
            vscode.window.showTextDocument(entry.uri);
          }
        }
        break;
      case "toggleFavourite":
        if (msg.relativePath && msg.scriptName) {
          const key = compositeKey(msg.relativePath, msg.scriptName);
          this.favouritesManager.toggleFavourite(key);
        }
        break;
    }
  }

  private findScript(
    relativePath: string,
    scriptName: string,
  ): ScriptEntry | undefined {
    for (const entry of this.packageJsonEntries) {
      if (entry.relativePath === relativePath) {
        return entry.scripts.find((s) => s.name === scriptName);
      }
    }
    return undefined;
  }

  private updateWebview(): void {
    if (!this.view) return;

    const webview = this.view.webview;
    const favKeys = new Set(this.favouritesManager.getFavouriteKeys());

    const tabs: {
      label: string;
      isFavourites: boolean;
      relativePath?: string;
    }[] = [];
    const hasFavourites = favKeys.size > 0;

    if (hasFavourites) {
      tabs.push({ label: "Favourites", isFavourites: true });
    }

    for (const entry of this.packageJsonEntries) {
      const label =
        entry.relativePath === "package.json"
          ? "root"
          : entry.relativePath.replace(/\/package\.json$/, "");
      tabs.push({
        label,
        isFavourites: false,
        relativePath: entry.relativePath,
      });
    }

    const adjustedIndex = hasFavourites
      ? this.activeTabIndex + 1
      : this.activeTabIndex;

    let scripts: {
      name: string;
      command: string;
      iconUri: string;
      relativePath: string;
      isFavourite: boolean;
      packageLabel?: string;
    }[] = [];

    const isFavouritesTab = hasFavourites && this.activeTabIndex === -1;

    if (isFavouritesTab) {
      for (const entry of this.packageJsonEntries) {
        for (const s of entry.scripts) {
          const key = compositeKey(s.relativePath, s.name);
          if (favKeys.has(key)) {
            scripts.push({
              name: s.name,
              command: s.command,
              iconUri: this.getIconWebviewUri(webview, s.name, s.command),
              relativePath: s.relativePath,
              isFavourite: true,
              packageLabel:
                s.relativePath === "package.json"
                  ? "root"
                  : s.relativePath.replace(/\/package\.json$/, ""),
            });
          }
        }
      }
    } else {
      const entry = this.packageJsonEntries[this.activeTabIndex];
      if (entry) {
        scripts = entry.scripts.map((s) => {
          const key = compositeKey(s.relativePath, s.name);
          return {
            name: s.name,
            command: s.command,
            iconUri: this.getIconWebviewUri(webview, s.name, s.command),
            relativePath: s.relativePath,
            isFavourite: favKeys.has(key),
          };
        });
      }
    }

    webview.html = this.getHtml(
      webview,
      tabs,
      adjustedIndex,
      scripts,
      isFavouritesTab,
    );
  }

  private getIconWebviewUri(
    webview: vscode.Webview,
    scriptName: string,
    scriptCommand: string,
  ): string {
    const iconName = resolveIconName(scriptName, scriptCommand);
    const iconsUri = vscode.Uri.joinPath(this.extensionUri, "icons");

    const isDark =
      vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark ||
      vscode.window.activeColorTheme.kind ===
        vscode.ColorThemeKind.HighContrast;

    const singleFileIcons = [
      "docker",
      "eslint",
      "playwright",
      "typescript",
      "vitest",
      "jest",
      "turborepo",
      "graphql",
      "tailwind",
      "supabase",
      "drizzle",
      "storybook",
      "sentry",
    ];

    let filename: string;
    if (iconName === "default") {
      filename = isDark ? "default-dark.svg" : "default-light.svg";
    } else if (singleFileIcons.includes(iconName)) {
      filename = `${iconName}.svg`;
    } else {
      filename = isDark ? `${iconName}-dark.svg` : `${iconName}-light.svg`;
    }

    return webview
      .asWebviewUri(vscode.Uri.joinPath(iconsUri, filename))
      .toString();
  }

  private getHtml(
    _webview: vscode.Webview,
    tabs: { label: string; isFavourites: boolean; relativePath?: string }[],
    activeVisualIndex: number,
    scripts: {
      name: string;
      command: string;
      iconUri: string;
      relativePath: string;
      isFavourite: boolean;
      packageLabel?: string;
    }[],
    isFavouritesTab: boolean,
  ): string {
    const nonce = getNonce();

    const tabsHtml = tabs
      .map((tab, i) => {
        const isActive =
          (isFavouritesTab && tab.isFavourites) ||
          (!isFavouritesTab && i === activeVisualIndex);
        const dataIndex = tab.isFavourites
          ? -1
          : i - (tabs[0]?.isFavourites ? 1 : 0);
        const icon = tab.isFavourites
          ? `<span class="tab-icon">${SVG_STAR_FULL}</span>`
          : "";
        const dataPath = tab.relativePath
          ? ` data-path="${escapeHtml(tab.relativePath)}"`
          : "";
        return `<button class="tab${isActive ? " active" : ""}" data-index="${dataIndex}"${dataPath}>${icon}${escapeHtml(tab.label)}</button>`;
      })
      .join("");

    const scriptsHtml = scripts
      .map(
        (s) => `
      <div class="script-row" data-relative-path="${escapeHtml(s.relativePath)}" data-name="${escapeHtml(s.name)}">
        <img class="script-icon" src="${s.iconUri}" />
        <div class="script-info">
          <span class="script-name">${escapeHtml(s.name)}</span>
          ${s.packageLabel ? `<span class="script-package">${escapeHtml(s.packageLabel)}</span>` : ""}
        </div>
        <div class="script-actions">
          <button class="action-btn" data-action="toggleFavourite" title="${s.isFavourite ? "Remove favourite" : "Add favourite"}">
            ${s.isFavourite ? SVG_STAR_FULL : SVG_STAR_EMPTY}
          </button>
          <button class="action-btn" data-action="open" title="Open in package.json">
            ${SVG_GO_TO_FILE}
          </button>
          <button class="action-btn" data-action="debug" title="Debug script">
            ${SVG_DEBUG}
          </button>
          <button class="action-btn" data-action="openExternal" title="Run in external terminal">
            ${SVG_TERMINAL}
          </button>
          <button class="action-btn run-btn" data-action="run" title="Run script">
            ${SVG_PLAY}
          </button>
        </div>
      </div>`,
      )
      .join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${_webview.cspSource}; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
  <style nonce="${nonce}">
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: transparent;
      overflow-x: hidden;
    }

    .tabs {
      display: flex;
      gap: 0;
      padding: 0 8px;
      overflow-x: auto;
      border-bottom: 1px solid var(--vscode-panel-border, var(--vscode-widget-border, transparent));
      scrollbar-width: none;
    }

    .tabs::-webkit-scrollbar {
      display: none;
    }

    .tab {
      flex-shrink: 0;
      padding: 6px 12px;
      border: none;
      background: transparent;
      color: var(--vscode-foreground);
      opacity: 0.6;
      cursor: pointer;
      font-size: var(--vscode-font-size);
      font-family: var(--vscode-font-family);
      border-bottom: 2px solid transparent;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: opacity 0.1s;
    }

    .tab:hover {
      opacity: 1;
    }

    .tab.active {
      opacity: 1;
      border-bottom-color: var(--vscode-focusBorder, var(--vscode-textLink-foreground));
    }

    .tab-icon {
      display: flex;
      align-items: center;
    }

    .tab-icon svg {
      width: 12px;
      height: 12px;
      color: var(--vscode-notificationsWarningIcon-foreground, #cca700);
    }

    .scripts {
      padding: 4px 0;
    }

    .script-row {
      display: flex;
      align-items: center;
      padding: 3px 8px 3px 16px;
      cursor: pointer;
      gap: 8px;
      height: 22px;
      position: relative;
    }

    .script-row:hover {
      background: var(--vscode-list-hoverBackground);
    }

    .script-icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    .script-info {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: baseline;
      gap: 6px;
      overflow: hidden;
    }

    .script-name {
      flex-shrink: 0;
      font-weight: normal;
    }

    .script-package {
      opacity: 0.5;
      font-size: 0.85em;
      white-space: nowrap;
    }

    .script-actions {
      display: none;
      position: absolute;
      right: 8px;
      top: 0;
      bottom: 0;
      gap: 2px;
      align-items: center;
      background: var(--vscode-list-hoverBackground);
    }

    .script-row:hover .script-actions {
      display: flex;
    }

    .action-btn {
      border: none;
      background: transparent;
      color: var(--vscode-foreground);
      cursor: pointer;
      padding: 2px;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.7;
    }

    .action-btn:hover {
      opacity: 1;
      background: var(--vscode-toolbar-hoverBackground);
    }

    .action-btn svg {
      width: 16px;
      height: 16px;
    }

    .empty {
      padding: 16px;
      text-align: center;
      opacity: 0.6;
    }
  </style>
</head>
<body>
  <div class="tabs">${tabsHtml}</div>
  <div class="scripts">
    ${scripts.length > 0 ? scriptsHtml : '<div class="empty">No scripts found</div>'}
  </div>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        if (tab.classList.contains('active') && tab.dataset.path) {
          vscode.postMessage({ type: 'openPackageJson', relativePath: tab.dataset.path });
          return;
        }
        const index = parseInt(tab.dataset.index, 10);
        vscode.postMessage({ type: 'selectTab', tabIndex: index });
      });
    });

    document.querySelectorAll('.script-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.action-btn')) return;
        vscode.postMessage({
          type: 'runDefault',
          relativePath: row.dataset.relativePath,
          scriptName: row.dataset.name,
        });
      });
    });

    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const row = btn.closest('.script-row');
        vscode.postMessage({
          type: btn.dataset.action,
          relativePath: row.dataset.relativePath,
          scriptName: row.dataset.name,
        });
      });
    });
  </script>
</body>
</html>`;
  }
}

function getNonce(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let nonce = "";
  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
