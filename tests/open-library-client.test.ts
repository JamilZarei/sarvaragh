import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchOpenLibraryJson } from "@/lib/open-library-fetch";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("fetchOpenLibraryJson", () => {
  it("retries a rate-limited request once, honouring Retry-After", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("slow down", { status: 429, headers: { "retry-after": "1" } }))
      .mockResolvedValueOnce(Response.json({ ok: 1 }));
    vi.stubGlobal("fetch", fetchMock);

    const pending = fetchOpenLibraryJson<{ ok: number }>("https://openlibrary.org/a.json");
    await vi.advanceTimersByTimeAsync(1000);
    expect(await pending).toEqual({ ok: true, data: { ok: 1 } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a 404 and reports not_found", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await fetchOpenLibraryJson("https://openlibrary.org/b.json")).toEqual({ ok: false, error: "not_found" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("gives up after one retry and reports the error", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    const pending = fetchOpenLibraryJson("https://openlibrary.org/c.json");
    await vi.advanceTimersByTimeAsync(3000);
    expect(await pending).toEqual({ ok: false, error: "upstream" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shares one fetch between identical concurrent requests", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => Response.json({ n: 1 }));
    vi.stubGlobal("fetch", fetchMock);
    const [a, b, c] = await Promise.all([
      fetchOpenLibraryJson("https://openlibrary.org/d.json"),
      fetchOpenLibraryJson("https://openlibrary.org/d.json"),
      fetchOpenLibraryJson("https://openlibrary.org/d.json"),
    ]);
    expect(a).toEqual(b);
    expect(b).toEqual(c);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("never runs more than six requests at once", async () => {
    let running = 0;
    let peak = 0;
    const fetchMock = vi.fn().mockImplementation(async () => {
      running++;
      peak = Math.max(peak, running);
      await new Promise((r) => setTimeout(r, 15));
      running--;
      return Response.json({});
    });
    vi.stubGlobal("fetch", fetchMock);
    await Promise.all(Array.from({ length: 20 }, (_, i) => fetchOpenLibraryJson(`https://openlibrary.org/e${i}.json`)));
    expect(fetchMock).toHaveBeenCalledTimes(20);
    expect(peak).toBeLessThanOrEqual(6);
  });
});
