import { useEffect } from "react";
import useShellPreferencesStore, {
  reapplyTenantPalette,
} from "@/stores/shellPreferencesStore";

/**
 * Re-asserts the active tenant palette whenever something else rewrites
 * `<html>` inline styles.
 *
 * **Why this exists:** `useApplyBrandingTheme` writes brand colors as
 * inline styles on `<html>`. When the user picks "Verdant Cloud" in the
 * tenant switcher we also write inline styles, but the branding hook can
 * fire afterwards (e.g. on auth refresh) and clobber them — leaving the
 * UI stuck in the original blue while `data-tenant="emerald"` is set.
 *
 * Solution: a `MutationObserver` watches the root style attribute. Any
 * external mutation while a tenant override is active triggers a single
 * re-apply on the next microtask. The observer pauses during our own
 * writes to avoid an infinite loop.
 *
 * Mount this hook ONCE near the top of the app (we mount it from the
 * shared `DashboardHeadbar`, which is on every authenticated page).
 */

let suppressObserver = false;

export const useTenantThemeEnforcer = (): void => {
  const tenant = useShellPreferencesStore((state) => state.tenant);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    // Always re-apply on tenant change (covers initial mount after
    // rehydration, where the branding hook may have just finished).
    suppressObserver = true;
    reapplyTenantPalette();
    queueMicrotask(() => {
      suppressObserver = false;
    });

    if (tenant === "default") return undefined;

    const root = document.documentElement;
    let scheduled = false;

    const observer = new MutationObserver(() => {
      if (suppressObserver || scheduled) return;
      scheduled = true;
      queueMicrotask(() => {
        suppressObserver = true;
        reapplyTenantPalette();
        queueMicrotask(() => {
          suppressObserver = false;
          scheduled = false;
        });
      });
    });

    observer.observe(root, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, [tenant]);
};

export default useTenantThemeEnforcer;
