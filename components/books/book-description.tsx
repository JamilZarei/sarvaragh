import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getBookDescriptionFa } from "@/lib/book-service";

const PERSIAN = /[؀-ۿ]/;

/**
 * Description tabs: the original text (shown first, right away) and its Persian
 * translation. Only the translation is streamed in its own Suspense boundary:
 * translating a long description can take a few seconds, and nothing else
 * should wait for it.
 */
export function BookDescription({ id, description }: { id: string; description: string[] }) {
  return (
    <Tabs defaultValue="original" className="animate-fade-in gap-4">
      <TabsList className="h-10! rounded-full p-1">
        <TabsTrigger value="original" className="rounded-full px-4 text-[0.95rem]">
          متن اصلی
        </TabsTrigger>
        <TabsTrigger value="fa" className="rounded-full px-4 text-[0.95rem]">
          ترجمه فارسی
        </TabsTrigger>
      </TabsList>
      <TabsContent value="original" className="animate-fade-in">
        <div className="space-y-4 font-serif text-[1.05rem] leading-8 text-foreground/90">
          {description.map((paragraph, i) => (
            // Persian paragraphs are justified like the rest of the site; Latin ones keep ragged lines.
            <p key={i} dir="auto" className={PERSIAN.test(paragraph) ? undefined : "text-start"}>
              {paragraph}
            </p>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="fa" className="animate-fade-in">
        <Suspense fallback={<TranslationSkeleton />}>
          <TranslatedDescription id={id} />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}

async function TranslatedDescription({ id }: { id: string }) {
  const translated = await getBookDescriptionFa(id);
  if (!translated.length) {
    return (
      <p className="rounded-xl border border-dashed bg-card/50 p-5 text-base leading-8 text-muted-foreground">
        ترجمه فارسی این معرفی هنوز آماده نیست؛ کمی بعد دوباره سر بزنید.
      </p>
    );
  }
  return (
    <>
      <div className="space-y-4 text-lg leading-9 text-foreground/90">
        {translated.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        ترجمه خودکار از متن ثبت‌شده در Open Library؛ برای دقت بیشتر «متن اصلی» را ببینید.
      </p>
    </>
  );
}

function TranslationSkeleton() {
  return (
    <div role="status" className="space-y-3">
      <span className="sr-only">در حال ترجمه معرفی کتاب…</span>
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-11/12" />
      <Skeleton className="h-5 w-2/3" />
      <p className="pt-1 text-xs text-muted-foreground">در حال آماده‌سازی ترجمه فارسی…</p>
    </div>
  );
}
