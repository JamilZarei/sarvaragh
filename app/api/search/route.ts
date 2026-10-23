import type { NextRequest } from "next/server";

import { searchBooks } from "@/lib/book-service";
import { PAGE_SIZE } from "@/lib/constants";
import { toSearchRequest } from "@/lib/open-library";
import { parseDiscoverQuery } from "@/lib/search-params";
import type { ApiErrorCode } from "@/types/book";

const STATUS: Record<ApiErrorCode, number> = {
  network: 502,
  upstream: 502,
  timeout: 504,
  rate_limited: 429,
  not_found: 404,
  invalid: 400,
};

const ALLOWED_SIZES = new Set([12, PAGE_SIZE]);

/**
 * Thin proxy in front of the Open Library Search API.
 * Validates parameters, normalizes the response into the internal model and
 * benefits from the server-side `use cache` layer in `searchBooks`.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = parseDiscoverQuery(params);
  const size = Number(params.get("size"));
  const pageSize = ALLOWED_SIZES.has(size) ? size : PAGE_SIZE;

  const result = await searchBooks(toSearchRequest(query, pageSize));

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: STATUS[result.error] });
  }

  return Response.json(result.data, {
    headers: {
      // Incomplete translations must not be cached by the browser or a CDN.
      "Cache-Control": result.data.translationPending
        ? "no-store"
        : "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
