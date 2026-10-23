import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md bg-muted after:absolute after:inset-0 after:animate-shimmer after:bg-gradient-to-l after:from-transparent after:via-foreground/[0.07] after:to-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
