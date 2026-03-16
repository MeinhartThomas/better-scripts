import * as vscode from "vscode";
import {
  findAllPackageJsons,
  type PackageJsonEntry,
} from "./packageJsonParser";
import {
  FavouritesGroupTreeItem,
  PackageJsonTreeItem,
  ScriptTreeItem,
} from "./ScriptTreeItem";
import { FavouritesManager, compositeKey } from "./FavouritesManager";

type TreeElement =
  | PackageJsonTreeItem
  | ScriptTreeItem
  | FavouritesGroupTreeItem;

export class ScriptTreeProvider implements vscode.TreeDataProvider<TreeElement> {
  private _onDidChangeTreeData = new vscode.EventEmitter<
    TreeElement | undefined | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private packageJsonEntries: PackageJsonEntry[] = [];
  private extensionPath: string;
  private activeTabIndex = 0;

  constructor(
    extensionPath: string,
    private favouritesManager: FavouritesManager,
  ) {
    this.extensionPath = extensionPath;
  }

  async refresh(): Promise<void> {
    this.packageJsonEntries = await findAllPackageJsons();
    if (this.activeTabIndex >= this.packageJsonEntries.length) {
      this.activeTabIndex = 0;
    }
    this._onDidChangeTreeData.fire();
  }

  getPackageJsonEntries(): PackageJsonEntry[] {
    return this.packageJsonEntries;
  }

  getActiveTabIndex(): number {
    return this.activeTabIndex;
  }

  setActiveTab(index: number): void {
    this.activeTabIndex = index;
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

      const items: TreeElement[] = [];
      const favKeys = this.favouritesManager.getFavouriteKeys();

      if (favKeys.length > 0) {
        items.push(new FavouritesGroupTreeItem());
      }

      const viewMode = vscode.workspace
        .getConfiguration("betterScripts")
        .get<string>("viewMode", "list");

      if (viewMode === "tabs") {
        const entry = this.packageJsonEntries[this.activeTabIndex];
        if (entry) {
          for (const s of entry.scripts) {
            const key = compositeKey(s.relativePath, s.name);
            items.push(
              new ScriptTreeItem(
                s,
                this.extensionPath,
                this.favouritesManager.isFavourite(key),
              ),
            );
          }
        }
      } else {
        for (const entry of this.packageJsonEntries) {
          items.push(
            new PackageJsonTreeItem(
              entry.relativePath,
              entry.uri,
              entry.packageManager,
              this.extensionPath,
            ),
          );
        }
      }

      return items;
    }

    if (element instanceof FavouritesGroupTreeItem) {
      const favKeys = new Set(this.favouritesManager.getFavouriteKeys());
      const items: ScriptTreeItem[] = [];
      for (const entry of this.packageJsonEntries) {
        for (const s of entry.scripts) {
          const key = compositeKey(s.relativePath, s.name);
          if (favKeys.has(key)) {
            items.push(new ScriptTreeItem(s, this.extensionPath, true));
          }
        }
      }
      return items;
    }

    if (element instanceof PackageJsonTreeItem) {
      const entry = this.packageJsonEntries.find(
        (e) => e.uri.fsPath === element.packageJsonUri.fsPath,
      );
      if (!entry) {
        return [];
      }
      return entry.scripts.map((s) => {
        const key = compositeKey(s.relativePath, s.name);
        return new ScriptTreeItem(
          s,
          this.extensionPath,
          this.favouritesManager.isFavourite(key),
        );
      });
    }

    return [];
  }
}
