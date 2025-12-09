// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useUpdateClient } from "../../../hooks/adminHooks/clientHooks";
import ToastUtils from "../../../utils/toastUtil";
import { useFetchCountries } from "../../../hooks/resource"; // Import the resource hook
import FormLayout, { formAccent, getAccentRgba } from "../../components/FormLayout";

interface EditClientModalProps {
  client: any;
  onClose: () => void;
  onClientUpdated?: (client: any) => void;
  isOpen?: boolean; // Added for consistency, though not strictly used in the original component logic directly but good for modal patterns
}

export const EditClientModal: React.FC<EditClientModalProps> = ({
  client,
  onClose,
  onClientUpdated,
}) => {
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    zip: "",
    country: "", // This will store the country name
    city: "",
    state: "",
  });
  const [errors, setErrors] = useState<any>({});

  const { mutate: updateClient, isPending } = useUpdateClient();
  const { data: countries, isFetching: isCountriesFetching } = useFetchCountries();

  // Populate form data when client details change
  useEffect(() => {
    if (client) {
      setFormData({
        first_name: client.first_name || "",
        middle_name: client.middle_name || "",
        last_name: client.last_name || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        zip: client.zip || "",
        country: client.country || "", // Set initial country name
        city: client.city || "",
        state: client.state || "",
      });
      setErrors({}); // Clear errors when new clientDetails are loaded
    }
  }, [client]);

  // Helper function to update form data and clear associated errors
  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev: any) => ({ ...prev, [field]: null }));
  };

  // Validate form fields before submission
  const validateForm = () => {
    const newErrors: any = {};
    if (!formData.first_name.trim()) newErrors.first_name = "First Name is required";
    if (!formData.last_name.trim()) newErrors.last_name = "Last Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      // Find the country ID based on the selected country name
      const selectedCountry = countries?.find(
        (countryOption: any) => countryOption.name === formData.country
      );
      const countryId = selectedCountry ? selectedCountry.id : null;

      const dataToSubmit = {
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        zip_code: formData.zip,
        country: formData.country, // Send country name
        country_id: countryId, // Send country ID
        city: formData.city,
        state: formData.state,
      };

      updateClient(
        { id: client.identifier, clientData: dataToSubmit },
        {
          onSuccess: (updatedData: any) => {
            ToastUtils.success("Client updated successfully!");
            if (onClientUpdated) {
              onClientUpdated({ ...client, ...updatedData });
            }
            onClose();
          },
          onError: (err: any) => {
            // ToastUtils.error(err?.message || "Failed to update client.");
          },
        }
      );
    }
  };

  const accent = formAccent.primary;
  const formId = "edit-client-form";
  const contactName = [formData.first_name, formData.middle_name, formData.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const locationSnapshot = [formData.city, formData.state, formData.country]
    .filter(Boolean)
    .join(", ");
  const meta = [
    {
      label: "Client",
      value: contactName || client?.first_name || "Unnamed",
    },
    {
      label: "Country",
      value: formData.country || client?.country || "Not set",
    },
    {
      label: "Verified",
      value: client?.verified ? "Yes" : "No",
    },
  ];

  const summarySections = useMemo(
    () => [
      {
        title: "Personal",
        items: [
          { label: "First name", value: formData.first_name || "—" },
          { label: "Last name", value: formData.last_name || "—" },
          { label: "Phone", value: formData.phone || "—" },
        ],
      },
      {
        title: "Address",
        items: [
          { label: "Street", value: formData.address || "—" },
          { label: "City", value: formData.city || "—" },
          { label: "State", value: formData.state || "—" },
        ],
      },
      {
        title: "Compliance",
        items: [
          { label: "ZIP", value: formData.zip || "—" },
          { label: "Country", value: formData.country || "—" },
          {
            label: "Email",
            value: formData.email || "Not provided",
          },
        ],
      },
    ],
    [
      formData.first_name,
      formData.last_name,
      formData.phone,
      formData.address,
      formData.city,
      formData.state,
      formData.zip,
      formData.country,
      formData.email,
    ]
  );

  const guidanceItems = [
    "Keep personal details aligned with the client's identification.",
    "Country selection drives applicable tax rules for billing.",
    "Phone number is used for notification workflows and MFA.",
  ];

  const asideContent = (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Client summary
            </p>
            <p className="text-lg font-semibold text-slate-800">
              {contactName || "Incomplete record"}
            </p>
          </div>
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
            style={{
              backgroundColor: getAccentRgba(accent.color, 0.12),
              color: accent.color,
            }}
          >
            {formData.email ? "✓" : "•"}
          </span>
        </div>
        <dl className="mt-4 space-y-2 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <dt>Email</dt>
            <dd className="max-w-[150px] text-right font-medium text-slate-800">
              {formData.email || "Not set"}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>Phone</dt>
            <dd className="font-medium text-slate-800">{formData.phone || "—"}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>Location</dt>
            <dd className="max-w-[150px] text-right font-medium text-slate-800">
              {locationSnapshot || "Pending"}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-slate-500">
          Ensure the client’s contact information stays current to keep support workflows smooth.
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
        <h3 className="text-sm font-semibold text-slate-800">Update checklist</h3>
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

  return (
    <FormLayout
      mode="modal"
      onClose={onClose}
      isProcessing={isPending}
      title={`Edit Client${client?.first_name ? ` • ${client.first_name}` : ""}`}
      description="Update client contact information and address records to keep your directory accurate."
      accentGradient={accent.gradient}
      accentColor={accent.color}
      meta={meta as any}
      aside={asideContent}
      footer={footer}
      maxWidthClass="max-w-4xl"
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
              <h3 className="text-base font-semibold text-slate-900">Personal details</h3>
              <p className="text-sm text-slate-500">
                Core information used across authentication and communications.
              </p>
            </div>
          </header>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="first_name" className="mb-2 block text-sm font-medium text-slate-700">
                First name<span className="text-red-500">*</span>
              </label>
              <input
                id="first_name"
                type="text"
                value={formData.first_name}
                onChange={(e) => updateFormData("first_name", e.target.value)}
                placeholder="Enter first name"
                className={`w-full input-field ${
                  errors.first_name ? "border-red-500" : "border-slate-300"
                }`}
                disabled={isPending}
              />
              {errors.first_name && (
                <p className="mt-1 text-xs text-red-500">{errors.first_name}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="middle_name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Middle name
              </label>
              <input
                id="middle_name"
                type="text"
                value={formData.middle_name}
                onChange={(e) => updateFormData("middle_name", e.target.value)}
                placeholder="Enter middle name"
                className="w-full input-field border-slate-300"
                disabled={isPending}
              />
            </div>
            <div>
              <label htmlFor="last_name" className="mb-2 block text-sm font-medium text-slate-700">
                Last name<span className="text-red-500">*</span>
              </label>
              <input
                id="last_name"
                type="text"
                value={formData.last_name}
                onChange={(e) => updateFormData("last_name", e.target.value)}
                placeholder="Enter last name"
                className={`w-full input-field ${
                  errors.last_name ? "border-red-500" : "border-slate-300"
                }`}
                disabled={isPending}
              />
              {errors.last_name && <p className="mt-1 text-xs text-red-500">{errors.last_name}</p>}
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                Email address<span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                placeholder="name@company.com"
                className={`w-full input-field ${
                  errors.email ? "border-red-500" : "border-slate-300"
                }`}
                disabled={isPending}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="mb-2 block text-sm font-medium text-slate-700">
                Phone number<span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                type="text"
                value={formData.phone}
                onChange={(e) => updateFormData("phone", e.target.value)}
                placeholder="+234 801 234 5678"
                className={`w-full input-field ${
                  errors.phone ? "border-red-500" : "border-slate-300"
                }`}
                disabled={isPending}
              />
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Address information</h3>
              <p className="text-sm text-slate-500">
                Physical mailing and billing details for the client.
              </p>
            </div>
          </header>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="address" className="mb-2 block text-sm font-medium text-slate-700">
                Street address
              </label>
              <input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => updateFormData("address", e.target.value)}
                placeholder="Enter street address"
                className="w-full input-field border-slate-300"
                disabled={isPending}
              />
            </div>
            <div>
              <label htmlFor="city" className="mb-2 block text-sm font-medium text-slate-700">
                City
              </label>
              <input
                id="city"
                type="text"
                value={formData.city}
                onChange={(e) => updateFormData("city", e.target.value)}
                placeholder="Enter city"
                className="w-full input-field border-slate-300"
                disabled={isPending}
              />
            </div>
            <div>
              <label htmlFor="state" className="mb-2 block text-sm font-medium text-slate-700">
                State / province
              </label>
              <input
                id="state"
                type="text"
                value={formData.state}
                onChange={(e) => updateFormData("state", e.target.value)}
                placeholder="Enter state"
                className="w-full input-field border-slate-300"
                disabled={isPending}
              />
            </div>
            <div>
              <label htmlFor="zip" className="mb-2 block text-sm font-medium text-slate-700">
                ZIP / postal code
              </label>
              <input
                id="zip"
                type="text"
                value={formData.zip}
                onChange={(e) => updateFormData("zip", e.target.value)}
                placeholder="Enter ZIP code"
                className="w-full input-field border-slate-300"
                disabled={isPending}
              />
            </div>
            <div>
              <label htmlFor="country" className="mb-2 block text-sm font-medium text-slate-700">
                Country
              </label>
              <select
                id="country"
                value={formData.country}
                onChange={(e) => updateFormData("country", e.target.value)}
                className={`w-full input-field ${
                  errors.country ? "border-red-500" : "border-slate-300"
                }`}
                disabled={isPending || isCountriesFetching}
              >
                <option value="">
                  {isCountriesFetching ? "Loading countries..." : "Select a country"}
                </option>
                {countries?.map((countryOption: any) => (
                  <option key={countryOption.id} value={countryOption.name}>
                    {countryOption.name}
                  </option>
                ))}
              </select>
              {errors.country && <p className="mt-1 text-xs text-red-500">{errors.country}</p>}
            </div>
          </div>
        </section>
      </form>
    </FormLayout>
  );
};

export default EditClientModal;
