import { coverFromOpenLibrary, resolveBookCover, type CoverLookup, type CoverRequest } from "@/lib/cover-source";
import { readFile, readJson, writeFile, writeJson, type StoredFile } from "@/lib/disk-cache";

/**
 * Server-side cover cache used by /api/cover and /api/author-photo.
 * Found images are kept on disk (and in a small memory cache). A definite
 * "no cover" is remembered on disk for a few hours so it is not looked up on
 * every page view; a lookup that failed because a source was unreachable is
 * remembered only briefly, in memory, and then tried again.
 */

const MISS_TTL_MS = 6 * 60 * 60 * 1000;
const UNREACHABLE_TTL_MS = 2 * 60 * 1000;
const MAX_LOOKUPS = 12;
const MEMORY_LIMIT = 300;

const memory = new Map<string, StoredFile>();
const unreachable = new Map<string, number>();
export type CoverResult = StoredFile | "missing" | "unreachable";

const inflight = new Map<string, Promise<CoverResult>>();
let active = 0;
const waiting: (() => void)[] = [];

async function withSlot<T>(task: () => Promise<T>): Promise<T> {
  if (active >= MAX_LOOKUPS) await new Promise<void>((resolve) => waiting.push(resolve));
  active++;
  try {
    return await task();
  } finally {
    active--;
    waiting.shift()?.();
  }
}

function remember(key: string, file: StoredFile) {
  memory.delete(key);
  memory.set(key, file);
  if (memory.size > MEMORY_LIMIT) {
    const oldest = memory.keys().next().value;
    if (oldest !== undefined) memory.delete(oldest);
  }
}

async function cached(key: string, lookup: () => Promise<CoverLookup>): Promise<CoverResult> {
  const hot = memory.get(key);
  if (hot) return hot;
  const onDisk = readFile("covers", key);
  if (onDisk) {
    remember(key, onDisk);
    return onDisk;
  }
  if (readJson<{ at: number }>("covers-miss", key, MISS_TTL_MS)) return "missing";
  if ((unreachable.get(key) ?? 0) > Date.now()) return "unreachable";

  const running = inflight.get(key);
  if (running) return running;
  const job = withSlot(lookup)
    .then((result) => {
      if (result === "missing") {
        writeJson("covers-miss", key, { at: Date.now() });
        return result;
      }
      if (result === "unreachable") {
        if (unreachable.size > MEMORY_LIMIT) {
          const now = Date.now();
          for (const [k, until] of unreachable) if (until <= now) unreachable.delete(k);
        }
        unreachable.set(key, Date.now() + UNREACHABLE_TTL_MS);
        return result;
      }
      const file = { body: result.body, type: result.type };
      writeFile("covers", key, file);
      remember(key, file);
      unreachable.delete(key);
      return file;
    })
    .catch((): CoverResult => "unreachable")
    .finally(() => inflight.delete(key));
  inflight.set(key, job);
  return job;
}

export function getBookCover(request: CoverRequest): Promise<CoverResult> {
  return cached(`b:${request.workId}:${request.coverId ?? "-"}:${request.size}`, () => resolveBookCover(request));
}

export function getAuthorPhoto(photoId: number): Promise<CoverResult> {
  return cached(`a:${photoId}`, () => coverFromOpenLibrary("a", photoId, "M"));
}

/**
 * HTTP response for a lookup. A found image is immutable; a definite miss may
 * be cached by the browser for an hour; a temporary failure is never cached.
 */
export function coverResponse(result: CoverResult): Response {
  if (result === "missing") return new Response(null, { status: 404, headers: { "Cache-Control": "public, max-age=3600" } });
  if (result === "unreachable") return new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } });
  return new Response(new Uint8Array(result.body), {
    headers: {
      "Content-Type": result.type,
      "Content-Length": String(result.body.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
