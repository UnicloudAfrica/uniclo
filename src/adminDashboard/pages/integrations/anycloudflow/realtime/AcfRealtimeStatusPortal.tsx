/**
 * AcfRealtimeStatusPortal — floating mount of the AnyCloudFlow realtime
 * status pill that attaches itself to the topbar without requiring edits
 * to the shared DashboardHeadbar component.
 *
 * Strategy: on mount we scan for the fixed 74px-tall header element that
 * UniCloud's DashboardHeadbar renders (selector-matched so we don't
 * import from `shared/components`). If we find it, we append a portal
 * node into the right-side action cluster. Otherwise we gracefully fall
 * back to a fixed-position badge in the top-right corner.
 *
 * Import it ONCE at the admin shell's root (or the route layout) and it
 * will render itself as soon as the header is in the DOM. Safe to mount
 * multiple times — it dedupes by a data attribute on the target node.
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import AcfRealtimeStatus from "./AcfRealtimeStatus";

const MARKER_ATTR = "data-acf-realtime-status-mount";

/**
 * Best-effort header locator. DashboardHeadbar renders a `.fixed.top-0`
 * container with `h-[74px]` — we match on the combination so we don't
 * collide with sticky nav elements from other shells.
 */
function findHeaderActionsContainer(): HTMLElement | null {
  if (typeof document === "undefined") return null;

  // Preferred: the action cluster is the last top-level flex child inside
  // the desktop header. We walk the known selector and pick the last
  // `.flex.items-center` inside it.
  const desktopHeader = document.querySelector<HTMLElement>(
    "div.fixed.top-0.hidden.md\\:flex.h-\\[74px\\]"
  );
  if (desktopHeader) {
    const rightClusters = desktopHeader.querySelectorAll<HTMLElement>(
      "div.flex.items-center.gap-2"
    );
    if (rightClusters.length > 0) {
      return rightClusters[rightClusters.length - 1] ?? null;
    }
    return desktopHeader;
  }

  // Fallback for mobile layout or different shells: any fixed top bar.
  return document.querySelector<HTMLElement>("header[role='banner']") ?? null;
}

export function AcfRealtimeStatusPortal() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [mountNode] = useState<HTMLElement | null>(() => {
    if (typeof document === "undefined") return null;
    const el = document.createElement("div");
    el.setAttribute(MARKER_ATTR, "1");
    el.style.display = "inline-flex";
    el.style.alignItems = "center";
    return el;
  });
  const attachedRef = useRef(false);

  useEffect(() => {
    if (!mountNode) return;

    let cancelled = false;
    let observer: MutationObserver | null = null;

    const tryAttach = () => {
      if (cancelled || attachedRef.current) return;
      const container = findHeaderActionsContainer();
      if (!container) return;

      // Don't double-mount if another copy already attached.
      const existing = container.querySelector(`[${MARKER_ATTR}]`);
      if (existing && existing !== mountNode) {
        attachedRef.current = true;
        return;
      }

      // Insert before the last child (which is typically the profile
      // dropdown) so we sit next to the notifications bell.
      container.insertBefore(mountNode, container.lastElementChild);
      attachedRef.current = true;
      setTarget(mountNode);
    };

    tryAttach();

    if (!attachedRef.current) {
      observer = new MutationObserver(tryAttach);
      observer.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      if (mountNode.parentNode) {
        try {
          mountNode.parentNode.removeChild(mountNode);
        } catch {
          // ignore teardown races
        }
      }
    };
  }, [mountNode]);

  // Fallback floating pill if we never found the header. Kept dismissible
  // by the user so it doesn't obstruct the UI if they prefer not to see it.
  const [fallbackDismissed, setFallbackDismissed] = useState(false);
  const showFallback =
    !target && !attachedRef.current && mountNode !== null && !fallbackDismissed;

  if (target) {
    return createPortal(<AcfRealtimeStatus compact />, target);
  }

  if (showFallback) {
    return (
      <div className="fixed right-4 top-4 z-[1001] flex items-center gap-2 rounded-full border border-gray-200 bg-white/95 px-1 py-1 shadow-md backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">
        <AcfRealtimeStatus />
        <button
          type="button"
          onClick={() => setFallbackDismissed(true)}
          className="px-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Dismiss realtime status"
        >
          ×
        </button>
      </div>
    );
  }

  return null;
}

export default AcfRealtimeStatusPortal;
