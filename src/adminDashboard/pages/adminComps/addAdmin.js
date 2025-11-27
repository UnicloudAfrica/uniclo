import React, { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useCreateAdmin } from "../../../hooks/adminHooks/adminHooks";
import ToastUtils from "../../../utils/toastUtil";
import FormLayout, {
  formAccent,
  getAccentRgba,
} from "../../components/FormLayout";

export const AddAdminModal = ({ isOpen, onClose, mode = "modal" }) => {
  const isPageMode = mode === "page";
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [errors, setErrors] = useState({});

  const {
    mutate: createAdmin,
    isPending,
    isError,
    error,
    isSuccess,
  } = useCreateAdmin();

  useEffect(() => {
    if (!isPageMode && !isOpen) {
      setFormData({
        first_name: "",
        last_name: "",
        phone: "",
        email: "",
        password: "",
        password_confirmation: "",
      });
      setErrors({});
    }
  }, [isOpen, isPageMode]);

  useEffect(() => {
    if (isError && error) {
      ToastUtils.error(error.message || "Failed to add admin");
    }
    if (isSuccess && !isPending) {
      ToastUtils.success("Admin added successfully");
    }
  }, [isError, error, isSuccess, isPending]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.first_name.trim()) newErrors.first_name = "First name is required.";
    if (!formData.last_name.trim()) newErrors.last_name = "Last name is required.";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required.";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email address is invalid.";
    }
    if (!formData.password.trim()) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long.";
    }
    if (!formData.password_confirmation.trim()) {
      newErrors.password_confirmation = "Confirm password is required.";
    } else if (formData.password_confirmation !== formData.password) {
      newErrors.password_confirmation = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    if (!validateForm()) return;

    const adminData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.phone,
      email: formData.email,
      password: formData.password,
      password_confirmation: formData.password_confirmation,
      role: "admin",
    };

    createAdmin(adminData, {
      onSuccess: () => {
        setFormData({
          first_name: "",
          last_name: "",
          phone: "",
          email: "",
          password: "",
          password_confirmation: "",
        });
        setErrors({});
        onClose();
      },
      onError: (err) => {
        ToastUtils.error(err.message || "Failed to add admin");
      },
    });
  };

  const accent = formAccent.primary;
  const formId = "add-admin-form";
  const contactName = [formData.first_name, formData.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  const summarySections = useMemo(
    () => [
      {
        title: "Account details",
        items: [
          { label: "Full name", value: contactName || "Pending" },
          { label: "Email", value: formData.email || "No email set" },
          { label: "Phone", value: formData.phone || "No phone set" },
        ],
      },
      {
        title: "Security",
        items: [
          {
            label: "Password length",
            value: formData.password ? `${formData.password.length} chars` : "Not set",
          },
          {
            label: "Confirmation",
            value:
              formData.password && formData.password_confirmation
                ? formData.password === formData.password_confirmation
                  ? "Match"
                  : "Mismatch"
                : "Pending",
          },
          { label: "Role", value: "Platform Admin" },
        ],
      },
    ],
    [
      contactName,
      formData.email,
      formData.phone,
      formData.password,
      formData.password_confirmation,
    ]
  );

  const guidanceItems = [
    "Use a unique work email; personal addresses reduce audit clarity.",
    "Set a temporary password and communicate reset expectations.",
    "Ensure administrators enable 2FA immediately after onboarding.",
  ];

  const asideContent = (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Admin overview
            </p>
            <p className="text-lg font-semibold text-slate-800">
              {contactName || "New administrator"}
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
            <dt>Role</dt>
            <dd className="font-medium text-slate-800">Admin</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-slate-500">
          Administrator accounts have full access to the control plane and
          should be provisioned carefully.
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
        <h3 className="text-sm font-semibold text-slate-800">Onboarding tips</h3>
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
        className="inline-flex w-full items-center justify-center rounded-full bg-[#0F62FE] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b51d3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F62FE] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {isPending ? (
          <>
            Saving
            <Loader2 className="ml-2 h-4 w-4 animate-spin text-white" />
          </>
        ) : (
          "Add admin"
        )}
      </button>
    </div>
  );

  const meta = [
    {
      label: "Role",
      value: "Admin",
    },
    {
      label: "Email",
      value: formData.email || "Pending",
    },
    {
      label: "Phone",
      value: formData.phone || "Not provided",
    },
  ];

  const shouldRender = isPageMode || isOpen;
  if (!shouldRender) return null;

  return (
    <FormLayout
      mode={mode}
      onClose={onClose}
      isProcessing={isPending}
      title="Add Admin User"
      description="Provision a new platform administrator with access credentials and contact details."
      accentGradient={accent.gradient}
      accentColor={accent.color}
      meta={meta}
      aside={asideContent}
      footer={footer}
      maxWidthClass={isPageMode ? "max-w-full" : "max-w-6xl"}
    >
      <form
        id={formId}
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        {isError && (
          <div className="md:col-span-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error?.message || "Failed to create admin. Please try again."}
          </div>
        )}

        <div>
          <label
            htmlFor="first_name"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            First name<span className="text-red-500">*</span>
          </label>
          <input
            id="first_name"
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
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
            htmlFor="last_name"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Last name<span className="text-red-500">*</span>
          </label>
          <input
            id="last_name"
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            placeholder="Enter last name"
            className={`w-full input-field ${
              errors.last_name ? "border-red-500" : "border-slate-300"
            }`}
            disabled={isPending}
          />
          {errors.last_name && (
            <p className="mt-1 text-xs text-red-500">{errors.last_name}</p>
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
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+234 801 234 5678"
            className={`w-full input-field ${
              errors.phone ? "border-red-500" : "border-slate-300"
            }`}
            disabled={isPending}
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Email<span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="name@company.com"
            className={`w-full input-field ${
              errors.email ? "border-red-500" : "border-slate-300"
            }`}
            disabled={isPending}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Password<span className="text-red-500">*</span>
          </label>
          <input
            id="password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
            className={`w-full input-field ${
              errors.password ? "border-red-500" : "border-slate-300"
            }`}
            disabled={isPending}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password_confirmation"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Confirm password<span className="text-red-500">*</span>
          </label>
          <input
            id="password_confirmation"
            type="password"
            name="password_confirmation"
            value={formData.password_confirmation}
            onChange={handleChange}
            placeholder="Confirm password"
            className={`w-full input-field ${
              errors.password_confirmation
                ? "border-red-500"
                : "border-slate-300"
            }`}
            disabled={isPending}
          />
          {errors.password_confirmation && (
            <p className="mt-1 text-xs text-red-500">
              {errors.password_confirmation}
            </p>
          )}
        </div>
      </form>
    </FormLayout>
  );
};
