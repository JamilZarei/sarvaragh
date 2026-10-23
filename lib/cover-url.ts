import homeAuthors from "@/lib/home-authors.json";
import homeCovers from "@/lib/home-covers.json";
import { isValidCoverId, isValidEditionId, isValidWorkId } from "@/lib/open-library";

/**
 * Where the browser loads a cover from. Never the Covers API directly:
 *  - home-page covers and featured-author photos are shipped in /public/covers and
 *    /public/authors (scripts/download-home-covers.ts);
 *  - everything else goes through /api/cover, which finds and caches the image.
 */

const LOCAL = new Set<number>(homeCovers.covers);
const LOCAL_AUTHORS = new Set<number>(homeAuthors.photos);

export function isLocalCover(coverId: number | null | undefined): boolean {
  return isValidCoverId(coverId) && LOCAL.has(coverId);
}

/**
 * Home showcases only use books whose cover is shipped, so they never show a
 * placeholder. Before the first `npm run covers:home` any book with a cover id qualifies.
 */
export function hasShowcaseCover<T extends { coverId: number | null }>(book: T): book is T & { coverId: number } {
  return isValidCoverId(book.coverId) && (LOCAL.size === 0 || LOCAL.has(book.coverId));
}

export function bookCoverSrc(
  bookId: string | null | undefined,
  coverId: number | null | undefined,
  editionId?: string | null,
  size: "M" | "L" = "M",
): string | null {
  if (!isValidCoverId(coverId)) return null;
  if (LOCAL.has(coverId)) return `/covers/${coverId}.jpg`;
  if (!bookId || !isValidWorkId(bookId)) return null;
  const params = new URLSearchParams({ c: String(coverId), s: size });
  if (isValidEditionId(editionId)) params.set("e", editionId);
  return `/api/cover/${bookId}?${params.toString()}`;
}

export function authorPhotoSrc(photoId: number | null | undefined): string | null {
  if (!isValidCoverId(photoId)) return null;
  return LOCAL_AUTHORS.has(photoId) ? `/authors/${photoId}.jpg` : `/api/author-photo/${photoId}`;
}

/**
 * The featured-authors row only shows authors whose photo is shipped. Before the
 * first `npm run covers:home` any author with a photo id qualifies.
 */
export function hasShowcasePhoto(photoId: number | null | undefined): photoId is number {
  return isValidCoverId(photoId) && (LOCAL_AUTHORS.size === 0 || LOCAL_AUTHORS.has(photoId));
}
