/**
 * UI primitive message resolution.
 *
 * Routes through `react-i18next` (namespace: `ui`) by default. Callers can:
 *   - Override per-instance via component props (`retryLabel`, `dismissLabel`, …).
 *   - Override globally via `<UiMessagesProvider value={…}>` at any subtree.
 *     Provider values take precedence over the i18n bundle.
 *
 * The provider override is preserved primarily for tests, controlled
 * environments, and gradual migration — production code should add
 * translations to `src/i18n/locales/{lng}/ui.json` rather than wrapping
 * with a Provider.
 */

import { createContext, useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";

export interface UiMessages {
  loading: string;
  loadingDefault: string;
  errorTitle: string;
  errorMessage: string;
  retry: string;
  emptyTitle: string;
  dismiss: string;
  remove: string;
  close: string;
  itemsLabel: (count: number) => string;
  tooltipFallback: string;
  menuActions: string;
  breadcrumbLandmark: string;
}

export const DEFAULT_UI_MESSAGES: UiMessages = {
  loading: "Loading…",
  loadingDefault: "Loading…",
  errorTitle: "Something went wrong",
  errorMessage:
    "We couldn't complete that request. Please try again in a moment.",
  retry: "Try again",
  emptyTitle: "Nothing here yet",
  dismiss: "Dismiss",
  remove: "Remove",
  close: "Close",
  itemsLabel: (count: number) => `${count} item${count === 1 ? "" : "s"}`,
  tooltipFallback: "More info",
  menuActions: "Actions",
  breadcrumbLandmark: "Breadcrumb",
};

const UiMessagesContext = createContext<Partial<UiMessages> | null>(null);

export const UiMessagesProvider = UiMessagesContext.Provider;

/**
 * Read the active UI messages.
 *
 * Resolution order, per key:
 *   1. Override from `<UiMessagesProvider value={{key: ...}}>` if present
 *   2. i18next translation from the `ui` namespace
 *   3. Hardcoded English fallback in DEFAULT_UI_MESSAGES
 *
 * If i18next isn't initialised (e.g. early SSR boot, certain test contexts),
 * we fall through to the defaults silently — no runtime error.
 */
export const useUiMessages = (): UiMessages => {
  const override = useContext(UiMessagesContext);
  const { t, ready } = useTranslation("ui", { useSuspense: false });

  return useMemo<UiMessages>(() => {
    const tr = (key: keyof UiMessages, fallback: string): string =>
      ready ? (t(key, { defaultValue: fallback }) as string) : fallback;

    return {
      loading: override?.loading ?? tr("loading", DEFAULT_UI_MESSAGES.loading),
      loadingDefault:
        override?.loadingDefault ?? tr("loadingDefault", DEFAULT_UI_MESSAGES.loadingDefault),
      errorTitle: override?.errorTitle ?? tr("errorTitle", DEFAULT_UI_MESSAGES.errorTitle),
      errorMessage:
        override?.errorMessage ?? tr("errorMessage", DEFAULT_UI_MESSAGES.errorMessage),
      retry: override?.retry ?? tr("retry", DEFAULT_UI_MESSAGES.retry),
      emptyTitle: override?.emptyTitle ?? tr("emptyTitle", DEFAULT_UI_MESSAGES.emptyTitle),
      dismiss: override?.dismiss ?? tr("dismiss", DEFAULT_UI_MESSAGES.dismiss),
      remove: override?.remove ?? tr("remove", DEFAULT_UI_MESSAGES.remove),
      close: override?.close ?? tr("close", DEFAULT_UI_MESSAGES.close),
      tooltipFallback:
        override?.tooltipFallback ?? tr("tooltipFallback", DEFAULT_UI_MESSAGES.tooltipFallback),
      menuActions:
        override?.menuActions ?? tr("menuActions", DEFAULT_UI_MESSAGES.menuActions),
      breadcrumbLandmark:
        override?.breadcrumbLandmark ??
        tr("breadcrumbLandmark", DEFAULT_UI_MESSAGES.breadcrumbLandmark),
      itemsLabel:
        override?.itemsLabel ??
        ((count: number) =>
          ready
            ? (t("items", { count, defaultValue: DEFAULT_UI_MESSAGES.itemsLabel(count) }) as string)
            : DEFAULT_UI_MESSAGES.itemsLabel(count)),
    };
  }, [override, t, ready]);
};
