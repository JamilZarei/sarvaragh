"use client";

import { RotateCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { ERROR_MESSAGES } from "@/components/books/error-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ApiErrorCode } from "@/types/book";

export function BookError({ error }: { error: ApiErrorCode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const message = ERROR_MESSAGES[error];

  return (
    <Alert variant="destructive" className="mx-auto max-w-xl animate-fade-up border-destructive/25 bg-destructive/[0.04] px-5 py-5 dark:bg-destructive/[0.07]">
      <AlertTitle className="text-base font-bold">{message.title}</AlertTitle>
      <AlertDescription className="leading-7 text-foreground/80!">
        <p>اطلاعات این کتاب دریافت نشد. {message.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" className="text-foreground" disabled={pending} onClick={() => startTransition(() => router.refresh())}>
            <RotateCw data-icon="inline-start" className={pending ? "animate-spin" : undefined} />
            تلاش دوباره
          </Button>
          <Button asChild variant="ghost" className="text-foreground">
            <Link href="/discover">بازگشت به کشف کتاب‌ها</Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
