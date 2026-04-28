import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "node:url";

// Always derive from import.meta.url — typeof __dirname can throw under
// strict ESM loaders even though it normally returns "undefined".
const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  // Keep this alias block in lockstep with vite.config.ts — vitest
  // runs its own module resolver and silently fails imports for
  // aliases we forget to mirror here.
  resolve: {
    alias: {
      "@/features": path.resolve(dirname, "./src/features"),
      "@/shared": path.resolve(dirname, "./src/shared"),
      "@/stores": path.resolve(dirname, "./src/stores"),
      "@/hooks": path.resolve(dirname, "./src/hooks"),
      "@/utils": path.resolve(dirname, "./src/utils"),
      "@/components": path.resolve(dirname, "./src/components"),
      "@/styles": path.resolve(dirname, "./src/styles"),
      "@/types": path.resolve(dirname, "./src/types"),
      "@/services": path.resolve(dirname, "./src/services"),
      "@/config": path.resolve(dirname, "./src/config"),
      "@/docs": path.resolve(dirname, "./src/docs"),
      "@/lib": path.resolve(dirname, "./src/lib"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/test/**", "src/**/*.d.ts"],
    },
  },
});
