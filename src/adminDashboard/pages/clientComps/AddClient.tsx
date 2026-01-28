// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  useFetchCountries,
  useFetchStatesById,
  useFetchCitiesById,
  useFetchIndustries,
} from "../../../hooks/resource";
import { useFetchTenants } from "../../../hooks/adminHooks/tenantHooks";
import { useCreateClient } from "../../../hooks/adminHooks/clientHooks";
import { useAssignDiscount } from "../../../hooks/useDiscounts";
import ToastUtils from "../../../utils/toastUtil";
import DiscountFormSection, {
  getDefaultDiscountFormData,
  DiscountFormData,
} from "../../../shared/components/DiscountFormSection";
import ClientBusinessInputs from "../../../dashboard/pages/clientComps/subComps/ClientBusinessInputs";
import FormLayout, { formAccent, getAccentRgba } from "../../components/FormLayout";

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "modal" | "page";
}

const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, mode = "modal" }) => {
  const isPageMode = mode === "page";
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
    verified: false,
    country_id: "",
    country: "",
    state_id: "",
    state: "",
    city_id: "",
    city: "",
    address: "",
    zip_code: "",
    force_password_reset: false,
    tenant_id: "",
    business_name: "",
    company_type: "",
    industry: "",
    registration_number: "",
    tin_number: "",
    website: "",
    verification_token: "",
  });
  const [discountFormData, setDiscountFormData] = useState<DiscountFormData>(
    getDefaultDiscountFormData()
  );
  const [errors, setErrors] = useState<any>({});

  const { data: tenants, isFetching: isTenantsFetching } = useFetchTenants();
  const { data: countries, isFetching: isCountriesFetching } = useFetchCountries();
  const { data: states, isFetching: isStatesFetching } = useFetchStatesById(formData.country_id, {
    enabled: !!formData.country_id,
  });
  const { data: cities, isFetching: isCitiesFetching } = useFetchCitiesById(formData.state_id, {
    enabled: !!formData.state_id,
  });
  const { data: industries, isFetching: isIndustriesFetching } = useFetchIndustries();
  const { mutate: createClient, isPending } = useCreateClient();
  const { mutate: assignDiscount, isPending: isAssigningDiscount } = useAssignDiscount();

  useEffect(() => {
    if (!isPageMode && !isOpen) {
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        password: "",
        password_confirmation: "",
        verified: false,
        country_id: "",
        country: "",
        state_id: "",
        state: "",
        city_id: "",
        city: "",
        address: "",
        zip_code: "",
        force_password_reset: false,
        tenant_id: "",
        business_name: "",
        company_type: "",
        industry: "",
        registration_number: "",
        tin_number: "",
        website: "",
        verification_token: "",
      });
      setDiscountFormData(getDefaultDiscountFormData());
      setErrors({});
    }
  }, [isOpen, isPageMode]);

  useEffect(() => {
    if (formData.country_id && countries) {
      const selectedCountry = countries.find((c: any) => c.id === parseInt(formData.country_id));
      setFormData((prev) => ({
        ...prev,
        country: selectedCountry?.name || "",
        state_id: "",
        state: "",
        city_id: "",
        city: "",
      }));
    }
  }, [formData.country_id, countries]);

  useEffect(() => {
    if (formData.state_id && states) {
      const selectedState = states.find((s: any) => s.id === parseInt(formData.state_id));
      setFormData((prev) => ({
        ...prev,
        state: selectedState?.name || "",
        city_id: "",
        city: "",
      }));
    }
  }, [formData.state_id, states]);

  useEffect(() => {
    if (formData.city_id && cities) {
      const selectedCity = cities.find((c: any) => c.id === parseInt(formData.city_id));
      setFormData((prev) => ({ ...prev, city: selectedCity?.name || "" }));
    }
  }, [formData.city_id, cities]);

  const validateForm = () => {
    const newErrors: any = {};
    if (!formData.first_name.trim()) newErrors.first_name = "First Name is required";
    if (!formData.last_name.trim()) newErrors.last_name = "Last Name is required";
    if (!formData.email.trim()) newErrors.email = "Email Address is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email address";
    if (!formData.phone.trim()) newErrors.phone = "Phone Number is required";
    else if (!/^\+?\d+$/.test(formData.phone))
      newErrors.phone = "Phone Number must contain only digits";
    if (!formData.password.trim()) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters long";
    if (formData.password !== formData.password_confirmation)
      newErrors.password_confirmation = "Passwords do not match";
    if (!formData.country_id) newErrors.country_id = "Country is required";
    if (!formData.state_id) newErrors.state_id = "State is required";
    if (!formData.city_id && !formData.city.trim()) newErrors.city = "City is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.zip_code.trim()) newErrors.zip_code = "Zip Code is required";
    if (!formData.business_name.trim()) newErrors.business_name = "Business Name is required";
    if (!formData.company_type.trim()) newErrors.company_type = "Business Type is required";
    if (!formData.registration_number.trim())
      newErrors.registration_number = "Registration Number is required";
    if (!formData.verification_token)
      newErrors.verification_token = "Business verification is required";
    if (formData.website.trim() && !/^https?:\/\/\S+/.test(formData.website))
      newErrors.website = "Invalid website URL";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev: any) => ({ ...prev, [field]: null }));
  };

  const handleSelectChange = (field: string, value: any, optionsList?: any[]) => {
    if (field === "country_id") {
      const selectedCountry = optionsList?.find((option) => String(option.id) === String(value));
      setFormData((prev) => ({
        ...prev,
        country_id: value,
        country: selectedCountry?.name || "",
        state_id: "",
        state: "",
        city_id: "",
        city: "",
      }));
      setErrors((prev: any) => ({
        ...prev,
        country_id: null,
        state_id: null,
        city_id: null,
      }));
    } else if (field === "state_id") {
      const selectedState = optionsList?.find((option) => String(option.id) === String(value));
      setFormData((prev) => ({
        ...prev,
        state_id: value,
        state: selectedState?.name || "",
        city_id: "",
        city: "",
      }));
      setErrors((prev: any) => ({ ...prev, state_id: null, city_id: null }));
    } else if (field === "city_id") {
      const selectedCity = optionsList?.find((option) => String(option.id) === String(value));
      setFormData((prev) => ({
        ...prev,
        city_id: value,
        city: selectedCity?.name || "",
      }));
      setErrors((prev: any) => ({ ...prev, city_id: null }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev: any) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) {
      ToastUtils.error("Please correct the errors in the form.");
      return;
    }

    const payload = { ...formData };
    if (payload.tenant_id) {
      payload.tenant_id = String(payload.tenant_id);
    }

    createClient(payload, {
      onSuccess: (response: any) => {
        const userId = response?.data?.id;

        // If discount is enabled and we have a user ID, assign the discount
        if (discountFormData.enabled && discountFormData.value && userId) {
          const discountPayload = {
            discount_type: discountFormData.type,
            value: parseFloat(discountFormData.value),
            starts_at: discountFormData.isPermanent ? null : discountFormData.startsAt || null,
            ends_at: discountFormData.isPermanent ? null : discountFormData.endsAt || null,
            notes: discountFormData.notes || null,
          };

          assignDiscount(
            { entityType: "user", entityId: userId, data: discountPayload },
            {
              onSuccess: () => {
                ToastUtils.success("Client added with discount successfully!");
                onClose();
              },
              onError: () => {
                ToastUtils.warning("Client created but discount assignment failed.");
                onClose();
              },
            }
          );
        } else {
          ToastUtils.success("Client added successfully!");
          onClose();
        }
      },
      onError: (err: any) => {
        const errorMsg = err.response?.data?.message || err.message || "Failed to add client.";
        ToastUtils.error(errorMsg);
        if (err.response?.data?.errors) {
          setErrors((prev: any) => ({
            ...prev,
            ...err.response.data.errors,
          }));
        }
      },
    });
  };

  const showCityDropdown = cities && cities.length > 0 && !isCitiesFetching;
  const accent = formAccent.primary;
  const formId = "add-client-form";
  const tenantList = Array.isArray(tenants?.data)
    ? tenants.data
    : Array.isArray(tenants)
      ? tenants
      : [];
  const selectedTenant = tenantList.find(
    (tenant: any) => String(tenant.id) === String(formData.tenant_id)
  );
  const contactName = [formData.first_name, formData.last_name].filter(Boolean).join(" ").trim();
  const locationSnapshot = [formData.city, formData.state, formData.country]
    .filter(Boolean)
    .join(", ");
  const verifiedLabel = formData.verified ? "Verified" : "Pending verification";
  const resetLabel = formData.force_password_reset ? "Forced on first login" : "Optional";

  const summarySections = useMemo(
    () => [
      {
        title: "Account contact",
        items: [
          { label: "Full name", value: contactName || "Pending contact" },
          { label: "Email", value: formData.email || "No email set" },
          { label: "Phone", value: formData.phone || "No phone set" },
        ],
      },
      {
        title: "Business profile",
        items: [
          {
            label: "Business name",
            value: formData.business_name || "Not provided",
          },
          {
            label: "Industry",
            value: formData.industry || "Select industry",
          },
          {
            label: "Company type",
            value: formData.company_type || "Not selected",
          },
        ],
      },
      {
        title: "Location details",
        items: [
          { label: "Country", value: formData.country || "Select country" },
          { label: "State", value: formData.state || "—" },
          { label: "City", value: formData.city || "—" },
        ],
      },
    ],
    [
      contactName,
      formData.email,
      formData.phone,
      formData.business_name,
      formData.industry,
      formData.company_type,
      formData.country,
      formData.state,
      formData.city,
    ]
  );

  const guidanceItems = [
    "Assign the client to the correct tenant workspace.",
    "Use the Verify Business action to populate official records.",
    "Passwords are temporary; a reset can be forced on their first login.",
  ];

  const asideContent = (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tenant assignment
            </p>
            <p className="text-lg font-semibold text-slate-800">
              {selectedTenant?.name || "Unassigned"}
            </p>
          </div>
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
            style={{
              backgroundColor: getAccentRgba(accent.color, 0.12),
              color: accent.color,
            }}
          >
            {formData.industry ? "✓" : "•"}
          </span>
        </div>
        <dl className="mt-4 space-y-2 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <dt>Status</dt>
            <dd className="font-medium text-slate-800">{verifiedLabel}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>Password reset</dt>
            <dd className="font-medium text-slate-800">{resetLabel}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>Location</dt>
            <dd className="max-w-[140px] text-right font-medium text-slate-800">
              {locationSnapshot || "Pending"}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-slate-500">
          Ensure the selected tenant has available licences before creating a new client profile.
        </p>
      </div>

      {summarySections.map((section: any) => (
        <div
          key={section.title}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-800">{section.title}</h3>
          <dl className="mt-3 space-y-3 text-sm">
            {section.items.map((item: any) => (
              <div
                key={`${section.title}-${item.label}`}
                className="flex items-start justify-between gap-3"
              >
                <dt className="text-slate-500">{item.label}</dt>
                <dd className="max-w-[160px] text-right font-medium text-slate-800">
                  {item.value || "—"}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">Quick guidance</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          {guidanceItems.map((tip: any) => (
            <li key={tip} className="flex items-start gap-2">
              <span
                className="mt-1 h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: accent.color }}
              />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );

  const footer = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={onClose}
        disabled={isPending}
        className="w-full rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        Cancel
      </button>
      <button
        type="submit"
        form={formId}
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-full bg-[var(--theme-color)] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[rgb(var(--theme-color-700))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--theme-color)] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {isPending ? (
          <>
            Saving
            <Loader2 className="ml-2 h-4 w-4 animate-spin text-white" />
          </>
        ) : (
          "Add client"
        )}
      </button>
    </div>
  );

  const meta = [
    {
      label: "Tenant",
      value: selectedTenant?.name || "Unassigned",
    },
    {
      label: "Verification",
      value: verifiedLabel,
    },
    {
      label: "Country",
      value: formData.country || "Not selected",
    },
  ];

  const shouldRender = isPageMode || isOpen;
  if (!shouldRender) return null;

  return (
    <FormLayout
      mode={mode}
      onClose={onClose}
      isProcessing={isPending}
      title="Add Client"
      description="Create a client profile, connect it to the right tenant workspace, and capture business records."
      accentGradient={accent.gradient}
      accentColor={accent.color}
      meta={meta as any}
      aside={asideContent}
      footer={footer}
      maxWidthClass={isPageMode ? "max-w-full" : "max-w-8xl"}
      kicker={undefined}
      headerBadge={undefined}
      headerActions={undefined}
    >
      <form
        id={formId}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-8"
      >
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Client details</h3>
              <p className="text-sm text-slate-500">
                Personal, business and credential information required to provision access.
              </p>
            </div>
          </header>
          <div className="mt-6 space-y-4">
            <ClientBusinessInputs
              formData={formData}
              handleInputChange={(e: any) => {
                if (e.target) {
                  updateFormData(e.target.id, e.target.value);
                }
              }}
              updateFormData={updateFormData}
              errors={errors}
              tenants={tenantList}
              countries={countries}
              states={states}
              cities={showCityDropdown ? cities : []}
              industries={industries}
              handleSelectChange={handleSelectChange}
              isTenantsFetching={isTenantsFetching}
              isCountriesFetching={isCountriesFetching}
              isStatesFetching={isStatesFetching}
              isCitiesFetching={isCitiesFetching}
              isIndustriesFetching={isIndustriesFetching}
            />
          </div>
        </section>

        {/* Discount Section */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">Pricing Discount</h3>
            <p className="text-sm text-slate-500">
              Optionally apply a default discount that will be used for all purchases by this
              client.
            </p>
          </header>
          <DiscountFormSection
            formData={discountFormData}
            onChange={(data) => setDiscountFormData((prev) => ({ ...prev, ...data }))}
            errors={errors}
          />
        </section>
      </form>
    </FormLayout>
  );
};

export default AddClientModal;
