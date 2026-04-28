import type { StorybookConfig } from "@storybook/react-vite";
import path from "path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Storybook config — picks up the project's Vite aliases so stories can
 * import primitives via `@/shared/components/ui` exactly like the app does.
 */
const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding",
  ],
  framework: "@storybook/react-vite",
  viteFinal: async (viteConfig) => {
    viteConfig.resolve = viteConfig.resolve ?? {};
    viteConfig.resolve.alias = {
      ...(viteConfig.resolve.alias ?? {}),
      "@/features": path.resolve(dirname, "../src/features"),
      "@/shared": path.resolve(dirname, "../src/shared"),
      "@/stores": path.resolve(dirname, "../src/stores"),
      "@/hooks": path.resolve(dirname, "../src/hooks"),
      "@/utils": path.resolve(dirname, "../src/utils"),
      "@/components": path.resolve(dirname, "../src/components"),
      "@/styles": path.resolve(dirname, "../src/styles"),
      "@/types": path.resolve(dirname, "../src/types"),
      "@/services": path.resolve(dirname, "../src/services"),
      "@/config": path.resolve(dirname, "../src/config"),
      "@/docs": path.resolve(dirname, "../src/docs"),
      "@/lib": path.resolve(dirname, "../src/lib"),
    };
    return viteConfig;
  },
};

export default config;
