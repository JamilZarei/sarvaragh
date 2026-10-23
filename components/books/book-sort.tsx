"use client";

import { ArrowDownUp } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SORT_OPTIONS, type SortKey } from "@/lib/constants";
import { cn } from "@/lib/utils";

type BookSortProps<T extends string = SortKey> = {
  value: T;
  onValueChange: (value: T) => void;
  options?: readonly { key: T; label: string }[];
  id?: string;
  className?: string;
};

export function BookSort<T extends string = SortKey>({
  value,
  onValueChange,
  options = SORT_OPTIONS as unknown as readonly { key: T; label: string }[],
  id = "book-sort",
  className,
}: BookSortProps<T>) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Label htmlFor={id} className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
        <ArrowDownUp className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">مرتب‌سازی:</span>
        <span className="sr-only sm:hidden">مرتب‌سازی</span>
      </Label>
      <Select value={value} onValueChange={(v) => onValueChange(v as T)}>
        <SelectTrigger id={id} className="min-w-40 bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="end">
          {options.map((option) => (
            <SelectItem key={option.key} value={option.key}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
