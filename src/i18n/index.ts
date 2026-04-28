/**
 * i18n bootstrap.
 *
 * Initializes i18next with browser language detection and JSON resource
 * bundles. The `ui` namespace is consumed by `useUiMessages()` from the
 * primitive library.
 *
 * To add a language:
 *   1. Drop a JSON file under `src/i18n/locales/{lang}/ui.json`
 *   2. Import + register in the `resources` block below
 *   3. Add the locale to `supportedLngs`
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enUi from "./locales/en/ui.json";
import enFlow from "./locales/en/flow.json";
import frUi from "./locales/fr/ui.json";
import frFlow from "./locales/fr/flow.json";

export const SUPPORTED_LANGUAGES = ["en", "fr"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES,
    ns: ["ui", "flow"],
    defaultNS: "ui",
    resources: {
      en: { ui: enUi, flow: enFlow },
      fr: { ui: frUi, flow: frFlow },
    },
    interpolation: {
      escapeValue: false, // React handles XSS escaping
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "uca-language",
      caches: ["localStorage"],
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
