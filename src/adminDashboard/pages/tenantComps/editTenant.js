import React, { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { FileInput } from "../../../utils/fileInput";
import { useUpdateTenant } from "../../../hooks/adminHooks/tenantHooks";
import { useFetchCountries, useFetchIndustries } from "../../../hooks/resource"; // Import the resource hooks
import ToastUtils from "../../../utils/toastUtil";
import FormLayout, {
  formAccent,
  getAccentRgba,
} from "../../components/FormLayout";

const EditPartnerModal = ({ isOpen, onClose, partnerDetails }) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    industry: "",
    address: "",
    registration_number: "",
    tin_number: "",
    email: "",
    phone: "",
    website: "",
    zip: "",
    country: "",
    city: "",
    state: "",
    national_id_document: null,
    registration_document: null,
    utility_bill_document: null,
    logo: null,
    // New fields for business details
    privacy_policy_url: "",
    unsubscription_url: "",
    help_center_url: "",
    logo_href: "",
    theme_color: "#288DD1", // Default color
    secondary_color: "#FFFFFF", // Default color
    ahref_link_color: "#288DD1", // Default color
  });
  const [errors, setErrors] = useState({});
  const {
    mutate: updateTenant,
    isPending,
    isSuccess,
    isError,
    error,
  } = useUpdateTenant();

  // Fetch countries and industries
  const { data: countries, isFetching: isCountriesFetching } =
    useFetchCountries();
  // Access the 'message' array from the industries data
  const { data: industriesData, isFetching: isIndustriesFetching } =
    useFetchIndustries();
  const industries = industriesData?.message || []; // Ensure it's an array

  // Define partner types
  const partnerTypes = [
    { value: "BNG", label: "Business Name" },
    { value: "LLC", label: "Limited Liability Company" },
    { value: "NGO", label: "Non-Governmental Organization" },
    { value: "LLP", label: "Limited Liability Partnership" },
    { value: "Other", label: "Other" },
  ];

  useEffect(() => {
    if (partnerDetails) {
      setFormData({
        name: partnerDetails.name || "",
        type: partnerDetails.type || "",
        industry: partnerDetails.industry || "",
        address: partnerDetails.address || "",
        registration_number: partnerDetails.registration_number || "",
        tin_number: partnerDetails.tin_number || "",
        email: partnerDetails.email || "",
        phone: partnerDetails.phone || "",
        website: partnerDetails.website || "",
        zip: partnerDetails.zip || "",
        country: partnerDetails.country || "",
        city: partnerDetails.city || "",
        state: partnerDetails.state || "",
        national_id_document: partnerDetails.national_id_document || null,
        registration_document: partnerDetails.registration_document || null,
        utility_bill_document: partnerDetails.utility_bill_document || null,
        logo: partnerDetails.logo || null,
        // Populate new fields from partnerDetails
        privacy_policy_url: partnerDetails.privacy_policy_url || "",
        unsubscription_url: partnerDetails.unsubscription_url || "",
        help_center_url: partnerDetails.help_center_url || "",
        logo_href: partnerDetails.logo_href || "",
        theme_color: partnerDetails.theme_color || "#288DD1",
        secondary_color: partnerDetails.secondary_color || "#FFFFFF",
        ahref_link_color: partnerDetails.ahref_link_color || "#288DD1",
      });
      setErrors({}); // Clear errors when new partnerDetails are loaded
    }
  }, [partnerDetails]);

  useEffect(() => {
    if (isSuccess) {
      onClose(); // Close modal on successful update
    }
  }, [isSuccess, onClose]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Partner Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    // Add more validation rules as needed for other fields
    if (
      formData.privacy_policy_url &&
      !/^https?:\/\/\S+$/.test(formData.privacy_policy_url)
    ) {
      newErrors.privacy_policy_url = "Invalid URL format";
    }
    if (
      formData.unsubscription_url &&
      !/^https?:\/\/\S+$/.test(formData.unsubscription_url)
    ) {
      newErrors.unsubscription_url = "Invalid URL format";
    }
    if (
      formData.help_center_url &&
      !/^https?:\/\/\S+$/.test(formData.help_center_url)
    ) {
      newErrors.help_center_url = "Invalid URL format";
    }
    if (formData.logo_href && !/^https?:\/\/\S+$/.test(formData.logo_href)) {
      newErrors.logo_href = "Invalid URL format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null })); // Clear error for the field being updated
  };

  const handleFileChange = (field, files) => {
    // files[0] will contain the base64 string from FileInput
    updateFormData(field, files.length > 0 ? files[0] : null);
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Find the country ID based on the selected country name
      const selectedCountry = countries?.find(
        (countryOption) => countryOption.name === formData.country
      );
      const countryId = selectedCountry ? selectedCountry.id : null;

      const dataToSubmit = {
        business: {
          name: formData.name,
          type: formData.type,
          industry: formData.industry,
          address: formData.address,
          national_id_document: formData.national_id_document,
          registration_document: formData.registration_document,
          utility_bill_document: formData.utility_bill_document,
          logo: formData.logo,
          registration_number: formData.registration_number,
          tin_number: formData.tin_number,
          email: formData.email,
          phone: formData.phone,
          website: formData.website || null, // Ensure null for empty URLs
          zip: formData.zip,
          city: formData.city,
          state: formData.state,
          privacy_policy_url: formData.privacy_policy_url || null,
          unsubscription_url: formData.unsubscription_url || null,
          help_center_url: formData.help_center_url || null,
          logo_href: formData.logo_href || null,
          theme_color: formData.theme_color || null,
          secondary_color: formData.secondary_color || null,
          ahref_link_color: formData.ahref_link_color || null,
          country: formData.country, // Send country name
          country_id: countryId, // Send country ID
          dependant_tenant: partnerDetails.dependant_tenant, // Assuming this is not editable and comes from existing details
          // If 'status' is a required field, it needs to be added to formData and handled here.
          // For now, it's omitted as it's not in the current form structure.
        },
      };

      updateTenant(
        {
          id: partnerDetails.identifier,
          tenantData: dataToSubmit,
        },
        {
          onSuccess: () => {
            ToastUtils.success("Partner edited successfully");
            onClose();
          },
          onError: (err) => {
            console.error("Failed to update partner:", err);
            // Error message is already set by the hook
          },
        }
      );
    }
  };

  const toTitle = (value, fallback = "—") =>
    value
      ? value
        .toString()
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
      : fallback;

  const accent = formAccent.primary;
  const formId = "edit-partner-form";
  const docKeys = [
    "national_id_document",
    "registration_document",
    "utility_bill_document",
    "logo",
  ];
  const uploadedDocs = docKeys.filter((key) => !!formData[key]).length;
  const statusText = toTitle(
    partnerDetails?.status ||
    (partnerDetails?.verified ? "verified" : "pending verification"),
    "Draft"
  );
  const lastUpdated = partnerDetails?.updated_at
    ? new Date(partnerDetails.updated_at).toLocaleDateString()
    : null;
  const dependantLabel = partnerDetails?.dependant_tenant
    ? "Dependant tenant"
    : "Primary tenant";

  const summarySections = useMemo(
    () => [
      {
        title: "Business overview",
        items: [
          {
            label: "Legal name",
            value: formData.name || partnerDetails?.name || "—",
          },
          {
            label: "Industry",
            value: formData.industry || partnerDetails?.industry || "—",
          },
          {
            label: "Type",
            value: formData.type || partnerDetails?.type || "—",
          },
          {
            label: "Registration No.",
            value:
              formData.registration_number ||
              partnerDetails?.registration_number ||
              "—",
          },
        ],
      },
      {
        title: "Key contacts",
        items: [
          { label: "Email", value: formData.email || partnerDetails?.email },
          { label: "Phone", value: formData.phone || partnerDetails?.phone },
          {
            label: "Website",
            value: formData.website || partnerDetails?.website || "—",
          },
        ],
      },
      {
        title: "Branding colours",
        items: [
          {
            label: "Theme",
            value: formData.theme_color || partnerDetails?.theme_color || "—",
          },
          {
            label: "Secondary",
            value:
              formData.secondary_color || partnerDetails?.secondary_color || "—",
          },
          {
            label: "Links",
            value:
              formData.ahref_link_color ||
              partnerDetails?.ahref_link_color ||
              "—",
          },
        ],
      },
    ],
    [
      formData.name,
      partnerDetails?.name,
      formData.industry,
      partnerDetails?.industry,
      formData.type,
      partnerDetails?.type,
      formData.registration_number,
      partnerDetails?.registration_number,
      formData.email,
      partnerDetails?.email,
      formData.phone,
      partnerDetails?.phone,
      formData.website,
      partnerDetails?.website,
      formData.theme_color,
      partnerDetails?.theme_color,
      formData.secondary_color,
      partnerDetails?.secondary_color,
      formData.ahref_link_color,
      partnerDetails?.ahref_link_color,
    ]
  );

  const guidanceItems = [
    "Keep statutory information aligned with provided documents.",
    "Colour palette updates reflect instantly across tenant experiences.",
    "Upload fresh documents if there have been compliance changes.",
  ];

  const asideContent = (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Partner status
            </p>
            <p className="text-lg font-semibold text-slate-800">
              {statusText}
            </p>
          </div>
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
            style={{
              backgroundColor: getAccentRgba(accent.color, 0.12),
              color: accent.color,
            }}
          >
            {uploadedDocs}/{docKeys.length}
          </span>
        </div>
        <dl className="mt-4 space-y-2 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <dt>Tenant type</dt>
            <dd className="font-medium text-slate-800">{dependantLabel}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>Country</dt>
            <dd className="font-medium text-slate-800">
              {formData.country || partnerDetails?.country || "—"}
            </dd>
          </div>
          {lastUpdated && (
            <div className="flex items-center justify-between">
              <dt>Last updated</dt>
              <dd className="font-medium text-slate-800">{lastUpdated}</dd>
            </div>
          )}
        </dl>
        <p className="mt-3 text-xs text-slate-500">
          Files uploaded count includes all supporting brand and compliance
          documents currently attached to the partner.
        </p>
      </div>

      {summarySections.map((section) => (
        <div
          key={section.title}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-800">
            {section.title}
          </h3>
          <dl className="mt-3 space-y-3 text-sm">
            {section.items.map((item) => (
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
        <h3 className="text-sm font-semibold text-slate-800">Update tips</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          {guidanceItems.map((tip) => (
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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
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
        className="inline-flex w-full items-center justify-center rounded-full bg-[#047857] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#036149] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#047857] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {isPending ? (
          <>
            Saving
            <Loader2 className="ml-2 h-4 w-4 animate-spin text-white" />
          </>
        ) : (
          "Save changes"
        )}
      </button>
    </div>
  );

  const meta = [
    {
      label: "Status",
      value: statusText,
    },
    {
      label: "Industry",
      value: formData.industry || partnerDetails?.industry || "Not set",
    },
    {
      label: "Documents",
      value: `${uploadedDocs}/${docKeys.length} uploaded`,
    },
  ];

  if (!isOpen) return null;

  return (
    <FormLayout
      mode="modal"
      onClose={onClose}
      isProcessing={isPending}
      title={`Edit Partner${partnerDetails?.name ? ` • ${partnerDetails.name}` : ""}`}
      description="Refresh partner company details, metadata and attachments to keep the workspace current."
      accentGradient={accent.gradient}
      accentColor={accent.color}
      meta={meta}
      aside={asideContent}
      footer={footer}
      maxWidthClass="max-w-8xl"
    >
      <form
        id={formId}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-8"
      >
        {isError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error?.message || "Failed to save changes. Please try again."}
          </div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Business identity
              </h3>
              <p className="text-sm text-slate-500">
                Legal name, industry alignment and company classifications.
              </p>
            </div>
          </header>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Partner name<span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                placeholder="Enter partner name"
                className={`w-full input-field ${errors.name ? "border-red-500" : "border-slate-300"
                  }`}
                disabled={isPending}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="type"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Entity type
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => updateFormData("type", e.target.value)}
                className={`w-full input-field ${errors.type ? "border-red-500" : "border-slate-300"
                  }`}
                disabled={isPending}
              >
                <option value="">Select a type</option>
                {partnerTypes.map((typeOption) => (
                  <option key={typeOption.value} value={typeOption.value}>
                    {typeOption.label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="mt-1 text-xs text-red-500">{errors.type}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="industry"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Industry
              </label>
              <select
                id="industry"
                value={formData.industry}
                onChange={(e) => updateFormData("industry", e.target.value)}
                className={`w-full input-field ${errors.industry ? "border-red-500" : "border-slate-300"
                  }`}
                disabled={isPending || isIndustriesFetching}
              >
                <option value="">
                  {isIndustriesFetching
                    ? "Loading industries..."
                    : "Select an industry"}
                </option>
                {industries?.map((industryOption) => (
                  <option key={industryOption.name} value={industryOption.name}>
                    {industryOption.name}
                  </option>
                ))}
              </select>
              {errors.industry && (
                <p className="mt-1 text-xs text-red-500">{errors.industry}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="registration_number"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Registration number
              </label>
              <input
                id="registration_number"
                type="text"
                value={formData.registration_number}
                onChange={(e) =>
                  updateFormData("registration_number", e.target.value)
                }
                placeholder="Enter registration number"
                className={`w-full input-field ${errors.registration_number
                    ? "border-red-500"
                    : "border-slate-300"
                  }`}
                disabled={isPending}
              />
            </div>
            <div>
              <label
                htmlFor="tin_number"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                TIN number
              </label>
              <input
                id="tin_number"
                type="text"
                value={formData.tin_number}
                onChange={(e) => updateFormData("tin_number", e.target.value)}
                placeholder="Enter TIN number"
                className={`w-full input-field ${errors.tin_number ? "border-red-500" : "border-slate-300"
                  }`}
                disabled={isPending}
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Contact & communication
              </h3>
              <p className="text-sm text-slate-500">
                Primary communication channels with the partner team.
              </p>
            </div>
          </header>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email address<span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                placeholder="name@company.com"
                className={`w-full input-field ${errors.email ? "border-red-500" : "border-slate-300"
                  }`}
                disabled={isPending}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Phone number<span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                type="text"
                value={formData.phone}
                onChange={(e) => updateFormData("phone", e.target.value)}
                placeholder="+234 801 234 5678"
                className={`w-full input-field ${errors.phone ? "border-red-500" : "border-slate-300"
                  }`}
                disabled={isPending}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label
                htmlFor="website"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Website
              </label>
              <input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => updateFormData("website", e.target.value)}
                placeholder="https://example.com"
                className={`w-full input-field ${errors.website ? "border-red-500" : "border-slate-300"
                  }`}
                disabled={isPending}
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Address & regions
              </h3>
              <p className="text-sm text-slate-500">
                Physical location details used across invoices and compliance.
              </p>
            </div>
          </header>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label
                htmlFor="address"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Street address
              </label>
              <input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => updateFormData("address", e.target.value)}
                placeholder="Enter street address"
                className={`w-full input-field ${errors.address ? "border-red-500" : "border-slate-300"
                  }`}
                disabled={isPending}
              />
            </div>
            <div>
              <label
                htmlFor="city"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                City
              </label>
              <input
                id="city"
                type="text"
                value={formData.city}
                onChange={(e) => updateFormData("city", e.target.value)}
                placeholder="Enter city"
                className={`w-full input-field ${errors.city ? "border-red-500" : "border-slate-300"
                  }`}
                disabled={isPending}
              />
            </div>
            <div>
              <label
                htmlFor="state"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                State / province
              </label>
              <input
                id="state"
                type="text"
                value={formData.state}
                onChange={(e) => updateFormData("state", e.target.value)}
                placeholder="Enter state"
                className={`w-full input-field ${errors.state ? "border-red-500" : "border-slate-300"
                  }`}
                disabled={isPending}
              />
            </div>
            <div>
              <label
                htmlFor="zip"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Zip / postal code
              </label>
              <input
                id="zip"
                type="text"
                value={formData.zip}
                onChange={(e) => updateFormData("zip", e.target.value)}
                placeholder="Enter zip code"
                className={`w-full input-field ${errors.zip ? "border-red-500" : "border-slate-300"
                  }`}
                disabled={isPending}
              />
            </div>
            <div>
              <label
                htmlFor="country"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Country
              </label>
              <select
                id="country"
                value={formData.country}
                onChange={(e) => updateFormData("country", e.target.value)}
                className={`w-full input-field ${errors.country ? "border-red-500" : "border-slate-300"
                  }`}
                disabled={isPending || isCountriesFetching}
              >
                <option value="">
                  {isCountriesFetching
                    ? "Loading countries..."
                    : "Select a country"}
                </option>
                {countries?.map((countryOption) => (
                  <option key={countryOption.id} value={countryOption.name}>
                    {countryOption.name}
                  </option>
                ))}
              </select>
              {errors.country && (
                <p className="mt-1 text-xs text-red-500">{errors.country}</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Digital touchpoints
              </h3>
              <p className="text-sm text-slate-500">
                URLs and colour palette surfaced across branded experiences.
              </p>
            </div>
          </header>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="privacy_policy_url"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Privacy policy URL
              </label>
              <input
                id="privacy_policy_url"
                type="url"
                value={formData.privacy_policy_url}
                onChange={(e) =>
                  updateFormData("privacy_policy_url", e.target.value)
                }
                placeholder="https://..."
                className={`w-full input-field ${errors.privacy_policy_url
                    ? "border-red-500"
                    : "border-slate-300"
                  }`}
                disabled={isPending}
              />
              {errors.privacy_policy_url && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.privacy_policy_url}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="unsubscription_url"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Unsubscription URL
              </label>
              <input
                id="unsubscription_url"
                type="url"
                value={formData.unsubscription_url}
                onChange={(e) =>
                  updateFormData("unsubscription_url", e.target.value)
                }
                placeholder="https://..."
                className={`w-full input-field ${errors.unsubscription_url
                    ? "border-red-500"
                    : "border-slate-300"
                  }`}
                disabled={isPending}
              />
              {errors.unsubscription_url && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.unsubscription_url}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="help_center_url"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Help centre URL
              </label>
              <input
                id="help_center_url"
                type="url"
                value={formData.help_center_url}
                onChange={(e) =>
                  updateFormData("help_center_url", e.target.value)
                }
                placeholder="https://..."
                className={`w-full input-field ${errors.help_center_url
                    ? "border-red-500"
                    : "border-slate-300"
                  }`}
                disabled={isPending}
              />
              {errors.help_center_url && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.help_center_url}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="logo_href"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Logo hyperlink
              </label>
              <input
                id="logo_href"
                type="url"
                value={formData.logo_href}
                onChange={(e) => updateFormData("logo_href", e.target.value)}
                placeholder="https://..."
                className={`w-full input-field ${errors.logo_href ? "border-red-500" : "border-slate-300"
                  }`}
                disabled={isPending}
              />
              {errors.logo_href && (
                <p className="mt-1 text-xs text-red-500">{errors.logo_href}</p>
              )}
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="theme_color"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Theme colour
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="theme_color"
                  type="color"
                  value={formData.theme_color}
                  onChange={(e) =>
                    updateFormData("theme_color", e.target.value)
                  }
                  className="h-10 w-10 cursor-pointer rounded-md border border-slate-300"
                  disabled={isPending}
                  title="Select theme colour"
                />
                <input
                  type="text"
                  value={formData.theme_color}
                  onChange={(e) =>
                    updateFormData("theme_color", e.target.value)
                  }
                  className="input-field w-full"
                  placeholder="#RRGGBB"
                  disabled={isPending}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="secondary_color"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Secondary colour
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="secondary_color"
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) =>
                    updateFormData("secondary_color", e.target.value)
                  }
                  className="h-10 w-10 cursor-pointer rounded-md border border-slate-300"
                  disabled={isPending}
                  title="Select secondary colour"
                />
                <input
                  type="text"
                  value={formData.secondary_color}
                  onChange={(e) =>
                    updateFormData("secondary_color", e.target.value)
                  }
                  className="input-field w-full"
                  placeholder="#RRGGBB"
                  disabled={isPending}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="ahref_link_color"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Link colour
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="ahref_link_color"
                  type="color"
                  value={formData.ahref_link_color}
                  onChange={(e) =>
                    updateFormData("ahref_link_color", e.target.value)
                  }
                  className="h-10 w-10 cursor-pointer rounded-md border border-slate-300"
                  disabled={isPending}
                  title="Select link colour"
                />
                <input
                  type="text"
                  value={formData.ahref_link_color}
                  onChange={(e) =>
                    updateFormData("ahref_link_color", e.target.value)
                  }
                  className="input-field w-full"
                  placeholder="#RRGGBB"
                  disabled={isPending}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Compliance documents
              </h3>
              <p className="text-sm text-slate-500">
                Upload up-to-date verification documents in PDF, JPG or PNG.
              </p>
            </div>
          </header>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <FileInput
              id="national_id_document"
              label="National ID document"
              onChange={(e) =>
                handleFileChange("national_id_document", e.target.files)
              }
              selectedFile={formData.national_id_document}
              error={errors.national_id_document}
              accept=".pdf,.jpg,.png"
            />
            <FileInput
              id="registration_document"
              label="Registration document"
              onChange={(e) =>
                handleFileChange("registration_document", e.target.files)
              }
              selectedFile={formData.registration_document}
              error={errors.registration_document}
              accept=".pdf,.jpg,.png"
            />
            <FileInput
              id="utility_bill_document"
              label="Utility bill"
              onChange={(e) =>
                handleFileChange("utility_bill_document", e.target.files)
              }
              selectedFile={formData.utility_bill_document}
              error={errors.utility_bill_document}
              accept=".pdf,.jpg,.png"
            />
            <FileInput
              id="logo"
              label="Company logo"
              onChange={(e) => handleFileChange("logo", e.target.files)}
              selectedFile={formData.logo}
              error={errors.logo}
              accept=".jpg,.png"
            />
          </div>
        </section>
      </form>
    </FormLayout>
  );
};

export default EditPartnerModal;
