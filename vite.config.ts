import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@/features": path.resolve(__dirname, "./src/features"),
      "@/shared": path.resolve(__dirname, "./src/shared"),
      "@/stores": path.resolve(__dirname, "./src/stores"),
      "@/hooks": path.resolve(__dirname, "./src/hooks"),
      "@/utils": path.resolve(__dirname, "./src/utils"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/styles": path.resolve(__dirname, "./src/styles"),
      "@/types": path.resolve(__dirname, "./src/types"),
      "@/services": path.resolve(__dirname, "./src/services"),
      "@/config": path.resolve(__dirname, "./src/config"),
      "@/docs": path.resolve(__dirname, "./src/docs"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
    },
  },
  server: {
    port: 3000,
    open: true,
    // Proxy all backend paths through Vite so the browser sees everything
    // as same-origin (localhost:3000). This eliminates the cross-port
    // Sanctum/CSRF mess we hit with VITE_API_USER_BASE_URL=http://localhost:8000.
    //
    // CRITICAL: `changeOrigin: true` only rewrites the HTTP `Host` header,
    // NOT the browser's `Origin` header. To prevent Laravel Sanctum's
    // `EnsureFrontendRequestsAreStateful` from gating the request on CSRF
    // (which fails for cross-port localhost), we explicitly REWRITE the
    // `Origin` header to match the proxy target. The backend then sees
    // the request as same-origin and falls back to Bearer-token auth.
    //
    // Companion change: set VITE_API_USER_BASE_URL='' in .env so the SPA
    // builds relative URLs like /admin/v1/... that hit Vite first and get
    // proxied to port 8000.
    // Patterns are matched with `path.startsWith()` semantics, so
    // they MUST be specific enough to not collide with SPA routes —
    // e.g. `/admin` would catch the SPA's `/admin-dashboard/*` and
    // wreck navigation. We pin to the actual API prefixes (which
    // include the version segment) to avoid that whole class of bug.
    proxy: (() => {
      const rewriteOrigin = {
        target: "http://localhost:8000",
        changeOrigin: true,
        configure: (proxy: any) => {
          proxy.on("proxyReq", (proxyReq: any) => {
            proxyReq.setHeader("Origin", "http://localhost:8000");
          });
        },
      };
      return {
        "/api/v1": rewriteOrigin,
        "/admin/v1": rewriteOrigin,
        "/tenant/v1": rewriteOrigin,
        "/sanctum": rewriteOrigin,
        "/broadcasting": rewriteOrigin,
        // Static file URLs — no Origin rewrite needed (they're not auth-gated).
        "/storage": { target: "http://localhost:8000", changeOrigin: true },
      };
    })(),
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
    },
  },
});
