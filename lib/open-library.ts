import { getSortOption, getSubject, MIN_RATINGS_FOR_SORT, OPEN_LIBRARY_URL, PAGE_SIZE } from "@/lib/constants";
import type { DiscoverQuery } from "@/lib/search-params";

/* ------------------------------------------------------------------------ */
/* Raw API shapes (only the fields we request). Every field is optional:    */
/* Open Library records are frequently incomplete.                          */
/* ------------------------------------------------------------------------ */

export type RawSearchDoc = {
  key?: string;
  title?: string;
  subtitle?: string;
  author_name?: string[];
  author_key?: string[];
  first_publish_year?: number;
  cover_i?: number;
  cover_edition_key?: string;
  subject?: string[];
  language?: string[];
  edition_count?: number;
  number_of_pages_median?: number;
  publisher?: string[];
  ratings_average?: number;
  ratings_count?: number;
  readinglog_count?: number;
  want_to_read_count?: number;
  currently_reading_count?: number;
  already_read_count?: number;
};

export type RawSearchResponse = {
  numFound?: number;
  num_found?: number;
  docs?: RawSearchDoc[];
};

type RawText = string | { type?: string; value?: string };

export type RawWork = {
  key?: string;
  type?: { key?: string };
  location?: string;
  title?: string;
  subtitle?: string;
  description?: RawText;
  subjects?: string[];
  covers?: number[];
  authors?: { author?: { key?: string } }[];
  first_publish_date?: string;
};

export type RawEdition = {
  isbn_13?: string[];
  isbn_10?: string[];
};

export type RawAuthor = {
  name?: string;
  personal_name?: string;
  photos?: number[];
};

/* ------------------------------------------------------------------------ */

export const SEARCH_FIELDS =
  "key,title,subtitle,author_name,author_key,first_publish_year,cover_i,cover_edition_key,subject,language,edition_count,number_of_pages_median,ratings_average,ratings_count,readinglog_count";

/**
 * Lighter field list for shelves and carousels: without `subject` (often
 * hundreds of entries per book) responses are about six times smaller.
 */
export const LIST_FIELDS =
  "key,title,author_name,author_key,first_publish_year,cover_i,cover_edition_key,edition_count,ratings_average,ratings_count,readinglog_count";

export const STATS_FIELDS = "want_to_read_count,currently_reading_count,already_read_count";


const WORK_ID_PATTERN = /^OL[1-9]\d{0,9}W$/;
const AUTHOR_ID_PATTERN = /^OL[1-9]\d{0,9}A$/;
const EDITION_ID_PATTERN = /^OL[1-9]\d{0,9}M$/;

export function isValidWorkId(id: string): boolean {
  return WORK_ID_PATTERN.test(id);
}

/** "/works/OL45804W" → "OL45804W"; returns null for anything unexpected. */
export function workIdFromKey(key: string | undefined): string | null {
  if (!key) return null;
  const id = key.replace(/^\/works\//, "");
  return isValidWorkId(id) ? id : null;
}

export function isValidEditionId(id: unknown): id is string {
  return typeof id === "string" && EDITION_ID_PATTERN.test(id);
}

export function authorIdFromKey(key: string | undefined): string | null {
  if (!key) return null;
  const id = key.replace(/^\/authors\//, "");
  return AUTHOR_ID_PATTERN.test(id) ? id : null;
}

export type CoverSize = "S" | "M" | "L";

export function isValidCoverId(id: unknown): id is number {
  return typeof id === "number" && Number.isInteger(id) && id > 0;
}

/**
 * Direct Covers API URL. Used for Open Graph images (fetched by crawlers abroad).
 * Pages load covers through /api/cover instead (see lib/cover-url.ts), because the
 * Covers host is unreachable from some networks.
 */
export function coverUrl(coverId: number | null | undefined, size: CoverSize = "M"): string | null {
  if (!isValidCoverId(coverId)) return null;
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

export function workUrl(id: string): string {
  return `${OPEN_LIBRARY_URL}/works/${encodeURIComponent(id)}`;
}

/**
 * Removes Solr syntax from free text so user input cannot change the query
 * structure (e.g. "Sapiens: A Brief History" must not be read as a field query).
 */
export function escapeSearchText(text: string): string {
  return text
    .replace(/[+\-!(){}[\]^"~*?:\\/&|]/g, " ")
    .replace(/\b(AND|OR|NOT)\b/g, (m) => m.toLowerCase())
    .replace(/\s+/g, " ")
    .trim();
}

export type SearchRequest = Pick<
  DiscoverQuery,
  "q" | "field" | "subjects" | "languages" | "yearFrom" | "yearTo" | "popularity" | "coversOnly" | "page"
> & {
  olSort: "new" | "old" | "editions" | "readinglog" | "rating" | null;
  pageSize?: number;
};

export function toSearchRequest(query: DiscoverQuery, pageSize = PAGE_SIZE): SearchRequest {
  return {
    q: query.q,
    field: query.field,
    subjects: query.subjects,
    languages: query.languages,
    yearFrom: query.yearFrom,
    yearTo: query.yearTo,
    popularity: query.popularity,
    coversOnly: query.coversOnly,
    page: query.page,
    olSort: getSortOption(query.sort).olSort,
    pageSize,
  };
}

/** Builds the Open Library search URL. Filters are combined with AND; values inside a filter with OR. */
export function buildSearchUrl(req: SearchRequest): URL {
  const url = new URL(`${OPEN_LIBRARY_URL}/search.json`);
  const clauses: string[] = [];
  const text = escapeSearchText(req.q);

  if (text) {
    if (req.field === "title") url.searchParams.set("title", text);
    else if (req.field === "author") url.searchParams.set("author", text);
    else clauses.push(text);
  }

  const subjects = req.subjects
    .map((key) => getSubject(key)?.olSubject)
    .filter((s): s is string => Boolean(s));
  if (subjects.length) clauses.push(`subject_key:(${subjects.join(" OR ")})`);

  const languages = req.languages.filter((l) => /^[a-z]{3}$/.test(l));
  if (languages.length) clauses.push(`language:(${languages.join(" OR ")})`);

  if (req.yearFrom !== null || req.yearTo !== null) {
    clauses.push(`first_publish_year:[${req.yearFrom ?? "*"} TO ${req.yearTo ?? "*"}]`);
  }

  if (req.popularity > 0) clauses.push(`readinglog_count:[${req.popularity} TO *]`);
  if (req.coversOnly) clauses.push("cover_i:[1 TO *]");
  // Average-rating ranges are not supported by the API; requiring a minimum number
  // of votes keeps single 5-star ratings from topping the "rating" order.
  if (req.olSort === "rating") clauses.push(`ratings_count:[${MIN_RATINGS_FOR_SORT} TO *]`);

  if (clauses.length) url.searchParams.set("q", clauses.join(" "));
  if (req.olSort) url.searchParams.set("sort", req.olSort);

  const pageSize = req.pageSize ?? PAGE_SIZE;
  url.searchParams.set("fields", SEARCH_FIELDS);
  url.searchParams.set("limit", String(pageSize));
  url.searchParams.set("offset", String((req.page - 1) * pageSize));
  return url;
}
