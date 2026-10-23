import { cacheLife } from "next/cache";

import { authorsFromSearchDoc, mapSearchDoc, mapSearchDocs, mapWork, statsFromSearchDoc } from "@/lib/books";
import { OPEN_LIBRARY_URL, SUBJECTS, type SubjectKey } from "@/lib/constants";
import { hasShowcaseCover, hasShowcasePhoto } from "@/lib/cover-url";
import {
  authorCandidates,
  FEATURED_AUTHOR_COUNT,
  fetchAuthorPhotoId,
  listUrl,
  SHELF_SIZE,
  SHELVES,
  SUBJECT_SHOWCASE_SIZE,
  subjectShowcaseQuery,
  type ShelfKey,
} from "@/lib/home-catalog";
import { localizeDescription, localizeDetail, localizeSummaries } from "@/lib/localize";
import {
  authorIdFromKey,
  buildSearchUrl,
  isValidWorkId,
  SEARCH_FIELDS,
  STATS_FIELDS,
  workIdFromKey,
  type RawAuthor,
  type RawSearchDoc,
  type RawSearchResponse,
  type RawWork,
  type SearchRequest,
} from "@/lib/open-library";
import { fetchOpenLibraryJson } from "@/lib/open-library-fetch";
import { translateQueryToEnglish, translateToPersian } from "@/lib/translate";
import type { ApiErrorCode, BookAuthor, BookDetail, BookSummary, Result, SearchResult } from "@/types/book";

/*
 * Server-only data access. Every function is cached with `use cache`;
 * failures and incomplete translations get short lifetimes so a transient
 * outage is never frozen in the cache.
 */

/* ------------------------------------------------------------------------ */
/* Raw Open Library data                                                    */
/* ------------------------------------------------------------------------ */

async function searchRaw(req: SearchRequest): Promise<Result<SearchResult>> {
  "use cache";
  const url = buildSearchUrl(req);
  const pageSize = req.pageSize ?? 24;

  if (!url.searchParams.has("q") && !url.searchParams.has("title") && !url.searchParams.has("author")) {
    cacheLife("max");
    return { ok: true, data: { books: [], total: 0, page: req.page, pageSize } };
  }

  const res = await fetchOpenLibraryJson<RawSearchResponse>(url);
  if (!res.ok) {
    cacheLife("seconds");
    return res;
  }

  const total = res.data.numFound ?? res.data.num_found ?? 0;
  // Open Library sometimes answers an overloaded query with an empty result set,
  // so empty answers are only cached briefly.
  if (total > 0) cacheLife("hours");
  else cacheLife("minutes");
  return { ok: true, data: { books: mapSearchDocs(res.data.docs), total, page: req.page, pageSize } };
}

async function listRaw(q: string, sort: string, limit: number): Promise<Result<{ books: BookSummary[]; total: number }>> {
  "use cache";
  const res = await fetchOpenLibraryJson<RawSearchResponse>(listUrl(q, sort, limit));
  if (!res.ok) {
    cacheLife("seconds");
    return res;
  }
  const books = mapSearchDocs(res.data.docs);
  if (books.length) cacheLife("days");
  else cacheLife("minutes");
  return { ok: true, data: { books, total: res.data.numFound ?? res.data.num_found ?? 0 } };
}

/* ------------------------------------------------------------------------ */
/* Search (used by /api/search)                                             */
/* ------------------------------------------------------------------------ */

/**
 * Searches and localizes results. A Persian query is translated to English
 * first (the catalog is mostly English); if that finds nothing, the original
 * text is searched as well.
 */
export async function searchBooks(req: SearchRequest): Promise<Result<SearchResult>> {
  "use cache";
  let result: Result<SearchResult>;
  let searchedAs: string | undefined;

  const english = req.q ? await translateQueryToEnglish(req.q) : null;
  if (english) {
    result = await searchRaw({ ...req, q: english });
    searchedAs = english;
    if (result.ok && result.data.total === 0) {
      result = await searchRaw(req);
      searchedAs = undefined;
    }
  } else {
    result = await searchRaw(req);
  }

  if (!result.ok) {
    cacheLife("seconds");
    return result;
  }

  const localized = await localizeSummaries(result.data.books);
  if (localized.complete) cacheLife("hours");
  else cacheLife("seconds");
  return {
    ok: true,
    data: { ...result.data, books: localized.value, searchedAs, translationPending: !localized.complete || undefined },
  };
}

/* ------------------------------------------------------------------------ */
/* Home page shelves                                                        */
/* ------------------------------------------------------------------------ */

export type Shelf = {
  key: ShelfKey;
  label: string;
  criteria: string;
  books: BookSummary[];
};

/** Three home-page shelves, fetched in parallel and translated in one pass. */
export async function getHomeShelves(): Promise<Shelf[]> {
  "use cache";
  const lists = await Promise.all(SHELVES.map((s) => listRaw(s.q, s.sort, SHELF_SIZE)));
  const all = lists.flatMap((r) => (r.ok ? r.data.books : []));
  const localized = await localizeSummaries(all, 5000);
  const byId = new Map(localized.value.map((b) => [b.id, b]));

  const shelves = SHELVES.map((s, i) => {
    const r = lists[i];
    const books = r.ok ? r.data.books.filter(hasShowcaseCover).map((b) => byId.get(b.id) ?? b) : [];
    return { key: s.key, label: s.label, criteria: s.criteria, books: books.slice(0, 14) };
  });

  const ok = lists.every((r) => r.ok) && shelves.every((s) => s.books.length > 0);
  if (ok && localized.complete) cacheLife("days");
  else cacheLife("minutes");
  return shelves;
}

export type SubjectShowcase = {
  key: SubjectKey;
  total: number;
  covers: { id: string; coverId: number; editionId: string | null; title: string }[];
};

/** Book counts and three popular covers for each home-page subject card. */
export async function getSubjectShowcases(): Promise<SubjectShowcase[]> {
  "use cache";
  const lists = await Promise.all(SUBJECTS.map((s) => listRaw(subjectShowcaseQuery(s.olSubject), "readinglog", SUBJECT_SHOWCASE_SIZE)));
  // Best-sellers carry many subjects; give every card its own covers.
  const used = new Set<string>();
  const showcases = SUBJECTS.map((s, i) => {
    const r = lists[i];
    const covers = r.ok
      ? r.data.books
          .filter(hasShowcaseCover)
          .filter((b) => !used.has(b.id))
          .slice(0, 3)
          .map((b) => ({ id: b.id, coverId: b.coverId, editionId: b.coverEditionId, title: b.title }))
      : [];
    covers.forEach((c) => used.add(c.id));
    return { key: s.key, total: r.ok ? r.data.total : 0, covers };
  });
  if (lists.every((r) => r.ok)) cacheLife("days");
  else cacheLife("minutes");
  return showcases;
}

export type FeaturedAuthor = {
  id: string;
  name: string;
  nameFa: string | null;
  photoId: number | null;
  bookTitle: string;
  bookTitleFa: string | null;
};

/** First valid photo id on an author record (cached; null when there is none). */
async function getAuthorPhotoId(id: string): Promise<number | null> {
  "use cache";
  const { ok, photoId } = await fetchAuthorPhotoId(id);
  if (ok) cacheLife("weeks");
  else cacheLife("minutes");
  return photoId;
}

/** Authors of the most-read books, in reading-log order, one entry per author. */
export async function getFeaturedAuthors(): Promise<FeaturedAuthor[]> {
  "use cache";
  const shelves = await getHomeShelves();
  const candidates = authorCandidates(shelves.flatMap((s) => s.books));
  const photos = await Promise.all(candidates.map((c) => getAuthorPhotoId(c.id)));
  // Only authors with a (shipped) photo: an initials avatar looks like a gap in this row.
  const authors = candidates
    .map((c, i) => ({ ...c, photoId: photos[i] }))
    .filter((c): c is typeof c & { photoId: number } => hasShowcasePhoto(c.photoId))
    .slice(0, FEATURED_AUTHOR_COUNT)
    .map(({ id, name, book, photoId }) => ({
      id,
      name,
      nameFa: book.authorsFa[0] ?? null,
      photoId,
      bookTitle: book.title,
      bookTitleFa: book.titleFa,
    }));
  cacheLife("days");
  return authors;
}

/* ------------------------------------------------------------------------ */
/* Book page                                                                */
/* ------------------------------------------------------------------------ */

export type BookDetailOutcome =
  | { kind: "ok"; book: BookDetail }
  | { kind: "redirect"; id: string }
  | { kind: "not_found" }
  | { kind: "error"; error: ApiErrorCode };

async function fetchAuthorNames(work: RawWork): Promise<BookAuthor[]> {
  const ids = (work.authors ?? [])
    .map((a) => authorIdFromKey(a.author?.key))
    .filter((id): id is string => id !== null)
    .slice(0, 3);

  const results = await Promise.all(
    ids.map(async (id): Promise<BookAuthor | null> => {
      const res = await fetchOpenLibraryJson<RawAuthor>(`${OPEN_LIBRARY_URL}/authors/${id}.json`);
      const name = res.ok ? (res.data.name ?? res.data.personal_name)?.trim() : undefined;
      const photoId = res.ok ? (res.data.photos ?? []).find((p) => Number.isInteger(p) && p > 0) ?? null : null;
      return name ? { id, name, nameFa: null, photoId } : null;
    }),
  );
  return results.filter((a): a is BookAuthor => a !== null);
}

async function getBookDetailRaw(id: string): Promise<BookDetailOutcome> {
  "use cache";
  if (!isValidWorkId(id)) {
    cacheLife("max");
    return { kind: "not_found" };
  }

  const summaryUrl = new URL(`${OPEN_LIBRARY_URL}/search.json`);
  summaryUrl.searchParams.set("q", `key:"/works/${id}"`);
  summaryUrl.searchParams.set("fields", `${SEARCH_FIELDS},${STATS_FIELDS},publisher`);
  summaryUrl.searchParams.set("limit", "1");

  const [workRes, summaryRes] = await Promise.all([
    fetchOpenLibraryJson<RawWork>(`${OPEN_LIBRARY_URL}/works/${id}.json`),
    fetchOpenLibraryJson<RawSearchResponse>(summaryUrl),
  ]);

  if (!workRes.ok) {
    if (workRes.error === "not_found") {
      cacheLife("hours");
      return { kind: "not_found" };
    }
    cacheLife("seconds");
    return { kind: "error", error: workRes.error };
  }

  const work = workRes.data;
  const type = work.type?.key;
  if (type === "/type/redirect") {
    const target = workIdFromKey(work.location);
    cacheLife("days");
    return target && target !== id ? { kind: "redirect", id: target } : { kind: "not_found" };
  }
  if (type === "/type/delete" || (type && type !== "/type/work")) {
    cacheLife("hours");
    return { kind: "not_found" };
  }

  // The search index adds normalized year, languages, publishers, stats and author names.
  // It is optional: the page still renders from the Work record if it fails.
  const doc: RawSearchDoc | null = summaryRes.ok ? (summaryRes.data.docs?.[0] ?? null) : null;
  const summary = doc ? mapSearchDoc(doc) : null;

  let authors = authorsFromSearchDoc(doc);
  if (authors.length === 0) authors = await fetchAuthorNames(work);

  const publishers = Array.from(
    new Set((doc?.publisher ?? []).filter((p) => typeof p === "string" && p.trim()).map((p) => p.trim())),
  ).slice(0, 4);

  if (summaryRes.ok) cacheLife("days");
  else cacheLife("minutes");
  return { kind: "ok", book: mapWork(id, work, summary, { authors, publishers, stats: statsFromSearchDoc(doc) }) };
}

/** Book page data with Persian translations of title, authors, subjects and description. */
export async function getBookDetail(id: string): Promise<BookDetailOutcome> {
  "use cache";
  const outcome = await getBookDetailRaw(id);
  if (outcome.kind !== "ok") {
    if (outcome.kind === "error") cacheLife("seconds");
    else cacheLife("hours");
    return outcome;
  }
  const [localized, photos] = await Promise.all([
    localizeDetail(outcome.book),
    Promise.all(outcome.book.authors.slice(0, 4).map((a) => (a.id ? getAuthorPhotoId(a.id) : Promise.resolve(a.photoId)))),
  ]);
  localized.value.authors = localized.value.authors.map((a, i) => ({ ...a, photoId: photos[i] ?? a.photoId }));
  if (localized.complete) cacheLife("days");
  else cacheLife("seconds");
  return { kind: "ok", book: localized.value };
}

/** Persian description of a book page, streamed separately from the rest of the page. */
export async function getBookDescriptionFa(id: string): Promise<string[]> {
  "use cache";
  const outcome = await getBookDetailRaw(id);
  if (outcome.kind !== "ok") {
    cacheLife("hours");
    return [];
  }
  const localized = await localizeDescription(outcome.book.description);
  if (localized.complete) cacheLife("days");
  else cacheLife("seconds");
  return localized.value;
}

export type SimilarBooks = {
  basis: { type: "author" | "subject"; label: string; labelFa: string | null };
  books: BookSummary[];
};

/** Related works by the same author, falling back to the first meaningful subject. */
export async function getSimilarBooks(
  id: string,
  author: string | null,
  subject: string | null,
): Promise<Result<SimilarBooks | null>> {
  "use cache";
  const attempts: { type: "author" | "subject"; label: string }[] = [];
  if (author) attempts.push({ type: "author", label: author });
  if (subject) attempts.push({ type: "subject", label: subject });

  for (const basis of attempts) {
    const url = new URL(`${OPEN_LIBRARY_URL}/search.json`);
    // Only books with a cover: this carousel is a showcase.
    if (basis.type === "author") {
      url.searchParams.set("author", basis.label);
      url.searchParams.set("q", "cover_i:[1 TO *]");
    } else {
      url.searchParams.set("q", `subject:"${basis.label.replace(/["\\]/g, "")}" cover_i:[1 TO *]`);
    }
    url.searchParams.set("sort", "readinglog");
    url.searchParams.set("fields", SEARCH_FIELDS);
    url.searchParams.set("limit", "13");

    const res = await fetchOpenLibraryJson<RawSearchResponse>(url);
    if (!res.ok) {
      cacheLife("seconds");
      return res;
    }
    const books = mapSearchDocs(res.data.docs)
      .filter((b) => b.id !== id)
      .slice(0, 12);
    if (books.length >= 2) {
      const [localized, label] = await Promise.all([
        localizeSummaries(books, 3000),
        translateToPersian([basis.label], basis.type === "author" ? "name" : "subject", { deadlineMs: 2000 }),
      ]);
      if (localized.complete) cacheLife("days");
      else cacheLife("seconds");
      return { ok: true, data: { basis: { ...basis, labelFa: label.values[0] }, books: localized.value } };
    }
  }

  cacheLife("hours");
  return { ok: true, data: null };
}
