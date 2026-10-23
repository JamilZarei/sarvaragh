"use client";

import { Link2, Share2 } from "lucide-react";
import { useSyncExternalStore } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const subscribeNoop = () => () => {};

function useCanNativeShare() {
  return useSyncExternalStore(
    subscribeNoop,
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
    () => false,
  );
}

async function copyCurrentUrl() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("پیوند کپی شد", { description: "با این پیوند، همین جستجو و فیلترها دوباره باز می‌شوند." });
  } catch {
    toast.error("کپی پیوند ممکن نشد", { description: "پیوند را از نوار آدرس مرورگر کپی کنید." });
  }
}

type ShareMenuProps = {
  title: string;
  label?: string;
  hideLabelOnMobile?: boolean;
};

export function ShareMenu({ title, label = "اشتراک‌گذاری", hideLabelOnMobile = true }: ShareMenuProps) {
  const canShare = useCanNativeShare();

  async function nativeShare() {
    try {
      await navigator.share({ title, url: window.location.href });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      await copyCurrentUrl();
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="bg-card" aria-label={label}>
          <Share2 data-icon="inline-start" />
          <span className={hideLabelOnMobile ? "hidden sm:inline" : undefined}>{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">اشتراک همین صفحه</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={copyCurrentUrl}>
          <Link2 />
          کپی پیوند
        </DropdownMenuItem>
        {canShare ? (
          <DropdownMenuItem onSelect={nativeShare}>
            <Share2 />
            ارسال با برنامه‌های دیگر…
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
