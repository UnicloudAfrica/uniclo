import "@testing-library/jest-dom/vitest";

// jsdom doesn't ship matchMedia, but orbit's `usePrefersReducedMotion` hook
// (src/shared/components/orbit/motion.ts) reaches for it. A no-op stub keeps
// component mounts from crashing.
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}
