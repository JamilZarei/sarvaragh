/**
 * Google Translate (public web endpoint used by the browser extension), no key.
 *
 * Many strings are translated in one POST: titles of a whole results page take
 * a single request of a few hundred milliseconds. This is an unofficial
 * endpoint without a published quota, so it is used politely: at most four
 * requests at a time, and a 10-minute pause after a refusal.
 */

const ENDPOINT = "https://clients5.google.com/translate_a/t?client=dict-chrome-ex";
const TIMEOUT_MS = 10_000;
const MAX_ITEMS = 40;
const MAX_CHARS = 4500;
const MAX_CONCURRENT = 4;
const PAUSE_MS = 10 * 60 * 1000;

let pausedUntil = 0;
let active = 0;
const waiting: (() => void)[] = [];

export function googleAvailable(): boolean {
  return Date.now() >= pausedUntil;
}

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

/** Each entry is either "text" or ["text", "detected-language"]. */
function readEntry(entry: unknown): string | null {
  const text = typeof entry === "string" ? entry : Array.isArray(entry) && typeof entry[0] === "string" ? entry[0] : null;
  return text && text.trim() ? text.trim() : null;
}

async function requestBatch(texts: string[], from: string, to: string): Promise<(string | null)[]> {
  const empty = texts.map(() => null);
  if (!googleAvailable()) return empty;
  const body = new URLSearchParams({ sl: from, tl: to });
  for (const text of texts) body.append("q", text);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status === 429 || res.status === 403) {
      pausedUntil = Date.now() + PAUSE_MS;
      return empty;
    }
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("json")) {
      // An HTML "unusual traffic" page means the endpoint is refusing us for now.
      if ((res.headers.get("content-type") ?? "").includes("html")) pausedUntil = Date.now() + PAUSE_MS;
      return empty;
    }
    const data: unknown = await res.json();
    // A single q may come back as a bare string array; several q as an array of entries.
    const list = Array.isArray(data) ? data : [];
    if (texts.length === 1) return [readEntry(list.length === 1 ? list[0] : list)];
    return list.length === texts.length ? list.map(readEntry) : empty;
  } catch {
    return empty;
  }
}

/** Translates many strings, batching them into as few requests as possible. */
export async function googleTranslate(texts: readonly string[], from = "auto", to = "fa"): Promise<(string | null)[]> {
  const results: (string | null)[] = texts.map(() => null);
  const batches: number[][] = [];
  let current: number[] = [];
  let chars = 0;
  texts.forEach((text, i) => {
    if (current.length && (current.length >= MAX_ITEMS || chars + text.length > MAX_CHARS)) {
      batches.push(current);
      current = [];
      chars = 0;
    }
    current.push(i);
    chars += text.length;
  });
  if (current.length) batches.push(current);

  await Promise.all(
    batches.map((batch) =>
      withSlot(async () => {
        const out = await requestBatch(
          batch.map((i) => texts[i]),
          from,
          to,
        );
        batch.forEach((i, j) => (results[i] = out[j]));
      }),
    ),
  );
  return results;
}
