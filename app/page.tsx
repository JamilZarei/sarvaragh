import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { FeaturedAuthors, FeaturedAuthorsSkeleton } from "@/components/home/featured-authors";
import { Hero } from "@/components/home/hero";
import { HomeExplore } from "@/components/home/home-explore";
import { HomeShelves, HomeShelvesSkeleton } from "@/components/home/home-shelves";
import { SectionHeading } from "@/components/home/section-heading";
import { SubjectGrid, SubjectGridSkeleton } from "@/components/home/subject-grid";
import { PageTransition } from "@/components/motion/page-transition";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { discoverHref } from "@/lib/search-params";

export default function HomePage() {
  return (
    <PageTransition>
      <Hero />

      <Reveal>
        <section aria-labelledby="shelves-title" className="container-page mt-16 sm:mt-24">
          <SectionHeading
            id="shelves-title"
            eyebrow="ویترین کتاب‌گرد"
            title="کتاب‌هایی که همه درباره‌شان حرف می‌زنند"
            description="فهرست‌ها بر اساس داده‌های واقعی خوانندگان و امتیازهای Open Library ساخته شده‌اند."
            action={
              <Button asChild variant="ghost" className="text-primary hover:text-primary">
                <Link href={discoverHref({ sort: "popular", popularity: 1000 })}>
                  همه کتاب‌های محبوب
                  <ArrowLeft data-icon="inline-end" />
                </Link>
              </Button>
            }
          />
          <Suspense fallback={<HomeShelvesSkeleton />}>
            <HomeShelves />
          </Suspense>
        </section>
      </Reveal>

      <Reveal>
        <section aria-labelledby="subjects-title" className="container-page mt-16 sm:mt-24">
          <SectionHeading
            id="subjects-title"
            eyebrow="موضوعات"
            title="کاوش بر اساس موضوع"
            description="هر قفسه با محبوب‌ترین جلدهایش؛ تعداد کتاب‌ها مستقیماً از کاتالوگ Open Library می‌آید."
          />
          <Suspense fallback={<SubjectGridSkeleton />}>
            <SubjectGrid />
          </Suspense>
        </section>
      </Reveal>

      <Reveal>
        <section aria-labelledby="authors-title" className="container-page mt-16 sm:mt-24">
          <SectionHeading
            id="authors-title"
            eyebrow="نویسندگان"
            title="نویسندگان پرخواننده"
            description="نویسندگان کتاب‌های بالا؛ روی هرکدام بزن تا آثارش را ببینی."
          />
          <Suspense fallback={<FeaturedAuthorsSkeleton />}>
            <FeaturedAuthors />
          </Suspense>
        </section>
      </Reveal>

      <Reveal>
        <section aria-labelledby="explore-title" className="container-page mt-16 sm:mt-24">
          <SectionHeading
            id="explore-title"
            eyebrow="کشف کتاب‌ها"
            title="در قفسه‌ها قدم بزن"
            description="موضوع و ترتیب نمایش را عوض کن و با «نمایش بیشتر» کتاب‌های بعدی را ببین."
          />
          <HomeExplore />
        </section>
      </Reveal>
    </PageTransition>
  );
}
