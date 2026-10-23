"use client";

import { useEffect } from "react";

const TARGET = "[data-touch-hover-target]";

/**
 * Touch screens have no hover, so cards would never show their hover animation
 * (lift, cover zoom, light sweep, fanned covers). Here a card gets
 * `data-touch-hover` while it crosses the middle band of the screen, which the
 * `hover` variant in globals.css treats like a mouse hover. Renders nothing;
 * does nothing with a mouse or under prefers-reduced-motion.
 */
export function TouchHover() {
  useEffect(() => {
    if (!window.matchMedia("(hover: none)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) entry.target.toggleAttribute("data-touch-hover", entry.isIntersecting);
      },
      // The middle quarter of the screen, roughly where a reader's eye rests while scrolling.
      { rootMargin: "-38% 0px -38% 0px" },
    );

    const observed = new WeakSet<Element>();
    const scan = () => {
      for (const element of document.querySelectorAll(TARGET)) {
        if (observed.has(element)) continue;
        observed.add(element);
        observer.observe(element);
      }
    };
    scan();

    // Lists stream in and change with filters: pick up new cards once per frame at most.
    let frame = 0;
    const mutations = new MutationObserver(() => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        scan();
      });
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    // iOS Safari only applies :active (the press state) when a touch listener exists.
    const noop = () => {};
    document.addEventListener("touchstart", noop, { passive: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
      cancelAnimationFrame(frame);
      document.removeEventListener("touchstart", noop);
    };
  }, []);

  return null;
}
