import React from "react";
import { Bell, Mail, Loader2, Check } from "lucide-react";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "../../hooks/useNotifications";

// Category to setting key mapping
const NOTIFICATION_SETTINGS = [
  {
    key: "email_notifications",
    label: "Email Notifications",
    description: "Receive key operational updates in your inbox.",
  },
  {
    key: "sms_notifications",
    label: "SMS Notifications",
    description: "Get urgent SMS alerts when capacity or billing thresholds are hit.",
  },
  {
    key: "instance_alerts",
    label: "Instance Alerts",
    description: "Be notified when compute instances provision, fail, or scale.",
  },
  {
    key: "billing_alerts",
    label: "Billing Alerts",
    description: "Enable summaries for invoices, renewals, and late payments.",
  },
  {
    key: "security_alerts",
    label: "Security Alerts",
    description: "Critical notifications when security baselines change.",
  },
  {
    key: "marketing_emails",
    label: "Product Updates",
    description: "Opt into release briefings and early product previews.",
  },
];

interface NotificationToggleProps {
  enabled: boolean;
  onChange: () => void;
  disabled?: boolean;
}

const NotificationToggle: React.FC<NotificationToggleProps> = ({ enabled, onChange, disabled }) => (
  <button
    type="button"
    onClick={onChange}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      enabled ? "bg-blue-600" : "bg-gray-200"
    } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        enabled ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

interface NotificationPreferencesSectionProps {
  className?: string;
}

/**
 * Notification Preferences Section
 *
 * This component uses the existing UserSettingsService to manage notification preferences.
 * It reads settings from /settings/profile?category=notifications and updates via /settings/profile/batch
 */
const NotificationPreferencesSection: React.FC<NotificationPreferencesSectionProps> = ({
  className = "",
}) => {
  const { data: preferencesData, isLoading } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  // Get raw settings object from API response
  const settings = preferencesData?.raw || {};

  const handleToggle = (key: string) => {
    const currentValue = Boolean(settings[key]);
    // Update with the new value
    updatePreferences.mutate({
      [key]: !currentValue,
    });
  };

  const isEnabled = (key: string): boolean => {
    return Boolean(settings[key]);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-500">Loading preferences...</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Preferences
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Choose how you want to receive notifications for different categories
        </p>
      </div>

      {/* Channel headers */}
      <div className="hidden md:grid grid-cols-[1fr_80px] gap-4 mb-4 px-4">
        <div />
        <div className="flex flex-col items-center gap-1">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500">Enabled</span>
        </div>
      </div>

      {/* Settings rows */}
      <div className="space-y-2">
        {NOTIFICATION_SETTINGS.map((setting) => (
          <div
            key={setting.key}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            {/* Desktop view */}
            <div className="hidden md:grid grid-cols-[1fr_80px] gap-4 items-center">
              <div>
                <p className="font-medium text-gray-900">{setting.label}</p>
                <p className="text-sm text-gray-500">{setting.description}</p>
              </div>
              <div className="flex justify-center">
                <NotificationToggle
                  enabled={isEnabled(setting.key)}
                  onChange={() => handleToggle(setting.key)}
                  disabled={updatePreferences.isPending}
                />
              </div>
            </div>

            {/* Mobile view */}
            <div className="md:hidden flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{setting.label}</p>
                <p className="text-sm text-gray-500">{setting.description}</p>
              </div>
              <div className="ml-4">
                <NotificationToggle
                  enabled={isEnabled(setting.key)}
                  onChange={() => handleToggle(setting.key)}
                  disabled={updatePreferences.isPending}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Save indicator */}
      {updatePreferences.isPending && (
        <div className="flex items-center gap-2 mt-4 text-sm text-blue-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving preferences...
        </div>
      )}

      {updatePreferences.isSuccess && (
        <div className="flex items-center gap-2 mt-4 text-sm text-green-600">
          <Check className="w-4 h-4" />
          Preferences saved
        </div>
      )}
    </div>
  );
};

export default NotificationPreferencesSection;
