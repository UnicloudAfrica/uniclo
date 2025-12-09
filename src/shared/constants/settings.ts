import { Option } from "../types/settings";

export const TIMEZONE_OPTIONS: Option[] = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern (US)" },
  { value: "America/Chicago", label: "Central (US)" },
  { value: "America/Los_Angeles", label: "Pacific (US)" },
  { value: "Europe/London", label: "GMT / London" },
  { value: "Africa/Lagos", label: "West Africa / Lagos" },
];

export const LANGUAGE_OPTIONS: Option[] = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
];

export const THEME_OPTIONS: Option[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "auto", label: "Auto" },
];

export const LAYOUT_OPTIONS: Option[] = [
  { value: "default", label: "Default" },
  { value: "compact", label: "Compact" },
  { value: "analytics", label: "Analytics" },
];

export const ITEMS_PER_PAGE_OPTIONS: Option[] = [
  { value: 10, label: "10 rows" },
  { value: 25, label: "25 rows" },
  { value: 50, label: "50 rows" },
  { value: 100, label: "100 rows" },
];
