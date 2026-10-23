"use client";

import { CloudOff, RotateCw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ApiErrorCode } from "@/types/book";

export const ERROR_MESSAGES: Record<ApiErrorCode, { title: string; description: string }> = {
  network: {
    title: "ارتباط برقرار نشد",
    description: "به نظر می‌رسد اتصال اینترنت قطع است یا سرور Open Library در دسترس نیست. اتصال را بررسی و دوباره تلاش کنید.",
  },
  timeout: {
    title: "پاسخ دیر رسید",
    description: "Open Library در زمان مناسب پاسخ نداد. این سرویس عمومی گاهی شلوغ است؛ چند لحظه بعد دوباره تلاش کنید.",
  },
  rate_limited: {
    title: "درخواست‌ها بیش از حد مجاز شد",
    description: "Open Library تعداد درخواست‌ها را محدود کرده است. کمی صبر کنید و دوباره تلاش کنید.",
  },
  upstream: {
    title: "خطا در سرویس Open Library",
    description: "سرویس منبع با خطا پاسخ داد. معمولاً این مشکل موقتی است.",
  },
  not_found: {
    title: "چیزی پیدا نشد",
    description: "منبع درخواستی در Open Library وجود ندارد.",
  },
  invalid: {
    title: "درخواست نامعتبر",
    description: "پارامترهای جستجو معتبر نبودند. فیلترها را بازنشانی کنید.",
  },
};

type ErrorStateProps = {
  error: ApiErrorCode;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({ error, onRetry, className }: ErrorStateProps) {
  const message = ERROR_MESSAGES[error];
  return (
    <Alert
      variant="destructive"
      className={cn("animate-fade-up border-destructive/25 bg-destructive/[0.04] px-5 py-5 dark:bg-destructive/[0.07]", className)}
    >
      <CloudOff />
      <AlertTitle className="text-base font-bold">{message.title}</AlertTitle>
      <AlertDescription className="leading-7 text-foreground/80!">
        <p>{message.description}</p>
      </AlertDescription>
      {onRetry ? (
        <div className="col-start-2 mt-3">
          <Button variant="outline" onClick={onRetry} className="bg-card text-foreground">
            <RotateCw data-icon="inline-start" />
            تلاش دوباره
          </Button>
        </div>
      ) : null}
    </Alert>
  );
}
