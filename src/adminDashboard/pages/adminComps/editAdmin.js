import React, { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";
import { useUpdateAdmin } from "../../../hooks/adminHooks/adminHooks";
import FormLayout, {
  formAccent,
  getAccentRgba,
} from "../../components/FormLayout";

export const EditAdminModal = ({
  isOpen,
  onClose,
  admin,
  onUpdateSuccess,
  mode = "modal",
}) => {
  // State to hold form data, initialized with admin prop
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    zip: "",
    country_id: "", // Assuming country_id is used for country selection
    city: "",
    state: "",
    role: "", // Assuming role can be edited
  });

  // Populate form data when the modal opens or admin prop changes
  useEffect(() => {
    if (admin) {
      setFormData({
        first_name: admin.first_name || "",
        last_name: admin.last_name || "",
        email: admin.email || "",
        phone: admin.phone || "",
        address: admin.address || "",
        zip: admin.zip || "",
        country_id: admin.country_id || "", // Use country_id if available
        city: admin.city || "",
        state: admin.state || "",
        role: admin.role || "",
      });
    }
  }, [admin]);

  // Use the useUpdateAdmin hook
  const {
    mutate: updateAdmin, // Renamed mutate to updateAdmin for clarity
    isPending,
    isError,
    error,
  } = useUpdateAdmin();

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const isPageMode = mode === "page";

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!admin?.identifier) {
      //   ToastUtils.error("Admin ID is missing for update.");
      return;
    }

    // Prepare data for update. Only send fields that are editable and might have changed.
    const updatedData = {
      id: admin.identifier, // Admin ID is required for the update mutation
      identifier: admin.identifier,
      adminData: {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        zip: formData.zip,
        country_id: formData.country_id,
        city: formData.city,
        state: formData.state,
        role: formData.role,
      },
    };

    updateAdmin(updatedData, {
      onSuccess: () => {
        ToastUtils.success("Admin updated successfully!");
        if (onUpdateSuccess) {
          onUpdateSuccess(updatedData);
        }
        onClose(); // Close the modal on successful update
      },
      onError: (err) => {
        console.error("Failed to update admin:", err);
        ToastUtils.error(
          err?.message || "Failed to update admin. Please try again."
        );
      },
    });
  };

  const accent = formAccent.primary;
  const formId = "edit-admin-form";
  const contactName = [formData.first_name, formData.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const locationSnapshot = [formData.city, formData.state]
    .filter(Boolean)
    .join(", ");
  const meta = [
    {
      label: "Admin",
      value: contactName || admin?.first_name || "Unnamed",
    },
    {
      label: "Email",
      value: formData.email || admin?.email || "Not set",
    },
    {
      label: "Role",
      value: formData.role || admin?.role || "Admin",
    },
  ];

  const summarySections = useMemo(
    () => [
      {
        title: "Contact",
        items: [
          { label: "Email", value: formData.email || "—" },
          { label: "Phone", value: formData.phone || "—" },
          { label: "Role", value: formData.role || "Admin" },
        ],
      },
      {
        title: "Location",
        items: [
          { label: "Address", value: formData.address || "—" },
          { label: "City", value: formData.city || "—" },
          { label: "State", value: formData.state || "—" },
        ],
      },
    ],
    [
      formData.email,
      formData.phone,
      formData.role,
      formData.address,
      formData.city,
      formData.state,
    ]
  );

  const guidanceItems = [
    "Keep administrator contact details up to date for audit notifications.",
    "If the admin has changed role, reflect that to maintain least privilege.",
    "Consider revoking access if the administrator leaves the organisation.",
  ];

  const shouldRender = isPageMode || isOpen;
  if (!shouldRender) return null;

  const asideContent = (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Administrator
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
            ADM
          </span>
        </div>
        <dl className="mt-4 space-y-2 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <dt>Email</dt>
            <dd className="max-w-[150px] text-right font-medium text-slate-800">
              {formData.email || "Pending"}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>Phone</dt>
            <dd className="font-medium text-slate-800">
              {formData.phone || "—"}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>Location</dt>
            <dd className="max-w-[150px] text-right font-medium text-slate-800">
              {locationSnapshot || "Not captured"}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-slate-500">
          Admin profiles should reflect the current responsibilities of the user
          to maintain proper access hygiene.
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
        <h3 className="text-sm font-semibold text-slate-800">Update checklist</h3>
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

  return (
    <FormLayout
      mode={mode}
      onClose={onClose}
      isProcessing={isPending}
      title={`Edit Admin${admin?.first_name ? ` • ${admin.first_name}` : ""}`}
      description="Adjust administrator contact information and role assignments."
      accentGradient={accent.gradient}
      accentColor={accent.color}
      meta={meta}
      aside={asideContent}
      footer={footer}
      maxWidthClass="max-w-4xl"
      showCloseButton={!isPageMode}
    >
      <form
        id={formId}
        onSubmit={handleSubmit}
        className="space-y-8"
      >
        {isError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error?.message || "Failed to update admin. Please try again."}
          </div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Personal details
              </h3>
              <p className="text-sm text-slate-500">
                Update the administrator’s core profile information.
              </p>
            </div>
          </header>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="first_name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                First name
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label
                htmlFor="last_name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Last name
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Phone
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label
                htmlFor="role"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Role
              </label>
              <input
                type="text"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., admin"
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Address information
              </h3>
              <p className="text-sm text-slate-500">
                Optional location details for audit records.
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
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="input-field"
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
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label
                htmlFor="state"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                State
              </label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label
                htmlFor="zip"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                ZIP / postal code
              </label>
              <input
                type="text"
                id="zip"
                name="zip"
                value={formData.zip}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label
                htmlFor="country_id"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Country
              </label>
              <input
                type="text"
                id="country_id"
                name="country_id"
                value={formData.country_id}
                onChange={handleChange}
                className="input-field"
                placeholder="Country code or ID"
              />
            </div>
          </div>
        </section>
      </form>
    </FormLayout>
  );
};
