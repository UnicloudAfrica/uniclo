# Unified Authentication & Session Management

This document summarizes how browser sessions are managed across every portal (admin, tenant, client) after consolidating the auth stores.

## Single Source of Truth per Persona

| Persona | Store | LocalStorage key |
|---------|-------|------------------|
| Admin   | `useAdminAuthStore`   | `unicloud_admin_auth`   |
| Tenant  | `useTenantAuthStore`  | `unicloud_tenant_auth`  |
| Client  | `useClientAuthStore`  | `unicloud_client_auth`  |

Each store now persists the full session payload:

```json
{
  "token": "…",
  "userEmail": "…",
  "user": { /* API user payload */ },
  "role": "admin|tenant|client",
  "tenant": { /* tenant summary */ },
  "domain": { /* backend domain relationship */ },
  "isAuthenticated": true,
  "cloudRoles": [],
  "cloudAbilities": [],
  "currentTenant": { "slug": "acme" },   // admins only
  "isCentralDomain": true,               // admins only
  "currentDomain": "tenant.unicloudafrica.com",
  "availableTenants": []                 
}
```

Sessions hydrate automatically on page load (`hasHydrated` flag) so guards can render immediately without race conditions.

## OTP/Login Flow

All login + signup screens (unified `/sign-in`, `/tenant-sign-in`, `/admin-signin`, `/sign-up`, `/tenant-sign-up`) funnel through an OTP page (`/verify-mail` or `/verify-admin-mail`). On success:

1. The API response is normalized into a `sessionPayload` (token, role, user, tenant, domain, available tenants, cloud roles, etc.).
2. The correct store’s `setSession(sessionPayload)` is called based on the returned role.
3. `clearAuthSessionsExcept(role)` runs so any previous persona is removed.
4. Guards redirect based on `role` (`/admin-dashboard`, `/dashboard`, or `/client-dashboard`).

## Exclusive Sessions

`src/stores/sessionUtils.js` exposes:

- `clearAuthSessionsExcept(role)` – wipes every store except the provided role.
- `clearAllAuthSessions()` – wipes all three.

Usage:

- **OTP success:** `clearAuthSessionsExcept(normalizedRole)`.
- **Logout buttons:** `clearAllAuthSessions()` before redirecting to `/sign-in`.
- **401 handlers in all API clients:** call `clearAllAuthSessions()` before redirecting to the relevant login page.

Result: the browser can never hold two personas simultaneously.

## Domain & Tenant Context

- Backend responses now include the tenant’s `domain` relationship (or `domain_account.account_domain`). This is persisted as `session.domain`.
- Admin sessions track `currentTenant`, `isCentralDomain`, and `availableTenants`. The store exposes `switchTenant`, `initializeTenantContext`, and `getAuthHeaders` so services can add `X-Tenant-Slug` automatically when the admin is operating under a tenant subdomain.
- Tenant/client sessions store the domain for future use (e.g., enforcing that a tenant only hits their own routes or APIs).

## API Clients & Services

All API helpers (`src/index/**/*`) now:

- Pull the token from the relevant store.
- On `401`, call `clearAllAuthSessions()` and redirect to the appropriate login screen.
- Object-storage and tenant-region services derive base URLs and headers from the enriched session (no need for `multiTenantAuthStore`).

## Legacy Stores

- `multiTenantAuthStore` has been removed. Anything that needed tenant-slug awareness now reads `useAdminAuthStore`.
- `unifiedAuthStore` still exists for future migration but no longer clears the real stores on hydration.

## Practical Implications

- Logging into any portal clears other personas automatically.
- The persisted session JSON now contains enough metadata (role + domain) to drive redirects and API headers without guessing from `window.location`.
- All logout buttons and 401 handlers share the same helpers, so it’s impossible to end up in a “ghost” session.
