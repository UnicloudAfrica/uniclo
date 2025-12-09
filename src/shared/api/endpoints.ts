/**
 * API Endpoint Constants
 * Centralized location for all API endpoints used across the application
 */

export const API_ENDPOINTS = {
  // ========================================
  // ADMIN ENDPOINTS
  // ========================================
  ADMIN: {
    // Partners (Tenants)
    PARTNERS: "/admin/tenants",
    PARTNER_BY_ID: (id: string) => `/admin/tenants/${id}`,
    PARTNERS_BULK_DELETE: "/admin/tenants/bulk-delete",
    PARTNERS_BULK_EXPORT: "/admin/tenants/bulk-export",

    // Clients
    CLIENTS: "/admin/clients",
    CLIENT_BY_ID: (id: number | string) => `/admin/clients/${id}`,
    CLIENTS_BULK_DELETE: "/admin/clients/bulk-delete",
    CLIENTS_BULK_EXPORT: "/admin/clients/bulk-export",

    // Instances
    INSTANCES: "/admin/instances",
    INSTANCE_BY_ID: (id: string) => `/admin/instances/${id}`,

    // Projects
    PROJECTS: "/admin/projects",
    PROJECT_BY_ID: (id: string) => `/admin/projects/${id}`,
    PROJECT_STATUS: (id: string) => `/admin/projects/${id}/status`,
    PROJECT_PROVISION: (id: string) => `/admin/projects/${id}/provision`,

    // Support
    SUPPORT: "/admin/support",
    SUPPORT_BY_ID: (id: string) => `/admin/support/${id}`,
    SUPPORT_REPLY: (id: string) => `/admin/support/${id}/reply`,

    // Regions
    REGIONS: "/admin/regions",
    REGION_BY_ID: (id: string) => `/admin/regions/${id}`,
    REGION_APPROVALS: "/admin/region-approvals",

    // Admins
    ADMINS: "/admin/admins",
    ADMIN_BY_ID: (id: string) => `/admin/admins/${id}`,
  },

  // ========================================
  // TENANT ENDPOINTS
  // ========================================
  TENANT: {
    // Dashboard
    DASHBOARD: "/tenant/admin/dashboard",

    // Partners
    PARTNERS: "/tenant/admin/partners",
    PARTNER_BY_ID: (id: string) => `/tenant/admin/partners/${id}`,
    PARTNER_CLIENTS: (id: string) => `/tenant/admin/partners/${id}/clients`,

    // Clients
    CLIENTS: "/tenant/admin/clients",
    CLIENT_BY_ID: (id: number | string) => `/tenant/admin/clients/${id}`,

    // Instances
    INSTANCES: "/tenant/admin/instances",
    INSTANCE_BY_ID: (id: string) => `/tenant/admin/instances/${id}`,
    INSTANCE_CREATE: "/tenant/admin/instances/create",

    // Projects
    PROJECTS: "/tenant/admin/projects",
    PROJECT_BY_ID: (id: string) => `/tenant/admin/projects/${id}`,

    // Support
    SUPPORT: "/tenant/admin/support",
    SUPPORT_BY_ID: (id: string) => `/tenant/admin/support/${id}`,

    // Region Requests
    REGION_REQUESTS: "/tenant/admin/region-requests",
    REGION_REQUEST_BY_ID: (id: string) => `/tenant/admin/region-requests/${id}`,

    // Revenue Shares
    REVENUE_SHARES: "/tenant/admin/revenue-shares",
    REVENUE_SHARES_STATS: "/tenant/admin/revenue-shares-stats",
  },

  // ========================================
  // CLIENT ENDPOINTS (Business Context)
  // ========================================
  CLIENT: {
    // Projects
    PROJECTS: "/business/projects",
    PROJECT_BY_ID: (id: string) => `/business/projects/${id}`,

    // Instances
    INSTANCES: "/business/instances",
    INSTANCE_BY_ID: (id: string) => `/business/instances/${id}`,
    INSTANCE_CREATE: "/business/instances/create",

    // Support
    SUPPORT: "/business/support",
    SUPPORT_BY_ID: (id: string) => `/business/support/${id}`,
  },

  // ========================================
  // SHARED/COMMON ENDPOINTS
  // ========================================
  COMMON: {
    // Auth
    LOGIN: "/business/auth/login",
    REGISTER: "/business/auth/register",
    LOGOUT: "/business/logout",
    PROFILE: "/business/profile",
    VERIFY_EMAIL: "/business/auth/verify-email",
    FORGOT_PASSWORD: "/business/auth/forgot-password",
    RESET_PASSWORD: "/business/auth/reset-password-otp",

    // Transactions
    TRANSACTIONS: "/transactions",
    TRANSACTION_BY_ID: (id: string) => `/transactions/${id}`,
    TRANSACTION_RECEIPT: (id: string) => `/transactions/${id}/receipt`,

    // Regions (Public)
    REGIONS: "/regions",
    REGION_BY_ID: (id: string) => `/regions/${id}`,

    // Products
    PRODUCT_PRICING: "/product-pricing",
    PRODUCT_COMPUTE_INSTANCE: "/product-compute-instance",
    PRODUCT_VOLUME_TYPE: "/product-volume-type",
    PRODUCT_OS_IMAGE: "/product-os-image",

    // Calculator
    CALCULATOR_OPTIONS: "/calculator-options",
  },
} as const;

export default API_ENDPOINTS;
