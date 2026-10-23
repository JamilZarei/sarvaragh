import { Star } from "lucide-react";

import { formatNumber, formatRating } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Five stars with a partial fill (fills from the start edge, so right-to-left in RTL). */
export function RatingStars({ value, className }: { value: number; className?: string }) {
  const percent = Math.max(0, Math.min(100, (value / 5) * 100));
  const stars = Array.from({ length: 5 }, (_, i) => <Star key={i} className="size-[1em] shrink-0" strokeWidth={1.6} />);
  return (
    <span
      role="img"
      aria-label={`امتیاز ${formatRating(value)} از ۵`}
      className={cn("relative inline-flex text-[0.95rem] text-gold/35", className)}
    >
      {stars}
      <span className="absolute inset-y-0 start-0 flex overflow-hidden text-gold" style={{ width: `${percent}%` }} aria-hidden="true">
        <span className="flex [&_svg]:fill-current">{stars}</span>
      </span>
    </span>
  );
}

/** Compact rating with vote count, e.g. "★ ۴٫۳ (۴۴۸ رأی)". */
export function RatingSummary({ value, count, className }: { value: number; count: number | null; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <RatingStars value={value} />
      <span className="font-bold tabular-nums">{formatRating(value)}</span>
      {count ? <span className="text-muted-foreground tabular-nums">({formatNumber(count)} رأی)</span> : null}
    </span>
  );
}
