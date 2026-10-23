import type { NextRequest } from "next/server";

import { coverResponse, getBookCover } from "@/lib/cover-store";
import { isValidCoverId, isValidEditionId, isValidWorkId } from "@/lib/open-library";

/**
 * Book cover proxy: /api/cover/OL893414W?c=11481354&e=OL123M&s=M
 *
 * The browser never contacts the Covers API directly (it is slow or filtered on
 * some networks). The server finds the image (Open Library, directly or via
 * wsrv.nl, then Google Books), caches it on disk and serves it with a long,
 * immutable cache lifetime.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/cover/[id]">) {
  const { id } = await ctx.params;
  const params = request.nextUrl.searchParams;
  const coverId = Number(params.get("c"));
  const edition = params.get("e");
  const size = params.get("s") === "L" ? "L" : "M";

  if (!isValidWorkId(id)) return new Response(null, { status: 400 });

  return coverResponse(
    await getBookCover({
      workId: id,
      coverId: isValidCoverId(coverId) ? coverId : null,
      editionId: isValidEditionId(edition) ? edition : null,
      size,
    }),
  );
}
