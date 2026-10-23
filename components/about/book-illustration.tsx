import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/** Lines of text on a page, following the curve of the paper. */
function PageLines({ side }: { side: "start" | "end" }) {
  const lines = [0, 1, 2, 3, 4, 5];
  return (
    <g className="stroke-muted-foreground/35" strokeWidth="2.2" strokeLinecap="round" fill="none">
      {lines.map((i) => {
        const y = 344 + i * 15;
        const short = i === lines.length - 1;
        return side === "start" ? (
          <path key={i} d={`M${short ? 470 : 418} ${y + 2} C 470 ${y - 10}, 530 ${y - 8}, 584 ${y + 10}`} />
        ) : (
          <path key={i} d={`M616 ${y + 10} C 670 ${y - 8}, 730 ${y - 10}, ${short ? 730 : 782} ${y + 2}`} />
        );
      })}
    </g>
  );
}

/** A small bird in two strokes. */
function Bird({ x, y, scale = 1, delay }: { x: number; y: number; scale?: number; delay: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d="M0 0 q 9 -10 18 0 q 9 -10 18 0"
        className="animate-float fill-none stroke-foreground/55"
        strokeWidth="2.4"
        strokeLinecap="round"
        style={{ animationDelay: delay, transformBox: "fill-box" } as CSSProperties}
      />
    </g>
  );
}

/** A Persian letter drifting out of the book. */
function Letter({ x, y, size, children, delay, className }: { x: number; y: number; size: number; children: string; delay: string; className?: string }) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      textAnchor="middle"
      className={cn("animate-float font-serif font-bold", className)}
      style={{ animationDelay: delay, transformBox: "fill-box" } as CSSProperties}
    >
      {children}
    </text>
  );
}

/**
 * Abstract illustration for the About page: an open book whose pages release
 * ribbons of light, letters and birds, with a rising sun of arcs behind it.
 * Drawn with theme colours, so it follows light and dark mode.
 */
export function BookIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 500"
      role="img"
      aria-label="تصویری انتزاعی: کتابی گشوده که از میان صفحه‌هایش حروف و پرنده‌ها به پرواز درمی‌آیند"
      className={cn("h-auto w-full", className)}
    >
      <defs>
        <radialGradient id="kg-glow" cx="50%" cy="88%" r="60%">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.28" />
          <stop offset="55%" stopColor="var(--primary)" stopOpacity="0.07" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="kg-ribbon" x1="0" y1="330" x2="0" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.95" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="kg-ribbon-green" x1="0" y1="330" x2="0" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="1200" height="500" fill="url(#kg-glow)" />

      {/* Rising sun of arcs behind the book. */}
      <g fill="none" strokeWidth="1.5">
        <circle cx="600" cy="446" r="150" className="stroke-gold/45" strokeDasharray="2 9" strokeLinecap="round" />
        <circle cx="600" cy="446" r="235" className="stroke-foreground/10" />
        <circle cx="600" cy="446" r="320" className="stroke-gold/25" strokeDasharray="1 12" strokeLinecap="round" />
        <circle cx="600" cy="446" r="405" className="stroke-foreground/[0.06]" />
      </g>

      {/* Ribbons rising from the spine. */}
      <g fill="none" strokeLinecap="round">
        <path d="M600 330 C 600 250, 520 236, 470 176 S 418 74, 470 34" stroke="url(#kg-ribbon)" strokeWidth="2.5" />
        <path d="M600 330 C 612 244, 702 222, 742 162 S 792 84, 760 40" stroke="url(#kg-ribbon)" strokeWidth="2.5" />
        <path d="M600 330 C 594 262, 604 200, 618 120" stroke="url(#kg-ribbon-green)" strokeWidth="2" strokeDasharray="3 9" />
        <path d="M600 330 C 560 280, 420 280, 360 220" stroke="url(#kg-ribbon-green)" strokeWidth="1.6" strokeDasharray="2 8" />
        <path d="M600 330 C 640 280, 780 286, 850 236" stroke="url(#kg-ribbon-green)" strokeWidth="1.6" strokeDasharray="2 8" />
      </g>

      {/* Letters and birds leaving the pages. */}
      <g className="fill-primary">
        <Letter x={470} y={150} size={40} delay="0s">ک</Letter>
        <Letter x={742} y={138} size={36} delay="1.2s" className="fill-gold">ت</Letter>
        <Letter x={616} y={96} size={30} delay="0.6s">ا</Letter>
        <Letter x={540} y={84} size={26} delay="2s" className="fill-gold">ب</Letter>
        <Letter x={372} y={206} size={24} delay="2.6s" className="fill-foreground/40">ر</Letter>
        <Letter x={846} y={222} size={26} delay="1.8s" className="fill-foreground/40">د</Letter>
      </g>
      <Bird x={790} y={74} scale={1.1} delay="0.4s" />
      <Bird x={850} y={112} scale={0.75} delay="1.4s" />
      <Bird x={330} y={128} scale={0.9} delay="2.2s" />
      <Bird x={672} y={44} scale={0.65} delay="3s" />

      {/* Sparks. */}
      <g className="fill-gold">
        {[
          [430, 250, 3],
          [770, 250, 3],
          [520, 214, 2.4],
          [690, 206, 2.4],
          [600, 168, 2],
          [400, 96, 2],
          [905, 160, 2.4],
          [290, 250, 2],
        ].map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} opacity="0.8" />
        ))}
      </g>

      {/* The open book. */}
      <ellipse cx="600" cy="466" rx="250" ry="11" className="fill-foreground/10" />
      <path
        d="M600 448 C 536 418, 458 416, 386 438 L 386 446 C 456 426, 536 430, 600 460 C 664 430, 744 426, 814 446 L 814 438 C 742 416, 664 418, 600 448 Z"
        className="fill-primary"
      />
      <path d="M600 332 C 540 302, 460 300, 392 318 L 392 434 C 460 416, 540 418, 600 448 Z" className="fill-card stroke-foreground/60" strokeWidth="2" strokeLinejoin="round" />
      <path d="M600 332 C 660 302, 740 300, 808 318 L 808 434 C 740 416, 660 418, 600 448 Z" className="fill-card stroke-foreground/60" strokeWidth="2" strokeLinejoin="round" />
      <PageLines side="start" />
      <PageLines side="end" />
      <path d="M600 332 L 600 448" className="stroke-foreground/45" strokeWidth="2" />
      {/* A turning page. */}
      <path d="M600 332 C 640 290, 700 262, 760 262 C 728 300, 700 360, 690 420 C 660 408, 630 420, 600 448 Z" className="fill-secondary stroke-foreground/45" strokeWidth="1.6" strokeLinejoin="round" opacity="0.92" />
    </svg>
  );
}
