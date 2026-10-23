import { NextResponse, type NextRequest } from "next/server";

const WORK_ID = /^OL[1-9]\d{0,9}W$/;

/**
 * Validates /books/[id] before rendering. The page streams, so a late
 * `notFound()` could only change the UI, not the HTTP status; doing the
 * format check here gives crawlers and share previews a real 404 / 308.
 */
export function proxy(request: NextRequest) {
  const raw = request.nextUrl.pathname.split("/")[2] ?? "";
  let id: string;
  try {
    id = decodeURIComponent(raw).trim();
  } catch {
    id = "";
  }

  if (WORK_ID.test(id)) return NextResponse.next();

  const upper = id.toUpperCase();
  if (WORK_ID.test(upper)) {
    const url = request.nextUrl.clone();
    url.pathname = `/books/${upper}`;
    return NextResponse.redirect(url, 308);
  }

  // Rewriting to a path without a route renders app/not-found.tsx with status 404.
  const url = request.nextUrl.clone();
  url.pathname = "/_book-not-found";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: "/books/:id",
};
