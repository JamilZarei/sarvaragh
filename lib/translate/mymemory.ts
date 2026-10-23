/**
 * MyMemory (https://mymemory.translated.net) — free machine translation, no key.
 *
 * Limits: about 500 bytes per request and a daily character quota per IP
 * (5,000 anonymous; 50,000 when MYMEMORY_EMAIL is set). Short texts are batched
 * into one request separated by newlines; a quota warning pauses the provider.
 */

const ENDPOINT = "https://api.mymemory.translated.net/get";
const MAX_BYTES = 450;
const TIMEOUT_MS = 8_000;
const CONCURRENCY = 4;

let pausedUntil = 0;

/* Process-wide cap on simultaneous MyMemory requests (several pages may translate at once). */
const MAX_GLOBAL = 6;
let active = 0;
const waiting: (() => void)[] = [];

async function withSlot<T>(task: () => Promise<T>): Promise<T> {
  if (active >= MAX_GLOBAL) await new Promise<void>((resolve) => waiting.push(resolve));
  active++;
  try {
    return await task();
  } finally {
    active--;
    waiting.shift()?.();
  }
}

export function myMemoryAvailable(): boolean {
  return Date.now() >= pausedUntil;
}

const encoder = new TextEncoder();
const byteLength = (s: string) => encoder.encode(s).length;

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name: string) => ENTITIES[name.toLowerCase()] ?? m);
}

type MyMemoryResponse = {
  responseStatus?: number | string;
  quotaFinished?: boolean;
  responseData?: { translatedText?: string };
};

function request(q: string, langpair: string): Promise<string | null> {
  return withSlot(() => requestNow(q, langpair));
}

async function requestNow(q: string, langpair: string): Promise<string | null> {
  if (!myMemoryAvailable()) return null;
  const url = new URL(ENDPOINT);
  url.searchParams.set("q", q);
  url.searchParams.set("langpair", langpair);
  const email = process.env.MYMEMORY_EMAIL;
  if (email) url.searchParams.set("de", email);

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { Accept: "application/json" } });
    if (res.status === 429 || res.status === 403) {
      pausedUntil = Date.now() + 60 * 60 * 1000;
      return null;
    }
    if (!res.ok) return null;
    const body = (await res.json()) as MyMemoryResponse;
    const text = body.responseData?.translatedText ?? "";
    if (body.quotaFinished || /MYMEMORY WARNING|QUOTA/i.test(text)) {
      pausedUntil = Date.now() + 60 * 60 * 1000;
      return null;
    }
    if (Number(body.responseStatus) !== 200 || !text.trim()) return null;
    return decodeEntities(text).trim();
  } catch {
    return null;
  }
}

/** Runs async jobs with a small concurrency limit. */
async function pool<T>(jobs: (() => Promise<T>)[], limit = CONCURRENCY): Promise<T[]> {
  const results = new Array<T>(jobs.length);
  let next = 0;
  async function worker() {
    while (next < jobs.length) {
      const i = next++;
      results[i] = await jobs[i]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, jobs.length) }, worker));
  return results;
}

/** Splits long text at sentence boundaries into request-sized pieces. */
export function splitForRequest(text: string, maxBytes = MAX_BYTES): string[] {
  if (byteLength(text) <= maxBytes) return [text];
  const sentences = text.match(/[^.!?؟]+[.!?؟]*\s*/g) ?? [text];
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if (byteLength(current + sentence) > maxBytes && current) {
      chunks.push(current.trim());
      current = "";
    }
    if (byteLength(sentence) > maxBytes) {
      // A single very long sentence: cut at word boundaries.
      for (const word of sentence.split(/\s+/)) {
        if (byteLength(`${current} ${word}`) > maxBytes && current) {
          chunks.push(current.trim());
          current = "";
        }
        current += `${word} `;
      }
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/** Translates a long text (e.g. a description paragraph) piece by piece. */
async function translateLong(text: string, langpair: string): Promise<string | null> {
  const pieces = splitForRequest(text);
  const out = await pool(pieces.map((p) => () => request(p, langpair)));
  return out.every((p) => p) ? out.join(" ") : null;
}

/**
 * Translates many short strings with as few requests as possible.
 * Returns `null` for any string that could not be translated.
 */
export async function myMemoryTranslate(texts: string[], langpair = "autodetect|fa"): Promise<(string | null)[]> {
  const clean = texts.map((t) => t.replace(/\s*\n\s*/g, " ").trim());
  const results: (string | null)[] = new Array(texts.length).fill(null);

  // Group short strings into newline-separated batches under the byte limit.
  const batches: number[][] = [];
  const singles: number[] = [];
  let current: number[] = [];
  let size = 0;
  clean.forEach((text, i) => {
    const len = byteLength(text) + 1;
    if (len > MAX_BYTES) {
      singles.push(i);
      return;
    }
    if (size + len > MAX_BYTES && current.length) {
      batches.push(current);
      current = [];
      size = 0;
    }
    current.push(i);
    size += len;
  });
  if (current.length) batches.push(current);

  const jobs: (() => Promise<void>)[] = [
    ...batches.map((batch) => async () => {
      const joined = batch.map((i) => clean[i]).join("\n");
      const translated = await request(joined, langpair);
      const lines = translated?.split(/\n/).map((l) => l.trim()) ?? [];
      if (translated && lines.length === batch.length) {
        batch.forEach((i, j) => (results[i] = lines[j] || null));
        return;
      }
      if (!translated || batch.length === 1) {
        if (batch.length === 1 && translated) results[batch[0]] = translated;
        return;
      }
      // The service merged or split lines: fall back to one request per string.
      const each = await pool(batch.map((i) => () => request(clean[i], langpair)));
      batch.forEach((i, j) => (results[i] = each[j]));
    }),
    ...singles.map((i) => async () => {
      results[i] = await translateLong(clean[i], langpair);
    }),
  ];
  await pool(jobs);
  return results;
}
