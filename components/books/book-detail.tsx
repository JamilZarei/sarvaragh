import { BookCopy, BookOpenText, ExternalLink, Fingerprint, Languages, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { BackToResults } from "@/components/books/back-to-results";
import { BookDescription } from "@/components/books/book-description";
import { BookCover } from "@/components/books/book-cover";
import { RatingSummary } from "@/components/books/rating";
import { ShareMenu } from "@/components/books/share-menu";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { displayTitle } from "@/lib/books";
import { formatCompact, formatNumber, formatYear } from "@/lib/format";
import { languageName } from "@/lib/languages";
import { authorPhotoSrc, bookCoverSrc } from "@/lib/cover-url";
import { workUrl } from "@/lib/open-library";
import { discoverHref } from "@/lib/search-params";
import type { BookDetail as BookDetailModel, BookStats } from "@/types/book";

const MAX_LANGUAGES = 6;

function MetaItem({ label, icon, children }: { label: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="text-base font-bold">{children}</dd>
    </div>
  );
}

/** Blurred cover as an ambient backdrop behind the page header. */
function Ambient({ bookId, coverId, editionId }: { bookId: string; coverId: number | null; editionId: string | null }) {
  const src = bookCoverSrc(bookId, coverId, editionId, "M");
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40rem] overflow-hidden">
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          unoptimized
          loading="eager"
          sizes="100vw"
          className="scale-125 object-cover opacity-40 blur-3xl saturate-150 dark:opacity-25"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/75 to-background" />
    </div>
  );
}

function ReaderStats({ stats }: { stats: BookStats }) {
  const rows = [
    { label: "می‌خواهند بخوانند", value: stats.wantToRead, color: "bg-gold" },
    { label: "در حال خواندن", value: stats.currentlyReading, color: "bg-primary" },
    { label: "خوانده‌اند", value: stats.alreadyRead, color: "bg-heart" },
  ].filter((r): r is { label: string; value: number; color: string } => r.value !== null);
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  if (total === 0) return null;

  return (
    <Card className="gap-4 px-5 py-5 shadow-card ring-foreground/[0.07]">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <Users className="size-4 text-primary" aria-hidden="true" />
          خوانندگان در Open Library
        </h2>
        <span className="text-sm text-muted-foreground tabular-nums">{formatNumber(total)} نفر</span>
      </div>
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.label} className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span>{row.label}</span>
              <span className="text-muted-foreground tabular-nums">{formatNumber(row.value)}</span>
            </div>
            <Progress
              value={(row.value / total) * 100}
              indicatorClassName={row.color}
              className="h-2"
              aria-label={`${row.label}: ${formatNumber(row.value)} نفر`}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function BookDetail({ book }: { book: BookDetailModel }) {
  const olUrl = workUrl(book.id);
  const title = displayTitle(book);
  const hasPersianTitle = Boolean(book.titleFa && book.titleFa !== book.title);
  const firstAuthor = book.authors[0];
  const favoriteData = {
    id: book.id,
    title: book.title,
    titleFa: book.titleFa,
    authors: book.authors.map((a) => a.name),
    authorsFa: book.authors.map((a) => a.nameFa),
    firstPublishYear: book.firstPublishYear,
    coverId: book.coverId,
    coverEditionId: book.coverEditionId,
    ratingAverage: book.stats.ratingAverage,
  };
  const languages = book.languages.slice(0, MAX_LANGUAGES).map(languageName);
  const extraLanguages = book.languages.length - languages.length;

  return (
    <article className="relative isolate">
      <Ambient bookId={book.id} coverId={book.coverId} editionId={book.coverEditionId} />

      <div className="container-page pt-6 sm:pt-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Breadcrumb>
            <BreadcrumbList className="text-sm">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">خانه</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/discover">کشف کتاب‌ها</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="block max-w-[14rem] truncate sm:max-w-sm">{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <BackToResults />
        </div>

        <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16">
          {/* 3D book: tilted at rest, faces the reader on hover */}
          <div className="mx-auto w-full max-w-[15rem] animate-fade-up md:max-w-none">
            <div className="[perspective:1400px]">
              <div
                data-touch-hover-target=""
                className="relative transition-transform duration-700 ease-out [transform:rotateY(-14deg)] [transform-style:preserve-3d] hover:[transform:rotateY(0deg)] motion-reduce:[transform:none]">
                <div className="overflow-hidden rounded-s-sm rounded-e-lg shadow-[0_30px_60px_-20px_rgb(0_0_0/0.45),0_10px_20px_-10px_rgb(0_0_0/0.3)]">
                  <BookCover
                    bookId={book.id}
                    coverId={book.coverId}
                    coverEditionId={book.coverEditionId}
                    title={title}
                    author={firstAuthor?.nameFa || firstAuthor?.name}
                    sizes="(min-width: 1024px) 320px, (min-width: 768px) 272px, 240px"
                    priority
                    morphName={`cover-${book.id}`}
                  />
                </div>
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 start-0 w-3 rounded-s-sm bg-gradient-to-l from-black/0 via-white/25 to-black/25"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-y-1.5 -end-1.5 w-1.5 rounded-e-sm bg-[repeating-linear-gradient(to_bottom,#f4efe3_0_2px,#d9d2c1_2px_3px)] shadow-sm"
                />
              </div>
            </div>
            {book.coverId ? (
              <p className="mt-4 text-center text-xs text-muted-foreground">جلد از Open Library Covers</p>
            ) : null}
          </div>

          <div className="min-w-0 animate-fade-up [animation-delay:80ms]">
            <h1 className="text-4xl leading-tight font-bold text-balance sm:text-5xl">{title}</h1>
            {hasPersianTitle ? (
              <p dir="ltr" lang="en" className="mt-2 text-right font-serif text-xl text-muted-foreground">
                {book.title}
              </p>
            ) : null}
            {book.subtitle ? (
              <p className="mt-2 text-lg text-muted-foreground">{book.subtitleFa || book.subtitle}</p>
            ) : null}

            {book.authors.length > 0 ? (
              <ul className="mt-5 flex flex-wrap gap-2" aria-label="نویسندگان">
                {book.authors.map((author, i) => {
                  const name = author.nameFa || author.name;
                  const photo = authorPhotoSrc(author.photoId);
                  return (
                    <li key={`${author.name}-${i}`}>
                      <Link
                        href={discoverHref({ q: author.name, field: "author", sort: "popular" })}
                        className="flex items-center gap-2 rounded-full border bg-card/80 py-1 ps-1 pe-4 shadow-xs backdrop-blur-sm transition-[border-color,translate] duration-200 hover:-translate-y-0.5 hover:border-primary/40"
                      >
                        <Avatar className="size-8">
                          {photo ? <AvatarImage src={photo} alt="" className="object-cover" /> : null}
                          <AvatarFallback className="bg-accent text-sm font-bold text-accent-foreground">
                            {name.trim()[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-primary">{name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 text-muted-foreground">نویسنده در Open Library ثبت نشده است.</p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              {book.stats.ratingAverage ? (
                <RatingSummary value={book.stats.ratingAverage} count={book.stats.ratingCount} className="text-base" />
              ) : (
                <span className="text-muted-foreground">هنوز امتیاز کافی ثبت نشده است</span>
              )}
              {book.stats.readers ? (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Users className="size-4" aria-hidden="true" />
                  {formatCompact(book.stats.readers)} خواننده
                </span>
              ) : null}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-2">
              <FavoriteButton book={favoriteData} variant="full" />
              <Button asChild variant="outline" size="lg" className="bg-card">
                <a href={olUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink data-icon="inline-start" />
                  مشاهده در Open Library
                  <span className="sr-only">(در زبانه جدید)</span>
                </a>
              </Button>
              <ShareMenu title={title} label="اشتراک" />
            </div>

            <div className="mt-8 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
              <Card className="gap-0 px-5 py-5 shadow-card ring-foreground/[0.07]">
                <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                  <MetaItem label="سال نخستین انتشار">
                    {book.firstPublishYear ? <span className="tabular-nums">{formatYear(book.firstPublishYear)}</span> : "نامشخص"}
                  </MetaItem>
                  <MetaItem label="زبان‌ها" icon={<Languages className="size-3.5" aria-hidden="true" />}>
                    {languages.length ? (
                      <>
                        {languages.join("، ")}
                        {extraLanguages > 0 ? (
                          <span className="font-normal text-muted-foreground"> و {formatNumber(extraLanguages)} زبان دیگر</span>
                        ) : null}
                      </>
                    ) : (
                      "نامشخص"
                    )}
                  </MetaItem>
                  {book.publishers.length ? (
                    <MetaItem label="ناشران (ویرایش‌های مختلف)">
                      <bdi dir="ltr" className="font-serif text-sm">
                        {book.publishers.join(" · ")}
                      </bdi>
                    </MetaItem>
                  ) : null}
                  {book.pagesMedian ? (
                    <MetaItem label="تعداد صفحات (میانه ویرایش‌ها)">
                      <span className="tabular-nums">{formatNumber(book.pagesMedian)}</span> صفحه
                    </MetaItem>
                  ) : null}
                  {book.editionCount ? (
                    <MetaItem label="ویرایش‌های ثبت‌شده" icon={<BookCopy className="size-3.5" aria-hidden="true" />}>
                      <span className="tabular-nums">{formatNumber(book.editionCount)}</span> ویرایش
                    </MetaItem>
                  ) : null}
                  <MetaItem label="شناسه Open Library" icon={<Fingerprint className="size-3.5" aria-hidden="true" />}>
                    <span className="font-mono text-sm" dir="ltr">
                      {book.id}
                    </span>
                  </MetaItem>
                </dl>
              </Card>
              <ReaderStats stats={book.stats} />
            </div>

            {book.subjects.length ? (
              <section aria-labelledby="subjects-heading" className="mt-8">
                <h2 id="subjects-heading" className="mb-3 text-base font-bold">
                  موضوعات
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {book.subjects.map((subject) => (
                    <li key={subject.name}>
                      <Badge
                        asChild
                        variant="outline"
                        className="h-8 rounded-full bg-card px-3.5 text-sm font-normal transition-[background-color,border-color,translate] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent"
                      >
                        <Link href={discoverHref({ q: subject.name })} title={subject.name}>
                          {subject.nameFa || subject.name}
                        </Link>
                      </Badge>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </div>

        <section aria-labelledby="about-heading" className="mt-14 max-w-3xl">
          <h2 id="about-heading" className="mb-4 flex items-center gap-2 text-2xl font-bold">
            <BookOpenText className="size-6 text-primary" aria-hidden="true" />
            درباره کتاب
          </h2>
          {book.description.length ? (
            <BookDescription id={book.id} description={book.description} />
          ) : (
            <div className="rounded-xl border border-dashed bg-card/50 p-5 text-base leading-8 text-muted-foreground">
              متأسفانه توضیحی برای این کتاب در Open Library ثبت نشده است. می‌توانید اطلاعات ویرایش‌های مختلف آن را در{" "}
              <a href={olUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline-offset-4 hover:underline">
                صفحه کتاب در Open Library
              </a>{" "}
              ببینید.
            </div>
          )}
        </section>
      </div>
    </article>
  );
}
