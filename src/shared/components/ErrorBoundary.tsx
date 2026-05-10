import { Component, type ErrorInfo, type ReactNode } from "react";
import PageErrorFallback from "./PageErrorFallback";
import { captureException } from "@/utils/sentry";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Detects "stale chunk" errors thrown by Vite (or webpack) when the
 * dev server restarts and generates new hashed chunk URLs while the
 * browser still references the old ones. The user sees a useless
 * "Failed to fetch dynamically imported module" panel and has to
 * hard-reload manually.
 *
 * The fix: auto-reload ONCE per cooldown window. The fresh page load
 * fetches the new index.html which references the current chunk URLs,
 * and the user is back to where they were. If the reload itself
 * triggers the same error (genuinely broken build, not a stale chunk),
 * the cooldown gate prevents an infinite loop and we fall through to
 * the normal error UI.
 */
const CHUNK_RELOAD_FLAG = "__chunk_reload_attempted_at__";
const CHUNK_RELOAD_COOLDOWN_MS = 10_000;

function isChunkLoadError(error: Error | null | undefined): boolean {
  if (!error) {
    return false;
  }

  const msg = String(error.message ?? "");
  const name = String(error.name ?? "");

  return (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("error loading dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("Loading chunk") ||
    /ChunkLoadError/i.test(name)
  );
}

function canAttemptChunkReload(): boolean {
  try {
    const last = Number(globalThis.sessionStorage?.getItem(CHUNK_RELOAD_FLAG) ?? 0);
    return !last || Date.now() - last > CHUNK_RELOAD_COOLDOWN_MS;
  } catch {
    return true;
  }
}

function markChunkReloadAttempt(): void {
  try {
    globalThis.sessionStorage?.setItem(CHUNK_RELOAD_FLAG, String(Date.now()));
  } catch {
    /* sessionStorage unavailable / quota exceeded — not fatal */
  }
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Stale-chunk auto-recovery — bypass Sentry noise + the error UI
    // and just hard-reload, which is what the user was about to do
    // manually anyway.
    if (isChunkLoadError(error) && canAttemptChunkReload()) {
      markChunkReloadAttempt();
      try {
        globalThis.location?.reload();
      } catch {
        /* fall through to normal error UI if reload itself fails */
      }
      return;
    }

    captureException(error, { componentStack: errorInfo.componentStack });

    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary] Uncaught error:", error);
      console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <PageErrorFallback
          error={this.state.error ?? undefined}
          resetError={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
