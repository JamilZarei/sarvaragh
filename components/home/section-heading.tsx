import type { ReactNode } from "react";

type SectionHeadingProps = {
  id: string;
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
};

export function SectionHeading({ id, eyebrow, title, description, action }: SectionHeadingProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-primary">
            <span className="h-px w-6 bg-gold" aria-hidden="true" />
            {eyebrow}
          </p>
        ) : null}
        <h2 id={id} className="text-[1.9rem] leading-tight font-bold tracking-tight text-balance sm:text-[2.4rem]">
          {title}
        </h2>
        {description ? <div className="mt-2 text-base leading-8 text-pretty text-muted-foreground">{description}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
