import { describe, expect, it } from "vitest";

import { MAX_PAGE, MAX_YEAR } from "@/lib/constants";
import { buildSearchUrl, coverUrl, escapeSearchText, isValidWorkId, toSearchRequest, workUrl } from "@/lib/open-library";
import {
  countActiveFilters,
  DEFAULT_QUERY,
  discoverHref,
  hasSearchCriteria,
  parseDiscoverQuery,
  parseYear,
  serializeDiscoverQuery,
} from "@/lib/search-params";

describe("parseDiscoverQuery", () => {
  it("parses and validates every parameter", () => {
    const q = parseDiscoverQuery(
      new URLSearchParams("q=  dune   messiah &by=title&subject=history,bogus,fiction&lang=per,xx&from=2000&to=1990&sort=new&page=3"),
    );
    expect(q).toEqual({
      q: "dune messiah",
      field: "title",
      subjects: ["fiction", "history"], // canonical order, unknown values dropped
      languages: ["per"],
      yearFrom: 1990, // swapped into a valid range
      yearTo: 2000,
      popularity: 0,
      coversOnly: true,
      sort: "new",
      page: 3,
      view: "grid",
    });
  });

  it("falls back to safe defaults for garbage input", () => {
    const q = parseDiscoverQuery({ by: "isbn", sort: "price", page: "-2", from: "abc", to: "99999" });
    expect(q).toEqual(DEFAULT_QUERY);
    expect(parseDiscoverQuery({ page: "100000" }).page).toBe(MAX_PAGE);
    expect(parseDiscoverQuery({ pop: "50", view: "table" })).toMatchObject({ popularity: 0, view: "grid" });
    expect(parseDiscoverQuery({ pop: "1000", view: "list" })).toMatchObject({ popularity: 1000, view: "list" });
  });

  it("accepts Persian digits for years", () => {
    expect(parseYear("۱۹۶۵")).toBe(1965);
    expect(parseYear(String(MAX_YEAR + 1))).toBeNull();
  });
});

describe("serializeDiscoverQuery", () => {
  it("round-trips and omits defaults", () => {
    const query = { ...DEFAULT_QUERY, q: "rumi", field: "author" as const, subjects: ["literature" as const], page: 2 };
    const params = serializeDiscoverQuery(query);
    expect(params.toString()).toBe("q=rumi&by=author&subject=literature&page=2");
    expect(parseDiscoverQuery(params)).toEqual(query);
    expect(serializeDiscoverQuery(DEFAULT_QUERY).toString()).toBe("");
    expect(discoverHref()).toBe("/discover");
  });

  it("drops the field selector when there is no text", () => {
    expect(serializeDiscoverQuery({ ...DEFAULT_QUERY, field: "title" }).has("by")).toBe(false);
  });

  it("counts filters and detects searchable queries", () => {
    const q = { ...DEFAULT_QUERY, subjects: ["history" as const], languages: ["per", "eng"], yearFrom: 1900, popularity: 100 as const };
    expect(countActiveFilters(q)).toBe(5);
    expect(hasSearchCriteria(DEFAULT_QUERY)).toBe(false);
    expect(hasSearchCriteria({ ...DEFAULT_QUERY, sort: "new" })).toBe(false);
    expect(hasSearchCriteria(q)).toBe(true);
  });
});

describe("Open Library URL building", () => {
  it("combines text and filters into a Solr query", () => {
    const url = buildSearchUrl(
      toSearchRequest({
        ...DEFAULT_QUERY,
        q: "Sapiens: A (Brief) History",
        subjects: ["history", "science"],
        languages: ["per"],
        yearFrom: 1990,
        sort: "editions",
        page: 2,
      }),
    );
    expect(url.origin + url.pathname).toBe("https://openlibrary.org/search.json");
    expect(url.searchParams.get("q")).toBe(
      "Sapiens A Brief History subject_key:(history OR science) language:(per) first_publish_year:[1990 TO *] cover_i:[1 TO *]",
    );
    expect(url.searchParams.get("sort")).toBe("editions");
    expect(url.searchParams.get("offset")).toBe("24");
    expect(url.searchParams.get("fields")).toContain("cover_i");
  });

  it("uses dedicated title/author parameters and no sort for title sorting", () => {
    const url = buildSearchUrl(toSearchRequest({ ...DEFAULT_QUERY, q: "herbert", field: "author", sort: "title-desc" }));
    expect(url.searchParams.get("author")).toBe("herbert");
    expect(url.searchParams.get("q")).toBe("cover_i:[1 TO *]");
    expect(url.searchParams.has("sort")).toBe(false);
  });

  it("adds popularity and minimum-vote clauses", () => {
    const popular = buildSearchUrl(toSearchRequest({ ...DEFAULT_QUERY, subjects: ["history"], popularity: 1000, sort: "popular" }));
    expect(popular.searchParams.get("q")).toBe("subject_key:(history) readinglog_count:[1000 TO *] cover_i:[1 TO *]");
    expect(popular.searchParams.get("sort")).toBe("readinglog");
    const rated = buildSearchUrl(toSearchRequest({ ...DEFAULT_QUERY, q: "tolkien", sort: "rating" }));
    expect(rated.searchParams.get("q")).toBe("tolkien cover_i:[1 TO *] ratings_count:[20 TO *]");
    expect(rated.searchParams.get("sort")).toBe("rating");
  });

  it("only asks for books with a cover unless covers=all", () => {
    const all = parseDiscoverQuery(new URLSearchParams("q=rumi&covers=all"));
    expect(all.coversOnly).toBe(false);
    expect(serializeDiscoverQuery(all).toString()).toBe("q=rumi&covers=all");
    expect(buildSearchUrl(toSearchRequest(all)).searchParams.get("q")).toBe("rumi");
    expect(parseDiscoverQuery(new URLSearchParams("q=rumi&covers=yes")).coversOnly).toBe(true);
    // A preference, not a filter: it neither counts as one nor makes an empty query searchable.
    expect(countActiveFilters(all)).toBe(0);
    expect(hasSearchCriteria({ ...DEFAULT_QUERY, coversOnly: false })).toBe(false);
  });

  it("neutralizes query syntax", () => {
    expect(escapeSearchText('title:"x" OR author:*')).toBe("title x or author");
  });

  it("validates ids before building cover and work URLs", () => {
    expect(isValidWorkId("OL45804W")).toBe(true);
    expect(isValidWorkId("OL45804M")).toBe(false);
    expect(isValidWorkId("../OL1W")).toBe(false);
    expect(coverUrl(123, "L")).toBe("https://covers.openlibrary.org/b/id/123-L.jpg");
    expect(coverUrl(-1)).toBeNull();
    expect(coverUrl(null)).toBeNull();
    expect(coverUrl(1.5)).toBeNull();
    expect(workUrl("OL45804W")).toBe("https://openlibrary.org/works/OL45804W");
  });
});
