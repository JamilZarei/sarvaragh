"use client";

import { RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";

/** Re-requests the current route's server components without a full reload. */
export function RetryButton({ label = "تلاش دوباره" }: { label?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button variant="outline" disabled={pending} onClick={() => startTransition(() => router.refresh())}>
      <RotateCw data-icon="inline-start" className={pending ? "animate-spin" : undefined} />
      {label}
    </Button>
  );
}
