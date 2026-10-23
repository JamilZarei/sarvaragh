"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties, type MouseEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useFavorites, useHydrated } from "@/hooks/use-favorites";
import { displayTitle } from "@/lib/books";
import { toFavorite, type FavoriteInput } from "@/lib/favorites";
import { cn } from "@/lib/utils";

type FavoriteButtonProps = {
  book: FavoriteInput;
  variant?: "icon" | "full";
  className?: string;
};

function shortTitle(title: string) {
  return title.length > 40 ? `${title.slice(0, 38)}…` : title;
}

/* Eight particles flying outwards when a book is added. */
const PARTICLES = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2;
  return { tx: `${Math.round(Math.cos(angle) * 20)}px`, ty: `${Math.round(Math.sin(angle) * 20)}px`, gold: i % 2 === 0 };
});

function Burst() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className={cn("absolute top-1/2 left-1/2 size-1.5 animate-burst rounded-full", p.gold ? "bg-gold" : "bg-heart")}
          style={{ "--tx": p.tx, "--ty": p.ty } as CSSProperties}
        />
      ))}
    </span>
  );
}

export function FavoriteButton({ book, variant = "icon", className }: FavoriteButtonProps) {
  const router = useRouter();
  const hydrated = useHydrated();
  const { favorites, isFavorite, add, remove } = useFavorites();
  const [popKey, setPopKey] = useState(0);
  const active = hydrated && isFavorite(book.id);
  const title = displayTitle(book);
  const label = active ? `حذف «${title}» از علاقه‌مندی‌ها` : `افزودن «${title}» به علاقه‌مندی‌ها`;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    // The card behind the button is a link; never navigate when toggling.
    event.preventDefault();
    event.stopPropagation();

    if (active) {
      const previous = favorites.find((f) => f.id === book.id) ?? toFavorite(book, Date.now());
      const persisted = remove(book.id);
      toast(`«${shortTitle(title)}» از علاقه‌مندی‌ها حذف شد`, {
        action: { label: "بازگردانی", onClick: () => add(previous) },
      });
      if (!persisted) warnStorage();
      return;
    }

    const persisted = add(book);
    setPopKey((k) => k + 1);
    toast.success(`«${shortTitle(title)}» به علاقه‌مندی‌ها اضافه شد`, {
      action: { label: "مشاهده", onClick: () => router.push("/favorites") },
    });
    if (!persisted) warnStorage();
  }

  const showBurst = popKey > 0 && active;
  const icon = (
    <span className="relative inline-grid place-items-center">
      <Heart
        key={popKey}
        aria-hidden="true"
        className={cn(
          "size-[1.1rem] transition-colors duration-200",
          active ? "fill-heart text-heart" : "text-current",
          showBurst && "animate-heart-pop",
        )}
      />
      {showBurst ? <Burst key={`b${popKey}`} /> : null}
    </span>
  );

  if (variant === "full") {
    return (
      <Button
        type="button"
        size="lg"
        variant={active ? "outline" : "default"}
        aria-pressed={active}
        onClick={handleClick}
        className={cn("min-w-48 bg-clip-border", active && "bg-card", className)}
      >
        {icon}
        {active ? "در علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
      </Button>
    );
  }

  // A native title instead of a Radix Tooltip: this button renders on every card,
  // and two dozen tooltip roots per page cost noticeable main-thread time on mobile.
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      aria-pressed={active}
      aria-label={label}
      title={active ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
      onClick={handleClick}
      className={cn(
        "overflow-visible rounded-full bg-card/90 text-foreground/70 shadow-sm ring-1 ring-foreground/5 backdrop-blur-sm transition-[transform,background-color,color] duration-200 hover:scale-110 hover:bg-card hover:text-heart active:scale-95 dark:bg-card/80",
        active && "text-heart",
        className,
      )}
    >
      {icon}
    </Button>
  );
}

function warnStorage() {
  toast.warning("مرورگر اجازه ذخیره دائمی نداد؛ فهرست فقط تا بستن این صفحه حفظ می‌شود.");
}
