const numberFormatter = new Intl.NumberFormat("fa-IR");
const yearFormatter = new Intl.NumberFormat("fa-IR", { useGrouping: false });
const compactFormatter = new Intl.NumberFormat("fa-IR", { notation: "compact", maximumFractionDigits: 1 });
const ratingFormatter = new Intl.NumberFormat("fa-IR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Grouped Persian number, e.g. 12345 → "۱۲٬۳۴۵". */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** Year without grouping, e.g. 1965 → "۱۹۶۵". */
export function formatYear(value: number): string {
  return yearFormatter.format(value);
}

/** Short form for large counts, e.g. 44511 → "۴۴٫۵ هزار". */
export function formatCompact(value: number): string {
  return compactFormatter.format(value);
}

/** Rating with one decimal, e.g. 4.3036 → "۴٫۳". */
export function formatRating(value: number): string {
  return ratingFormatter.format(value);
}

type WithAuthors = { authors: readonly string[]; authorsFa?: readonly (string | null)[] };

/** Author names as shown to users: Persian where available, original otherwise. */
export function displayAuthorList(book: WithAuthors): string[] {
  return book.authors.map((name, i) => book.authorsFa?.[i] || name);
}

export function formatAuthors(authors: readonly string[], max = 2): string {
  if (authors.length === 0) return "";
  if (authors.length <= max) return authors.join("، ");
  return `${authors.slice(0, max).join("، ")} و ${formatNumber(authors.length - max)} نفر دیگر`;
}

type WithTitle = { title: string; titleFa?: string | null };

/** The original title is shown as a secondary line only when it differs from the Persian one. */
export function originalTitleIfTranslated(book: WithTitle): string | null {
  return book.titleFa && book.titleFa !== book.title ? book.title : null;
}
