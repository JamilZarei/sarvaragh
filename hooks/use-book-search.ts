"use client";

import { useCallback, useEffect, useState } from "react";

import type { ApiErrorCode, SearchResult } from "@/types/book";

export type SearchState =
  | { status: "idle" }
  | { status: "loading"; previous: SearchResult | null }
  | { status: "success"; data: SearchResult }
  | { status: "error"; error: ApiErrorCode };

/** Session-level cache: back/forward navigation and repeated filters are instant. */
const responseCache = new Map<string, SearchResult>();
const CACHE_LIMIT = 60;

function remember(key: string, data: SearchResult) {
  responseCache.delete(key);
  responseCache.set(key, data);
  if (responseCache.size > CACHE_LIMIT) {
    const oldest = responseCache.keys().next().value;
    if (oldest !== undefined) responseCache.delete(oldest);
  }
}

const KNOWN_ERRORS: readonly ApiErrorCode[] = ["network", "timeout", "rate_limited", "upstream", "not_found", "invalid"];

export class SearchError extends Error {
  constructor(public readonly code: ApiErrorCode) {
    super(code);
    this.name = "SearchError";
  }
}

export function getCachedSearch(apiUrl: string): SearchResult | undefined {
  return responseCache.get(apiUrl);
}

export async function fetchSearch(apiUrl: string, signal?: AbortSignal): Promise<SearchResult> {
  const cached = responseCache.get(apiUrl);
  if (cached) return cached;

  let response: Response;
  try {
    response = await fetch(apiUrl, { signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new SearchError("network");
  }
  if (!response.ok) {
    let code: ApiErrorCode = "upstream";
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error && (KNOWN_ERRORS as string[]).includes(body.error)) code = body.error as ApiErrorCode;
    } catch {
      /* keep the generic code */
    }
    throw new SearchError(code);
  }
  const data = (await response.json()) as SearchResult;
  remember(apiUrl, data);
  return data;
}

type Settled =
  | { key: string; attempt: number; status: "success"; data: SearchResult }
  | { key: string; attempt: number; status: "error"; error: ApiErrorCode };

/**
 * Fetches `/api/search` for the given URL. A new URL aborts the in-flight request,
 * so out-of-order responses can never overwrite newer results.
 * Pass `null` to stay idle. State is derived from the URL during render, so the
 * effect only performs the request and never sets state synchronously.
 */
export function useBookSearch(apiUrl: string | null) {
  const [settled, setSettled] = useState<Settled | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!apiUrl || responseCache.has(apiUrl)) return;
    const controller = new AbortController();
    fetchSearch(apiUrl, controller.signal)
      .then((data) => setSettled({ key: apiUrl, attempt, status: "success", data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setSettled({
          key: apiUrl,
          attempt,
          status: "error",
          error: error instanceof SearchError ? error.code : "network",
        });
      });
    return () => controller.abort();
  }, [apiUrl, attempt]);

  let state: SearchState;
  const cached = apiUrl ? responseCache.get(apiUrl) : undefined;
  if (!apiUrl) state = { status: "idle" };
  else if (cached) state = { status: "success", data: cached };
  else if (settled && settled.key === apiUrl && settled.attempt === attempt) {
    state = settled.status === "success" ? { status: "success", data: settled.data } : { status: "error", error: settled.error };
  } else state = { status: "loading", previous: settled?.status === "success" ? settled.data : null };

  // When the server could not finish translating in time, quietly ask again a few
  // times so Persian titles replace the originals without the user reloading.
  const pending = state.status === "success" && Boolean(state.data.translationPending);
  useEffect(() => {
    if (!apiUrl || !pending) return;
    const controller = new AbortController();
    let tries = 0;
    let timer: number | undefined;
    const refresh = async () => {
      tries++;
      try {
        const res = await fetch(apiUrl, { cache: "no-store", signal: controller.signal });
        if (!res.ok) return;
        const data = (await res.json()) as SearchResult;
        remember(apiUrl, data);
        setSettled({ key: apiUrl, attempt, status: "success", data });
        if (data.translationPending && tries < 3) timer = window.setTimeout(refresh, 3500);
      } catch {
        /* keep the current results */
      }
    };
    timer = window.setTimeout(refresh, 2500);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [apiUrl, pending, attempt]);

  const retry = useCallback(() => {
    if (apiUrl) responseCache.delete(apiUrl);
    setAttempt((n) => n + 1);
  }, [apiUrl]);

  return { state, retry };
}
