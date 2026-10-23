"use client";

import { useState, type KeyboardEvent } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  LANGUAGES,
  MAX_YEAR,
  MIN_YEAR,
  POPULARITY_LEVELS,
  SUBJECTS,
  type PopularityLevel,
  type SubjectKey,
} from "@/lib/constants";
import { formatYear } from "@/lib/format";
import { toLatinDigits, type DiscoverQuery } from "@/lib/search-params";
import { cn } from "@/lib/utils";

type FilterPatch = Partial<Pick<DiscoverQuery, "subjects" | "languages" | "yearFrom" | "yearTo" | "popularity" | "coversOnly">>;

type BookFiltersProps = {
  query: DiscoverQuery;
  onChange: (patch: FilterPatch) => void;
  /** Prefix keeps ids unique when the panel is rendered twice (sidebar + sheet). */
  idPrefix: string;
  className?: string;
};

function toggle<T>(list: readonly T[], item: T, checked: boolean): T[] {
  return checked ? (list.includes(item) ? [...list] : [...list, item]) : list.filter((x) => x !== item);
}

function FilterGroup({ title, children, hint }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-3 text-sm font-bold">{title}</legend>
      {hint ? <p className="-mt-1 text-xs leading-6 text-muted-foreground">{hint}</p> : null}
      {children}
    </fieldset>
  );
}

function CheckboxRow({ id, label, checked, onCheckedChange }: { id: string; label: string; checked: boolean; onCheckedChange: (c: boolean) => void }) {
  return (
    <div className="flex items-center gap-3">
      <Checkbox id={id} checked={checked} onCheckedChange={(c) => onCheckedChange(c === true)} className="size-[1.05rem]" />
      <Label htmlFor={id} className="flex-1 cursor-pointer py-1 text-sm font-normal">
        {label}
      </Label>
    </div>
  );
}

export function BookFilters({ query, onChange, idPrefix, className }: BookFiltersProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <CheckboxRow
        id={`${idPrefix}-covers-only`}
        label="فقط کتاب‌های دارای جلد"
        checked={query.coversOnly}
        onCheckedChange={(coversOnly) => onChange({ coversOnly })}
      />

      <Separator />

      <FilterGroup title="محبوبیت" hint="بر اساس تعداد خوانندگان کتاب در Open Library.">
        <ToggleGroup
          type="single"
          value={String(query.popularity)}
          onValueChange={(v) => v && onChange({ popularity: Number(v) as PopularityLevel })}
          aria-label="فیلتر محبوبیت"
          className="grid w-full grid-cols-3 gap-1.5"
          spacing={0}
        >
          {POPULARITY_LEVELS.map((level) => (
            <ToggleGroupItem
              key={level.value}
              value={String(level.value)}
              className="h-auto min-w-0 flex-col gap-0.5 rounded-lg border bg-card px-1 py-2 text-[0.82rem] leading-tight whitespace-normal data-[state=on]:border-primary data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
            >
              <span className="font-bold">{level.label}</span>
              <span className="text-[0.68rem] text-muted-foreground">{level.hint}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </FilterGroup>

      <Separator />

      <FilterGroup title="موضوع">
        <div className="grid gap-1">
          {SUBJECTS.map((s) => (
            <CheckboxRow
              key={s.key}
              id={`${idPrefix}-subject-${s.key}`}
              label={s.label}
              checked={query.subjects.includes(s.key)}
              onCheckedChange={(checked) => onChange({ subjects: toggle<SubjectKey>(query.subjects, s.key, checked) })}
            />
          ))}
        </div>
      </FilterGroup>

      <Separator />

      <FilterGroup title="زبان" hint="کتاب‌هایی که دست‌کم یک ویرایش به این زبان دارند.">
        <div className="grid grid-cols-2 gap-1 lg:grid-cols-1">
          {LANGUAGES.map((l) => (
            <CheckboxRow
              key={l.code}
              id={`${idPrefix}-lang-${l.code}`}
              label={l.label}
              checked={query.languages.includes(l.code)}
              onCheckedChange={(checked) => onChange({ languages: toggle(query.languages, l.code, checked) })}
            />
          ))}
        </div>
      </FilterGroup>

      <Separator />

      <YearRangeFilter
        // Remount when the URL changes so drafts always start from the applied values.
        key={`${query.yearFrom ?? ""}-${query.yearTo ?? ""}`}
        idPrefix={idPrefix}
        yearFrom={query.yearFrom}
        yearTo={query.yearTo}
        onApply={(yearFrom, yearTo) => onChange({ yearFrom, yearTo })}
      />
    </div>
  );
}

type YearRangeFilterProps = {
  idPrefix: string;
  yearFrom: number | null;
  yearTo: number | null;
  onApply: (from: number | null, to: number | null) => void;
};

function parseDraft(raw: string): number | null | "invalid" {
  const value = toLatinDigits(raw.trim());
  if (value === "") return null;
  if (!/^\d{1,4}$/.test(value)) return "invalid";
  const year = Number(value);
  return year < MIN_YEAR || year > MAX_YEAR ? "invalid" : year;
}

function YearRangeFilter({ idPrefix, yearFrom, yearTo, onApply }: YearRangeFilterProps) {
  const [fromText, setFromText] = useState(yearFrom?.toString() ?? "");
  const [toText, setToText] = useState(yearTo?.toString() ?? "");
  const [range, setRange] = useState<[number, number]>([yearFrom ?? MIN_YEAR, yearTo ?? MAX_YEAR]);

  const from = parseDraft(fromText);
  const to = parseDraft(toText);
  let error: string | null = null;
  if (from === "invalid" || to === "invalid") error = `سال باید عددی بین ${formatYear(MIN_YEAR)} و ${formatYear(MAX_YEAR)} باشد.`;
  else if (from !== null && to !== null && from > to) error = "سال شروع نباید از سال پایان بزرگ‌تر باشد.";

  function commitInputs() {
    if (error || from === "invalid" || to === "invalid") return;
    if (from === yearFrom && to === yearTo) return;
    onApply(from, to);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitInputs();
    }
  }

  function commitSlider([a, b]: number[]) {
    const nextFrom = a <= MIN_YEAR ? null : a;
    const nextTo = b >= MAX_YEAR ? null : b;
    if (nextFrom === yearFrom && nextTo === yearTo) return;
    onApply(nextFrom, nextTo);
  }

  const errorId = `${idPrefix}-year-error`;

  return (
    <FilterGroup title="سال نخستین انتشار">
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor={`${idPrefix}-year-from`} className="text-xs text-muted-foreground">
            از
          </Label>
          <Input
            id={`${idPrefix}-year-from`}
            inputMode="numeric"
            dir="ltr"
            placeholder={String(MIN_YEAR)}
            value={fromText}
            onChange={(e) => setFromText(e.target.value)}
            onBlur={commitInputs}
            onKeyDown={onKeyDown}
            aria-invalid={from === "invalid" || Boolean(error && from !== null)}
            aria-describedby={error ? errorId : undefined}
            className="h-9 bg-card text-center tabular-nums"
          />
        </div>
        <span className="pb-2 text-muted-foreground" aria-hidden="true">
          –
        </span>
        <div className="flex-1 space-y-1.5">
          <Label htmlFor={`${idPrefix}-year-to`} className="text-xs text-muted-foreground">
            تا
          </Label>
          <Input
            id={`${idPrefix}-year-to`}
            inputMode="numeric"
            dir="ltr"
            placeholder={String(MAX_YEAR)}
            value={toText}
            onChange={(e) => setToText(e.target.value)}
            onBlur={commitInputs}
            onKeyDown={onKeyDown}
            aria-invalid={to === "invalid" || Boolean(error && to !== null)}
            aria-describedby={error ? errorId : undefined}
            className="h-9 bg-card text-center tabular-nums"
          />
        </div>
      </div>

      {error ? (
        <p id={errorId} role="alert" className="text-xs leading-6 text-destructive">
          {error}
        </p>
      ) : null}

      <Slider
        min={MIN_YEAR}
        max={MAX_YEAR}
        step={1}
        minStepsBetweenThumbs={0}
        value={range}
        onValueChange={(v) => {
          setRange([v[0], v[1]]);
          setFromText(v[0] <= MIN_YEAR ? "" : String(v[0]));
          setToText(v[1] >= MAX_YEAR ? "" : String(v[1]));
        }}
        onValueCommit={commitSlider}
        thumbLabels={["سال شروع", "سال پایان"]}
        className="py-3"
      />
      <div className="flex justify-between text-[0.7rem] text-muted-foreground tabular-nums">
        <span>{formatYear(MIN_YEAR)}</span>
        <span>{formatYear(MAX_YEAR)}</span>
      </div>
    </FilterGroup>
  );
}
