import { describe, expect, it } from "vitest";

import { cleanDescription, cleanSubjects, mapSearchDoc, mapSearchDocs, mapWork, sortBooks, yearFromDateString } from "@/lib/books";
import type { BookSummary } from "@/types/book";

describe("mapSearchDoc", () => {
  it("maps a complete Open Library search document", () => {
    const book = mapSearchDoc({
      key: "/works/OL893414W",
      title: "  Dune ",
      author_name: ["Frank Herbert"],
      first_publish_year: 1965,
      cover_i: 11481354,
      language: ["eng", "per"],
      edition_count: 155,
      number_of_pages_median: 408,
      subject: ["Fiction", "nyt:combined-print-and-e-book-fiction=2021-11-07", "fiction", "Science fiction"],
      author_key: ["OL79034A"],
      cover_edition_key: "OL26234146M",
      ratings_average: 4.303571,
      ratings_count: 448,
      readinglog_count: 4429,
    });
    expect(book).toEqual({
      id: "OL893414W",
      title: "Dune",
      titleFa: null,
      authors: ["Frank Herbert"],
      authorsFa: [null],
      authorIds: ["OL79034A"],
      firstPublishYear: 1965,
      coverId: 11481354,
      coverEditionId: "OL26234146M",
      editionCount: 155,
      languages: ["eng", "per"],
      subjects: ["Fiction", "Science fiction"],
      subjectsFa: [],
      pagesMedian: 408,
      ratingAverage: 4.3,
      ratingCount: 448,
      readers: 4429,
    });
  });

  it("tolerates missing and malformed optional fields", () => {
    const book = mapSearchDoc({
      key: "/works/OL1W",
      title: "Untitled draft",
      cover_i: -1,
      first_publish_year: 0,
      author_name: undefined,
      edition_count: Number.NaN,
    });
    expect(book).toMatchObject({ authors: [], coverId: null, firstPublishYear: null, editionCount: null, subjects: [] });
  });

  it("ignores ratings backed by too few votes", () => {
    const book = mapSearchDoc({ key: "/works/OL2W", title: "T", ratings_average: 5, ratings_count: 1 });
    expect(book?.ratingAverage).toBeNull();
    expect(book?.ratingCount).toBe(1);
  });

  it("rejects documents without a valid work key or title", () => {
    expect(mapSearchDoc({ title: "No key" })).toBeNull();
    expect(mapSearchDoc({ key: "/books/OL1M", title: "Edition, not work" })).toBeNull();
    expect(mapSearchDoc({ key: "/works/OL5W", title: "   " })).toBeNull();
  });

  it("drops invalid entries and duplicates in a result list", () => {
    const books = mapSearchDocs([
      { key: "/works/OL5W", title: "A" },
      null,
      "junk",
      { key: "/works/OL5W", title: "A again" },
      { key: "/works/OL6W", title: "B" },
    ]);
    expect(books.map((b) => b.id)).toEqual(["OL5W", "OL6W"]);
    expect(mapSearchDocs(undefined)).toEqual([]);
  });
});

describe("cleanSubjects", () => {
  it("removes noisy, long and duplicate subjects", () => {
    expect(cleanSubjects(["History", "history", "Accessible book", "subject:x", "x".repeat(60), "Iran"])).toEqual(["History", "Iran"]);
  });
});

describe("cleanDescription", () => {
  it("returns plain-text paragraphs and strips markup", () => {
    const raw = {
      type: "/type/text",
      value: "First **bold** [link](https://evil.example) <script>alert(1)</script>\r\n\r\n----------\r\n\r\nSecond ([source][1])\n\n[1]: https://example.com",
    };
    expect(cleanDescription(raw)).toEqual(["First bold link alert(1)", "Second"]);
  });

  it("handles missing descriptions", () => {
    expect(cleanDescription(undefined)).toEqual([]);
    expect(cleanDescription({ type: "/type/text" })).toEqual([]);
    expect(cleanDescription("   ")).toEqual([]);
  });
});

describe("mapWork", () => {
  it("prefers search-index data and never invents fields", () => {
    const detail = mapWork(
      "OL45804W",
      { title: "Fantastic Mr Fox", covers: [-1, 6498519], first_publish_date: "October 1970" },
      null,
      {
        authors: [],
        publishers: [],
        stats: { ratingAverage: null, ratingCount: null, readers: null, wantToRead: null, currentlyReading: null, alreadyRead: null },
      },
    );
    expect(detail).toMatchObject({
      title: "Fantastic Mr Fox",
      coverId: 6498519,
      firstPublishYear: 1970,
      description: [],
      authors: [],
      pagesMedian: null,
      subtitle: null,
      titleFa: null,
    });
  });

  it("extracts years from free-form dates", () => {
    expect(yearFromDateString("c1999")).toBeNull();
    expect(yearFromDateString("March 12, 1999")).toBe(1999);
    expect(yearFromDateString(undefined)).toBeNull();
  });
});

describe("sortBooks", () => {
  const book = (title: string, year: number | null, editions = 1, readers: number | null = null): BookSummary => ({
    id: `OL${title.length}W`,
    title,
    titleFa: null,
    authors: [],
    authorsFa: [],
    authorIds: [],
    firstPublishYear: year,
    coverId: null,
    coverEditionId: null,
    editionCount: editions,
    languages: [],
    subjects: [],
    subjectsFa: [],
    pagesMedian: null,
    ratingAverage: null,
    ratingCount: null,
    readers,
  });
  const list = [book("The Hobbit", 1937, 5), book("Dune", 1965, 9), book("a Clockwork Orange", null, 3), book("Beloved", 1987, 1)];

  it("sorts titles ignoring leading articles and case", () => {
    expect(sortBooks(list, "title-asc").map((b) => b.title)).toEqual(["Beloved", "a Clockwork Orange", "Dune", "The Hobbit"]);
    expect(sortBooks(list, "title-desc").map((b) => b.title)).toEqual(["The Hobbit", "Dune", "a Clockwork Orange", "Beloved"]);
  });

  it("puts unknown years last in both directions", () => {
    expect(sortBooks(list, "new").map((b) => b.firstPublishYear)).toEqual([1987, 1965, 1937, null]);
    expect(sortBooks(list, "old").map((b) => b.firstPublishYear)).toEqual([1937, 1965, 1987, null]);
  });

  it("sorts by edition count and keeps relevance order untouched", () => {
    expect(sortBooks(list, "editions").map((b) => b.editionCount)).toEqual([9, 5, 3, 1]);
    expect(sortBooks(list, "relevance")).toEqual(list);
  });

  it("sorts by readers and by the displayed (Persian) title", () => {
    const popular = [book("A", 2000, 1, 10), book("B", 2000, 1, null), book("C", 2000, 1, 500)];
    expect(sortBooks(popular, "popular").map((b) => b.title)).toEqual(["C", "A", "B"]);
    const translated = [{ ...book("Zebra", 1), titleFa: "الف" }, { ...book("Apple", 1), titleFa: "ب" }];
    expect(sortBooks(translated, "title-asc").map((b) => b.title)).toEqual(["Zebra", "Apple"]);
  });

  it("does not mutate the input", () => {
    const copy = [...list];
    sortBooks(list, "title-asc");
    expect(list).toEqual(copy);
  });
});
