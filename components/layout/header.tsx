import { Suspense } from "react";

import { Logo } from "@/components/layout/logo";
import { MobileNav, MobileNavFallback } from "@/components/layout/mobile-nav";
import { NavLinks, NavLinksFallback } from "@/components/layout/nav-links";
import { CommandSearch } from "@/components/search/command-search";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md supports-backdrop-filter:bg-background/80">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        پرش به محتوای اصلی
      </a>
      <div className="container-page flex h-16 items-center gap-4">
        <Logo />
        {/* NavLinks renders the <nav> landmark itself (Radix NavigationMenu root). */}
        <div className="ms-6 hidden md:block">
          <Suspense fallback={<NavLinksFallback />}>
            <NavLinks />
          </Suspense>
        </div>
        <div className="ms-auto flex items-center gap-1">
          <Suspense fallback={null}>
            <CommandSearch />
          </Suspense>
          <ThemeToggle />
          <Suspense fallback={<MobileNavFallback />}>
            <MobileNav />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
