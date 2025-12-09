import { Activity, Bell, Clock, Globe, Mail, Palette, Settings, Shield, User } from "lucide-react";
import {
  ITEMS_PER_PAGE_OPTIONS,
  LANGUAGE_OPTIONS,
  LAYOUT_OPTIONS,
  THEME_OPTIONS,
  TIMEZONE_OPTIONS,
} from "./settings";
import { TabConfig } from "../types/settings";

export const PROFILE_TABS: TabConfig[] = [
  {
    id: "profile",
    name: "Profile",
    description:
      "Keep your personal details accurate so teammates know who they are collaborating with.",
    icon: User,
    categories: ["profile", "contact"],
    groups: [
      {
        title: "Identity",
        description: "Update how your profile appears across the admin console.",
        fields: [
          {
            stateKey: "profile.name",
            label: "Full name",
            placeholder: "Jane Doe",
            type: "text",
            icon: User,
            required: true,
          },
          {
            stateKey: "contact.email",
            label: "Email address",
            placeholder: "mail@company.com",
            type: "text",
            icon: Mail,
            readOnly: true,
            help: "Email can only be changed by the platform administrator.",
          },
          {
            stateKey: "contact.phone",
            label: "Phone number",
            placeholder: "+234 801 234 5678",
            type: "text",
            icon: Activity,
          },
          {
            stateKey: "profile.timezone",
            label: "Primary timezone",
            placeholder: "Select timezone",
            type: "select",
            options: TIMEZONE_OPTIONS,
            icon: Clock,
            includeWhenUndefined: true,
          },
          {
            stateKey: "profile.location",
            label: "Location",
            placeholder: "City, State, Country",
            type: "text",
            icon: Globe,
          },
        ],
      },
      {
        title: "About you",
        description: "Share a short bio so teams understand your background.",
        fields: [
          {
            stateKey: "profile.bio",
            label: "Bio",
            placeholder: "Tell us about your role, focus areas, and interests.",
            type: "textarea",
            rows: 4,
          },
        ],
      },
    ],
  },
  {
    id: "notifications",
    name: "Notifications",
    description:
      "Choose which alerts you want to receive to stay ahead of infrastructure activity.",
    icon: Bell,
    categories: ["notifications"],
    groups: [
      {
        title: "Notification channels",
        description: "Toggle the channels that should stay active for your profile.",
        layout: "grid",
        fields: [
          {
            stateKey: "notifications.email_notifications",
            label: "Email alerts",
            help: "Receive key operational updates in your inbox.",
            type: "toggle",
          },
          {
            stateKey: "notifications.sms_notifications",
            label: "SMS alerts",
            help: "Get urgent SMS alerts when capacity or billing thresholds are hit.",
            type: "toggle",
          },
          {
            stateKey: "notifications.instance_alerts",
            label: "Instance alerts",
            help: "Be notified when compute instances provision, fail, or scale.",
            type: "toggle",
          },
          {
            stateKey: "notifications.billing_alerts",
            label: "Billing alerts",
            help: "Enable summaries for invoices, renewals, and late payments.",
            type: "toggle",
          },
          {
            stateKey: "notifications.security_alerts",
            label: "Security alerts",
            help: "Critical notifications when security baselines change.",
            type: "toggle",
          },
          {
            stateKey: "notifications.marketing_emails",
            label: "Product updates",
            help: "Opt into release briefings and early product previews.",
            type: "toggle",
          },
        ],
      },
    ],
  },
  {
    id: "preferences",
    name: "Preferences",
    description: "Tailor the admin experience to match the way you work day to day.",
    icon: Palette,
    categories: ["preferences"],
    groups: [
      {
        title: "Interface preferences",
        description: "These options impact the appearance and density of data tables.",
        fields: [
          {
            stateKey: "preferences.theme",
            label: "Theme",
            type: "select",
            options: THEME_OPTIONS,
            icon: Palette,
          },
          {
            stateKey: "preferences.language",
            label: "Language",
            type: "select",
            options: LANGUAGE_OPTIONS,
            icon: Globe,
          },
          {
            stateKey: "preferences.dashboard_layout",
            label: "Dashboard layout",
            type: "select",
            options: LAYOUT_OPTIONS,
            icon: Settings,
          },
          {
            stateKey: "preferences.items_per_page",
            label: "Rows per page",
            type: "select",
            options: ITEMS_PER_PAGE_OPTIONS,
            icon: Activity,
            cast: (value: any) => Number(value) || 25,
          },
        ],
      },
    ],
  },
  {
    id: "security",
    name: "Security",
    description: "Increase the protection around your account and keep suspicious access at bay.",
    icon: Shield,
    categories: ["security"],
    groups: [
      {
        title: "Multi-factor authentication",
        description: "Require a secondary factor when signing in to this admin account.",
        fields: [],
      },
    ],
  },
];

export const getTabsForContext = (contextType: "admin" | "tenant" | "client") => {
  switch (contextType) {
    case "client":
      return PROFILE_TABS.filter((tab) => tab.id !== "security");
    default:
      return PROFILE_TABS;
  }
};
