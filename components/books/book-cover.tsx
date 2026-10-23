"use client";

import { BookOpen } from "lucide-react";
import Image, { type ImageLoader } from "next/image";
import { useEffect, useRef, useState, ViewTransition } from "react";

import { bookCoverSrc } from "@/lib/cover-url";
import { cn } from "@/lib/utils";

/**
 * Covers come from our own origin (shipped home covers or the /api/cover proxy),
 * never from the Covers API directly. For proxied covers the loader asks for the
 * larger size only when the slot is wide (retina or the book page).
 */
const coverLoader: ImageLoader = ({ src, width }) => {
  const sized = src.startsWith("/api/cover/") ? src.replace(/([?&])s=[ML]/, `$1s=${width <= 256 ? "M" : "L"}`) : src;
  return `${sized}${sized.includes("?") ? "&" : "?"}w=${width}`;
};

type BookCoverProps = {
  /** Open Library work id; lets the server find the cover elsewhere when needed. */
  bookId?: string;
  coverId: number | null;
  coverEditionId?: string | null;
  title: string;
  author?: string;
  sizes: string;
  /** Preload: for the single most important image (hero, detail cover). */
  priority?: boolean;
  /** Load immediately without preloading, for covers that are usually above the fold. */
  eager?: boolean;
  /** Shared-element name for the card → book page morph. Must be unique on the page. */
  morphName?: string;
  /** Glossy light sweep while the nearest `.shine-host` ancestor is hovered. */
  shine?: boolean;
  className?: string;
  /** Extra classes for the <img>, e.g. hover zoom driven by a parent group. */
  imageClassName?: string;
};

/** After this long on screen without the image, show the designed placeholder instead of a shimmer. */
const SLOW_COVER_MS = 8000;

export function BookCover({
  bookId,
  coverId,
  coverEditionId,
  title,
  author,
  sizes,
  priority,
  eager,
  morphName,
  shine,
  className,
  imageClassName,
}: BookCoverProps) {
  const [failedId, setFailedId] = useState<number | null>(null);
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const [slowId, setSlowId] = useState<number | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const src = bookCoverSrc(bookId, coverId, coverEditionId);
  const showImage = src !== null && failedId !== coverId;
  const loaded = loadedId === coverId;
  const slow = slowId === coverId && !loaded;

  // The Covers API is a third-party service and sometimes stalls. Start a timer once the
  // cover is visible; if the image still has not arrived, swap the shimmer for the
  // placeholder (the image keeps loading and fades in over it if it arrives later).
  useEffect(() => {
    const el = container.current;
    if (!el || !showImage || loaded) return;
    let timer: number | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || timer !== undefined) return;
      timer = window.setTimeout(() => setSlowId(coverId), SLOW_COVER_MS);
      observer.disconnect();
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [coverId, showImage, loaded]);

  const cover = (
    <div
      ref={container}
      className={cn(
        "@container relative aspect-[2/3] w-full overflow-hidden bg-cover-placeholder",
        shine && showImage && loaded && "cover-shine",
        className,
      )}
    >
      {showImage ? (
        <>
          {/* A first lookup can take a few seconds; shimmer until the image arrives, then fade it in. */}
          {slow ? (
            <CoverPlaceholder title={title} author={author} decorative />
          ) : !loaded ? (
            <span aria-hidden="true" className="absolute inset-0 overflow-hidden">
              <span className="absolute inset-0 animate-shimmer bg-gradient-to-l from-transparent via-foreground/[0.06] to-transparent" />
            </span>
          ) : null}
          <Image
            src={src}
            loader={coverLoader}
            // Shipped covers exist in one size: one URL, downloaded once.
            unoptimized={src.startsWith("/covers/")}
            alt={`جلد کتاب ${title}`}
            fill
            sizes={sizes}
            preload={priority}
            loading={priority || eager ? "eager" : "lazy"}
            className={cn(
              "object-cover transition-[opacity,scale] duration-500 ease-out",
              loaded ? "opacity-100" : "opacity-0",
              imageClassName,
            )}
            onLoad={() => setLoadedId(coverId)}
            onError={() => setFailedId(coverId)}
          />
        </>
      ) : (
        <CoverPlaceholder title={title} author={author} />
      )}
    </div>
  );

  if (!morphName) return cover;
  return (
    <ViewTransition name={morphName} share="morph" default="none">
      {cover}
    </ViewTransition>
  );
}

/** Cloth-binding colours for generated covers; fixed like a real cover, in both themes. */
const BINDINGS = ["#285C49", "#6E2C34", "#253A57", "#7A5A1E", "#2F312C", "#4B3452", "#1F4E5A"] as const;

function bindingFor(title: string): string {
  let hash = 0;
  for (const char of title) hash = (hash * 31 + char.codePointAt(0)!) | 0;
  return BINDINGS[Math.abs(hash) % BINDINGS.length];
}

/**
 * A designed cover, used when a book has no cover image, while a slow one is
 * still on its way, or when it fails to load. Looks like a cloth-bound book
 * (colour picked from the title) rather than an error message.
 */
export function CoverPlaceholder({
  title,
  author,
  decorative,
}: {
  title: string;
  author?: string;
  /** Visual stand-in while the real cover (which has its own alt text) is still loading. */
  decorative?: boolean;
}) {
  return (
    <div
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : `جلد کتاب ${title}`}
      style={{ backgroundColor: bindingFor(title) }}
      className="absolute inset-0 flex flex-col items-center justify-center gap-[6%] px-[13%] py-[16%] text-center text-[#F3EBDD]"
    >
      <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-black/25" />
      <span aria-hidden="true" className="absolute inset-y-0 start-[5%] w-[3%] bg-black/15" />
      <span aria-hidden="true" className="absolute inset-[7%] start-[11%] rounded-[2px] border border-[#C9A75A]/55" />
      <BookOpen aria-hidden="true" strokeWidth={1.4} className="relative size-[clamp(1rem,10cqw,1.6rem)] text-[#C9A75A]" />
      <p dir="auto" className="relative line-clamp-4 font-serif text-[clamp(0.8rem,2.6cqw+0.45rem,1.15rem)] leading-snug font-bold text-balance">
        {title}
      </p>
      {author ? (
        <>
          <span aria-hidden="true" className="relative h-px w-[30%] bg-[#C9A75A]/70" />
          <p dir="auto" className="relative line-clamp-2 text-[clamp(0.62rem,1.6cqw+0.4rem,0.78rem)] text-[#F3EBDD]/75">
            {author}
          </p>
        </>
      ) : null}
    </div>
  );
}
