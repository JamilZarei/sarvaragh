import {
  LANGUAGE_CODES,
  MAX_PAGE,
  MAX_QUERY_LENGTH,
  MAX_YEAR,
  MIN_YEAR,
  SORT_KEYS,
  SUBJECT_KEYS,
  type PopularityLevel,
  type SearchField,
  type SortKey,
  type SubjectKey,
  type ViewMode,
} from "@/lib/constants";

/**
 * The complete, validated state of the discover page.
 * It is the single source of truth shared by the URL, the UI and the API route.
 */
export type DiscoverQuery = {
  q: string;
  field: SearchField;
  subjects: SubjectKey[];
  languages: string[];
  yearFrom: number | null;
  yearTo: number | null;
  popularity: PopularityLevel;
  /** Only books that have a cover image (default). `covers=all` in the URL turns it off. */
  coversOnly: boolean;
  sort: SortKey;
  page: number;
  /** Presentation only; never sent to the API. */
  view: ViewMode;
};

export const DEFAULT_QUERY: DiscoverQuery = {
  q: "",
  field: "all",
  subjects: [],
  languages: [],
  yearFrom: null,
  yearTo: null,
  popularity: 0,
  coversOnly: true,
  sort: "relevance",
  page: 1,
  view: "grid",
};

type ParamSource = URLSearchParams | Record<string, string | string[] | undefined>;

function read(source: ParamSource, key: string): string | null {
  if (source instanceof URLSearchParams) return source.get(key);
  const value = source[key];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function parseList<T extends string>(raw: string | null, allowed: readonly T[]): T[] {
  if (!raw) return [];
  const items = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is T => (allowed as readonly string[]).includes(s));
  // Keep the canonical order of `allowed` so equal filters produce equal URLs.
  return allowed.filter((a) => items.includes(a));
}

export function parseYear(raw: string | null | undefined): number | null {
  if (raw == null || raw.trim() === "") return null;
  const normalized = toLatinDigits(raw.trim());
  if (!/^\d{1,4}$/.test(normalized)) return null;
  const year = Number(normalized);
  if (year < MIN_YEAR || year > MAX_YEAR) return null;
  return year;
}

/** Converts Persian/Arabic-Indic digits to ASCII so users can type either. */
export function toLatinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

export function sanitizeQuery(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_QUERY_LENGTH);
}

export function parseDiscoverQuery(source: ParamSource): DiscoverQuery {
  const q = sanitizeQuery(read(source, "q") ?? "");

  const fieldRaw = read(source, "by");
  const field: SearchField = fieldRaw === "title" || fieldRaw === "author" ? fieldRaw : "all";

  const sortRaw = read(source, "sort");
  const sort: SortKey = (SORT_KEYS as string[]).includes(sortRaw ?? "") ? (sortRaw as SortKey) : "relevance";

  let yearFrom = parseYear(read(source, "from"));
  let yearTo = parseYear(read(source, "to"));
  if (yearFrom !== null && yearTo !== null && yearFrom > yearTo) {
    [yearFrom, yearTo] = [yearTo, yearFrom];
  }

  const pageRaw = Number(read(source, "page"));
  const page = Number.isInteger(pageRaw) && pageRaw >= 1 ? Math.min(pageRaw, MAX_PAGE) : 1;

  const popRaw = Number(read(source, "pop"));
  const popularity: PopularityLevel = popRaw === 100 || popRaw === 1000 ? popRaw : 0;
  const view: ViewMode = read(source, "view") === "list" ? "list" : "grid";

  return {
    q,
    field,
    subjects: parseList(read(source, "subject"), SUBJECT_KEYS),
    languages: parseList(read(source, "lang"), LANGUAGE_CODES),
    yearFrom,
    yearTo,
    popularity,
    coversOnly: read(source, "covers") !== "all",
    sort,
    page,
    view,
  };
}

/** Serializes only non-default values to keep shareable URLs short and stable. */
export function serializeDiscoverQuery(query: DiscoverQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.q && query.field !== "all") params.set("by", query.field);
  if (query.subjects.length) params.set("subject", query.subjects.join(","));
  if (query.languages.length) params.set("lang", query.languages.join(","));
  if (query.yearFrom !== null) params.set("from", String(query.yearFrom));
  if (query.yearTo !== null) params.set("to", String(query.yearTo));
  if (query.popularity > 0) params.set("pop", String(query.popularity));
  if (!query.coversOnly) params.set("covers", "all");
  if (query.sort !== "relevance") params.set("sort", query.sort);
  if (query.page > 1) params.set("page", String(query.page));
  if (query.view !== "grid") params.set("view", query.view);
  return params;
}

export function discoverHref(partial: Partial<DiscoverQuery> = {}): string {
  const params = serializeDiscoverQuery({ ...DEFAULT_QUERY, ...partial });
  const qs = params.toString();
  return qs ? `/discover?${qs}` : "/discover";
}

export function countActiveFilters(query: DiscoverQuery): number {
  return (
    query.subjects.length +
    query.languages.length +
    (query.yearFrom !== null || query.yearTo !== null ? 1 : 0) +
    (query.popularity > 0 ? 1 : 0)
  );
}

/** True when there is something to search for. Open Library needs at least one criterion. */
export function hasSearchCriteria(query: DiscoverQuery): boolean {
  return query.q.length > 0 || countActiveFilters(query) > 0;
}
