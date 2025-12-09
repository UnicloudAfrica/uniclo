# Shared API Infrastructure

This directory contains the base API infrastructure used across all features.

## Files

- **`client.ts`** - Axios instance with authentication and error handling interceptors
- **`endpoints.ts`** - Centralized API endpoint constants organized by role (Admin/Tenant/Client)
- **`queryClient.ts`** - React Query configuration with query key factory for consistent caching

## Usage

### Making API Calls

```typescript
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoints";

// Example: Fetch partners
const fetchPartners = async () => {
  const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.PARTNERS);
  return data;
};

// Example: Create a partner
const createPartner = async (partnerData) => {
  const { data } = await apiClient.post(API_ENDPOINTS.ADMIN.PARTNERS, partnerData);
  return data;
};
```

### Using with React Query

```typescript
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoints";
import { queryKeys } from "@/shared/api/queryClient";

export const useAdminPartners = () => {
  return useQuery({
    queryKey: queryKeys.admin.partners(),
    queryFn: async () => {
      const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.PARTNERS);
      return data;
    },
  });
};
```

## Authentication

The API client automatically:

- Attaches JWT tokens from `localStorage` to requests
- Redirects to login on 401 Unauthorized
- Handles common error scenarios

## Query Key Patterns

Use the `queryKeys` factory for consistent cache management:

```typescript
queryKeys.admin.partners(); // ['admin', 'partners']
queryKeys.admin.partner("123"); // ['admin', 'partners', '123']
queryKeys.tenant.instances(); // ['tenant', 'instances']
```
