"use client";

import { ChevronDown, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavigationMenu } from "radix-ui";

import { Badge } from "@/components/ui/badge";
import { SUBJECT_ICONS } from "@/components/home/subject-icons";
import { useFavorites, useHydrated } from "@/hooks/use-favorites";
import { SUBJECTS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { discoverHref } from "@/lib/search-params";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/", label: "خانه" },
  { href: "/discover", label: "کشف کتاب‌ها" },
  { href: "/favorites", label: "علاقه‌مندی‌ها" },
  { href: "/about", label: "درباره" },
] as const;

export function isActivePath(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function FavoritesCount() {
  const hydrated = useHydrated();
  const { favorites } = useFavorites();
  if (!hydrated || favorites.length === 0) return null;
  return (
    <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[0.7rem] tabular-nums animate-fade-in">
      {formatNumber(favorites.length)}
      <span className="sr-only">کتاب</span>
    </Badge>
  );
}

const linkClass =
  "relative inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground";

/** Label of the subjects menu, placed right after "Home". */
export const CATEGORIES_LABEL = "دسته‌بندی";

/**
 * Subjects dropdown: opens on hover (after a short delay), on click and from
 * the keyboard; closes on Escape, when the pointer leaves and after choosing a subject.
 */
function CategoriesMenu() {
  return (
    <NavigationMenu.Item className="lg:relative">
      <NavigationMenu.Trigger
        className={cn(linkClass, "group outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:text-foreground")}
      >
        {CATEGORIES_LABEL}
        <ChevronDown aria-hidden="true" className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </NavigationMenu.Trigger>
      {/* Top padding instead of margin: the pointer never crosses a gap on its way into the panel.
          Below lg the panel spans the screen under the header instead of hanging off the trigger. */}
      <NavigationMenu.Content className="z-50 pt-3 max-lg:fixed max-lg:inset-x-4 max-lg:top-14 lg:absolute lg:start-0 lg:top-full data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2 data-[state=open]:duration-200">
        <div className="overflow-hidden lg:w-[42rem] rounded-2xl border bg-popover text-popover-foreground shadow-xl">
          <ul className="grid grid-cols-2 gap-1 p-3">
            {SUBJECTS.map((subject) => {
              const Icon = SUBJECT_ICONS[subject.key];
              return (
                <li key={subject.key}>
                  <NavigationMenu.Link asChild>
                    <Link
                      href={discoverHref({ subjects: [subject.key], sort: "popular" })}
                      className="group/item flex items-start gap-3 rounded-xl p-2.5 outline-none transition-colors duration-150 hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-transform duration-200 group-hover/item:scale-105">
                        <Icon className="size-[1.1rem]" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-foreground">{subject.label}</span>
                        <span className="block truncate text-xs leading-6 text-muted-foreground">{subject.description}</span>
                      </span>
                    </Link>
                  </NavigationMenu.Link>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between gap-3 border-t bg-muted/40 px-5 py-3 text-sm">
            <span className="text-muted-foreground">کتاب‌های هر موضوع به ترتیب محبوبیت نمایش داده می‌شوند.</span>
            <NavigationMenu.Link asChild>
              <Link href="/discover" className="inline-flex shrink-0 items-center gap-1.5 font-medium text-primary hover:underline">
                <LayoutGrid className="size-4" aria-hidden="true" />
                همه کتاب‌ها
              </Link>
            </NavigationMenu.Link>
          </div>
        </div>
      </NavigationMenu.Content>
    </NavigationMenu.Item>
  );
}

/** Desktop navigation: animated underline for the active route, subjects dropdown after "Home". */
export function NavLinks() {
  const pathname = usePathname();
  return (
    <NavigationMenu.Root aria-label="منوی اصلی" delayDuration={120}>
      <NavigationMenu.List className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          return [
            <NavigationMenu.Item key={item.href}>
              <NavigationMenu.Link asChild active={active}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    linkClass,
                    "after:absolute after:inset-x-3 after:-bottom-[13px] after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-200",
                    active && "text-foreground after:scale-x-100",
                  )}
                >
                  {item.label}
                  {item.href === "/favorites" && <FavoritesCount />}
                </Link>
              </NavigationMenu.Link>
            </NavigationMenu.Item>,
            item.href === "/" ? <CategoriesMenu key="categories" /> : null,
          ];
        })}
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}

/** Static fallback rendered during prerendering (no active state yet). */
export function NavLinksFallback() {
  return (
    <nav aria-label="منوی اصلی">
      <ul className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => [
          <li key={item.href}>
            <Link href={item.href} className={linkClass}>
              {item.label}
            </Link>
          </li>,
          item.href === "/" ? (
            <li key="categories">
              <Link href="/discover" className={linkClass}>
                {CATEGORIES_LABEL}
                <ChevronDown aria-hidden="true" className="size-3.5" />
              </Link>
            </li>
          ) : null,
        ])}
      </ul>
    </nav>
  );
}
