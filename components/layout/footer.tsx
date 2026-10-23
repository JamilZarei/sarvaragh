import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/layout/logo";
import { Separator } from "@/components/ui/separator";
import { OPEN_LIBRARY_DOCS_URL, OPEN_LIBRARY_URL, SITE_TAGLINE } from "@/lib/constants";

const LINKS = [
  { href: "/", label: "صفحه اصلی" },
  { href: "/discover", label: "کشف کتاب‌ها" },
  { href: "/favorites", label: "علاقه‌مندی‌ها" },
  { href: "/about", label: "درباره کتاب‌گرد" },
] as const;

const externalLinkClass =
  "inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground";

export function Footer() {
  return (
    <footer className="mt-24 border-t bg-card/60">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm space-y-4">
          <Logo />
          <p className="text-sm leading-7 text-muted-foreground">
            کتاب‌گرد یک کتابخانه دیجیتال برای کشف و مرور کتاب‌هاست؛ جستجو کن، فیلتر کن و کتاب‌های
            موردعلاقه‌ات را برای بعد نگه دار. {SITE_TAGLINE}
          </p>
        </div>

        <nav aria-label="پیوندهای پانویس">
          <h2 className="mb-4 text-sm font-bold">پیمایش</h2>
          <ul className="space-y-3">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="mb-4 text-sm font-bold">منبع داده‌ها</h2>
          <p className="mb-4 text-sm leading-7 text-muted-foreground">
            اطلاعات و جلد کتاب‌ها از پروژه آزاد{" "}
            {/* One LTR run, so the bidi algorithm cannot pull the parentheses apart. */}
            <span dir="ltr" className="whitespace-nowrap">
              <span className="font-medium text-foreground">Open Library</span> (Internet Archive)
            </span>{" "}
            و جلدهای جایگزین از <span dir="ltr">Google Books</span> دریافت می‌شود.
          </p>
          <ul className="space-y-3">
            <li>
              <a href={OPEN_LIBRARY_URL} target="_blank" rel="noopener noreferrer" className={externalLinkClass}>
                وب‌سایت Open Library
                <ExternalLink className="size-3.5" aria-hidden="true" />
                <span className="sr-only">(در زبانه جدید)</span>
              </a>
            </li>
            <li>
              <a href={OPEN_LIBRARY_DOCS_URL} target="_blank" rel="noopener noreferrer" className={externalLinkClass}>
                مستندات API
                <ExternalLink className="size-3.5" aria-hidden="true" />
                <span className="sr-only">(در زبانه جدید)</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
      <Separator />
      <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>کتاب‌گرد فقط برای کشف و معرفی کتاب است؛ فروش، خرید یا مطالعه آنلاین در آن انجام نمی‌شود.</p>
        <p dir="ltr">KetabGard · Data: Open Library</p>
      </div>
    </footer>
  );
}
