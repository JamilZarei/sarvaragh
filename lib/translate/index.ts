import { cacheGet, cacheSet } from "@/lib/translate/cache";
import { claudeAvailable, claudeTranslate } from "@/lib/translate/claude";
import { googleAvailable, googleTranslate } from "@/lib/translate/google";
import { lookupGlossary } from "@/lib/translate/glossary";
import { myMemoryAvailable, myMemoryTranslate } from "@/lib/translate/mymemory";

/**
 * Translation pipeline (server-only):
 *   1. text already in Persian → kept as is
 *   2. curated glossary (published titles, author names, subjects)
 *   3. cache (memory + disk)
 *   4. machine translation — Claude (when configured), then Google, then MyMemory
 *
 * Callers pass a deadline so a slow provider never blocks a page for long;
 * a translation that misses the deadline keeps running and fills the cache
 * for the next request.
 */

export type TranslateKind = "title" | "name" | "subject" | "text";

const ARABIC_SCRIPT = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/u;
const LETTER = /\p{L}/gu;

/** True when most letters are in Arabic script (Persian text needs no translation). */
export function isPersianText(text: string): boolean {
  const letters = text.match(LETTER) ?? [];
  if (letters.length === 0) return false;
  const persian = letters.filter((c) => ARABIC_SCRIPT.test(c)).length;
  return persian / letters.length > 0.5;
}

/** Strings with no letters ("1984", "21") are left alone. */
function needsTranslation(text: string): boolean {
  return /\p{L}/u.test(text) && !isPersianText(text);
}

const inflight = new Map<string, Promise<string | null>>();

function cacheKey(kind: TranslateKind | "query", text: string) {
  // Names and titles can collide ("Emma"); keep kinds separate except for the
  // three short kinds that translate identically.
  return `${kind === "text" ? "t" : kind === "query" ? "q" : "s"}:${text}`;
}

type Provider = {
  available: () => boolean;
  translate: (texts: string[], kind: TranslateKind | "query") => Promise<(string | null)[]>;
};

/**
 * Providers in order of preference. Each one only receives what the previous
 * ones could not translate, so a quota or outage on one service is covered by
 * the next.
 */
const PROVIDERS: Provider[] = [
  { available: claudeAvailable, translate: (texts, kind) => claudeTranslate(texts, kind) },
  {
    available: googleAvailable,
    translate: (texts, kind) => (kind === "query" ? googleTranslate(texts, "fa", "en") : googleTranslate(texts, "auto", "fa")),
  },
  {
    available: myMemoryAvailable,
    translate: (texts, kind) => myMemoryTranslate(texts, kind === "query" ? "fa|en" : "autodetect|fa"),
  },
];

async function provider(texts: string[], kind: TranslateKind | "query"): Promise<(string | null)[]> {
  const out: (string | null)[] = texts.map(() => null);
  for (const p of PROVIDERS) {
    const missing = out.map((t, i) => (t ? -1 : i)).filter((i) => i >= 0);
    if (missing.length === 0) break;
    if (!p.available()) continue;
    const got = await p.translate(
      missing.map((i) => texts[i]),
      kind,
    );
    missing.forEach((idx, j) => {
      const value = got[j];
      // Ignore echoes of the source text (an untranslated passthrough).
      if (value && value !== texts[idx]) out[idx] = value;
    });
  }
  return out;
}

/** Translates unique texts once, sharing in-flight work between concurrent requests. */
function translateUncached(texts: string[], kind: TranslateKind | "query"): Map<string, Promise<string | null>> {
  const result = new Map<string, Promise<string | null>>();
  const toFetch: string[] = [];
  for (const text of texts) {
    const key = cacheKey(kind, text);
    const running = inflight.get(key);
    if (running) result.set(text, running);
    else toFetch.push(text);
  }
  if (toFetch.length) {
    const batch = provider(toFetch, kind).catch(() => toFetch.map(() => null));
    toFetch.forEach((text, i) => {
      const key = cacheKey(kind, text);
      const promise = batch
        .then((out) => {
          const value = out[i];
          // Reject echoes (provider returned the source) so they can be retried later.
          if (value && value !== text) cacheSet(key, value);
          return value && value !== text ? value : null;
        })
        .finally(() => inflight.delete(key));
      inflight.set(key, promise);
      result.set(text, promise);
    });
  }
  return result;
}

function withDeadline<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(undefined), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(undefined);
      },
    );
  });
}

export type TranslationOutcome = {
  values: (string | null)[];
  /** False when some translation is still pending (deadline hit or provider unavailable). */
  complete: boolean;
};

/**
 * Translates texts into Persian. `values[i]` is null when no translation is
 * available; the UI then shows the original text.
 */
export async function translateToPersian(
  texts: readonly string[],
  kind: TranslateKind,
  { deadlineMs = 3500 }: { deadlineMs?: number } = {},
): Promise<TranslationOutcome> {
  const values: (string | null)[] = texts.map(() => null);
  const pending = new Map<string, number[]>();

  texts.forEach((raw, i) => {
    const text = raw.replace(/\s+/g, " ").trim();
    if (!text) return;
    // Glossary first: it also covers number-only titles such as "1984" → «۱۹۸۴».
    const curated = kind === "text" ? null : lookupGlossary(text, kind);
    if (curated) {
      values[i] = curated;
      return;
    }
    if (!needsTranslation(text)) {
      values[i] = isPersianText(text) ? text : null;
      return;
    }
    const cached = cacheGet(cacheKey(kind, text));
    if (cached) {
      values[i] = cached;
      return;
    }
    pending.set(text, [...(pending.get(text) ?? []), i]);
  });

  if (pending.size === 0) return { values, complete: true };

  const jobs = translateUncached([...pending.keys()], kind);
  const settled = await withDeadline(
    Promise.all([...jobs.entries()].map(async ([text, p]) => [text, await p] as const)),
    deadlineMs,
  );

  let complete = true;
  for (const [text, indices] of pending) {
    const value = settled?.find(([t]) => t === text)?.[1] ?? cacheGet(cacheKey(kind, text)) ?? null;
    if (!value) complete = false;
    for (const i of indices) values[i] = value;
  }
  return { values, complete };
}

/** Translates a Persian search query into English for the Open Library catalog. */
export async function translateQueryToEnglish(query: string, deadlineMs = 3000): Promise<string | null> {
  const text = query.replace(/\s+/g, " ").trim();
  if (!text || !isPersianText(text)) return null;
  const cached = cacheGet(cacheKey("query", text));
  if (cached) return cached;
  const job = translateUncached([text], "query").get(text);
  if (!job) return null;
  const value = await withDeadline(job, deadlineMs);
  return value && !isPersianText(value) ? value : null;
}
