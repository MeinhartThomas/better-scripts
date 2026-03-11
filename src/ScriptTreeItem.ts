import * as vscode from "vscode";
import type { ScriptEntry } from "./packageJsonParser";
import type { PackageManager } from "./packageManagerDetector";
import { getIconPath } from "./iconResolver";

export class PackageJsonTreeItem extends vscode.TreeItem {
  constructor(
    public readonly relativePath: string,
    public readonly packageJsonUri: vscode.Uri
  ) {
    super(relativePath, vscode.TreeItemCollapsibleState.Expanded);
    this.contextValue = "packageJson";
    this.iconPath = new vscode.ThemeIcon("package");
    this.tooltip = packageJsonUri.fsPath;
  }
}

export class ScriptTreeItem extends vscode.TreeItem {
  constructor(
    public readonly script: ScriptEntry,
    public readonly packageManager: PackageManager,
    extensionPath: string
  ) {
    super(script.name, vscode.TreeItemCollapsibleState.None);

    this.contextValue = "script";
    this.tooltip = `${packageManager} run ${script.name}\n${script.command}`;
    this.description = script.command;

    this.iconPath = getIconPath(
      extensionPath,
      script.name,
      script.command,
      packageManager
    );

    this.command = {
      command: "betterScripts.runScript",
      title: "Run Script",
      arguments: [this],
    };
  }
}
