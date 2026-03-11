import * as vscode from "vscode";
import { ScriptTreeProvider } from "./ScriptTreeProvider";
import { PackageJsonTreeItem, ScriptTreeItem } from "./ScriptTreeItem";
import {
  detectPackageManager,
  type PackageManager,
} from "./packageManagerDetector";
import { createPackageJsonWatcher } from "./packageJsonParser";
import {
  runScript,
  debugScript,
  openScriptInPackageJson,
} from "./scriptRunner";

let treeProvider: ScriptTreeProvider;
let detectedPm: PackageManager = "npm";

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  treeProvider = new ScriptTreeProvider(context.extensionPath);

  const folders = vscode.workspace.workspaceFolders;
  if (folders && folders.length > 0) {
    detectedPm = await detectPackageManager(folders[0]);
    treeProvider.setPackageManager(detectedPm);
  }

  const treeView = vscode.window.createTreeView("betterScripts", {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);

  await treeProvider.refresh();

  const watcher = createPackageJsonWatcher(() => treeProvider.refresh());
  context.subscriptions.push(watcher);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "betterScripts.runScript",
      (item: ScriptTreeItem) => {
        if (item instanceof ScriptTreeItem) {
          runScript(item, detectedPm);
        }
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "betterScripts.debugScript",
      (item: ScriptTreeItem) => {
        if (item instanceof ScriptTreeItem) {
          debugScript(item, detectedPm);
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
