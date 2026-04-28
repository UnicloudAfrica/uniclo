import React, { useEffect } from "react";
import type { Preview, Decorator } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Import the production CSS so design tokens, fonts, and brand utility
// classes resolve in stories the same way they do in the app.
import "../src/index.css";

// Bootstrap i18next so primitives that read via useUiMessages() resolve
// translations in stories the same way they do in the app.
import i18n from "../src/i18n";

/**
 * Set body data-theme + dir based on toolbar globals so the design
 * system's whitelabel + dark mode + RTL all work in stories.
 */
const ThemeAndDirDecorator: Decorator = (Story, context) => {
  const theme = (context.globals.theme as string) || "light";
  const direction = (context.globals.direction as string) || "ltr";
  const tenant = (context.globals.tenant as string) || "default";

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
    root.setAttribute("dir", direction);
    if (tenant === "default") root.removeAttribute("data-tenant");
    else root.setAttribute("data-tenant", tenant);
  }, [theme, direction, tenant]);

  const locale = (context.globals.locale as string) || "en";
  useEffect(() => {
    void i18n.changeLanguage(locale);
  }, [locale]);

  return (
    <div
      className="font-outfit"
      style={{ background: "var(--surface-page)", padding: 24, minHeight: "100vh" }}
    >
      <Story />
    </div>
  );
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

const QueryDecorator: Decorator = (Story) => (
  <QueryClientProvider client={queryClient}>
    <Story />
  </QueryClientProvider>
);

const RouterDecorator: Decorator = (Story) => (
  <MemoryRouter initialEntries={["/"]}>
    <Story />
  </MemoryRouter>
);

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' = show in panel; 'error' = fail story tests on violations
      test: "todo",
    },
    layout: "padded",
    backgrounds: { disable: true },
  },
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Light or dark surface",
      defaultValue: "light",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
    direction: {
      name: "Direction",
      description: "LTR / RTL",
      defaultValue: "ltr",
      toolbar: {
        icon: "transfer",
        items: [
          { value: "ltr", title: "LTR" },
          { value: "rtl", title: "RTL" },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      name: "Language",
      description: "i18n locale",
      defaultValue: "en",
      toolbar: {
        icon: "globe",
        items: [
          { value: "en", title: "English" },
          { value: "fr", title: "Français" },
        ],
        dynamicTitle: true,
      },
    },
    tenant: {
      name: "Tenant theme",
      description: "Whitelabel preview",
      defaultValue: "default",
      toolbar: {
        icon: "paintbrush",
        items: [
          { value: "default", title: "UniCloud (default)" },
          { value: "emerald", title: "Emerald" },
          { value: "indigo", title: "Indigo" },
          { value: "sunset", title: "Sunset" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [ThemeAndDirDecorator, QueryDecorator, RouterDecorator],
};

export default preview;
