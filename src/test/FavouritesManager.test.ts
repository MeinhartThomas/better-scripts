import { describe, it, expect, beforeEach } from "vitest";
import { FavouritesManager, compositeKey } from "../FavouritesManager";

class MockMemento {
  private store = new Map<string, unknown>();

  get<T>(key: string, defaultValue: T): T {
    return (this.store.get(key) as T) ?? defaultValue;
  }

  async update(key: string, value: unknown): Promise<void> {
    this.store.set(key, value);
  }

  keys(): readonly string[] {
    return [...this.store.keys()];
  }

  setKeysForSync(): void {}
}

describe("compositeKey", () => {
  it("joins relativePath and scriptName with ::", () => {
    expect(compositeKey("packages/app/package.json", "build")).toBe(
      "packages/app/package.json::build",
    );
  });
});

describe("FavouritesManager", () => {
  let memento: MockMemento;
  let manager: FavouritesManager;

  beforeEach(() => {
    memento = new MockMemento();
    manager = new FavouritesManager(memento as any);
  });

  it("starts with no favourites", () => {
    expect(manager.getFavouriteKeys()).toEqual([]);
  });

  it("isFavourite returns false for unknown keys", () => {
    expect(manager.isFavourite("pkg::build")).toBe(false);
  });

  it("toggleFavourite adds a key", () => {
    manager.toggleFavourite("pkg::build");
    expect(manager.isFavourite("pkg::build")).toBe(true);
    expect(manager.getFavouriteKeys()).toEqual(["pkg::build"]);
  });

  it("toggleFavourite removes an existing key", () => {
    manager.toggleFavourite("pkg::build");
    manager.toggleFavourite("pkg::build");
    expect(manager.isFavourite("pkg::build")).toBe(false);
    expect(manager.getFavouriteKeys()).toEqual([]);
  });

  it("handles multiple keys", () => {
    manager.toggleFavourite("pkg::build");
    manager.toggleFavourite("pkg::dev");
    manager.toggleFavourite("other::test");
    expect(manager.getFavouriteKeys()).toHaveLength(3);
    expect(manager.isFavourite("pkg::build")).toBe(true);
    expect(manager.isFavourite("pkg::dev")).toBe(true);
    expect(manager.isFavourite("other::test")).toBe(true);
  });

  it("removing one key does not affect others", () => {
    manager.toggleFavourite("pkg::build");
    manager.toggleFavourite("pkg::dev");
    manager.toggleFavourite("pkg::build");
    expect(manager.isFavourite("pkg::build")).toBe(false);
    expect(manager.isFavourite("pkg::dev")).toBe(true);
  });

  it("exposes onDidChange event", () => {
    // The event emitter is a vscode.EventEmitter; verify it exists
    expect(manager.onDidChange).toBeDefined();
  });

  it("persists to memento", () => {
    manager.toggleFavourite("pkg::build");
    const stored = memento.get<string[]>("betterScripts.favourites", []);
    expect(stored).toEqual(["pkg::build"]);
  });
});
