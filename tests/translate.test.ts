import { afterEach, describe, expect, it, vi } from "vitest";

import { isPersianText, translateQueryToEnglish, translateToPersian } from "@/lib/translate";
import { glossaryKey, lookupGlossary } from "@/lib/translate/glossary";
import { decodeEntities, splitForRequest } from "@/lib/translate/mymemory";

type GoogleMode = "ok" | "html" | "slow";

/**
 * Fake translation services. Both "translate" by prefixing the text:
 * Google with «گ:», MyMemory with «م:». Persian→English requests answer
 * "Pride and Prejudice".
 */
function mockServices(options: { google?: GoogleMode; myMemoryQuota?: boolean } = {}) {
  const calls = { google: [] as string[][], myMemory: [] as string[] };
  const fetchMock = vi.fn(async (input: string | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.hostname === "clients5.google.com") {
      const body = new URLSearchParams(String(init?.body ?? ""));
      const items = body.getAll("q");
      calls.google.push(items);
      if (options.google === "html") return new Response("<html>unusual traffic</html>", { headers: { "content-type": "text/html" } });
      if (options.google === "slow") await new Promise((r) => setTimeout(r, 120));
      if (body.get("tl") === "en") return Response.json(["Pride and Prejudice"]);
      const out = items.map((q) => [`گ:${q}`, "en"]);
      return Response.json(items.length === 1 ? out[0] : out);
    }
    const q = url.searchParams.get("q") ?? "";
    calls.myMemory.push(q);
    if (options.myMemoryQuota) {
      return Response.json({ responseStatus: 429, responseData: { translatedText: "MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS" } });
    }
    const translated = q
      .split("\n")
      .map((line) => `م:${line}`)
      .join("&#10;");
    return Response.json({ responseStatus: 200, responseData: { translatedText: translated } });
  });
  vi.stubGlobal("fetch", fetchMock);
  return { calls, fetchMock };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("glossary", () => {
  it("returns established Persian titles and names", () => {
    expect(lookupGlossary("Dune", "title")).toBe("تلماسه");
    expect(lookupGlossary("  The Little Prince ", "title")).toBe("شازده کوچولو");
    expect(lookupGlossary("The Adventures of Sherlock Holmes [12 stories]", "title")).toBe("ماجراهای شرلوک هولمز");
    expect(lookupGlossary("... Trotzdem Ja zum Leben sagen", "title")).toBe("انسان در جستجوی معنا");
    expect(lookupGlossary("J.R.R. Tolkien", "name")).toBe("جی. آر. آر. تالکین");
    expect(lookupGlossary("An Unknown Book", "title")).toBeNull();
  });

  it("translates compound subject headings part by part", () => {
    expect(lookupGlossary("Fiction, science fiction, general", "subject")).toBe("داستان، علمی‌تخیلی، عمومی");
    expect(lookupGlossary("Fiction, thrillers, general", "subject")).toBe("داستان، هیجانی، عمومی");
    expect(lookupGlossary("Fiction, unknown thing", "subject")).toBeNull();
  });

  it("normalizes keys", () => {
    expect(glossaryKey("“Dune.”")).toBe("dune");
  });
});

describe("isPersianText", () => {
  it("detects Persian script", () => {
    expect(isPersianText("بوف کور")).toBe(true);
    expect(isPersianText("Dune")).toBe(false);
    expect(isPersianText("1984")).toBe(false);
  });
});

describe("MyMemory helpers", () => {
  it("decodes HTML entities", () => {
    expect(decodeEntities("a&#10;b &quot;c&quot; &amp; &#x41;")).toBe('a\nb "c" & A');
  });

  it("splits long text at sentence boundaries under the byte limit", () => {
    const text = Array.from({ length: 30 }, (_, i) => `Sentence number ${i} is here.`).join(" ");
    const chunks = splitForRequest(text, 120);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => new TextEncoder().encode(c).length <= 120)).toBe(true);
    expect(chunks.join(" ")).toBe(text);
  });
});

describe("translateToPersian", () => {
  it("uses glossary and keeps Persian/number-only text without any request", async () => {
    const { fetchMock } = mockServices();
    const out = await translateToPersian(["Dune", "بوف کور", "1984"], "title");
    expect(out).toEqual({ values: ["تلماسه", "بوف کور", "۱۹۸۴"], complete: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("translates a whole batch with one Google request and caches the result", async () => {
    const { calls } = mockServices();
    const first = await translateToPersian(["Quiet Gardens", "Silver Rivers", "Quiet Gardens"], "title");
    expect(first).toEqual({ values: ["گ:Quiet Gardens", "گ:Silver Rivers", "گ:Quiet Gardens"], complete: true });
    expect(calls.google).toEqual([["Quiet Gardens", "Silver Rivers"]]);
    expect(calls.myMemory).toHaveLength(0);

    const again = await translateToPersian(["Silver Rivers"], "title");
    expect(again.values).toEqual(["گ:Silver Rivers"]);
    expect(calls.google).toHaveLength(1);
  });

  it("returns originals (null) when the deadline passes, then serves the late result from cache", async () => {
    const { calls } = mockServices({ google: "slow" });
    const fast = await translateToPersian(["Slow Mountain"], "title", { deadlineMs: 20 });
    expect(fast).toEqual({ values: [null], complete: false });

    await new Promise((r) => setTimeout(r, 200));
    const later = await translateToPersian(["Slow Mountain"], "title", { deadlineMs: 20 });
    expect(later).toEqual({ values: ["گ:Slow Mountain"], complete: true });
    expect(calls.google).toHaveLength(1);
  });

  it("translates Persian queries to English for the catalog", async () => {
    mockServices();
    expect(await translateQueryToEnglish("Dune")).toBeNull(); // not Persian: left alone
    expect(await translateQueryToEnglish("غرور و تعصب")).toBe("Pride and Prejudice");
  });

  // The two tests below pause providers (module state), so they run last.
  it("falls back to MyMemory when Google refuses, and pauses Google", async () => {
    const { calls } = mockServices({ google: "html" });
    const out = await translateToPersian(["Paper Lanterns"], "title");
    expect(out.values).toEqual(["م:Paper Lanterns"]);
    expect(calls.google).toHaveLength(1);

    await translateToPersian(["Glass Harbour"], "title");
    expect(calls.google).toHaveLength(1); // paused: not asked again
    expect(calls.myMemory).toEqual(["Paper Lanterns", "Glass Harbour"]);
  });

  it("pauses MyMemory after a quota warning instead of retrying on every request", async () => {
    const { calls } = mockServices({ google: "html", myMemoryQuota: true });
    const first = await translateToPersian(["Quota Book One"], "title");
    expect(first.complete).toBe(false);
    const second = await translateToPersian(["Quota Book Two"], "title");
    expect(second.values).toEqual([null]);
    expect(calls.myMemory).toHaveLength(1);
  });
});
