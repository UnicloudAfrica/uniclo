// User Profile Settings Configuration
// This defines available settings for each user role and their UI structure

export const SETTINGS_CONFIG = {
  ADMIN: {
    personal: {
      label: "Personal Information",
      icon: "user",
      settings: ["profile", "contact", "security"],
      description: "Manage your personal profile information",
    },
    interface: {
      label: "Interface & Preferences",
      icon: "settings",
      settings: ["theme", "language", "timezone", "dashboard_layout"],
      description: "Customize your dashboard and interface preferences",
    },
    notifications: {
      label: "Notifications & Alerts",
      icon: "bell",
      settings: ["email", "sms", "in_app", "webhooks"],
      description: "Configure notification preferences and webhooks",
    },
    billing: {
      label: "Billing & Payment",
      icon: "credit-card",
      settings: ["payment_methods", "invoicing", "tax_settings"],
      description: "Manage billing information and payment settings",
    },
    business: {
      label: "Business Preferences",
      icon: "building",
      settings: ["company_info", "branding", "departments"],
      description: "Configure business and organizational settings",
    },
    integrations: {
      label: "Integrations & API",
      icon: "link",
      settings: ["api_keys", "webhooks", "third_party"],
      description: "Manage API keys, webhooks, and third-party integrations",
    },
    system: {
      label: "System Management",
      icon: "server",
      settings: ["global_settings", "compliance", "maintenance"],
      description: "Configure global system settings and compliance",
    },
    reporting: {
      label: "Reporting & Analytics",
      icon: "bar-chart",
      settings: ["analytics", "exports", "custom_reports"],
      description: "Configure reporting and analytics preferences",
    },
  },

  TENANT: {
    personal: {
      label: "Personal Information",
      icon: "user",
      settings: ["profile", "contact", "security"],
      description: "Manage your personal profile information",
    },
    interface: {
      label: "Interface & Preferences",
      icon: "settings",
      settings: ["theme", "language", "timezone", "dashboard_layout"],
      description: "Customize your dashboard and interface preferences",
    },
    notifications: {
      label: "Notifications & Alerts",
      icon: "bell",
      settings: ["email", "sms", "in_app"],
      description: "Configure notification preferences",
    },
    billing: {
      label: "Billing & Payment",
      icon: "credit-card",
      settings: ["payment_methods", "invoicing"],
      description: "Manage tenant billing and payment settings",
    },
    business: {
      label: "Business Preferences",
      icon: "building",
      settings: ["company_info", "branding", "departments"],
      description: "Configure your organization settings",
    },
    integrations: {
      label: "Integrations & API",
      icon: "link",
      settings: ["limited_api", "basic_webhooks"],
      description: "Manage limited API access and webhooks",
    },
    reporting: {
      label: "Reporting & Analytics",
      icon: "bar-chart",
      settings: ["tenant_analytics", "basic_exports"],
      description: "View tenant-specific reports and analytics",
    },
  },

  CLIENT: {
    personal: {
      label: "Personal Information",
      icon: "user",
      settings: ["profile", "contact", "security"],
      description: "Manage your personal profile information",
    },
    interface: {
      label: "Interface & Preferences",
      icon: "settings",
      settings: ["theme", "language", "timezone"],
      description: "Customize your interface preferences",
    },
    notifications: {
      label: "Notifications & Alerts",
      icon: "bell",
      settings: ["email", "in_app"],
      description: "Configure your notification preferences",
    },
    billing: {
      label: "Billing Information",
      icon: "credit-card",
      settings: ["view_billing", "payment_methods"],
      description: "View billing information and manage payments",
    },
  },
};

// Setting field definitions and validation rules
export const SETTING_FIELDS = {
  // Personal settings
  profile: {
    type: "object",
    fields: {
      first_name: { type: "string", required: true, label: "First Name" },
      last_name: { type: "string", required: true, label: "Last Name" },
      bio: { type: "textarea", label: "Bio" },
      avatar_url: { type: "url", label: "Avatar URL" },
    },
  },
  contact: {
    type: "object",
    fields: {
      phone: { type: "phone", label: "Phone Number" },
      address: { type: "textarea", label: "Address" },
      city: { type: "string", label: "City" },
      country: { type: "select", label: "Country", options: "countries" },
    },
  },
  security: {
    type: "object",
    fields: {
      two_factor_enabled: { type: "boolean", label: "Enable 2FA" },
      session_timeout: {
        type: "select",
        label: "Session Timeout",
        options: [
          { value: 15, label: "15 minutes" },
          { value: 30, label: "30 minutes" },
          { value: 60, label: "1 hour" },
          { value: 240, label: "4 hours" },
          { value: 480, label: "8 hours" },
        ],
      },
    },
  },

  // Interface settings
  theme: {
    type: "select",
    label: "Theme",
    options: [
      { value: "light", label: "Light" },
      { value: "dark", label: "Dark" },
      { value: "auto", label: "Auto (System)" },
    ],
  },
  language: {
    type: "select",
    label: "Language",
    options: [
      { value: "en", label: "English" },
      { value: "es", label: "Spanish" },
      { value: "fr", label: "French" },
      { value: "de", label: "German" },
    ],
  },
  timezone: {
    type: "select",
    label: "Timezone",
    options: "timezones", // Will be loaded dynamically
  },
  dashboard_layout: {
    type: "select",
    label: "Dashboard Layout",
    options: [
      { value: "compact", label: "Compact" },
      { value: "comfortable", label: "Comfortable" },
      { value: "spacious", label: "Spacious" },
    ],
  },

  // Notification settings
  email: {
    type: "object",
    fields: {
      marketing: { type: "boolean", label: "Marketing emails" },
      security: { type: "boolean", label: "Security alerts" },
      billing: { type: "boolean", label: "Billing notifications" },
      system: { type: "boolean", label: "System updates" },
    },
  },
  sms: {
    type: "object",
    fields: {
      security: { type: "boolean", label: "Security alerts via SMS" },
      billing: { type: "boolean", label: "Billing alerts via SMS" },
    },
  },
  in_app: {
    type: "object",
    fields: {
      push_notifications: { type: "boolean", label: "Push notifications" },
      sound: { type: "boolean", label: "Notification sounds" },
      desktop: { type: "boolean", label: "Desktop notifications" },
    },
  },

  // Business settings
  company_info: {
    type: "object",
    fields: {
      company_name: { type: "string", required: true, label: "Company Name" },
      industry: { type: "select", label: "Industry", options: "industries" },
      size: {
        type: "select",
        label: "Company Size",
        options: [
          { value: "1-10", label: "1-10 employees" },
          { value: "11-50", label: "11-50 employees" },
          { value: "51-200", label: "51-200 employees" },
          { value: "201-500", label: "201-500 employees" },
          { value: "500+", label: "500+ employees" },
        ],
      },
    },
  },
  branding: {
    type: "object",
    fields: {
      logo_url: { type: "url", label: "Logo URL" },
      primary_color: { type: "color", label: "Primary Color" },
      secondary_color: { type: "color", label: "Secondary Color" },
    },
  },
};

// Default values for settings
export const SETTING_DEFAULTS = {
  theme: "light",
  language: "en",
  timezone: "UTC",
  dashboard_layout: "comfortable",
  email: {
    marketing: false,
    security: true,
    billing: true,
    system: true,
  },
  in_app: {
    push_notifications: true,
    sound: true,
    desktop: false,
  },
  security: {
    two_factor_enabled: false,
    session_timeout: 60,
  },
};

// API endpoints for settings
export const SETTINGS_API = {
  profile: "/api/v1/settings/profile",
  admin: "/api/v1/settings/admin",
  tenant: "/api/v1/settings/tenant",
  schema: "/api/v1/settings/profile/schema",
  export: "/api/v1/settings/profile/export",
  import: "/api/v1/settings/profile/import",
  reset: "/api/v1/settings/profile/reset",
};

// Navigation structure for settings pages
export const SETTINGS_NAVIGATION = {
  ADMIN: [
    { key: "personal", path: "/settings/personal" },
    { key: "interface", path: "/settings/interface" },
    { key: "notifications", path: "/settings/notifications" },
    { key: "billing", path: "/settings/billing" },
    { key: "business", path: "/settings/business" },
    { key: "integrations", path: "/settings/integrations" },
    { key: "system", path: "/settings/system" },
    { key: "reporting", path: "/settings/reporting" },
  ],
  TENANT: [
    { key: "personal", path: "/settings/personal" },
    { key: "interface", path: "/settings/interface" },
    { key: "notifications", path: "/settings/notifications" },
    { key: "billing", path: "/settings/billing" },
    { key: "business", path: "/settings/business" },
    { key: "integrations", path: "/settings/integrations" },
    { key: "reporting", path: "/settings/reporting" },
  ],
  CLIENT: [
    { key: "personal", path: "/settings/personal" },
    { key: "interface", path: "/settings/interface" },
    { key: "notifications", path: "/settings/notifications" },
    { key: "billing", path: "/settings/billing" },
  ],
};

// Helper functions
export const getAvailableSettings = (userRole) => {
  return SETTINGS_CONFIG[userRole?.toUpperCase()] || SETTINGS_CONFIG.CLIENT;
};

export const getSettingNavigation = (userRole) => {
  return SETTINGS_NAVIGATION[userRole?.toUpperCase()] || SETTINGS_NAVIGATION.CLIENT;
};

export const getSettingField = (fieldKey) => {
  return SETTING_FIELDS[fieldKey] || { type: "string", label: fieldKey };
};

export const getSettingDefault = (fieldKey) => {
  return SETTING_DEFAULTS[fieldKey] || null;
};
