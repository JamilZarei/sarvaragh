import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Route = (url: string) => Response | Promise<Response> | "fail";

const jpeg = (bytes: number) => new Response(new Uint8Array(bytes).fill(7), { headers: { "content-type": "image/jpeg" } });
const notFound = () => new Response("", { status: 404 });

/** Routes fetch() by URL; "fail" throws like a network error or timeout. */
function mockFetch(route: Route) {
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL) => {
      const url = String(input);
      calls.push(url);
      const result = await route(url);
      if (result === "fail") throw new TypeError("fetch failed");
      return result;
    }),
  );
  return calls;
}

// cover-source keeps the "skip the direct route" state in module scope: load a fresh copy per test.
async function load() {
  return import("@/lib/cover-source");
}

const work = { workId: "OL1W", coverId: 123, editionId: "OL2M", size: "M" as const };

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

describe("resolveBookCover", () => {
  it("returns the Open Library cover when the direct request works", async () => {
    const calls = mockFetch((url) => (url.startsWith("https://covers.openlibrary.org/b/id/123-M.jpg") ? jpeg(5000) : "fail"));
    const { resolveBookCover } = await load();
    const result = await resolveBookCover(work);
    expect(result).toMatchObject({ source: "openlibrary" });
    expect(calls).toHaveLength(1);
  });

  it("falls back to the wsrv.nl mirror when Open Library cannot be reached", async () => {
    const calls = mockFetch((url) => (url.startsWith("https://wsrv.nl/") ? jpeg(5000) : "fail"));
    const { resolveBookCover } = await load();
    expect(await resolveBookCover(work)).toMatchObject({ source: "openlibrary" });
    expect(calls[1]).toBe("https://wsrv.nl/?url=covers.openlibrary.org%2Fb%2Fid%2F123-M.jpg%3Fdefault%3Dfalse&output=jpg&q=85");
  });

  it("stops trying the direct route after repeated failures", async () => {
    const calls = mockFetch((url) => (url.startsWith("https://wsrv.nl/") ? jpeg(5000) : "fail"));
    const { coverFromOpenLibrary } = await load();
    for (let i = 0; i < 3; i++) await coverFromOpenLibrary("b", 100 + i, "M");
    calls.length = 0;
    await coverFromOpenLibrary("b", 200, "M");
    expect(calls).toEqual([expect.stringMatching(/^https:\/\/wsrv\.nl\//)]);
  });

  it("uses Google Books by ISBN when Open Library has no cover, rejecting placeholders", async () => {
    mockFetch((url) => {
      if (url.includes("covers.openlibrary.org")) return notFound();
      if (url.startsWith("https://openlibrary.org/books/OL2M.json")) return Response.json({ isbn_13: ["9780000000001", "9780000000002"] });
      if (url.includes("vid=ISBN9780000000001")) return jpeg(1200); // too small: Google's "no cover" image
      if (url.includes("vid=ISBN9780000000002")) return jpeg(9000);
      return "fail";
    });
    const { resolveBookCover } = await load();
    expect(await resolveBookCover(work)).toMatchObject({ source: "google" });
  });

  it("reports a definite miss only when every source answered", async () => {
    mockFetch((url) => {
      if (url.includes("covers.openlibrary.org")) return notFound();
      if (url.startsWith("https://openlibrary.org/books/")) return Response.json({});
      if (url.startsWith("https://openlibrary.org/search.json")) return Response.json({ docs: [{}] });
      return "fail";
    });
    const { resolveBookCover } = await load();
    expect(await resolveBookCover(work)).toBe("missing");
  });

  it("reports unreachable (not missing) when the sources could not be asked", async () => {
    mockFetch((url) => {
      if (url.startsWith("https://openlibrary.org/books/")) return Response.json({});
      if (url.startsWith("https://openlibrary.org/search.json")) return Response.json({ docs: [{}] });
      return "fail";
    });
    const { resolveBookCover } = await load();
    expect(await resolveBookCover(work)).toBe("unreachable");
  });
});

describe("coverResponse", () => {
  it("caches found images forever, misses for an hour and failures never", async () => {
    const { coverResponse } = await import("@/lib/cover-store");
    const found = coverResponse({ body: Buffer.from([1, 2, 3]), type: "image/jpeg" });
    expect(found.status).toBe(200);
    expect(found.headers.get("cache-control")).toContain("immutable");
    expect(coverResponse("missing").status).toBe(404);
    expect(coverResponse("missing").headers.get("cache-control")).toBe("public, max-age=3600");
    expect(coverResponse("unreachable").status).toBe(503);
    expect(coverResponse("unreachable").headers.get("cache-control")).toBe("no-store");
  });
});
