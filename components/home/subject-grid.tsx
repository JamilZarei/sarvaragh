import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { BookCover } from "@/components/books/book-cover";
import { SUBJECT_ICONS } from "@/components/home/subject-icons";
import { Skeleton } from "@/components/ui/skeleton";
import { getSubjectShowcases } from "@/lib/book-service";
import { SUBJECTS } from "@/lib/constants";
import { formatCompact } from "@/lib/format";
import { discoverHref } from "@/lib/search-params";
import { cn } from "@/lib/utils";

/* Resting and hover positions of the three fanned covers on each card. */
const FAN = [
  "z-10 -rotate-[10deg] translate-x-3 group-hover/subject:-rotate-[16deg] group-hover/subject:translate-x-7",
  "z-20 -translate-y-1 group-hover/subject:-translate-y-3",
  "z-10 rotate-[10deg] -translate-x-3 group-hover/subject:rotate-[16deg] group-hover/subject:-translate-x-7",
];

/** Subject cards with real popular covers and live book counts from Open Library. */
export async function SubjectGrid() {
  const showcases = await getSubjectShowcases();
  const byKey = new Map(showcases.map((s) => [s.key, s]));

  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      {SUBJECTS.map((subject, i) => {
        const Icon = SUBJECT_ICONS[subject.key];
        const showcase = byKey.get(subject.key);
        return (
          <li key={subject.key} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
            <Link
              href={discoverHref({ subjects: [subject.key], sort: "popular" })}
              data-touch-hover-target=""
              className="group/subject relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card p-4 shadow-card transition-[translate,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-card-hover sm:p-5"
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-accent/80 to-transparent opacity-70 transition-opacity duration-300 group-hover/subject:opacity-100"
              />
              <span aria-hidden="true" className="relative mx-auto mb-4 flex h-28 w-full items-end justify-center">
                {showcase && showcase.covers.length === 3 ? (
                  showcase.covers.map((cover, j) => (
                    <span
                      key={cover.id}
                      className={cn(
                        "-mx-3 w-[4.4rem] overflow-hidden rounded-md shadow-book ring-1 ring-black/5 transition-transform duration-500 ease-out sm:w-20",
                        FAN[j],
                      )}
                    >
                      <BookCover bookId={cover.id} coverId={cover.coverId} coverEditionId={cover.editionId} title={cover.title} sizes="80px" />
                    </span>
                  ))
                ) : (
                  <span className="grid size-16 place-items-center rounded-2xl bg-accent text-accent-foreground">
                    <Icon className="size-7" />
                  </span>
                )}
              </span>
              <span className="relative flex items-center gap-2">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition-colors duration-200 group-hover/subject:bg-primary group-hover/subject:text-primary-foreground">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="text-lg font-bold">{subject.label}</span>
              </span>
              <span className="relative mt-1 text-sm leading-6 text-muted-foreground">{subject.description}</span>
              <span className="relative mt-3 flex items-center justify-between text-sm">
                <span className="font-bold text-primary tabular-nums">
                  {showcase?.total ? `${formatCompact(showcase.total)} کتاب` : "مشاهده کتاب‌ها"}
                </span>
                <ArrowLeft
                  className="size-4 text-muted-foreground transition-transform duration-300 group-hover/subject:-translate-x-1 group-hover/subject:text-primary"
                  aria-hidden="true"
                />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function SubjectGridSkeleton() {
  return (
    <ul aria-hidden="true" className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      {SUBJECTS.map((s) => (
        <li key={s.key}>
          <Skeleton className="h-64 rounded-2xl" />
        </li>
      ))}
    </ul>
  );
}
