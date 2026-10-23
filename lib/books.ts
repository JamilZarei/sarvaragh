import { MAX_YEAR, type SortKey } from "@/lib/constants";
import {
  authorIdFromKey,
  isValidCoverId,
  isValidEditionId,
  workIdFromKey,
  type RawSearchDoc,
  type RawWork,
} from "@/lib/open-library";
import type { BookAuthor, BookDetail, BookStats, BookSummary } from "@/types/book";

const MAX_SUBJECTS = 12;

function nonEmptyStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0).map((v) => v.trim());
}

function positiveInt(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}

function rating(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 5 ? Math.round(value * 100) / 100 : null;
}

function validYear(value: unknown): number | null {
  const year = positiveInt(value);
  // Open Library occasionally contains obviously broken years.
  return year !== null && year >= 100 && year <= MAX_YEAR + 1 ? year : null;
}

/**
 * Open Library subjects are noisy ("nyt:...", "Accessible book", duplicates in
 * different cases). Keep short, human-readable, unique subjects only.
 */
export function cleanSubjects(subjects: unknown, limit = MAX_SUBJECTS): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const subject of nonEmptyStrings(subjects)) {
    if (/[:=]/.test(subject) || subject.length > 48) continue;
    if (/^(accessible book|protected daisy|in library|lending library|large type books|open library staff picks)$/i.test(subject)) {
      continue;
    }
    const key = subject.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(subject);
    if (result.length >= limit) break;
  }
  return result;
}

export function mapSearchDoc(doc: RawSearchDoc): BookSummary | null {
  const id = workIdFromKey(doc.key);
  const title = typeof doc.title === "string" ? doc.title.trim() : "";
  if (!id || !title) return null;

  const authors = nonEmptyStrings(doc.author_name).slice(0, 5);
  const authorKeys = Array.isArray(doc.author_key) ? doc.author_key : [];
  const ratingCount = positiveInt(doc.ratings_count);

  return {
    id,
    title,
    titleFa: null,
    authors,
    authorsFa: authors.map(() => null),
    authorIds: authors.map((_, i) => authorIdFromKey(authorKeys[i])),
    firstPublishYear: validYear(doc.first_publish_year),
    coverId: isValidCoverId(doc.cover_i) ? doc.cover_i : null,
    coverEditionId: isValidEditionId(doc.cover_edition_key) ? doc.cover_edition_key : null,
    editionCount: positiveInt(doc.edition_count),
    languages: nonEmptyStrings(doc.language).slice(0, 20),
    subjects: cleanSubjects(doc.subject, 6),
    subjectsFa: [],
    pagesMedian: positiveInt(doc.number_of_pages_median),
    // An average from one or two votes is noise; only report it with enough votes.
    ratingAverage: ratingCount !== null && ratingCount >= 3 ? rating(doc.ratings_average) : null,
    ratingCount,
    readers: positiveInt(doc.readinglog_count),
  };
}

export function statsFromSearchDoc(doc: RawSearchDoc | null): BookStats {
  const ratingCount = positiveInt(doc?.ratings_count);
  return {
    ratingAverage: ratingCount !== null && ratingCount >= 3 ? rating(doc?.ratings_average) : null,
    ratingCount,
    readers: positiveInt(doc?.readinglog_count),
    wantToRead: positiveInt(doc?.want_to_read_count),
    currentlyReading: positiveInt(doc?.currently_reading_count),
    alreadyRead: positiveInt(doc?.already_read_count),
  };
}

export function mapSearchDocs(docs: unknown): BookSummary[] {
  if (!Array.isArray(docs)) return [];
  const seen = new Set<string>();
  const books: BookSummary[] = [];
  for (const doc of docs) {
    if (!doc || typeof doc !== "object") continue;
    const book = mapSearchDoc(doc as RawSearchDoc);
    if (book && !seen.has(book.id)) {
      seen.add(book.id);
      books.push(book);
    }
  }
  return books;
}

/**
 * Converts an Open Library description (plain text with occasional Markdown)
 * into safe plain-text paragraphs. Nothing is rendered as HTML.
 */
export function cleanDescription(raw: unknown): string[] {
  let text = "";
  if (typeof raw === "string") text = raw;
  else if (raw && typeof raw === "object" && "value" in raw && typeof raw.value === "string") text = raw.value;
  if (!text.trim()) return [];

  text = text
    .replace(/\r\n?/g, "\n")
    .replace(/<[^>]*>/g, " ") // stray HTML tags
    .replace(/^\s*\[\d+\]:\s*\S+.*$/gm, "") // reference-style link definitions
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // inline links → text
    .replace(/\[([^\]]+)\]\[\d+\]/g, "$1") // reference links → text
    .replace(/\(\s*\[?source\]?[^)]*\)/gi, "") // "([source][1])"
    .replace(/^\s*[-*_]{3,}\s*$/gm, "\n") // horizontal rules
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/^#+\s*/gm, "");

  return text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").replace(/\s{2,}/g, " ").trim())
    .filter((p) => p.length > 0 && !/^(also contained in|contains):?$/i.test(p));
}

export function mapWork(
  id: string,
  work: RawWork,
  summary: BookSummary | null,
  extra: { authors: BookAuthor[]; publishers: string[]; stats: BookStats },
): BookDetail {
  const workCover = Array.isArray(work.covers) ? work.covers.find(isValidCoverId) ?? null : null;
  const subjects = cleanSubjects(work.subjects);

  return {
    id,
    title: (typeof work.title === "string" && work.title.trim()) || summary?.title || "بدون عنوان",
    titleFa: null,
    subtitle: typeof work.subtitle === "string" && work.subtitle.trim() ? work.subtitle.trim() : null,
    subtitleFa: null,
    authors: extra.authors,
    firstPublishYear: summary?.firstPublishYear ?? yearFromDateString(work.first_publish_date),
    coverId: summary?.coverId ?? workCover,
    coverEditionId: summary?.coverEditionId ?? null,
    description: cleanDescription(work.description),
    subjects: (subjects.length ? subjects : summary?.subjects ?? []).map((name) => ({ name, nameFa: null })),
    languages: summary?.languages ?? [],
    publishers: extra.publishers,
    pagesMedian: summary?.pagesMedian ?? null,
    editionCount: summary?.editionCount ?? null,
    stats: extra.stats,
  };
}

export function yearFromDateString(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = value.match(/\b(\d{4})\b/);
  return match ? validYear(Number(match[1])) : null;
}

export function authorsFromSearchDoc(doc: RawSearchDoc | null): BookAuthor[] {
  if (!doc) return [];
  const names = nonEmptyStrings(doc.author_name);
  const keys = Array.isArray(doc.author_key) ? doc.author_key : [];
  return names.slice(0, 6).map((name, i) => ({ name, nameFa: null, id: authorIdFromKey(keys[i]), photoId: null }));
}

/* ------------------------------------------------------------------------ */
/* Sorting                                                                  */
/* ------------------------------------------------------------------------ */

const titleCollator = new Intl.Collator(["fa", "en"], { sensitivity: "base", numeric: true });

function normalizeTitleForSort(title: string): string {
  return title.replace(/^[\s"'«»“”‘’([{]+/, "").replace(/^(the|a|an)\s+/i, "");
}

export function compareTitles(a: string, b: string): number {
  return titleCollator.compare(normalizeTitleForSort(a), normalizeTitleForSort(b));
}

/** Books with an unknown year are always placed last. */
function compareYears(a: number | null, b: number | null, direction: 1 | -1): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return (a - b) * direction;
}

type Sortable = {
  title: string;
  titleFa?: string | null;
  firstPublishYear: number | null;
  editionCount?: number | null;
  readers?: number | null;
  ratingAverage?: number | null;
};

/** The title users actually see: the Persian one when available. */
export function displayTitle(book: { title: string; titleFa?: string | null }): string {
  return book.titleFa || book.title;
}

/**
 * Stable in-memory sort. Used for title sorts on a loaded page (the Search API
 * cannot sort by title descending) and for the favorites list.
 */
export function sortBooks<T extends Sortable>(books: readonly T[], sort: SortKey): T[] {
  const indexed = books.map((book, index) => ({ book, index }));
  const compare = (a: T, b: T): number => {
    switch (sort) {
      case "title-asc":
        return compareTitles(displayTitle(a), displayTitle(b));
      case "title-desc":
        return compareTitles(displayTitle(b), displayTitle(a));
      case "popular":
        return (b.readers ?? 0) - (a.readers ?? 0);
      case "rating":
        return (b.ratingAverage ?? 0) - (a.ratingAverage ?? 0);
      case "new":
        return compareYears(a.firstPublishYear, b.firstPublishYear, -1);
      case "old":
        return compareYears(a.firstPublishYear, b.firstPublishYear, 1);
      case "editions":
        return (b.editionCount ?? 0) - (a.editionCount ?? 0);
      default:
        return 0;
    }
  };
  indexed.sort((x, y) => compare(x.book, y.book) || x.index - y.index);
  return indexed.map((x) => x.book);
}
