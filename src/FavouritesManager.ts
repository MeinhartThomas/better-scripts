import * as vscode from "vscode";

const STORAGE_KEY = "betterScripts.favourites";

export class FavouritesManager {
  private _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChange = this._onDidChange.event;

  constructor(private state: vscode.Memento) {}

  isFavourite(compositeKey: string): boolean {
    return this.getSet().has(compositeKey);
  }

  toggleFavourite(compositeKey: string): void {
    const set = this.getSet();
    if (set.has(compositeKey)) {
      set.delete(compositeKey);
    } else {
      set.add(compositeKey);
    }
    this.state.update(STORAGE_KEY, [...set]);
    this._onDidChange.fire();
  }

  getFavouriteKeys(): string[] {
    return this.state.get<string[]>(STORAGE_KEY, []);
  }

  private getSet(): Set<string> {
    return new Set(this.state.get<string[]>(STORAGE_KEY, []));
  }

  dispose(): void {
    this._onDidChange.dispose();
  }
}

export function compositeKey(relativePath: string, scriptName: string): string {
  return `${relativePath}::${scriptName}`;
}
