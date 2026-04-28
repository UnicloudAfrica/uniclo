/**
 * Typed wrapper around @sentry/react.
 *
 * Dynamically imported so that a missing / broken SDK doesn't crash
 * the app boot. All exports degrade gracefully to no-ops.
 *
 * L-01: Types come directly from @sentry/react via `import type`.
 * The empty `declare module "@sentry/react"` stub in modules.d.ts has
 * been removed, so these are the real SDK types.
 */
import type * as SentryType from "@sentry/react";

interface SentryUser {
  id: string | number;
  tenant_id?: string;
  account_domain_id?: string | number;
  role?: string;
}

interface SentryBreadcrumb {
  category: string;
  message: string;
  data?: Record<string, unknown>;
  level?: "debug" | "info" | "warning" | "error" | "fatal";
}

let SentryModule: typeof SentryType | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Field names whose values are replaced with "[Filtered]" before an
 * event is sent. Mirrors the backend's config/observability.php list.
 */
const REDACT_KEYS = new Set<string>([
  "password",
  "password_confirmation",
  "token",
  "access_token",
  "refresh_token",
  "authorization",
  "cookie",
  "ticket",
  "secret",
  "secret_key",
  "private_key",
  "ephemeral_private_key",
  "content",
  "secret_ciphertext",
  "encrypted_secret",
  "sec-websocket-protocol",
  "x-paystack-signature",
  "x-stripe-signature",
  "credit_card",
  "card_number",
  "cvv",
  "cvc",
]);

function scrub<T>(value: T, depth = 0): T {
  if (depth > 6 || value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map((v) => scrub(v, depth + 1)) as unknown as T;
  }

  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (REDACT_KEYS.has(k.toLowerCase())) {
        out[k] = "[Filtered]";
        continue;
      }
      if (typeof v === "string" && /^(Bearer|Basic)\s+\S+/i.test(v)) {
        out[k] = "[Filtered]";
        continue;
      }
      out[k] = scrub(v, depth + 1);
    }
    return out as unknown as T;
  }

  return value;
}

export async function initSentry(): Promise<void> {
  // Guard against double-init (main.tsx and HMR).
  if (initPromise) return initPromise;

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  initPromise = (async () => {
    try {
      SentryModule = await import("@sentry/react");

      type Integration = Parameters<typeof SentryType.init>[0] extends
        | undefined
        | { integrations?: infer I }
        ? I extends Array<infer E>
          ? E
          : never
        : never;

      const integrations: Integration[] = [];
      if (typeof SentryModule.browserTracingIntegration === "function") {
        integrations.push(
          SentryModule.browserTracingIntegration() as Integration
        );
      }
      if (typeof SentryModule.replayIntegration === "function") {
        integrations.push(
          SentryModule.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }) as Integration
        );
      }

      SentryModule.init({
        dsn,
        environment: import.meta.env.MODE,
        release: import.meta.env.VITE_SENTRY_RELEASE,
        tracesSampleRate: Number(
          import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0.1
        ),
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 1.0,
        sendDefaultPii: false,
        integrations,
        beforeSend: (event) => scrub(event),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Log to console only — we have no observability yet (ironic).
      console.warn(
        "[sentry] SDK init failed, continuing without error reporting:",
        msg
      );
    }
  })();

  return initPromise;
}

/**
 * Called from auth hooks after login / logout.
 */
export function setUser(user: SentryUser | null): void {
  SentryModule?.setUser(user);
}

/**
 * Report an error manually (e.g. from a React error boundary).
 */
export function captureException(
  error: unknown,
  context?: Record<string, unknown>
): void {
  if (!SentryModule?.captureException) return;
  SentryModule.captureException(error, {
    extra: context ? scrub(context) : undefined,
  });
}

/**
 * Add a breadcrumb — appears in the event timeline when a later
 * error is reported.
 */
export function addBreadcrumb(breadcrumb: SentryBreadcrumb): void {
  if (!SentryModule?.addBreadcrumb) return;
  SentryModule.addBreadcrumb({
    ...breadcrumb,
    data: breadcrumb.data ? scrub(breadcrumb.data) : undefined,
  });
}

/**
 * Public handle for tests + legacy callers that expect a `Sentry` object.
 */
export const Sentry = {
  captureException,
  setUser,
  addBreadcrumb,
  /** Exposed for the PII redaction test. */
  _scrubForTest: scrub,
};
