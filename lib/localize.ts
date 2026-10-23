import { translateToPersian } from "@/lib/translate";
import { lookupGlossary } from "@/lib/translate/glossary";
import type { BookDetail, BookSummary } from "@/types/book";

export type Localized<T> = { value: T; complete: boolean };

/** Adds Persian titles and author names to a list of books in two batched calls. */
export async function localizeSummaries(books: BookSummary[], deadlineMs = 3500): Promise<Localized<BookSummary[]>> {
  if (books.length === 0) return { value: books, complete: true };

  const names = Array.from(new Set(books.flatMap((b) => b.authors.slice(0, 2))));
  const [titles, authors] = await Promise.all([
    translateToPersian(
      books.map((b) => b.title),
      "title",
      { deadlineMs },
    ),
    translateToPersian(names, "name", { deadlineMs }),
  ]);
  const nameMap = new Map(names.map((n, i) => [n, authors.values[i]]));

  return {
    complete: titles.complete && authors.complete,
    value: books.map((book, i) => ({
      ...book,
      titleFa: titles.values[i],
      authorsFa: book.authors.map((a) => nameMap.get(a) ?? null),
      subjectsFa: Array.from(
        new Set(book.subjects.map(subjectLabelFa).filter((s): s is string => Boolean(s))),
      ).slice(0, 4),
    })),
  };
}

/**
 * Translates the short texts of a book page (title, authors, subjects). The
 * description is translated separately so it can stream in after the page.
 */
export async function localizeDetail(book: BookDetail, deadlineMs = 3000): Promise<Localized<BookDetail>> {
  const [titles, authors, subjectsFa] = await Promise.all([
    translateToPersian([book.title, book.subtitle ?? ""], "title", { deadlineMs }),
    translateToPersian(
      book.authors.map((a) => a.name),
      "name",
      { deadlineMs },
    ),
    translateToPersian(
      book.subjects.map((s) => s.name),
      "subject",
      { deadlineMs },
    ),
  ]);

  return {
    complete: titles.complete && authors.complete && subjectsFa.complete,
    value: {
      ...book,
      titleFa: titles.values[0],
      subtitleFa: book.subtitle ? titles.values[1] : null,
      authors: book.authors.map((a, i) => ({ ...a, nameFa: authors.values[i] })),
      subjects: book.subjects.map((s, i) => ({ ...s, nameFa: subjectsFa.values[i] })),
    },
  };
}

/** Paragraph-by-paragraph Persian translation; empty unless every paragraph translated. */
export async function localizeDescription(paragraphs: string[], deadlineMs = 8000): Promise<Localized<string[]>> {
  if (paragraphs.length === 0) return { value: [], complete: true };
  const out = await translateToPersian(paragraphs, "text", { deadlineMs });
  return { value: out.values.every(Boolean) ? (out.values as string[]) : [], complete: out.complete };
}

/** Glossary-only subject translation, for list views where spending translation quota is not worth it. */
export function subjectLabelFa(subject: string): string | null {
  return lookupGlossary(subject, "subject");
}
