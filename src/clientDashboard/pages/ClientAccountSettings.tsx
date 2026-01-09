// @ts-nocheck
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  User,
  Bell,
  Shield,
  Mail,
  Phone,
  Globe,
  Building,
  MapPin,
  Save,
  Loader2,
} from "lucide-react";

// Components
import Headbar from "../components/clientHeadbar";
import Sidebar from "../components/clientSidebar";
import ClientActiveTab from "../components/clientActiveTab";
import ClientPageShell from "../components/ClientPageShell";
import { ModernCard, ModernButton, ResourceHero } from "../../shared/components/ui";
import {
  FieldControl,
  SecurityTwoFactorPanel,
  ProfileAvatar,
} from "../../shared/components/settings";
import NotificationPreferencesSection from "../../shared/components/NotificationPreferencesSection";

// Hooks
import {
  useFetchClientProfile,
  useUserUpdateClientProfile,
  useEnableTwoFactorAuth,
  useDisableTwoFactorAuth,
} from "../../hooks/clientHooks/profileHooks";
import { useFetchCountries, useFetchStatesById, useFetchCitiesById } from "../../hooks/resource";

// Types
import { TabConfig, FieldConfig } from "../../shared/types/settings";
import ToastUtils from "../../utils/toastUtil";

// Utils
import config from "../../config";
import useClientAuthStore from "../../stores/clientAuthStore";

export default function ClientAccountSettings() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [formState, setFormState] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Profile Data
  const {
    data: profile,
    isFetching: isProfileFetching,
    refetch: refetchProfile,
  } = useFetchClientProfile();

  const { mutate: updateUserProfile } = useUserUpdateClientProfile();

  // Location Data Hooks
  const countryId = formState.country_id;
  const stateId = formState.state_id;

  const { data: countries } = useFetchCountries();
  const { data: states, isFetching: isStatesFetching } = useFetchStatesById(countryId, {
    enabled: !!countryId,
  });
  const { data: cities, isFetching: isCitiesFetching } = useFetchCitiesById(stateId, {
    enabled: !!stateId,
  });

  // 2FA Hooks
  const { mutateAsync: enable2fa } = useEnableTwoFactorAuth();
  const { mutateAsync: disable2fa } = useDisableTwoFactorAuth();
  const is2faEnabled = !!profile?.google2fa_secret;

  // Initialize Form State
  useEffect(() => {
    if (profile) {
      setFormState({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        country_id: profile.country_id ? String(profile.country_id) : "",
        state_id: profile.state_id ? String(profile.state_id) : "", // Assuming API returns IDs
        state: profile.state || "",
        city_id: profile.city_id ? String(profile.city_id) : "",
        city: profile.city || "",
        address: profile.address || "",
        zip_code: profile.zip_code || "",
        business_name: profile.business_meta?.business_name || "",
        company_type: profile.business_meta?.company_type || "",
        registration_number: profile.business_meta?.registration_number || "",
        tin_number: profile.business_meta?.tin_number || "",
        // Password fields
        current_password: "",
        new_password: "",
        confirm_new_password: "",
      });
    }
  }, [profile]);

  // Construct Dynamic Tabs
  const tabs: TabConfig[] = useMemo(
    () => [
      {
        id: "profile",
        name: "User Profile",
        description: "Manage your personal information and address.",
        icon: User,
        categories: ["profile", "address", "business"],
        groups: [
          {
            title: "Identity",
            description: "Basic personal details.",
            layout: "grid",
            fields: [
              {
                stateKey: "first_name",
                label: "First Name",
                type: "text",
                icon: User,
                required: true,
              },
              {
                stateKey: "last_name",
                label: "Last Name",
                type: "text",
                icon: User,
                required: true,
              },
              {
                stateKey: "email",
                label: "Email Address",
                type: "text",
                icon: Mail,
                readOnly: true,
                help: "Contact support to change email.",
              },
              {
                stateKey: "phone",
                label: "Phone Number",
                type: "text",
                icon: Phone,
              },
            ],
          },
          {
            title: "Address",
            description: "Location details.",
            layout: "grid",
            fields: [
              {
                stateKey: "country_id",
                label: "Country",
                type: "select",
                icon: Globe,
                options: countries?.map((c: any) => ({ label: c.name, value: c.id })) || [],
                required: true,
              },
              {
                stateKey: "state_id", // Use ID driven selection
                label: "State/Province",
                type: "select", // Simplified to select for consistency, or text if no states
                icon: MapPin,
                options: states?.map((s: any) => ({ label: s.name, value: s.id })) || [],
                disabled: !countryId || isStatesFetching,
              },
              {
                stateKey: "city_id",
                label: "City",
                type: "select",
                icon: Building,
                options: cities?.map((c: any) => ({ label: c.name, value: c.id })) || [],
                disabled: !stateId || isCitiesFetching,
              },
              {
                stateKey: "address",
                label: "Street Address",
                type: "text",
                icon: MapPin,
                required: true,
              },
              {
                stateKey: "zip_code",
                label: "ZIP / Postal Code",
                type: "text",
                icon: MapPin,
              },
            ],
          },
          {
            title: "Business Details",
            description: "Company information.",
            layout: "grid",
            fields: [
              {
                stateKey: "business_name",
                label: "Business Name",
                type: "text",
                icon: Building,
              },
              {
                stateKey: "company_type",
                label: "Company Type",
                type: "text",
                icon: Building,
              },
              {
                stateKey: "registration_number",
                label: "Registration Number",
                type: "text",
                icon: Building,
              },
              {
                stateKey: "tin_number",
                label: "TIN Number",
                type: "text",
                icon: Building,
              },
            ],
          },
        ],
      },
      {
        id: "notifications",
        name: "Notifications",
        description: "Manage your notification preferences.",
        icon: Bell,
        categories: ["notifications"],
        groups: [], // Content rendered directly
      },
      {
        id: "security",
        name: "Security",
        description: "Manage password and two-factor authentication.",
        icon: Shield,
        categories: ["security"],
        groups: [
          {
            title: "Change Password",
            description: "Update your account password.",
            layout: "grid",
            fields: [
              {
                stateKey: "current_password",
                label: "Current Password",
                type: "password",
                required: true,
              },
              {
                stateKey: "new_password",
                label: "New Password",
                type: "password",
                required: true,
              },
              {
                stateKey: "confirm_new_password",
                label: "Confirm New Password",
                type: "password",
                required: true,
              },
            ],
          },
        ],
      },
    ],
    [countries, states, cities, countryId, stateId, isStatesFetching, isCitiesFetching]
  );

  // Handlers
  const handleFieldChange = (key: string, value: any) => {
    setFormState((prev) => {
      const updates: any = { [key]: value };

      // Reset dependent fields
      const cId = String(value);
      if (key === "country_id") {
        updates.state_id = "";
        updates.city_id = "";
        updates.state = "";
        updates.city = "";
        // Update country name text for API if needed, but we mostly send IDs
        const country = countries?.find((c: any) => String(c.id) === cId);
        if (country) updates.country = country.name;
      }
      if (key === "state_id") {
        updates.city_id = "";
        updates.city = "";
        const state = states?.find((s: any) => String(s.id) === cId);
        if (state) updates.state = state.name;
      }
      if (key === "city_id") {
        const city = cities?.find((c: any) => String(c.id) === cId);
        if (city) updates.city = city.name;
      }

      return { ...prev, ...updates };
    });
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Filter out password fields for profile update
      const { current_password, new_password, confirm_new_password, ...profilePayload } = formState;

      // Ensure IDs are numbers if API expects them
      const payload = {
        ...profilePayload,
        country_id: Number(profilePayload.country_id),
        // state/city might be names or IDs depending on legacy logic
        // Legacy logic sent names for state/city if input, or IDs if select.
        // We'll trust formState has correct values populated by handlers
      };

      updateUserProfile(payload, {
        onSuccess: () => {
          ToastUtils.success("Profile updated successfully");
          setIsSaving(false);
          refetchProfile();
        },
        onError: (err: any) => {
          ToastUtils.error(err.message || "Failed to update profile");
          setIsSaving(false);
        },
      });
    } catch (error) {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (formState.new_password !== formState.confirm_new_password) {
      ToastUtils.error("New passwords do not match");
      return;
    }

    setIsSaving(true);
    updateUserProfile(
      {
        current_password: formState.current_password,
        new_password: formState.new_password,
        new_password_confirmation: formState.confirm_new_password, // API key mismatch check? Legacy used this key
      },
      {
        onSuccess: () => {
          ToastUtils.success("Password updated successfully");
          setFormState((prev) => ({
            ...prev,
            current_password: "",
            new_password: "",
            confirm_new_password: "",
          }));
          setIsSaving(false);
        },
        onError: (err: any) => {
          ToastUtils.error(err.message || "Failed to update password");
          setIsSaving(false);
        },
      }
    );
  };

  const activeTabConfig = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <>
      <Headbar onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
      />
      <ClientActiveTab />
      <ClientPageShell
        title="Account Settings"
        description="Manage your profile, authentication, and security preferences."
        breadcrumbs={[{ label: "Home", href: "/client-dashboard" }, { label: "Settings" }]}
        contentWrapper="div"
        contentClassName="pb-20 space-y-6"
      >
        {isProfileFetching ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <div className="mx-auto w-full flex flex-col lg:flex-row gap-8">
            {/* Tabs Sidebar */}
            <div className="w-full lg:w-64 flex-shrink-0">
              <div className="flex flex-col gap-2">
                {tabs.map((tab: any) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary-50 text-primary-700"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${isActive ? "text-primary-600" : "text-slate-400"}`}
                      />
                      {tab.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 space-y-6">
              {/* Profile Header */}
              {activeTab === "profile" && (
                <ProfileAvatar
                  name={`${profile?.first_name} ${profile?.last_name}`}
                  email={profile?.email}
                  avatarUrl={profile?.profile_picture_url} // Check if this field exists
                  readOnly={true}
                  onAvatarChange={() => {}}
                  uploadEndpoint=""
                />
              )}

              {activeTab === "notifications" ? (
                <NotificationPreferencesSection />
              ) : (
                <>
                  {activeTabConfig.groups.map((group, idx) => (
                    <ModernCard key={idx} title={group.title}>
                      {group.description && (
                        <p className="text-sm text-gray-500 mb-6">{group.description}</p>
                      )}
                      <div
                        className={`grid gap-6 ${group.layout === "grid" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}
                      >
                        {group.fields?.map((field) => (
                          <FieldControl
                            key={field.stateKey}
                            field={field}
                            value={field.stateKey ? formState[field.stateKey] : ""}
                            onChange={(val) =>
                              field.stateKey && handleFieldChange(field.stateKey, val)
                            }
                          />
                        ))}
                      </div>
                      {/* Group Actions */}
                      {activeTab === "profile" && idx === activeTabConfig.groups.length - 1 && (
                        <div className="mt-6 flex justify-end">
                          <ModernButton
                            onClick={handleSaveProfile}
                            disabled={isSaving}
                            className="flex items-center gap-2"
                          >
                            {isSaving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            Save Profile
                          </ModernButton>
                        </div>
                      )}
                      {activeTab === "security" && group.title === "Change Password" && (
                        <div className="mt-6 flex justify-end">
                          <ModernButton
                            onClick={handlePasswordChange}
                            disabled={isSaving}
                            className="flex items-center gap-2"
                          >
                            {isSaving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            Change Password
                          </ModernButton>
                        </div>
                      )}
                    </ModernCard>
                  ))}

                  {activeTab === "security" && (
                    <SecurityTwoFactorPanel
                      enabled={is2faEnabled}
                      // The shared panel expects a promise-returning function that returns `{ secret, qrCodeUrl }`
                      // Our hooks are mutations. We need to wrap them and adapt headers/response.
                      // Legacy `useEnableTwoFactorAuth` hook returns a promise via mutateAsync? Yes.
                      onEnable={async () => {
                        const res = await enable2fa({});
                        // Legacy hook returns { qr_code_url, secret } directly in `res`?
                        // Let's check `clientHooks/profileHooks.js` -> `enableTwoFactorAuth`.
                        // It returns `res.data`.
                        // `TwoFactorAuth.js` says `data` has `qr_code_url`.
                        // Shared `SecurityTwoFactorPanel` calls normalizeTwoFactorSetup on response.
                        // We might need to ensure the response shape matches.
                        // Shared normalization checks for `qr_code_url` mapping to `qrCodeUrl`.
                        return res;
                      }}
                      onDisable={async (otp) => await disable2fa({ code: otp })}
                      isBusy={false} // Managed by panel mostly, or we can use isEnabling
                      isFetching={false}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </ClientPageShell>
    </>
  );
}
