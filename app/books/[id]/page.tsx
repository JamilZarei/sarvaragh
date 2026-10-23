import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";

import { BookDetail } from "@/components/books/book-detail";
import { BookDetailSkeleton } from "@/components/books/book-detail-skeleton";
import { BookError } from "@/components/books/book-error";
import { SimilarBooks, SimilarBooksSkeleton } from "@/components/books/similar-books";
import { PageTransition } from "@/components/motion/page-transition";
import { displayTitle } from "@/lib/books";
import { getBookDetail } from "@/lib/book-service";
import { coverUrl, isValidWorkId } from "@/lib/open-library";

function normalizeId(raw: string): string {
  try {
    return decodeURIComponent(raw).trim().toUpperCase();
  } catch {
    return "";
  }
}

export async function generateMetadata({ params }: PageProps<"/books/[id]">): Promise<Metadata> {
  const id = normalizeId((await params).id);
  if (!isValidWorkId(id)) return { title: "کتاب پیدا نشد" };

  const outcome = await getBookDetail(id);
  if (outcome.kind !== "ok") return { title: "کتاب" };

  const { book } = outcome;
  const authors = book.authors.map((a) => a.nameFa || a.name).join("، ");
  const title = displayTitle(book);
  const year = book.firstPublishYear ? `، نخستین انتشار ${new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(book.firstPublishYear)}` : "";
  const description = `«${title}»${authors ? ` نوشته ${authors}` : ""}${year} — معرفی، امتیاز خوانندگان و کتاب‌های مشابه در کتاب‌گرد.`;
  const image = coverUrl(book.coverId, "L");

  return {
    title: authors ? `${title} — ${authors}` : title,
    description,
    alternates: { canonical: `/books/${book.id}` },
    openGraph: {
      type: "book",
      title,
      description,
      authors: book.authors.map((a) => a.nameFa || a.name),
      images: image ? [{ url: image, alt: `جلد کتاب ${title}` }] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description },
  };
}

async function BookContent({ params }: { params: PageProps<"/books/[id]">["params"] }) {
  const raw = (await params).id;
  const id = normalizeId(raw);
  if (!isValidWorkId(id)) notFound();
  if (id !== raw) permanentRedirect(`/books/${id}`);

  const outcome = await getBookDetail(id);
  if (outcome.kind === "not_found") notFound();
  if (outcome.kind === "redirect") permanentRedirect(`/books/${outcome.id}`);
  if (outcome.kind === "error") {
    return (
      <div className="container-page pt-10">
        <BookError error={outcome.error} />
      </div>
    );
  }

  const { book } = outcome;
  return (
    <>
      <BookDetail book={book} />
      <Suspense fallback={<SimilarBooksSkeleton />}>
        <SimilarBooks id={book.id} author={book.authors[0]?.name ?? null} subject={book.subjects[0]?.name ?? null} />
      </Suspense>
    </>
  );
}

export default function BookPage({ params }: PageProps<"/books/[id]">) {
  return (
    <PageTransition>
      <Suspense
        fallback={
          <div className="container-page pt-6 sm:pt-10">
            <BookDetailSkeleton />
          </div>
        }
      >
        <BookContent params={params} />
      </Suspense>
    </PageTransition>
  );
}
