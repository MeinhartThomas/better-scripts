import * as vscode from "vscode";
import {
  findAllPackageJsons,
  type PackageJsonEntry,
} from "./packageJsonParser";
import { PackageJsonTreeItem, ScriptTreeItem } from "./ScriptTreeItem";

type TreeElement = PackageJsonTreeItem | ScriptTreeItem;

export class ScriptTreeProvider implements vscode.TreeDataProvider<TreeElement> {
  private _onDidChangeTreeData = new vscode.EventEmitter<
    TreeElement | undefined | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private packageJsonEntries: PackageJsonEntry[] = [];
  private extensionPath: string;

  constructor(extensionPath: string) {
    this.extensionPath = extensionPath;
  }

  async refresh(): Promise<void> {
    this.packageJsonEntries = await findAllPackageJsons();
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeElement): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TreeElement): TreeElement[] {
    if (!element) {
      if (this.packageJsonEntries.length === 0) {
        return [];
      }
      return this.packageJsonEntries.map(
        (entry) =>
          new PackageJsonTreeItem(
            entry.relativePath,
            entry.uri,
            entry.packageManager,
            this.extensionPath,
          ),
      );
    }

    if (element instanceof PackageJsonTreeItem) {
      const entry = this.packageJsonEntries.find(
        (e) => e.uri.fsPath === element.packageJsonUri.fsPath,
      );
      if (!entry) {
        return [];
      }
      return entry.scripts.map(
        (s) => new ScriptTreeItem(s, this.extensionPath),
      );
    }

    return [];
  }
}
