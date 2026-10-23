import type { NextRequest } from "next/server";

import { coverResponse, getAuthorPhoto } from "@/lib/cover-store";
import { isValidCoverId } from "@/lib/open-library";

/** Author photo proxy (Open Library photo id). An error status lets the avatar show initials. */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/author-photo/[id]">) {
  const photoId = Number((await ctx.params).id);
  if (!isValidCoverId(photoId)) return new Response(null, { status: 400 });
  return coverResponse(await getAuthorPhoto(photoId));
}
