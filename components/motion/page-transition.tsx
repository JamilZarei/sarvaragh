import { ViewTransition, type ReactNode } from "react";

/**
 * Cross-fades a page in and out on route changes (View Transitions API).
 * `default="none"` keeps same-route updates (filters, pagination) still.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page" exit="page" default="none">
      {children}
    </ViewTransition>
  );
}
