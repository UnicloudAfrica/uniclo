/**
 * Shared types for admin CRUD hook patterns.
 *
 * Most admin hooks follow the same pattern: fetch a paginated collection,
 * fetch by ID, create, update, delete. These types unify those signatures.
 */

export interface CollectionQueryParams {
  region?: string;
  provider?: string;
  page?: number | string;
  perPage?: number | string;
  search?: string;
}

export interface CollectionResponse<T = Record<string, unknown>> {
  data: T[];
  meta: Record<string, unknown> | null;
  message?: string;
  success?: boolean;
}

export interface AdminUser {
  id: number | string;
  name: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}
