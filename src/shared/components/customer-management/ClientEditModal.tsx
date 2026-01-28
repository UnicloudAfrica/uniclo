// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useUpdateClient as useAdminUpdateClient } from "../../../hooks/adminHooks/clientHooks";
import { useUpdateClient as useTenantUpdateClient } from "../../../hooks/clientHooks";
import { useFetchCountries } from "../../../hooks/resource";
import ToastUtils from "../../../utils/toastUtil";
import FormLayout, { formAccent, getAccentRgba } from "../../../adminDashboard/components/FormLayout";

const resolveClientId = (client) => client?.identifier || client?.id || client?.uuid || "";

const ClientEditModal = ({ context = "admin", client, onClose, onClientUpdated }) => {
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    zip: "",
    country: "",
    city: "",
    state: "",
  });
  const [errors, setErrors] = useState({});

  const adminMutation = useAdminUpdateClient();
  const tenantMutation = useTenantUpdateClient();
  const { mutate: updateClient, isPending } =
    context === "tenant" ? tenantMutation : adminMutation;

  const { data: countries } = useFetchCountries();

  useEffect(() => {
    if (!client) return;

    setFormData({
      first_name: client.first_name || "",
      middle_name: client.middle_name || "",
      last_name: client.last_name || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      zip: client.zip || "",
      country: client.country || "",
      city: client.city || "",
      state: client.state || "",
    });
    setErrors({});
  }, [client]);

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.first_name.trim()) newErrors.first_name = "First Name is required";
    if (!formData.last_name.trim()) newErrors.last_name = "Last Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const selectedCountry = countries?.find(
      (countryOption) => countryOption.name === formData.country
    );
    const countryId = selectedCountry ? selectedCountry.id : null;

    const payload = {
      first_name: formData.first_name,
      middle_name: formData.middle_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      zip_code: formData.zip,
      country: formData.country,
      country_id: countryId,
      city: formData.city,
      state: formData.state,
    };

    const clientId = resolveClientId(client);

    updateClient(
      { id: clientId, clientData: payload },
      {
        onSuccess: (updatedData) => {
          ToastUtils.success("Client updated successfully!");
          onClientUpdated?.({ ...client, ...updatedData });
          onClose();
        },
        onError: () => {
          ToastUtils.error("Failed to update client.");
        },
      }
    );
  };

  if (!client) return null;

  const accent = formAccent.primary;
  const formId = "edit-client-form";
  const contactName = [formData.first_name, formData.middle_name, formData.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const locationSnapshot = [formData.city, formData.state, formData.country]
    .filter(Boolean)
    .join(", ");

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
          { label: "Email", value: formData.email || "Not provided" },
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

      {summarySections.map((section) => (
        <div
          key={section.title}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h4 className="text-sm font-semibold text-slate-900">{section.title}</h4>
          <dl className="mt-3 space-y-2 text-sm text-slate-600">
            {section.items.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <dt>{item.label}</dt>
                <dd className="font-medium text-slate-800">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}

      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        <p className="font-semibold text-slate-800">Editing guidance</p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          {guidanceItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </>
  );

  return (
    <FormLayout
      title="Edit client"
      description="Update the contact record and keep details current across the workspace."
      meta={[
        { label: "Client", value: contactName || client?.first_name || "Unnamed" },
        { label: "Country", value: formData.country || client?.country || "Not set" },
        { label: "Verified", value: client?.verified ? "Yes" : "No" },
      ]}
      formId={formId}
      aside={asideContent}
      accent={accent}
      onCancel={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isPending}
      submitLabel="Update client"
    >
      <form id={formId} className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
            <input
              value={formData.first_name}
              onChange={(e) => updateFormData("first_name", e.target.value)}
              className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                errors.first_name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.first_name && (
              <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Middle name</label>
            <input
              value={formData.middle_name}
              onChange={(e) => updateFormData("middle_name", e.target.value)}
              className="w-full rounded-[10px] border border-gray-300 px-3 py-2 text-sm input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
            <input
              value={formData.last_name}
              onChange={(e) => updateFormData("last_name", e.target.value)}
              className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                errors.last_name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.last_name && (
              <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              value={formData.email}
              onChange={(e) => updateFormData("email", e.target.value)}
              className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              value={formData.phone}
              onChange={(e) => updateFormData("phone", e.target.value)}
              className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                errors.phone ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              value={formData.address}
              onChange={(e) => updateFormData("address", e.target.value)}
              className="w-full rounded-[10px] border border-gray-300 px-3 py-2 text-sm input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              value={formData.city}
              onChange={(e) => updateFormData("city", e.target.value)}
              className="w-full rounded-[10px] border border-gray-300 px-3 py-2 text-sm input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input
              value={formData.state}
              onChange={(e) => updateFormData("state", e.target.value)}
              className="w-full rounded-[10px] border border-gray-300 px-3 py-2 text-sm input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input
              value={formData.country}
              onChange={(e) => updateFormData("country", e.target.value)}
              className="w-full rounded-[10px] border border-gray-300 px-3 py-2 text-sm input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
            <input
              value={formData.zip}
              onChange={(e) => updateFormData("zip", e.target.value)}
              className="w-full rounded-[10px] border border-gray-300 px-3 py-2 text-sm input-field"
            />
          </div>
        </section>
      </form>
    </FormLayout>
  );
};

export default ClientEditModal;
