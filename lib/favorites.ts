import { sortBooks } from "@/lib/books";
import { isValidWorkId } from "@/lib/open-library";
import type { BookSummary, FavoriteBook } from "@/types/book";

export const FAVORITES_STORAGE_KEY = "ketabgard:favorites:v1";
export const MAX_FAVORITES = 500;

function isFavoriteBook(value: unknown): value is FavoriteBook {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    isValidWorkId(v.id) &&
    typeof v.title === "string" &&
    v.title.length > 0 &&
    Array.isArray(v.authors) &&
    v.authors.every((a) => typeof a === "string") &&
    (v.firstPublishYear === null || typeof v.firstPublishYear === "number") &&
    (v.coverId === null || typeof v.coverId === "number") &&
    typeof v.addedAt === "number"
  );
}

/** Parses stored JSON defensively: corrupt or foreign data never crashes the UI. */
export function parseFavorites(raw: string | null): FavoriteBook[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    return parsed
      .filter((item): item is FavoriteBook => {
        if (!isFavoriteBook(item) || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .map(sanitizeOptional);
  } catch {
    return [];
  }
}

/** Optional fields were added later; drop malformed values instead of rejecting the entry. */
function sanitizeOptional(book: FavoriteBook): FavoriteBook {
  return {
    ...book,
    titleFa: typeof book.titleFa === "string" && book.titleFa ? book.titleFa : null,
    authorsFa: Array.isArray(book.authorsFa)
      ? book.authorsFa.map((a) => (typeof a === "string" && a ? a : null))
      : book.authors.map(() => null),
    ratingAverage: typeof book.ratingAverage === "number" ? book.ratingAverage : null,
    coverEditionId: typeof book.coverEditionId === "string" ? book.coverEditionId : null,
  };
}

export type FavoriteInput = Pick<BookSummary, "id" | "title" | "authors" | "firstPublishYear" | "coverId"> &
  Partial<Pick<BookSummary, "titleFa" | "authorsFa" | "ratingAverage" | "coverEditionId">>;

export function toFavorite(book: FavoriteInput, now: number): FavoriteBook {
  return {
    id: book.id,
    title: book.title,
    titleFa: book.titleFa ?? null,
    authors: book.authors.slice(0, 5),
    authorsFa: (book.authorsFa ?? []).slice(0, 5),
    firstPublishYear: book.firstPublishYear,
    coverId: book.coverId,
    coverEditionId: book.coverEditionId ?? null,
    ratingAverage: book.ratingAverage ?? null,
    addedAt: now,
  };
}

export function hasFavorite(list: readonly FavoriteBook[], id: string): boolean {
  return list.some((b) => b.id === id);
}

/** Newest first; adding an existing book is a no-op. */
export function addFavorite(list: readonly FavoriteBook[], book: FavoriteBook): FavoriteBook[] {
  if (hasFavorite(list, book.id)) return [...list];
  return [book, ...list].slice(0, MAX_FAVORITES);
}

export function removeFavorite(list: readonly FavoriteBook[], id: string): FavoriteBook[] {
  return list.filter((b) => b.id !== id);
}

/* ------------------------------------------------------------------------ */
/* localStorage-backed store compatible with useSyncExternalStore           */
/* ------------------------------------------------------------------------ */

type Listener = () => void;

export type FavoritesStore = {
  getSnapshot: () => FavoriteBook[];
  subscribe: (listener: Listener) => () => void;
  /** Returns false when the browser refused to persist (quota, privacy mode…). */
  set: (next: FavoriteBook[]) => boolean;
};

export function createFavoritesStore(getStorage: () => Storage | null): FavoritesStore {
  const listeners = new Set<Listener>();
  let cachedRaw: string | null | undefined;
  let cachedList: FavoriteBook[] = [];
  // In-memory fallback so the session still works when storage is unavailable.
  let memoryRaw: string | null = null;

  const readRaw = (): string | null => {
    try {
      const storage = getStorage();
      return storage ? storage.getItem(FAVORITES_STORAGE_KEY) : memoryRaw;
    } catch {
      return memoryRaw;
    }
  };

  const emit = () => listeners.forEach((l) => l());

  return {
    getSnapshot() {
      const raw = readRaw();
      if (raw !== cachedRaw) {
        cachedRaw = raw;
        cachedList = parseFavorites(raw);
      }
      return cachedList;
    },
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (event: StorageEvent) => {
        if (event.key === null || event.key === FAVORITES_STORAGE_KEY) listener();
      };
      if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
      };
    },
    set(next) {
      const raw = JSON.stringify(next);
      memoryRaw = raw;
      let persisted = true;
      try {
        const storage = getStorage();
        if (storage) storage.setItem(FAVORITES_STORAGE_KEY, raw);
        else persisted = false;
      } catch {
        persisted = false;
      }
      emit();
      return persisted;
    },
  };
}

/* ------------------------------------------------------------------------ */
/* Sorting                                                                  */
/* ------------------------------------------------------------------------ */

export type FavoritesSort = "recent" | "oldest-added" | "title-asc" | "title-desc" | "new" | "old" | "rating";

export const FAVORITE_SORTS: readonly { key: FavoritesSort; label: string }[] = [
  { key: "recent", label: "تازه‌ترین افزوده‌ها" },
  { key: "oldest-added", label: "قدیمی‌ترین افزوده‌ها" },
  { key: "title-asc", label: "عنوان (الف تا ی)" },
  { key: "title-desc", label: "عنوان (ی تا الف)" },
  { key: "new", label: "جدیدترین انتشار" },
  { key: "old", label: "قدیمی‌ترین انتشار" },
  { key: "rating", label: "بالاترین امتیاز" },
];

export function sortFavorites(list: readonly FavoriteBook[], sort: FavoritesSort): FavoriteBook[] {
  switch (sort) {
    case "recent":
      return [...list].sort((a, b) => b.addedAt - a.addedAt);
    case "oldest-added":
      return [...list].sort((a, b) => a.addedAt - b.addedAt);
    default:
      return sortBooks(list, sort);
  }
}
