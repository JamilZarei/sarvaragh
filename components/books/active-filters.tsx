"use client";

import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLanguageLabel, getSubject, POPULARITY_LEVELS } from "@/lib/constants";
import { formatYear } from "@/lib/format";
import type { DiscoverQuery } from "@/lib/search-params";

type ActiveFiltersProps = {
  query: DiscoverQuery;
  onChange: (patch: Partial<DiscoverQuery>) => void;
  onClearAll: () => void;
};

type Chip = { key: string; label: string; remove: () => void };

export function ActiveFilters({ query, onChange, onClearAll }: ActiveFiltersProps) {
  const chips: Chip[] = [
    ...query.subjects.map((s) => ({
      key: `s-${s}`,
      label: getSubject(s)?.label ?? s,
      remove: () => onChange({ subjects: query.subjects.filter((x) => x !== s) }),
    })),
    ...query.languages.map((l) => ({
      key: `l-${l}`,
      label: `زبان: ${getLanguageLabel(l)}`,
      remove: () => onChange({ languages: query.languages.filter((x) => x !== l) }),
    })),
  ];

  if (query.popularity > 0) {
    const level = POPULARITY_LEVELS.find((l) => l.value === query.popularity);
    chips.unshift({
      key: "pop",
      label: `${level?.label ?? "محبوب"} (${level?.hint ?? ""})`,
      remove: () => onChange({ popularity: 0 }),
    });
  }

  if (query.yearFrom !== null || query.yearTo !== null) {
    const label =
      query.yearFrom !== null && query.yearTo !== null
        ? `${formatYear(query.yearFrom)} تا ${formatYear(query.yearTo)}`
        : query.yearFrom !== null
          ? `از ${formatYear(query.yearFrom)}`
          : `تا ${formatYear(query.yearTo as number)}`;
    chips.push({ key: "year", label: `سال: ${label}`, remove: () => onChange({ yearFrom: null, yearTo: null }) });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="فیلترهای فعال">
      {chips.map((chip) => (
        <Badge
          key={chip.key}
          variant="secondary"
          className="h-8 animate-fade-in gap-1 rounded-full border-border bg-card ps-3 pe-1 text-[0.8rem] font-normal shadow-xs"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.remove}
            aria-label={`حذف فیلتر ${chip.label}`}
            className="grid size-6 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <X className="size-3.5" />
          </button>
        </Badge>
      ))}
      <Button variant="link" size="sm" onClick={onClearAll} className="h-8 px-2 text-muted-foreground hover:text-foreground">
        پاک کردن همه
      </Button>
    </div>
  );
}
