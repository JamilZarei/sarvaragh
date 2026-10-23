import Link from "next/link";

import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8 shrink-0", className)}>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        d="M9.5 8.6a9 9 0 0 1 13 0"
        fill="none"
        strokeWidth="1.6"
        strokeLinecap="round"
        className="stroke-primary-foreground/70"
      />
      <path
        d="M6.5 12c3.1-1.3 6.3-1.1 8.9.7v11.1c-2.7-1.6-5.9-1.9-8.9-.7Zm19 0c-3.1-1.3-6.3-1.1-8.9.7v11.1c2.7-1.6 5.9-1.9 8.9-.7Z"
        className="fill-primary-foreground"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("group flex items-center gap-2.5 rounded-lg", className)} aria-label="کتاب‌گرد، صفحه اصلی">
      <LogoMark className="transition-transform duration-200 group-hover:-rotate-6" />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-extrabold tracking-tight">کتاب‌گرد</span>
        <span className="mt-1 text-[0.65rem] font-medium tracking-[0.18em] text-muted-foreground" dir="ltr">
          KETABGARD
        </span>
      </span>
    </Link>
  );
}
