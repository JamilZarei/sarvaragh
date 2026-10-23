"use client";

import { useEffect, useRef, useState } from "react";

import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Animates a number from its previous value to the new one (≈700ms, ease-out).
 * Respects prefers-reduced-motion and announces only the final value.
 */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(0);

  useEffect(() => {
    const start = from.current;
    from.current = value;
    if (start === value || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = requestAnimationFrame(() => setShown(value));
      return () => cancelAnimationFrame(id);
    }
    const duration = 700;
    const t0 = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(start + (value - start) * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  // The invisible final value reserves the width, so the animation never shifts the layout.
  return (
    <span className={cn("relative inline-block", className)}>
      <span aria-hidden="true" className="invisible">
        {formatNumber(value)}
      </span>
      <span aria-hidden="true" className="absolute inset-y-0 start-0">
        {formatNumber(shown)}
      </span>
      <span className="sr-only">{formatNumber(value)}</span>
    </span>
  );
}
