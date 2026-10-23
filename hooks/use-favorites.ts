"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  addFavorite,
  createFavoritesStore,
  removeFavorite,
  toFavorite,
  type FavoriteInput,
} from "@/lib/favorites";
import type { FavoriteBook } from "@/types/book";

const store = createFavoritesStore(() => (typeof window === "undefined" ? null : window.localStorage));

const EMPTY: FavoriteBook[] = [];
const getServerSnapshot = () => EMPTY;

const noopSubscribe = () => () => {};

/** False during SSR and hydration, true afterwards. Avoids hydration mismatches. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}


export function useFavorites() {
  const favorites = useSyncExternalStore(store.subscribe, store.getSnapshot, getServerSnapshot);

  const isFavorite = useCallback((id: string) => favorites.some((b) => b.id === id), [favorites]);

  const add = useCallback((book: FavoriteInput | FavoriteBook) => {
    const entry = "addedAt" in book ? book : toFavorite(book, Date.now());
    return store.set(addFavorite(store.getSnapshot(), entry));
  }, []);

  const remove = useCallback((id: string) => store.set(removeFavorite(store.getSnapshot(), id)), []);

  const clear = useCallback(() => store.set([]), []);

  const replaceAll = useCallback((list: FavoriteBook[]) => store.set(list), []);

  return { favorites, isFavorite, add, remove, clear, replaceAll };
}
