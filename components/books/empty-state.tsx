import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, children, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex animate-fade-up flex-col items-center rounded-2xl border border-dashed bg-card/50 px-6 py-14 text-center sm:py-20",
        className,
      )}
    >
      <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-bold text-balance">{title}</h2>
      {description ? (
        <div className="mt-2 max-w-md text-sm leading-7 text-pretty text-muted-foreground">{description}</div>
      ) : null}
      {children ? <div className="mt-6 flex flex-wrap items-center justify-center gap-2">{children}</div> : null}
    </div>
  );
}
