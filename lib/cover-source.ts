import crypto from "node:crypto";

import { OPEN_LIBRARY_URL } from "@/lib/constants";
import {
  isValidCoverId,
  isValidEditionId,
  type RawEdition,
  type RawSearchResponse,
} from "@/lib/open-library";
import { fetchOpenLibraryJson } from "@/lib/open-library-fetch";

/**
 * Finds a cover image from whichever source is reachable from the server.
 *
 * 1. Open Library Covers API (covers.openlibrary.org → archive.org storage).
 *    It is slow (1–5 s, sometimes far more, through two redirects) and on some
 *    networks filtered or unreliable. When the direct request fails, the same
 *    image is fetched through wsrv.nl, a public image cache that reaches Open
 *    Library from its own servers. After repeated direct failures the direct
 *    route is skipped for a while and wsrv.nl is asked first.
 * 2. Google Books, by the ISBN of the edition whose cover Open Library shows
 *    (`cover_edition_key`), then a few other ISBNs of the work. Google answers
 *    unknown ISBNs with placeholder images, which are recognised and rejected.
 *
 * Used by the /api/cover route and by scripts/download-home-covers.ts.
 */

export type CoverImage = { body: Buffer; type: string; source: "openlibrary" | "google" };
export type CoverSize = "M" | "L";
/** A cover, or why there is none: "missing" is a definite answer, "unreachable" may change. */
export type CoverLookup = CoverImage | "missing" | "unreachable";

const USER_AGENT = "KetabGard/0.1 (book discovery; educational project)";
const OPEN_LIBRARY_TIMEOUT_MS = 8000;
const MIRROR_TIMEOUT_MS = 12000;
const GOOGLE_TIMEOUT_MS = 6000;
const DIRECT_FAILURES_BEFORE_SKIP = 3;
const DIRECT_SKIP_MS = 5 * 60 * 1000;

/** SHA-1 of Google Books "no cover" images (grey JPEG, "image not available" PNG). */
const GOOGLE_PLACEHOLDERS = new Set([
  "ba8cd5043eedf32e39a4f328a4ec22f8a7dbbaba",
  "cc7313f0f2ac7aa7bc990e3b8bbc9fddd0a19f70",
]);

let directFailures = 0;
let skipDirectUntil = 0;

type FetchedImage = { body: Buffer; type: string };

/** The image, null when the server answered "not found", or a thrown error when it could not be reached. */
async function fetchImage(url: string, timeoutMs: number): Promise<FetchedImage | null> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const type = response.headers.get("content-type") ?? "";
  if (!type.startsWith("image/")) throw new Error(`unexpected ${type}`);
  return { body: Buffer.from(await response.arrayBuffer()), type };
}

async function tryOpenLibraryRoute(url: string, timeoutMs: number): Promise<CoverLookup> {
  try {
    const image = await fetchImage(url, timeoutMs);
    // Missing covers are a 404 with default=false; anything tiny is a blank pixel.
    return image && image.body.length > 1000 ? { ...image, source: "openlibrary" } : "missing";
  } catch {
    return "unreachable";
  }
}

/** Book cover ("b") or author photo ("a") from the Open Library Covers API, directly or through wsrv.nl. */
export async function coverFromOpenLibrary(kind: "b" | "a", id: number, size: CoverSize): Promise<CoverLookup> {
  if (!isValidCoverId(id)) return "missing";
  const direct = `https://covers.openlibrary.org/${kind}/id/${id}-${size}.jpg?default=false`;

  if (Date.now() >= skipDirectUntil) {
    const result = await tryOpenLibraryRoute(direct, OPEN_LIBRARY_TIMEOUT_MS);
    if (result !== "unreachable") {
      directFailures = 0;
      return result;
    }
    if (++directFailures >= DIRECT_FAILURES_BEFORE_SKIP) {
      skipDirectUntil = Date.now() + DIRECT_SKIP_MS;
      directFailures = 0;
    }
  }
  const mirror = `https://wsrv.nl/?url=${encodeURIComponent(direct.slice("https://".length))}&output=jpg&q=85`;
  return tryOpenLibraryRoute(mirror, MIRROR_TIMEOUT_MS);
}

function isUsableGoogleImage(image: { body: Buffer; type: string }): boolean {
  if (!image.type.includes("jpeg") || image.body.length < 2500) return false;
  const hash = crypto.createHash("sha1").update(image.body).digest("hex");
  return !GOOGLE_PLACEHOLDERS.has(hash);
}

export async function coverFromGoogleBooks(isbns: readonly string[], size: CoverSize): Promise<CoverLookup> {
  const fife = size === "L" ? "w800-h1200" : "w400-h600";
  let reachable = false;
  for (const isbn of isbns.slice(0, 8)) {
    try {
      const image = await fetchImage(
        `https://books.google.com/books/content?vid=ISBN${isbn}&printsec=frontcover&img=1&zoom=1&fife=${fife}`,
        GOOGLE_TIMEOUT_MS,
      );
      reachable = true;
      if (image && isUsableGoogleImage(image)) return { ...image, source: "google" };
    } catch {
      /* try the next ISBN */
    }
  }
  return reachable || isbns.length === 0 ? "missing" : "unreachable";
}

const ISBN = /^(97[89]\d{10}|\d{9}[\dX])$/;

async function editionIsbns(editionId: string): Promise<string[]> {
  if (!isValidEditionId(editionId)) return [];
  const res = await fetchOpenLibraryJson<RawEdition>(`${OPEN_LIBRARY_URL}/books/${editionId}.json`);
  if (!res.ok) return [];
  return [...(res.data.isbn_13 ?? []), ...(res.data.isbn_10 ?? [])].filter((i) => ISBN.test(i));
}

async function workIsbns(workId: string): Promise<{ editionId: string | null; isbns: string[]; failed: boolean }> {
  const url = new URL(`${OPEN_LIBRARY_URL}/search.json`);
  url.searchParams.set("q", `key:"/works/${workId}"`);
  url.searchParams.set("fields", "isbn,cover_edition_key");
  url.searchParams.set("limit", "1");
  const res = await fetchOpenLibraryJson<RawSearchResponse & { docs?: { isbn?: string[]; cover_edition_key?: string }[] }>(url);
  const doc = res.ok ? res.data.docs?.[0] : undefined;
  const isbns = (doc?.isbn ?? []).filter((i) => ISBN.test(i));
  // Prefer English-language ISBN prefixes (978-0 / 978-1): their covers match Open Library's more often.
  isbns.sort((a, b) => Number(/^97[89][01]/.test(b)) - Number(/^97[89][01]/.test(a)));
  return { editionId: isValidEditionId(doc?.cover_edition_key) ? doc.cover_edition_key : null, isbns, failed: !res.ok };
}

export type CoverRequest = {
  workId: string;
  coverId: number | null;
  editionId?: string | null;
  size: CoverSize;
};

/**
 * "missing" only when every source that was asked gave a definite answer, so
 * the caller can remember it for hours; a lookup that hit network trouble
 * returns "unreachable" and is retried soon.
 */
export async function resolveBookCover({ workId, coverId, editionId, size }: CoverRequest): Promise<CoverLookup> {
  let unreachable = false;
  const settle = (result: CoverLookup): CoverImage | null => {
    if (result === "unreachable") unreachable = true;
    return typeof result === "string" ? null : result;
  };

  if (coverId !== null) {
    const found = settle(await coverFromOpenLibrary("b", coverId, size));
    if (found) return found;
  }

  const tried = new Set<string>();
  const tryIsbns = async (list: string[]) => {
    const fresh = list.filter((isbn) => !tried.has(isbn));
    fresh.forEach((isbn) => tried.add(isbn));
    return fresh.length ? settle(await coverFromGoogleBooks(fresh, size)) : null;
  };

  // 1) The edition whose cover Open Library shows (known from search results).
  if (editionId) {
    const found = await tryIsbns((await editionIsbns(editionId)).slice(0, 2));
    if (found) return found;
  }
  // 2) Look the work up: its cover edition, then a few other editions.
  const work = await workIsbns(workId);
  if (work.failed) unreachable = true;
  if (work.editionId && work.editionId !== editionId) {
    const found = await tryIsbns((await editionIsbns(work.editionId)).slice(0, 2));
    if (found) return found;
  }
  const found = await tryIsbns(work.isbns.slice(0, 8));
  return found ?? (unreachable ? "unreachable" : "missing");
}
