import { readJson, writeJson } from "@/lib/disk-cache";
import type { ApiErrorCode, Result } from "@/types/book";

/*
 * Server-only HTTP client for Open Library (it uses the disk cache, so it must
 * never be imported from client components; pure helpers live in
 * lib/open-library.ts).
 */

const USER_AGENT = "KetabGard/0.1 (book discovery; educational project)";
const TIMEOUT_MS = 12_000;

/* ------------------------------------------------------------------------ */
/* Polite client: Open Library is a shared public service. Bursts (many     */
/* visitors at once, or one page fanning out) are smoothed so the server    */
/* never trips its rate limiting.                                           */
/* ------------------------------------------------------------------------ */

const MAX_CONCURRENT = 6;
const DISK_TTL_MS = 6 * 60 * 60 * 1000;
const RETRYABLE: readonly ApiErrorCode[] = ["rate_limited", "upstream", "network"];

let active = 0;
const waiting: (() => void)[] = [];

async function withSlot<T>(task: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENT) await new Promise<void>((resolve) => waiting.push(resolve));
  active++;
  try {
    return await task();
  } finally {
    active--;
    waiting.shift()?.();
  }
}

type Attempt<T> = { result: Result<T>; retryAfterMs: number | null };

async function attempt<T>(url: URL | string): Promise<Attempt<T>> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    const code: ApiErrorCode = name === "TimeoutError" || name === "AbortError" ? "timeout" : "network";
    return { result: { ok: false, error: code }, retryAfterMs: null };
  }

  if (response.status === 404) return { result: { ok: false, error: "not_found" }, retryAfterMs: null };
  if (response.status === 429 || !response.ok) {
    const header = Number(response.headers.get("retry-after"));
    return {
      result: { ok: false, error: response.status === 429 ? "rate_limited" : "upstream" },
      retryAfterMs: Number.isFinite(header) && header > 0 ? header * 1000 : null,
    };
  }

  try {
    return { result: { ok: true, data: (await response.json()) as T }, retryAfterMs: null };
  } catch {
    return { result: { ok: false, error: "upstream" }, retryAfterMs: null };
  }
}

const inflight = new Map<string, Promise<Result<unknown>>>();

/**
 * Fetches JSON from Open Library with a timeout and typed failure modes.
 * At most six requests run at once, identical concurrent requests share one
 * fetch, and transient failures (429, 5xx, network) are retried once with a
 * short backoff that honours Retry-After (capped at 3s). Timeouts are not
 * retried, to keep the worst case bounded.
 */
export function fetchOpenLibraryJson<T>(url: URL | string): Promise<Result<T>> {
  const key = String(url);
  const running = inflight.get(key);
  if (running) return running as Promise<Result<T>>;

  // Successful responses persist on disk for a few hours (fast restarts, fewer upstream calls).
  const stored = readJson<T>("ol", key, DISK_TTL_MS);
  if (stored !== undefined) return Promise.resolve({ ok: true, data: stored });

  const job = withSlot(async () => {
    const first = await attempt<T>(url);
    let result = first.result;
    if (!result.ok && RETRYABLE.includes(result.error)) {
      const wait = Math.min(first.retryAfterMs ?? 600 + Math.random() * 400, 3000);
      await new Promise((resolve) => setTimeout(resolve, wait));
      result = (await attempt<T>(url)).result;
    }
    if (result.ok) writeJson("ol", key, result.data);
    return result;
  }).finally(() => inflight.delete(key));

  inflight.set(key, job);
  return job;
}
