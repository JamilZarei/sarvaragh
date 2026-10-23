import { mapSearchDocs } from "@/lib/books";
import { OPEN_LIBRARY_URL, SUBJECTS } from "@/lib/constants";
import { LIST_FIELDS, type RawAuthor, type RawSearchResponse } from "@/lib/open-library";
import { fetchOpenLibraryJson } from "@/lib/open-library-fetch";
import type { BookSummary } from "@/types/book";

/**
 * What the home page shows. Kept free of Next.js imports so the same
 * definitions drive both the page (lib/book-service.ts) and the cover
 * download script (scripts/download-home-covers.ts).
 */

export type ShelfKey = "popular" | "top-rated" | "classics";

export const SHELVES: readonly { key: ShelfKey; label: string; criteria: string; q: string; sort: string }[] = [
  {
    key: "popular",
    label: "محبوب‌ترین‌ها",
    criteria: "بیشترین تعداد کاربرانی که کتاب را در فهرست مطالعه Open Library گذاشته‌اند.",
    q: "readinglog_count:[5000 TO *]",
    sort: "readinglog",
  },
  {
    key: "top-rated",
    label: "بالاترین امتیاز",
    criteria: "میانگین امتیاز کاربران Open Library، فقط کتاب‌هایی با دست‌کم ۲۰۰ رأی.",
    q: "ratings_count:[200 TO *]",
    sort: "rating",
  },
  {
    key: "classics",
    label: "کلاسیک‌های محبوب",
    criteria: "آثار با موضوع «ادبیات کلاسیک» به ترتیب تعداد خوانندگان در Open Library.",
    q: "subject_key:classic_literature",
    sort: "readinglog",
  },
];

/** More than a shelf shows (14), so books without a shipped cover can be skipped. */
export const SHELF_SIZE = 24;
export const SUBJECT_SHOWCASE_SIZE = 16;

export function listUrl(q: string, sort: string, limit: number): URL {
  const url = new URL(`${OPEN_LIBRARY_URL}/search.json`);
  url.searchParams.set("q", q);
  url.searchParams.set("sort", sort);
  url.searchParams.set("fields", LIST_FIELDS);
  url.searchParams.set("limit", String(limit));
  return url;
}

export function subjectShowcaseQuery(olSubject: string): string {
  return `subject_key:${olSubject}`;
}

/** Every book whose cover appears on the home page (shelves + subject cards). */
export async function fetchHomeBooks(): Promise<BookSummary[]> {
  const queries = [
    ...SHELVES.map((s) => listUrl(s.q, s.sort, SHELF_SIZE)),
    ...SUBJECTS.map((s) => listUrl(subjectShowcaseQuery(s.olSubject), "readinglog", SUBJECT_SHOWCASE_SIZE)),
  ];
  const results = await Promise.all(queries.map((url) => fetchOpenLibraryJson<RawSearchResponse>(url)));
  const seen = new Set<string>();
  return results
    .flatMap((r) => (r.ok ? mapSearchDocs(r.data.docs) : []))
    .filter((b) => b.coverId !== null && !seen.has(b.id) && seen.add(b.id));
}

/** How many authors the "featured authors" row shows. */
export const FEATURED_AUTHOR_COUNT = 12;

export type AuthorCandidate = { id: string; name: string; book: BookSummary };

/** Each book's first author, once, in list order: the pool the featured-authors row picks from. */
export function authorCandidates(books: readonly BookSummary[]): AuthorCandidate[] {
  const seen = new Set<string>();
  const out: AuthorCandidate[] = [];
  for (const book of books) {
    const id = book.authorIds[0];
    const name = book.authors[0];
    if (!id || !name || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, name, book });
  }
  return out;
}

/** First valid photo id on an Open Library author record, or null. */
export async function fetchAuthorPhotoId(authorId: string): Promise<{ ok: boolean; photoId: number | null }> {
  const res = await fetchOpenLibraryJson<RawAuthor>(`${OPEN_LIBRARY_URL}/authors/${authorId}.json`);
  if (!res.ok) return { ok: false, photoId: null };
  return { ok: true, photoId: (res.data.photos ?? []).find((p) => Number.isInteger(p) && p > 0) ?? null };
}

/** Books on the three home shelves (unfiltered), for the author photo download. */
export async function fetchShelfBooks(): Promise<BookSummary[]> {
  const results = await Promise.all(SHELVES.map((s) => fetchOpenLibraryJson<RawSearchResponse>(listUrl(s.q, s.sort, SHELF_SIZE))));
  return results.flatMap((r) => (r.ok ? mapSearchDocs(r.data.docs) : []));
}
