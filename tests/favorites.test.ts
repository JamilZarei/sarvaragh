import { describe, expect, it, vi } from "vitest";

import {
  addFavorite,
  createFavoritesStore,
  FAVORITES_STORAGE_KEY,
  hasFavorite,
  parseFavorites,
  removeFavorite,
  sortFavorites,
  toFavorite,
} from "@/lib/favorites";
import type { FavoriteBook } from "@/types/book";

const fav = (id: string, title: string, addedAt: number, year: number | null = null): FavoriteBook => ({
  id,
  title,
  authors: [],
  firstPublishYear: year,
  coverId: null,
  addedAt,
});

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  key(i: number) {
    return [...this.map.keys()][i] ?? null;
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
}

describe("favorites list operations", () => {
  it("adds newest first without duplicates and removes by id", () => {
    let list = addFavorite([], fav("OL1W", "A", 1));
    list = addFavorite(list, fav("OL2W", "B", 2));
    list = addFavorite(list, fav("OL1W", "A again", 3));
    expect(list.map((b) => b.id)).toEqual(["OL2W", "OL1W"]);
    expect(hasFavorite(list, "OL1W")).toBe(true);
    expect(removeFavorite(list, "OL1W").map((b) => b.id)).toEqual(["OL2W"]);
  });

  it("keeps only the fields needed for display", () => {
    const entry = toFavorite(
      { id: "OL9W", title: "T", authors: ["a", "b", "c", "d", "e", "f"], firstPublishYear: 2001, coverId: 5 },
      42,
    );
    expect(entry).toEqual({
      id: "OL9W",
      title: "T",
      titleFa: null,
      authors: ["a", "b", "c", "d", "e"],
      authorsFa: [],
      firstPublishYear: 2001,
      coverId: 5,
      coverEditionId: null,
      ratingAverage: null,
      addedAt: 42,
    });
  });

  it("accepts entries saved before Persian fields existed and drops malformed optional values", () => {
    const legacy = JSON.stringify([{ id: "OL1W", title: "Old", authors: ["A"], firstPublishYear: null, coverId: null, addedAt: 1 }]);
    expect(parseFavorites(legacy)[0]).toMatchObject({ titleFa: null, authorsFa: [null], ratingAverage: null });
    const bad = JSON.stringify([{ ...fav("OL2W", "B", 1), titleFa: 42, authorsFa: "x", ratingAverage: "5" }]);
    expect(parseFavorites(bad)[0]).toMatchObject({ titleFa: null, authorsFa: [], ratingAverage: null });
  });

  it("parses stored data defensively", () => {
    expect(parseFavorites(null)).toEqual([]);
    expect(parseFavorites("{broken")).toEqual([]);
    expect(parseFavorites('{"not":"an array"}')).toEqual([]);
    const raw = JSON.stringify([fav("OL1W", "A", 1), { id: "bad", title: "x" }, fav("OL1W", "dup", 2), { ...fav("OL3W", "C", 3), coverId: "x" }]);
    expect(parseFavorites(raw).map((b) => b.title)).toEqual(["A"]);
  });

  it("sorts favorites by date added, title or year", () => {
    const list = [fav("OL1W", "Beta", 10, 1990), fav("OL2W", "alpha", 30, null), fav("OL3W", "Gamma", 20, 2005)];
    expect(sortFavorites(list, "recent").map((b) => b.id)).toEqual(["OL2W", "OL3W", "OL1W"]);
    expect(sortFavorites(list, "oldest-added").map((b) => b.id)).toEqual(["OL1W", "OL3W", "OL2W"]);
    expect(sortFavorites(list, "title-asc").map((b) => b.title)).toEqual(["alpha", "Beta", "Gamma"]);
    expect(sortFavorites(list, "new").map((b) => b.firstPublishYear)).toEqual([2005, 1990, null]);
  });
});

describe("createFavoritesStore", () => {
  it("persists to storage, notifies subscribers and keeps a stable snapshot", () => {
    const storage = new MemoryStorage();
    const store = createFavoritesStore(() => storage);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    const first = store.getSnapshot();
    expect(store.getSnapshot()).toBe(first); // same reference while unchanged

    expect(store.set([fav("OL1W", "A", 1)])).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(JSON.parse(storage.getItem(FAVORITES_STORAGE_KEY) ?? "[]")).toHaveLength(1);
    expect(store.getSnapshot().map((b) => b.id)).toEqual(["OL1W"]);

    unsubscribe();
    store.set([]);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("falls back to memory when storage throws (quota, privacy mode)", () => {
    const broken = new MemoryStorage();
    broken.setItem = () => {
      throw new DOMException("quota", "QuotaExceededError");
    };
    broken.getItem = () => {
      throw new DOMException("denied", "SecurityError");
    };
    const store = createFavoritesStore(() => broken);
    expect(store.getSnapshot()).toEqual([]);
    expect(store.set([fav("OL1W", "A", 1)])).toBe(false);
    expect(store.getSnapshot().map((b) => b.id)).toEqual(["OL1W"]);
  });

  it("works without any storage (server rendering)", () => {
    const store = createFavoritesStore(() => null);
    expect(store.getSnapshot()).toEqual([]);
    expect(store.set([fav("OL1W", "A", 1)])).toBe(false);
  });
});
