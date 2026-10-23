"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import { parseDiscoverQuery, serializeDiscoverQuery, type DiscoverQuery } from "@/lib/search-params";

type UpdateOptions = {
  /** Use history.replace (typing) instead of push (discrete choices). */
  replace?: boolean;
  /** Keep the current page; by default any change resets to page 1. */
  keepPage?: boolean;
};

/**
 * The URL is the single source of truth for the discover page. Each update
 * merges into the current query, so changing one filter never drops another.
 */
export function useDiscoverQuery() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const query = useMemo(() => parseDiscoverQuery(new URLSearchParams(searchParams.toString())), [searchParams]);

  const update = useCallback(
    (patch: Partial<DiscoverQuery>, options: UpdateOptions = {}) => {
      const next: DiscoverQuery = { ...query, ...patch };
      if (!options.keepPage && patch.page === undefined) next.page = 1;
      const qs = serializeDiscoverQuery(next).toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      if (options.replace) router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    },
    [query, pathname, router],
  );

  const hrefFor = useCallback(
    (patch: Partial<DiscoverQuery>) => {
      const qs = serializeDiscoverQuery({ ...query, ...patch }).toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [query, pathname],
  );

  return { query, update, hrefFor };
}
