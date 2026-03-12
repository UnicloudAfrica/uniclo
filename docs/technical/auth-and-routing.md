# UniCloud Africa -- Authentication and Routing

## Overview

UniCloud Africa uses a **cookie-based authentication** model. The Laravel backend issues HttpOnly cookies upon login; the frontend never stores or transmits bearer tokens directly. Zustand stores persist lightweight session metadata (user, role, email, tenant context) in `localStorage` so that route guards can evaluate access without waiting for a network call on every page load.

---

## Login Flow

### Tenant / Client Login (`/sign-in`)

1. **Email + Password submission**
   - Component: `src/dashboard/pages/loginV2.tsx` (rendered at `/sign-in`)
   - Hook: `useLoginAccount()` from `src/hooks/authHooks.ts`
   - API call: `POST /api/v1/business/auth/login` with `{ email, password }`
   - Request includes `credentials: "include"` so the browser stores the HttpOnly session cookie.

2. **OTP Verification**
   - On successful login, the server may respond with `two_factor_required: true` or redirect the user to OTP verification.
   - Component: `src/dashboard/pages/verifyMail.tsx` (rendered at `/verify-mail`)
   - Hook: `useVerifyMail()` from `src/hooks/authHooks.ts`
   - API call: `POST /api/v1/business/auth/verify-email` with `{ email, otp }`
   - On success, the component calls `setSession()` on the appropriate auth store (tenant or client), setting `isAuthenticated: true`.

3. **Session Stored**
   - The Zustand store persists to `localStorage` under the configured key (e.g. `unicloud_tenant_auth`).
   - Persisted fields: `userEmail`, `user`, `role`, `tenant`, `domain`, `isAuthenticated`, `cloudRoles`, `cloudAbilities`, `twoFactorRequired`.
   - Additional fields for tenant/admin stores: `currentTenant`, `isCentralDomain`, `currentDomain`.
   - Admin store also persists: `availableTenants`.

4. **Redirect**
   - Tenant users: redirected to `/dashboard`
   - Client users: redirected to `/client-dashboard`

### Admin Login (`/admin-signin`)

1. **Email + Password submission**
   - Component: `src/adminDashboard/pages/AdminSignin.tsx` (rendered at `/admin-signin`)
   - API call: `POST /admin/v1/business/auth/login` (admin-scoped endpoint)

2. **Admin OTP Verification**
   - Component: `src/adminDashboard/pages/AdminVerify.tsx` (rendered at `/verify-admin-mail`)
   - Same 2FA flow as above, but uses the admin auth store.

3. **Redirect** to `/admin-dashboard`

### Tenant Registration (`/tenant-sign-up`)

1. Component: `src/tenantDashboard/pages/tenant-signup.tsx`
2. Hook: `useCreateAccount()` -- calls `POST /api/v1/business/auth/register`
3. After registration, the user must verify their email via OTP before accessing the dashboard.

### Client Registration (`/sign-up`)

1. Component: `src/dashboard/pages/sign-upV2.tsx`
2. Same `useCreateAccount()` hook and `/business/auth/register` endpoint.

### Password Reset

- **Forgot Password**: `POST /api/v1/business/auth/forgot-password` -- sends OTP to email
- **Reset Password**: `POST /api/v1/business/auth/reset-password-otp` -- validates OTP and sets new password
- Components at `/forgot-password` and `/reset-password`
- Hooks: `useForgotPassword()`, `useResetPassword()` from `src/hooks/authHooks.ts`

---

## Two-Factor Authentication (2FA)

### Setup

1. User navigates to account settings.
2. Calls `useSetupTwoFactor()` which hits `GET /api/v1/2fa-setup`.
3. Backend returns a QR code / secret for the authenticator app.

### Enable

1. User enters the TOTP code from their authenticator app.
2. Calls `useEnableTwoFactor({ code })` which hits `POST /api/v1/2fa-enable`.
3. On success, 2FA is active for subsequent logins.

### Verification on Login

1. When 2FA is enabled, the login response includes `two_factor_required: true`.
2. The API client factory detects this via:
   - HTTP status `403`
   - Header `X-Auth-Status: two-factor-required`
   - Body field `two_factor_required: true`
3. The auth store's `twoFactorRequired` flag is set to `true`.
4. The user is redirected to `/verify-mail` (or `/verify-admin-mail` for admins).
5. After entering the correct OTP/TOTP code, the session is fully authenticated.

### Disable

- Calls `useDisableTwoFactor({ code })` which hits `POST /api/v1/2fa-disable`.

---

## Auth Stores -- Persistence Details

### localStorage Keys

| Store | Key | Persisted Fields |
|-------|-----|-----------------|
| Admin | `unicloud_admin_auth` | `userEmail`, `user`, `role`, `tenant`, `domain`, `isAuthenticated`, `cloudRoles`, `cloudAbilities`, `twoFactorRequired`, `currentTenant`, `isCentralDomain`, `currentDomain`, `availableTenants` |
| Tenant | `unicloud_tenant_auth` | `userEmail`, `user`, `role`, `tenant`, `domain`, `isAuthenticated`, `cloudRoles`, `cloudAbilities`, `twoFactorRequired`, `currentTenant`, `isCentralDomain`, `currentDomain` |
| Client | `unicloud_client_auth` | `userEmail`, `user`, `role`, `tenant`, `domain`, `isAuthenticated`, `cloudRoles`, `cloudAbilities`, `twoFactorRequired` |

### Hydration

Each store tracks `hasHydrated` (not persisted). On page load, Zustand's `onRehydrateStorage` callback sets `hasHydrated = true` once localStorage data has been restored. Route guards display a loading spinner until hydration completes.

### Session Clearing

- `clearSession()` resets the store to its initial state (preserving the `hasHydrated` flag).
- `clearAuthSessionsExcept(role)` in `sessionUtils.ts` clears all stores except the specified role.
- `logoutActiveSession()` calls the backend logout endpoint (`POST /business/auth/logout`) then clears all stores.

---

## Route Guards

### TenantRoute (`src/routes/TenantRoute.tsx`)

Protects all `/dashboard/*` routes. Evaluation order:

1. **Hydration check**: If `hasHydrated` is `false`, render a full-screen spinner (Loader2).
2. **Auth check**: If `isAuthenticated` is `false` or `role !== "tenant"`, redirect to `/sign-in`.
3. **Onboarding check**: Fetches onboarding state via `useOnboardingState()`.
   - If onboarding status is not `"completed"` and the user is NOT on `/dashboard/onboarding`, redirect to `/dashboard/onboarding`.
   - If onboarding status IS `"completed"` and the user IS on `/dashboard/onboarding`, redirect to `/dashboard`.
4. If all checks pass, render the children or `<Outlet />`.

### ClientRoute (`src/routes/ClientRoute.tsx`)

Protects all `/client-dashboard/*` routes. Simpler guard:

1. **Hydration check**: Spinner until `hasHydrated` is `true`.
2. **Auth check**: If `isAuthenticated` is `false` or `role !== "client"`, redirect to `/sign-in`.
3. Render children.

### Admin Routes

Admin routes (`/admin-dashboard/*`) do not use a dedicated route guard component. Authentication is enforced at the API level -- the admin API client redirects to `/admin-signin` on 401/403 responses via `handleAuthRedirect()`.

---

## Token and Cookie Handling

### Cookie-Based Auth

- All API clients use `credentials: "include"` in fetch options, ensuring the browser sends HttpOnly cookies with every request.
- The frontend **never stores tokens in JavaScript-accessible storage**. The `token` field in the auth state is always set to `null` (legacy field preserved for interface compatibility).
- Auth cookies are set by the Laravel backend with `HttpOnly`, `Secure`, and `SameSite` attributes.

### No Explicit Token Refresh

There is no client-side token refresh mechanism. The session cookie is managed entirely by the backend. If the session expires:

1. The API returns `401` or `403`.
2. `handleAuthRedirect()` in `src/utils/authRedirect.ts` detects the status.
3. A toast notification displays: "Session expired. Redirecting to login..."
4. The user is redirected to the appropriate login page.

---

## Session Expiry and Error Handling

### 401/403 Detection (`src/utils/authRedirect.ts`)

When any API client receives a `401` or `403` response:

1. **Check for 2FA requirement** (403 with `X-Auth-Status: two-factor-required`):
   - Set `twoFactorRequired = true` on the auth store.
   - Redirect to `/verify-mail` or `/verify-admin-mail`.

2. **Check `X-Prevent-Login-Redirect` header** or `prevent_redirect` body flag:
   - If present, do not redirect (allows specific endpoints to return 403 without forcing logout).

3. **Clear the session** on the active auth store.

4. **Redirect to login**:
   - Admin: `/admin-signin`
   - Tenant: `/sign-in`
   - Client: `/sign-in`

5. **Debounce**: A 5-second debounce (`isRedirecting` flag) prevents multiple concurrent redirects.

### Login Path Resolution

```typescript
const LOGIN_PATHS = {
  admin:  "/admin-signin",
  tenant: "/sign-in",
  client: "/sign-in",
};
```

The active persona is resolved via `resolveActivePersona()` from `sessionUtils.ts`, which checks stores in priority order: admin > tenant > client.

---

## Multi-Persona Support

### `resolveActivePersona()` (`src/stores/sessionUtils.ts`)

Returns the first authenticated persona in priority order:

```
1. Admin (useAdminAuthStore)
2. Tenant (useTenantAuthStore)
3. Client (useClientAuthStore)
```

Each store is independent. A user could theoretically have multiple stores authenticated simultaneously, but `resolveActivePersona()` always picks the highest-priority one.

### Persona-Aware Auth Headers

The shared API client (`src/index/api.ts`) uses `useAdminAuthStore` for auth headers. The `authHooks.ts` shared hooks use `resolveActivePersona()` to dynamically select the correct auth headers based on which store is authenticated.

### Logout

`logoutActiveSession()` in `sessionUtils.ts`:
1. Identifies the active persona.
2. Calls `POST {baseUrl}/business/auth/logout` with that persona's auth headers and cookies.
3. Clears ALL auth sessions (all three stores).

---

## Subdomain Routing

### Detection (`src/utils/getSubdomain.ts`)

```typescript
export const getSubdomain = (): string | null => {
  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  return parts.length > 2 ? parts[0] : null;
};
```

- `unicloudafrica.com` -> `null` (central domain)
- `acme.unicloudafrica.com` -> `"acme"` (tenant subdomain)
- `localhost` -> `null` (development, treated as central)

### Tenant Context in Auth Stores

The `inferTenantContext()` function in `createAuthStore.ts` evaluates the hostname:

```typescript
const isCentral = hostname === "unicloudafrica.com"
               || hostname === "localhost"
               || hostname.includes("127.0.0.1");
const tenantSlug = !isCentral ? hostname.split(".")[0] : null;
```

When on a tenant subdomain:
- `isCentralDomain` is `false`.
- `currentTenant` is `{ slug: "acme" }`.
- Auth headers include `X-Tenant-Slug: acme`.

### Admin Tenant Switching

The admin store provides `switchTenant(slug)` which navigates the browser to `{slug}.unicloudafrica.com`:

```typescript
switchTenant: (tenantSlug: string) => {
  const targetHost = `${tenantSlug}.unicloudafrica.com`;
  window.location.href = `${protocol}//${targetHost}${port}`;
}
```

### Effective Role Resolution

The admin store's `getEffectiveRole()` returns:
- `"admin"` when on the central domain
- `"tenant"` when on a tenant subdomain (even though the store's `role` field says `"admin"`)

This allows admins to view tenant dashboards on subdomains with the appropriate permissions.

---

## WebSocket Authentication

Real-time events use Laravel Echo with the Reverb broadcaster. The auth endpoint is:

```
{config.baseURL}/broadcasting/auth
```

Authentication is cookie-based (`withCredentials: true`), consistent with the REST API approach. No bearer tokens are used for WebSocket channel authentication.

---

## Flow Diagrams

### Login Sequence

```
User                    Frontend                     Backend
  |                        |                            |
  |-- Enter credentials -->|                            |
  |                        |-- POST /auth/login ------->|
  |                        |<-- Set-Cookie + response --|
  |                        |                            |
  |                        |-- setSession(store) ------>|
  |                        |-- persist to localStorage  |
  |                        |                            |
  |                        |-- IF 2FA required -------->|
  |<-- Redirect to OTP ---|                            |
  |-- Enter OTP --------->|                            |
  |                        |-- POST /auth/verify ------>|
  |                        |<-- Success + cookie -------|
  |                        |-- setSession(authenticated)|
  |<-- Redirect to dash --|                            |
```

### Session Expiry Sequence

```
User                    Frontend                     Backend
  |                        |                            |
  |                        |-- Any API request -------->|
  |                        |<-- 401 Unauthorized -------|
  |                        |                            |
  |                        |-- clearSession() --------->|
  |                        |-- Show toast notification  |
  |<-- Redirect to login --|                            |
```
