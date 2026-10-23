import { BookOpenText, Mail, Quote } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BookIllustration } from "@/components/about/book-illustration";
import { PageTransition } from "@/components/motion/page-transition";
import { Button } from "@/components/ui/button";
import { OPEN_LIBRARY_URL, SITE_NAME } from "@/lib/constants";

const CONTACT_EMAIL = "jamilzarei@gmail.com";

export const metadata: Metadata = {
  title: "درباره",
  description: "سرورق چیست، داده‌هایش از کجا می‌آید و چطور می‌شود با سازنده‌اش در تماس بود.",
};

export default function AboutPage() {
  return (
    <PageTransition>
      <div className="container-page pt-8 sm:pt-12">
        <header className="mb-10 max-w-2xl">
          <p className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-primary">
            <span className="h-px w-6 bg-gold" aria-hidden="true" />
            درباره
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">درباره {SITE_NAME}</h1>
          <p className="mt-3 text-base leading-8 text-muted-foreground sm:text-lg">
            سرورق یک کتابخانه دیجیتال فارسی برای کشف و مرور کتاب‌هاست؛ جایی برای پیدا کردن کتاب بعدی‌ات.
          </p>
        </header>

        <figure className="relative isolate animate-fade-up overflow-hidden rounded-[2rem] bg-hero px-6 py-12 text-hero-foreground sm:px-14 sm:py-16 dark:ring-1 dark:ring-white/[0.06]">
          <Quote aria-hidden="true" className="absolute -top-4 end-6 -z-10 size-40 rotate-180 text-hero-foreground/[0.06] sm:size-56" />
          <blockquote className="max-w-3xl" cite="https://fr.wikisource.org/wiki/Discours_de_la_m%C3%A9thode">
            {/* Display type: justifying a few large words per line opens wide gaps, so this one is balanced instead. */}
            <p className="font-serif text-2xl leading-[1.9] font-bold text-balance text-start sm:text-4xl sm:leading-[1.8]">
              «خواندن همه کتاب‌های خوب، همچون گفت‌وگو با فرهیخته‌ترین مردمان سده‌های گذشته است؛ همان‌ها که نویسندگان این کتاب‌ها
              بوده‌اند.»
            </p>
            <p lang="fr" dir="ltr" className="mt-5 max-w-2xl font-serif text-sm leading-7 text-hero-muted italic sm:text-base">
              « La lecture de tous les bons livres est comme une conversation avec les plus honnêtes gens des siècles passés, qui en
              ont été les auteurs. »
            </p>
          </blockquote>
          <figcaption className="mt-7 flex items-center gap-3 text-sm text-hero-muted sm:text-base">
            <span className="h-px w-10 shrink-0 bg-gold" aria-hidden="true" />
            <span>
              <span className="font-bold text-hero-foreground">رنه دکارت</span>، <cite className="not-italic">گفتار در روش</cite> (۱۶۳۷)
            </span>
          </figcaption>
        </figure>

        <figure className="mt-14 overflow-hidden rounded-[2rem] border bg-card shadow-card">
          <BookIllustration />
        </figure>

        <div className="mt-14 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <section aria-labelledby="about-data" className="rounded-2xl border bg-card p-6 sm:p-8">
            <h2 id="about-data" className="mb-3 flex items-center gap-2 text-xl font-bold">
              <BookOpenText className="size-5 text-primary" aria-hidden="true" />
              داده‌ها از کجا می‌آیند؟
            </h2>
            <p className="leading-8 text-muted-foreground">
              اطلاعات کتاب‌ها از پروژه آزاد{" "}
              <span dir="ltr">
                <a href={OPEN_LIBRARY_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline-offset-4 hover:underline">
                  Open Library
                </a>{" "}
                (Internet Archive)
              </span>{" "}
              دریافت می‌شود و جلدهایی که آنجا نیستند از <span dir="ltr">Google Books</span>. ترجمه‌های فارسی خودکارند و ممکن است با
              نام نسخه منتشرشده فارسی فرق کنند. سرورق فروشگاه نیست و خرید، فروش یا مطالعه آنلاین در آن انجام نمی‌شود.
            </p>
          </section>

          <section aria-labelledby="about-contact" className="flex flex-col rounded-2xl border bg-accent/50 p-6 sm:p-8">
            <h2 id="about-contact" className="mb-3 flex items-center gap-2 text-xl font-bold">
              <Mail className="size-5 text-primary" aria-hidden="true" />
              تماس با سازنده
            </h2>
            <p className="mb-5 leading-8 text-muted-foreground">پیشنهاد، گزارش اشکال یا معرفی یک کتاب خوب؟ خوشحال می‌شوم بشنوم.</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              dir="ltr"
              className="mt-auto self-start rounded-xl border bg-card px-4 py-3 font-mono text-[0.95rem] break-all text-foreground shadow-card transition-colors hover:border-primary/40 hover:text-primary"
            >
              {CONTACT_EMAIL}
            </a>
          </section>
        </div>

        <div className="mt-14 flex justify-center">
          <Button asChild size="lg" className="rounded-full px-7">
            <Link href="/discover">شروع کشف کتاب‌ها</Link>
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
