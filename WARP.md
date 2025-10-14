# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

---

## Project Overview

UniCloud Africa frontend - A multi-tenant cloud infrastructure management platform built with React. Supports three distinct user contexts: Admin (super admin), Tenant (cloud service provider), and Client (end user).

**Tech Stack:** React 18, React Router v6, TailwindCSS, Zustand, TanStack Query (React Query), Framer Motion

---

## Development Commands

### Core Commands
```bash
# Install dependencies
npm install

# Start development server (port 3000)
npm start

# Build for production
npm run build

# Run tests (interactive watch mode)
npm test

# Eject from Create React App (irreversible)
npm run eject
```

### Testing & Development
```bash
# Run a single test file
npm test -- <test-file-name>

# Run tests in CI mode (no watch)
CI=true npm test

# Run tests with coverage
npm test -- --coverage --watchAll=false
```

### Environment Setup
- Copy `.env.example` to `.env` if needed
- Required environment variables:
  - `REACT_APP_API_USER_BASE_URL` - Backend API base URL (default: http://localhost:8000)
  - `REACT_APP_PAYSTACK_KEY` - Paystack payment gateway key

---

## Architecture Overview

### Multi-Context Architecture

The application operates in **three distinct contexts**, each with isolated authentication, routing, and state management:

1. **Admin Context** (`/admin-dashboard/*`)
   - Super admin dashboard for platform management
   - Manages tenants, clients, regions, products, pricing, infrastructure
   - Full CRUD on all entities across all tenants

2. **Tenant Context** (`/dashboard/*` and `/tenant-dashboard/*`)
   - Tenant admin dashboard for managing their cloud services
   - Manages their own clients, projects, instances, quotes
   - Can create sub-tenants and manage hierarchical relationships

3. **Client Context** (`/client-dashboard/*`)
   - End-user dashboard for consuming cloud services
   - Manages their own projects, instances, volumes, networks
   - Limited to resources they own or have access to

### Authentication & State Management

**Auth Stores** (Zustand with localStorage persistence):
- `src/stores/adminAuthStore.js` - Admin authentication
- `src/stores/userAuthStore.js` - Tenant/user authentication
- `src/stores/clientAuthStore.js` - Client authentication
- `src/stores/unifiedAuthStore.js` - New unified auth (migration in progress)
- `src/stores/multiTenantAuthStore.js` - Multi-tenant context management

**Key Pattern:** Each context uses its own auth store. Never mix auth tokens between contexts.

### API Layer Architecture

**Base Configuration** (`src/config.js`):
```javascript
config.baseURL    // /api/v1      - Public & business/client APIs
config.adminURL   // /admin/v1    - Admin-only APIs
config.tenantURL  // /tenant/v1   - Tenant admin APIs
```

**API Clients** (`src/index/`):
```
src/index/
├── admin/
│   ├── api.js              # Admin API client (with toast notifications)
│   ├── silent.js           # Silent admin API (no toast)
│   ├── apiAdminforUser.js  # Admin acting as user
│   ├── fileapi.js          # File upload handling
│   └── multipartApi.js     # Multipart form data
├── client/
│   ├── api.js              # Client API client
│   └── silent.js           # Silent client API
├── tenant/
│   ├── tenantApi.js        # Tenant API client
│   └── silentTenant.js     # Silent tenant API
├── api.js                  # Base business API
└── silent.js               # Base silent API
```

**Why multiple API clients?**
- **"Silent" APIs** suppress toast notifications (used for background polling/refresh)
- **Context-specific** clients automatically use the correct base URL and auth headers
- **File upload** clients handle multipart/form-data content types

### Hooks Architecture

**Pattern:** Hooks are organized by context and resource type

```
src/hooks/
├── adminHooks/               # Admin-scoped hooks
│   ├── tenantHooks.js        # Tenant management
│   ├── projectHooks.js       # Admin project operations
│   ├── edgeHooks.js          # Edge configuration
│   └── [resource]Hooks.js
├── clientHooks/              # Client-scoped hooks
│   ├── projectHooks.js       # Client project operations
│   ├── vpcHooks.js           # VPC management
│   └── [resource]Hooks.js
├── tenantHooks/              # Tenant-scoped hooks
│   └── leadsHook.js
├── sharedResourceHooks.js    # Cross-context resources
├── businessClientHooks.js    # Public/business APIs
├── adminHooks.js             # Legacy admin hooks (consolidated)
└── [resource].js             # Shared resource hooks
```

**TanStack Query Integration:**
- All hooks use `useMutation` or `useQuery` from `@tanstack/react-query`
- Query client configured in `src/utils/queryProvider.js` with retry: 1
- Standard pattern:
  ```javascript
  export const useFetchResource = () => {
    return useQuery({
      queryKey: ["resource-name"],
      queryFn: async () => {
        const response = await api.get('/endpoint');
        return response.data;
      }
    });
  };
  ```

### Routing Strategy

**Context Isolation:**
- Admin routes: `/admin-dashboard/*`
- Tenant routes: `/dashboard/*`, `/tenant-dashboard/*`
- Client routes: `/client-dashboard/*`
- Public routes: `/`, `/about`, `/calculator`, etc.

**Key Files:**
- `src/App.js` - Main route definitions (~200+ routes)
- `src/routes/` - Route utilities and guards (if present)

**Navigation Pattern:**
- Instance details: `?identifier={instance.identifier}` (preferred) or `?id={base64(id)}` (legacy)
- Project details: `?identifier={project.identifier}`
- Use `identifier` strings in URLs, not numeric IDs

---

## Critical Integration Rules

### Backend Integration (See `docs/INTEGRATION_RULES.md`)

**Golden Rules:**
1. **Never invent field names** - Use exact backend contract names
2. **Use `config.baseURL`** for all admin API calls (never hardcode URLs)
3. **Token from store** - `const { token } = useAdminAuthStore.getState()`
4. **Omit optional fields** when not set (don't send null/empty)
5. **Use identifiers, not IDs** - `project.identifier` (string), `instance.identifier` (string)

**Common Pitfalls:**
- ❌ `localStorage.getItem('token')` - Use auth store instead
- ❌ `/api/v1/business/...` hardcoded - Use `${config.baseURL}/business/...`
- ❌ `project_id: project.id` - Use `project_id: project.identifier` (string)
- ❌ Sending `null` values - Omit the field entirely
- ✅ Reset dependent dropdowns when parent changes (region → project → infra)

### Multi-Instance Creation Payload

**Critical Endpoint:** `POST /business/instances/create` (admin) or `POST /api/v1/multi-quotes` (tenant/client)

**Required Fields:**
```javascript
{
  pricing_requests: [{
    region: "region-code",              // Required OR project_id
    project_id: "project-identifier",   // Required OR region
    compute_instance_id: 123,           // From product_pricing productable_id
    os_image_id: 456,                   // From product_pricing productable_id
    months: 12,
    number_of_instances: 2,
    volume_types: [{
      volume_type_id: 789,              // From product_pricing productable_id
      storage_size_gb: 100
    }]
  }]
}
```

**Optional Fields (omit if not set):**
- `bandwidth_id`, `bandwidth_count` (send together or not at all)
- `floating_ip_count` (omit if 0)
- `cross_connect_id`, `cross_connect_count` (send together or not at all)
- `network_id`, `subnet_id`, `security_group_ids`, `keypair_name`

**Admin-Only Fields:**
- `tenant_id` OR `user_id` (not both) - for assigning to specific tenant/client

### Infrastructure Prerequisites

**Dependency Chain:**
1. Select **Region** → enables product pricing queries
2. Select **Project** (optional but recommended) → enables infra lists
3. Infra resources require BOTH region + project:
   - Security Groups: `?project_id={identifier}&region={code}`
   - Key Pairs: `?project_id={identifier}&region={code}`
   - Subnets: `?project_id={identifier}&region={code}`
   - Network Interfaces: `?project_id={identifier}&region={code}`

**UI Pattern:** Disable infra selects until prerequisites met, but don't block form submission (they're optional).

### Edge Configuration

**Tenant View** (`src/dashboard/components/EdgeConfigPanel.js`):
- GET `/admin/projects/{id}/edge-config`
- Shows current config, warns if missing

**Admin View** (`src/adminDashboard/components/AdminEdgeConfigPanel.js`):
- GET `/business/projects/{id}/edge-config`
- Lists edge networks, IP pools
- POST `/business/projects/{id}/edge-config` to assign

**Special Admin Detection:**
- Tenant dashboards check for admin token presence
- If admin token exists, show admin-specific controls and "Configure Edge" button

---

## Component Structure

### Dashboard Hierarchy

**Admin Dashboard:**
```
src/adminDashboard/
├── pages/                    # Route components
│   ├── adminDashboard.js     # Main admin overview
│   ├── adminProjects.js      # Project management
│   ├── adminPartners.js      # Tenant management
│   ├── adminInventory.js     # Infrastructure inventory
│   ├── multiInstanceCreation.js  # Advanced instance wizard
│   └── [feature]Comps/       # Sub-components per feature
└── components/               # Shared admin components
```

**Tenant Dashboard:**
```
src/dashboard/
├── pages/                    # Route components
│   ├── dashboard.js          # Tenant overview
│   ├── projectmain.js        # Projects list
│   ├── projectDetails.js     # Project details
│   ├── instances.js          # Instances list
│   ├── addInstance.js        # Create instance wizard
│   └── [feature]Comps/       # Sub-components
└── components/               # Shared tenant components
```

**Client Dashboard:**
```
src/clientDashboard/
├── pages/                    # Route components
│   ├── clientDashboard.js    # Client overview
│   ├── clientProjects.js     # Client's projects
│   ├── clientInstances.js    # Client's instances
│   └── [feature]Comps/
└── components/
    └── ClientDashboardLayout.js  # Wrapper layout
```

### Reusable Component Patterns

**Layout Components:**
- `src/components/sidebar.js` - Main navigation sidebar
- `src/adminDashboard/components/AdminDashboardLayout.js` - Admin wrapper
- `src/clientDashboard/components/ClientDashboardLayout.js` - Client wrapper

**Data Display:**
- Tables use custom table components with sorting/filtering
- Skeleton loaders via `react-loading-skeleton` during data fetch
- Toast notifications via `sonner` library

**Forms:**
- Modal-based forms for create/edit operations
- Validation handled per-component (no centralized validation library)
- Success/error feedback via toast notifications

---

## Key Utilities

### Toast Notifications
```javascript
// Import from sonner
import { toast } from 'sonner';

// Usage
toast.success("Instance created successfully");
toast.error("Failed to create instance");
toast.warning("Configuration incomplete");
```

### Subdomain Detection
```javascript
// Get tenant subdomain (xyz from xyz.unicloudafrica.com)
import { getSubdomain } from './utils/getSubdomaim';
const subdomain = getSubdomain();
const isTenant = !!subdomain;
```

### Date Formatting
- Use native JS Date APIs or third-party if imported
- Backend typically returns ISO 8601 strings

---

## ESLint Rules (Important)

**Strict Import Restrictions:**

1. **Admin dashboard files** (`src/adminDashboard/**`) **CANNOT** import:
   - `src/index/tenant/*`
   - `src/stores/userAuthStore`

2. **Tenant/Client dashboards** (`src/dashboard/**`, `src/clientDashboard/**`) **CANNOT** import:
   - `src/index/admin/*`
   - `src/stores/adminAuthStore`

**Why?** Prevents cross-context auth token leakage and maintains clear separation of concerns.

---

## Testing

**Test Files:** Only `src/App.test.js` exists (minimal)

**Testing Stack:**
- `@testing-library/react`
- `@testing-library/jest-dom`
- `@testing-library/user-event`

**Running Tests:**
```bash
# Interactive mode
npm test

# Single run
npm test -- --watchAll=false

# With coverage
npm test -- --coverage
```

**Note:** Test coverage is currently minimal. When adding tests, follow Testing Library best practices.

---

## Styling

**TailwindCSS Configuration** (`tailwind.config.js`):
- Custom primary color palette (`#288DD1` and variants)
- Custom font: Outfit
- Custom utility: `.scrollbar-hide` for hiding scrollbars
- Content paths: `./src/**/*.{js,jsx,ts,tsx}`

**Global Styles:** `src/index.css`

**Component Styling Pattern:**
- Utility-first with Tailwind classes
- Responsive breakpoints: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Custom animations via Framer Motion (`framer-motion`)

---

## Key Dependencies

**Core:**
- `react` 18.2.0
- `react-router-dom` 6.18.0 - Client-side routing
- `zustand` 5.0.5 - State management

**Data Fetching:**
- `@tanstack/react-query` 5.81.2 - Server state management

**UI/UX:**
- `framer-motion` 10.16.4 - Animations
- `lucide-react` 0.511.0 - Icons
- `sonner` 2.0.5 - Toast notifications
- `react-loading-skeleton` 3.5.0 - Loading states

**Forms & Inputs:**
- `react-datepicker` 4.24.0 - Date picker component
- `@tinymce/tinymce-react` 4.3.2 - Rich text editor

**Utilities:**
- `lodash.debounce` 4.0.8 - Input debouncing
- `countries-list` 3.0.6, `country-state-city` 3.2.1 - Location data

**Payment:**
- `@paystack/inline-js` 2.22.6 - Paystack integration

**PDF:**
- `react-pdf` 10.0.1 - PDF viewing
- `jspdf` 3.0.1, `jspdf-autotable` 5.0.2 - PDF generation

**Firebase:**
- `firebase` 10.6.0 - Authentication/storage (check if actively used)

---

## Documentation

**Additional Docs:** `docs/` directory contains:
- `INTEGRATION_RULES.md` - **Critical:** Backend API integration rules
- `API.md` - Complete backend route listing
- `HOOKS_DOCUMENTATION.md` - Hook inventory and usage
- `FRONTEND_HOOKS_ANALYSIS.md` - Hook implementation audit
- `INFRASTRUCTURE_SETUP_*.md` - Infrastructure setup guides
- `README.md` - Basic CRA documentation

**Before Making Changes:** Read `docs/INTEGRATION_RULES.md` to understand backend contracts.

---

## Common Development Workflows

### Adding a New Resource Management Page

1. **Create hooks** in appropriate context folder:
   ```javascript
   // src/hooks/adminHooks/newResourceHooks.js
   export const useFetchNewResources = () => {
     return useQuery({
       queryKey: ['newResources'],
       queryFn: async () => {
         const response = await adminApi.get('/new-resources');
         return response.data;
       }
     });
   };
   ```

2. **Create page component:**
   ```javascript
   // src/adminDashboard/pages/adminNewResources.js
   import { useFetchNewResources } from '../../hooks/adminHooks/newResourceHooks';
   ```

3. **Add route** in `src/App.js`:
   ```jsx
   <Route path="/admin-dashboard/new-resources" element={<AdminNewResources />} />
   ```

4. **Update navigation** in sidebar component

### Debugging API Integration Issues

1. Check browser Network tab for actual request/response
2. Verify auth token is present: `useAdminAuthStore.getState().token`
3. Verify base URL: Check `config.baseURL` matches backend
4. Check payload matches `docs/INTEGRATION_RULES.md` contract
5. Verify query keys don't conflict (use React Query DevTools if available)

### Adding Multi-Context Feature

1. Create hook in `src/hooks/sharedResourceHooks.js` with all three clients:
   ```javascript
   // Business/Client version
   export const useFetchResource = () => {
     return useQuery({
       queryKey: ['resource'],
       queryFn: async () => {
         const response = await api.get('/business/resource');
         return response.data;
       }
     });
   };

   // Admin version
   export const useAdminFetchResource = () => {
     return useQuery({
       queryKey: ['adminResource'],
       queryFn: async () => {
         const response = await adminApi.get('/business/resource');
         return response.data;
       }
     });
   };

   // Tenant version
   export const useTenantFetchResource = () => {
     return useQuery({
       queryKey: ['tenantResource'],
       queryFn: async () => {
         const response = await tenantApi.get('/admin/resource');
         return response.data;
       }
     });
   };
   ```

2. Use appropriate version in each context's components

---

## Known Issues & Considerations

- **Instance Management Actions:** The `/business/instance-management/{id}/actions` endpoint was removed. Instance actions now use standard CRUD operations on `/business/instances`. See `src/services/instanceApi.js` for migration notes.

- **Auth Store Migration:** `unifiedAuthStore.js` exists but is not yet fully integrated. Current code still uses separate auth stores (`adminAuthStore`, `userAuthStore`, `clientAuthStore`).

- **Multi-Tenant Hierarchy:** Tenant hierarchies (parent/child relationships) are managed via `multiTenantAuthStore.js` - complex logic for navigating tenant trees.

- **Environment Variables:** The app expects `REACT_APP_API_USER_BASE_URL` and `REACT_APP_PAYSTACK_KEY`. Check `.env` file before running.

- **Legacy Routes:** Some routes use base64-encoded numeric IDs (`?id={base64}`). New code should use identifier strings (`?identifier={string}`).

---

## Getting Help

- **Backend API Documentation:** See `docs/API.md` for full endpoint listing
- **Integration Contract:** See `docs/INTEGRATION_RULES.md` for required payloads
- **Hook Patterns:** See `docs/HOOKS_DOCUMENTATION.md` for hook usage examples
- **Architecture Questions:** Check this WARP.md first, then source code comments

---

**Last Updated:** 2025-10-14
