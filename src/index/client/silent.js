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
        primary_color: "#3FE0C8",
        accent_color: "#288DD1",
        palette: {
          primary: "#3FE0C8",
          primary_text: "#FFFFFF",
          accent: "#288DD1",
          accent_text: "#FFFFFF",
          page_bg: "#F9FAFB",
          surface_alt: "#F3F4F6",
          card_bg: "#FFFFFF",
          heading: "#111827",
          text: "#6B7280",
          muted: "#6B7280",
          border: "rgba(63, 224, 200, 0.2)",
          badge_success_bg: "rgba(40, 141, 209, 0.2)",
          badge_success_text: "#288DD1",
          badge_pending_bg: "#FEF3C7",
          badge_pending_text: "#92400E",
          badge_failed_bg: "#FEE2E2",
          badge_failed_text: "#B91C1C",
          tag_bg: "rgba(40, 141, 209, 0.16)",
          tag_text: "#288DD1",
        },
      },
      company: {
        name: "UniCloud Africa",
        logo: "https://unicloudafrica.africa/logo.png",
      },
    },
  },
});
