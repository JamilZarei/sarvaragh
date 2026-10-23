/**
 * Internal, UI-facing book models.
 * Raw Open Library payloads are mapped into these shapes in `lib/books.ts`
 * so the rest of the app never depends on the external API structure.
 *
 * Persian fields (`*Fa`) hold translations; the original values are always
 * kept alongside so the UI can show both and never presents a translation as
 * the source text.
 */

/** Open Library Work ID, e.g. "OL45804W". */
export type WorkId = string;

/** Reader statistics from Open Library's reading log and ratings. */
export type BookStats = {
  ratingAverage: number | null;
  ratingCount: number | null;
  /** Total reading-log entries (want to read + reading + already read). */
  readers: number | null;
  wantToRead: number | null;
  currentlyReading: number | null;
  alreadyRead: number | null;
};

export type BookSummary = {
  id: WorkId;
  title: string;
  titleFa: string | null;
  authors: string[];
  /** Parallel to `authors`; `null` where no translation is available. */
  authorsFa: (string | null)[];
  authorIds: (string | null)[];
  firstPublishYear: number | null;
  coverId: number | null;
  /** Edition whose cover Open Library shows; its ISBN finds the cover elsewhere when needed. */
  coverEditionId: string | null;
  editionCount: number | null;
  /** MARC language codes as reported by Open Library (e.g. "eng", "per"). */
  languages: string[];
  subjects: string[];
  /** Glossary translations of `subjects` (unknown subjects are omitted). */
  subjectsFa: string[];
  pagesMedian: number | null;
  ratingAverage: number | null;
  ratingCount: number | null;
  readers: number | null;
};

export type BookAuthor = {
  id: string | null;
  name: string;
  nameFa: string | null;
  /** Open Library photo id; null when the author has no photo. */
  photoId: number | null;
};

export type BookSubject = {
  name: string;
  nameFa: string | null;
};

export type BookDetail = {
  id: WorkId;
  title: string;
  titleFa: string | null;
  subtitle: string | null;
  subtitleFa: string | null;
  authors: BookAuthor[];
  firstPublishYear: number | null;
  coverId: number | null;
  coverEditionId: string | null;
  /** Paragraphs of plain text, already stripped of markup. Empty when unavailable. */
  description: string[];
  subjects: BookSubject[];
  languages: string[];
  /** Publishers aggregated across editions (Open Library search index). */
  publishers: string[];
  pagesMedian: number | null;
  editionCount: number | null;
  stats: BookStats;
};

export type SearchResult = {
  books: BookSummary[];
  total: number;
  page: number;
  pageSize: number;
  /** When a Persian query was translated for searching, the English text actually used. */
  searchedAs?: string;
  /** Some translations missed the deadline; asking again shortly returns them. */
  translationPending?: boolean;
};

export type ApiErrorCode = "network" | "timeout" | "rate_limited" | "upstream" | "not_found" | "invalid";

export type Result<T> = { ok: true; data: T } | { ok: false; error: ApiErrorCode };

export type FavoriteBook = {
  id: WorkId;
  title: string;
  titleFa?: string | null;
  authors: string[];
  authorsFa?: (string | null)[];
  firstPublishYear: number | null;
  coverId: number | null;
  coverEditionId?: string | null;
  ratingAverage?: number | null;
  /** Epoch milliseconds. */
  addedAt: number;
};
