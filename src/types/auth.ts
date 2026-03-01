export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface Tenant {
  id?: number;
  name?: string;
  slug: string;
  [key: string]: unknown;
}

export interface TenantContext {
  isCentralDomain: boolean;
  currentDomain: string | null;
  currentTenant: Tenant | null;
}

export interface AuthState {
  token: string | null;
  userEmail: string | null;
  user: User | null;
  role: string | null;
  tenant: Tenant | null;
  domain: string | null;
  isAuthenticated: boolean;
  twoFactorRequired: boolean;
  cloudRoles: string[];
  cloudAbilities: string[];
  currentTenant: Tenant | null;
  isCentralDomain: boolean;
  currentDomain: string | null;
  availableTenants?: Tenant[];
  hasHydrated: boolean;
  setToken: (token: string | null) => void;
  clearToken: () => void;
  setUserEmail: (email: string | null) => void;
  clearUserEmail: () => void;
  setTwoFactorRequired: (value: boolean) => void;
  clearTwoFactorRequirement: () => void;
  setUser: (user: User | null) => void;
  setRole: (role: string | null) => void;
  setTenant: (tenant: Tenant | null) => void;
  setDomain?: (domain: string | null) => void;
  setCloudRoles: (roles: string[]) => void;
  setCloudAbilities: (abilities: string[]) => void;
  setAvailableTenants?: (tenants: Tenant[]) => void;
  setCurrentTenant: (tenant: Tenant | null) => void;
  setIsCentralDomain?: (value: boolean) => void;
  setCurrentDomain?: (value: string | null) => void;
  setSession: (session: Partial<AuthState>) => void;
  clearSession: () => void;
  initializeTenantContext?: () => void;
  switchTenant?: (tenantSlug: string) => boolean;
  getAuthHeaders: () => Record<string, string>;
  getEffectiveRole?: () => string;
  updateContext?: (context: TenantContext) => void;
  setHasHydrated: (value: boolean) => void;
}
