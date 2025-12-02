import config from "../../config";
import useClientAuthStore from "../../stores/clientAuthStore";
import { createApiClient } from "../../utils/createApiClient";

export default createApiClient({
  baseURL: config.baseURL,
  authStore: useClientAuthStore,
  showToasts: false,
  redirectPath: "/sign-in",
  useSafeJsonParsing: false,
  mockData: {
    branding: {
      brand: {
        primary_color: "#14547F",
        accent_color: "#1C1C1C",
        palette: {
          primary: "#14547F",
          primary_text: "#FFFFFF",
          accent: "#1C1C1C",
          accent_text: "#FFFFFF",
          page_bg: "#F9FAFB",
          surface_alt: "#F3F4F6",
          card_bg: "#FFFFFF",
          heading: "#111827",
          text: "#1F2937",
          muted: "#6B7280",
          border: "#E5E7EB",
          badge_success_bg: "rgba(28, 28, 28, 0.1)",
          badge_success_text: "#1C1C1C",
          badge_pending_bg: "#FEF3C7",
          badge_pending_text: "#92400E",
          badge_failed_bg: "#FEE2E2",
          badge_failed_text: "#B91C1C",
          tag_bg: "rgba(28, 28, 28, 0.1)",
          tag_text: "#1C1C1C",
        },
      },
      company: {
        name: "UniCloud Africa",
        logo: "https://unicloudafrica.africa/logo.png",
      },
    },
  },
});
