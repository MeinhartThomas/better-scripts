import * as path from "path";
import * as vscode from "vscode";
import type { ScriptEntry } from "./packageJsonParser";
import type { PackageManager } from "./packageManagerDetector";
import { getIconPath } from "./iconResolver";

export class PackageJsonTreeItem extends vscode.TreeItem {
  constructor(
    public readonly relativePath: string,
    public readonly packageJsonUri: vscode.Uri,
    packageManager: PackageManager,
    extensionPath: string,
  ) {
    super(relativePath, vscode.TreeItemCollapsibleState.Expanded);
    this.contextValue = "packageJson";

    const pmIconName =
      packageManager === "pnpm" ? "pnpm-light" : packageManager;
    const pmIcon = vscode.Uri.file(
      path.join(extensionPath, "icons", `${pmIconName}.svg`),
    );

    if (packageManager === "pnpm") {
      this.iconPath = {
        light: vscode.Uri.file(
          path.join(extensionPath, "icons", "pnpm-light.svg"),
        ),
        dark: vscode.Uri.file(
          path.join(extensionPath, "icons", "pnpm-dark.svg"),
        ),
      };
    } else {
      this.iconPath = { light: pmIcon, dark: pmIcon };
    }

    this.tooltip = packageJsonUri.fsPath;
    this.command = {
      command: "betterScripts.openPackageJson",
      title: "Open package.json",
      arguments: [this],
    };
  }
}

export class ScriptTreeItem extends vscode.TreeItem {
  constructor(
    public readonly script: ScriptEntry,
    extensionPath: string,
  ) {
    super(script.name, vscode.TreeItemCollapsibleState.None);

    this.contextValue = "script";
    this.tooltip = `${script.packageManager} run ${script.name}\n${script.command}`;
    this.description = script.command;

    this.iconPath = getIconPath(extensionPath, script.name, script.command);

    this.command = {
      command: "betterScripts.runScript",
      title: "Run Script",
      arguments: [this],
    };
  }
}
