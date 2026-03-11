import * as vscode from "vscode";
import { ScriptTreeProvider } from "./ScriptTreeProvider";
import { PackageJsonTreeItem, ScriptTreeItem } from "./ScriptTreeItem";
import { createPackageJsonWatcher } from "./packageJsonParser";
import {
  runScript,
  debugScript,
  openScriptInPackageJson,
} from "./scriptRunner";

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
  const treeProvider = new ScriptTreeProvider(context.extensionPath);

  const treeView = vscode.window.createTreeView("betterScripts", {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);

  await treeProvider.refresh();

  const debouncedRefresh = debounce(() => treeProvider.refresh(), 300);
  const watcher = createPackageJsonWatcher(() => debouncedRefresh());
  context.subscriptions.push(watcher);

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
      "betterScripts.openPackageJson",
      (item: PackageJsonTreeItem) => {
        if (item instanceof PackageJsonTreeItem) {
          vscode.window.showTextDocument(item.packageJsonUri);
        }
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("betterScripts.refresh", () => {
      treeProvider.refresh();
    }),
  );
}

export function deactivate(): void {}
