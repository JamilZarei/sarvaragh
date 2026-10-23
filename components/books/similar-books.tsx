import { BookCarousel } from "@/components/books/book-carousel";
import { BookGridSkeleton } from "@/components/books/book-skeleton";
import { getSimilarBooks } from "@/lib/book-service";

type SimilarBooksProps = {
  id: string;
  author: string | null;
  subject: string | null;
};

/** Same-author works first, then the first subject; nothing is shown when neither yields results. */
export async function SimilarBooks({ id, author, subject }: SimilarBooksProps) {
  const result = await getSimilarBooks(id, author, subject);
  if (!result.ok || !result.data) return null;
  const { basis, books } = result.data;
  const label = basis.labelFa || basis.label;

  return (
    <section aria-labelledby="similar-heading" className="container-page mt-16">
      <h2 id="similar-heading" className="text-2xl font-bold sm:text-3xl">
        {basis.type === "author" ? "کتاب‌های دیگر از همین نویسنده" : "کتاب‌های مشابه"}
      </h2>
      <div className="mt-1">
        <BookCarousel
          books={books}
          label={basis.type === "author" ? `آثار ${label}` : `کتاب‌های موضوع ${label}`}
          caption={
            <>
              {basis.type === "author" ? "آثار " : "بر اساس موضوع "}
              <span className="font-bold text-foreground">{label}</span>، به ترتیب تعداد خوانندگان در Open Library
            </>
          }
        />
      </div>
    </section>
  );
}

export function SimilarBooksSkeleton() {
  return (
    <div className="container-page mt-16">
      <BookGridSkeleton count={6} columns="wide" />
    </div>
  );
}
