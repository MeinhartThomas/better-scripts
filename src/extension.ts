import * as vscode from "vscode";
import { ScriptTreeProvider } from "./ScriptTreeProvider";
import { PackageJsonTreeItem, ScriptTreeItem } from "./ScriptTreeItem";
import { createPackageJsonWatcher } from "./packageJsonParser";
import type { ScriptEntry } from "./packageJsonParser";
import {
  runScript,
  debugScript,
  openScriptInPackageJson,
  openInExternalTerminal,
  openInExternalTerminalEntry,
  runScriptEntry,
  debugScriptEntry,
  openScriptEntryInPackageJson,
} from "./scriptRunner";
import { FavouritesManager, compositeKey } from "./FavouritesManager";
import { ScriptWebviewProvider } from "./ScriptWebviewProvider";

function debounce(fn: () => void, ms: number): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(fn, ms);
  };
}

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  const favouritesManager = new FavouritesManager(context.workspaceState);
  context.subscriptions.push(favouritesManager);

  // Tree view (list mode)
  const treeProvider = new ScriptTreeProvider(
    context.extensionPath,
    favouritesManager,
  );

  const treeView = vscode.window.createTreeView("betterScripts", {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);

  // Webview (tabs mode)
  const webviewProvider = new ScriptWebviewProvider(
    context.extensionUri,
    favouritesManager,
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "betterScriptsTabs",
      webviewProvider,
      { webviewOptions: { retainContextWhenHidden: true } },
    ),
  );

  // Initial data load
  await treeProvider.refresh();
  await webviewProvider.refresh();

  // File watcher
  const debouncedRefresh = debounce(() => {
    treeProvider.refresh();
    webviewProvider.refresh();
  }, 300);
  const watcher = createPackageJsonWatcher(() => debouncedRefresh());
  context.subscriptions.push(watcher);

  // Favourites change → refresh both views
  context.subscriptions.push(
    favouritesManager.onDidChange(() => {
      treeProvider.refresh();
      webviewProvider.refresh();
    }),
  );

  // Config change → refresh both views
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("betterScripts.viewMode")) {
        treeProvider.refresh();
        webviewProvider.refresh();
      }
    }),
  );

  // --- Commands ---

  // Tree view commands (receive ScriptTreeItem instances)
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "betterScripts.runScript",
      (item: ScriptTreeItem) => {
        if (item instanceof ScriptTreeItem) {
          runScript(item);
        }
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "betterScripts.debugScript",
      (item: ScriptTreeItem) => {
        if (item instanceof ScriptTreeItem) {
          debugScript(item);
        }
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "betterScripts.openScript",
      (item: ScriptTreeItem) => {
        if (item instanceof ScriptTreeItem) {
          openScriptInPackageJson(item);
        }
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "betterScripts.openInExternalTerminal",
      (item: ScriptTreeItem) => {
        if (item instanceof ScriptTreeItem) {
          openInExternalTerminal(item);
        }
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "betterScripts.runScriptDefault",
      (item: ScriptTreeItem) => {
        if (item instanceof ScriptTreeItem) {
          const action = vscode.workspace
            .getConfiguration("betterScripts")
            .get<string>("defaultClickAction", "integratedTerminal");
          if (action === "externalTerminal") {
            openInExternalTerminalEntry(item.script);
          } else {
            runScriptEntry(item.script);
          }
        }
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "betterScripts.openPackageJson",
      (item: PackageJsonTreeItem) => {
        if (item instanceof PackageJsonTreeItem) {
          vscode.window.showTextDocument(item.packageJsonUri);
        }
      },
    ),
  );

  // Webview commands (receive plain ScriptEntry objects)
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "betterScripts.runScriptEntry",
      (entry: ScriptEntry) => {
        runScriptEntry(entry);
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "betterScripts.debugScriptEntry",
      (entry: ScriptEntry) => {
        debugScriptEntry(entry);
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "betterScripts.openScriptEntry",
      (entry: ScriptEntry) => {
        openScriptEntryInPackageJson(entry);
      },
    ),
  );

  // Shared commands
  context.subscriptions.push(
    vscode.commands.registerCommand("betterScripts.refresh", () => {
      treeProvider.refresh();
      webviewProvider.refresh();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "betterScripts.toggleFavourite",
      (item: ScriptTreeItem) => {
        if (item instanceof ScriptTreeItem) {
          const key = compositeKey(item.script.relativePath, item.script.name);
          favouritesManager.toggleFavourite(key);
        }
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "betterScripts.removeFavourite",
      (item: ScriptTreeItem) => {
        if (item instanceof ScriptTreeItem) {
          const key = compositeKey(item.script.relativePath, item.script.name);
          favouritesManager.toggleFavourite(key);
        }
      },
    ),
  );
}

export function deactivate(): void {}
