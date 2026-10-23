import Link from "next/link";

import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * «سرورق» means a book's front cover / title page, so the mark is one: a
 * cover seen from the front with its spine on the right (Persian books open
 * from the right), a gold title plate, two lines of text and a bookmark ribbon.
 * Kept to a few solid shapes so it still reads as a 16px favicon (app/icon.svg).
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8 shrink-0", className)}>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      {/* Cover */}
      <path d="M8.5 7.5A1.5 1.5 0 0 1 10 6h11a2.5 2.5 0 0 1 2.5 2.5v14A2.5 2.5 0 0 1 21 25H10a1.5 1.5 0 0 1-1.5-1.5Z" className="fill-primary-foreground" />
      {/* Spine on the right */}
      <path d="M20 6h1a2.5 2.5 0 0 1 2.5 2.5v14A2.5 2.5 0 0 1 21 25h-1Z" className="fill-primary opacity-25" />
      {/* Title plate */}
      <rect x="11" y="9.5" width="7" height="4.5" rx="1" className="fill-gold" />
      {/* Lines of text */}
      <path d="M11.5 17.25h6M13 20h3" strokeWidth="1.4" strokeLinecap="round" className="stroke-primary opacity-45" />
      {/* Bookmark ribbon */}
      <path d="M12 24h2.8v5l-1.4-1.15L12 29Z" className="fill-gold" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("group flex items-center gap-2.5 rounded-lg", className)} aria-label={`${SITE_NAME}، صفحه اصلی`}>
      <LogoMark className="transition-transform duration-200 group-hover:-rotate-6" />
      <span className="flex flex-col leading-none">
        {/* The fatha marks the reading: sar-varaq. */}
        <span className="text-lg font-extrabold tracking-tight">سَرورق</span>
        <span className="mt-1 text-[0.65rem] font-medium tracking-[0.18em] text-muted-foreground" dir="ltr">
          SARVARAGH
        </span>
      </span>
    </Link>
  );
}
