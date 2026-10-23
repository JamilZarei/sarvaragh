/**
 * Downloads every cover shown on the home page into public/covers and the
 * photos of the featured-author candidates into public/authors, and writes
 * lib/home-covers.json and lib/home-authors.json, so the home page never
 * depends on a third-party image host at view time.
 *
 *   npm run covers:home
 *
 * Sources: Open Library Covers API (directly or via wsrv.nl), otherwise Google
 * Books by ISBN (see lib/cover-source.ts). Already downloaded covers are skipped, so the
 * script can be re-run safely to pick up books that newly appear on the page.
 */
import fs from "node:fs";
import path from "node:path";

import { coverFromOpenLibrary, resolveBookCover } from "@/lib/cover-source";
import { authorCandidates, fetchAuthorPhotoId, fetchHomeBooks, fetchShelfBooks } from "@/lib/home-catalog";
import type { BookSummary } from "@/types/book";

const OUT_DIR = path.join(process.cwd(), "public", "covers");
const MANIFEST = path.join(process.cwd(), "lib", "home-covers.json");
const AUTHORS_DIR = path.join(process.cwd(), "public", "authors");
const AUTHORS_MANIFEST = path.join(process.cwd(), "lib", "home-authors.json");
const CONCURRENCY = 6;

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log("Fetching the home-page book lists from Open Library…");
  const books = await fetchHomeBooks();
  console.log(`${books.length} books with covers on the home page.`);

  let downloaded = 0;
  let skipped = 0;
  const missing: BookSummary[] = [];
  const sources = { openlibrary: 0, google: 0 };
  let next = 0;

  async function worker() {
    while (next < books.length) {
      const book = books[next++];
      const file = path.join(OUT_DIR, `${book.coverId}.jpg`);
      if (fs.existsSync(file)) {
        skipped++;
        continue;
      }
      const image = await resolveBookCover({
        workId: book.id,
        coverId: book.coverId,
        editionId: book.coverEditionId,
        size: "M",
      });
      if (typeof image === "string") {
        missing.push(book);
        continue;
      }
      fs.writeFileSync(file, image.body);
      downloaded++;
      sources[image.source]++;
      process.stdout.write(`\r  ${downloaded + skipped + missing.length}/${books.length}`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  process.stdout.write("\n");

  const covers = fs
    .readdirSync(OUT_DIR)
    .map((name) => /^(\d+)\.jpg$/.exec(name)?.[1])
    .filter((id): id is string => Boolean(id))
    .map(Number)
    .sort((a, b) => a - b);
  fs.writeFileSync(MANIFEST, `${JSON.stringify({ generatedAt: new Date().toISOString(), covers }, null, 2)}\n`);

  const bytes = covers.reduce((sum, id) => sum + fs.statSync(path.join(OUT_DIR, `${id}.jpg`)).size, 0);
  console.log(
    `Downloaded ${downloaded} (Open Library ${sources.openlibrary}, Google Books ${sources.google}), ` +
      `already present ${skipped}, not found ${missing.length}.`,
  );
  console.log(`${covers.length} covers in public/covers (${(bytes / 1024 / 1024).toFixed(1)} MB). Manifest: lib/home-covers.json`);
  if (missing.length) console.log("Without a cover:", missing.map((b) => b.title).join(" | "));

  await downloadAuthorPhotos();
}

/** Photos of every author on the home shelves; the page shows the first twelve that have one. */
async function downloadAuthorPhotos() {
  fs.mkdirSync(AUTHORS_DIR, { recursive: true });
  console.log("Fetching the featured-author candidates…");
  const candidates = authorCandidates(await fetchShelfBooks());
  let withPhoto = 0;
  let downloaded = 0;
  const failed: string[] = [];
  let next = 0;

  async function worker() {
    while (next < candidates.length) {
      const author = candidates[next++];
      const { photoId } = await fetchAuthorPhotoId(author.id);
      if (photoId === null) continue;
      withPhoto++;
      const file = path.join(AUTHORS_DIR, `${photoId}.jpg`);
      if (fs.existsSync(file)) continue;
      const image = await coverFromOpenLibrary("a", photoId, "M");
      if (typeof image === "string") {
        failed.push(author.name);
        continue;
      }
      fs.writeFileSync(file, image.body);
      downloaded++;
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const photos = fs
    .readdirSync(AUTHORS_DIR)
    .map((name) => /^(\d+)\.jpg$/.exec(name)?.[1])
    .filter((id): id is string => Boolean(id))
    .map(Number)
    .sort((a, b) => a - b);
  fs.writeFileSync(AUTHORS_MANIFEST, `${JSON.stringify({ generatedAt: new Date().toISOString(), photos }, null, 2)}\n`);
  console.log(
    `${candidates.length} authors, ${withPhoto} with a photo id; downloaded ${downloaded}, failed ${failed.length}. ` +
      `${photos.length} photos in public/authors. Manifest: lib/home-authors.json`,
  );
  if (failed.length) console.log("Photo not downloadable:", failed.join(" | "));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
