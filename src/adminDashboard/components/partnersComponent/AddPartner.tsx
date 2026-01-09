// @ts-nocheck
import React, { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  useFetchCountries,
  useFetchIndustries,
  useFetchStatesById,
  useFetchCitiesById,
} from "../../../hooks/resource";
import { useCreateTenant } from "../../../hooks/adminHooks/tenantHooks";
import { useAssignDiscount } from "../../../hooks/useDiscounts";
import CreateAccount from "../../pages/tenantComps/CreateAccount";
import BusinessInfo from "../../pages/tenantComps/BusinessInfo";
import BusinessAddress from "../../pages/tenantComps/BusinessAddress";
import UploadFiles from "../../pages/tenantComps/UploadFiles";
import BillingConfigStep from "../../pages/tenantComps/BillingConfigStep";
import StepNavigation from "../../pages/tenantComps/StepNavigation";
import ToastUtils from "../../../utils/toastUtil";
import DiscountFormSection, {
  getDefaultDiscountFormData,
  DiscountFormData,
} from "../../../shared/components/DiscountFormSection";
import FormLayout, { formAccent, getAccentRgba } from "../../components/FormLayout";

interface AddPartnerProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "modal" | "page";
}

const AddPartner: React.FC<AddPartnerProps> = ({ isOpen, onClose, mode = "modal" }) => {
  const isPageMode = mode === "page";
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "tenant",
    force_password_reset: true,
    status: "",
    domain: "",
    first_name: "",
    last_name: "",
    verified: false,
    verification_token: "",
    business: {
      email: "",
      name: "",
      type: "CAC_BASIC",
      company_type: "",
      industry: "",
      address: "",
      registration_number: "",
      tin_number: "",
      website: "",
      zip: "",
      country: "",
      country_id: "",
      city: "",
      state: "",
      phone: "",
      registration_document: null,
      utility_bill_document: null,
      tinCertificate: null,
      nationalIdDocument: null,
      businessLogo: null,
      dependant_tenant: false,
      verified: false,
    },
    billing: {
      billing_model: "direct",
      allowed_billing_models: ["direct", "prepaid_credit"],
      credit_limit_cents: 0,
      margin_percent: 0,
      payment_terms_days: 30,
      auto_suspend_on_overdue: true,
      allow_client_gateway: false,
    },
  });
  const [discountFormData, setDiscountFormData] = useState<DiscountFormData>(
    getDefaultDiscountFormData()
  );
  const [errors, setErrors] = useState<any>({});

  const { mutate: createTenant, isPending } = useCreateTenant();
  const { mutate: assignDiscount, isPending: isAssigningDiscount } = useAssignDiscount();
  const { data: industries, isFetching: isIndustriesFetching } = useFetchIndustries();
  const { data: countries, isFetching: isCountriesFetching } = useFetchCountries();
  const { data: states, isFetching: isStatesFetching } = useFetchStatesById(
    formData.business.country_id,
    {
      enabled: !!formData.business.country_id,
    }
  );
  const { data: cities, isFetching: isCitiesFetching } = useFetchCitiesById(
    formData.business.state,
    {
      enabled: !!formData.business.state,
    }
  );

  const steps = [
    {
      component: CreateAccount,
      label: "Create Account",
      description: "Set the account owner and authentication details.",
      validate: CreateAccount.validate,
    },
    {
      component: (props: any) => (
        <BusinessInfo
          {...props}
          industries={industries}
          isIndustriesFetching={isIndustriesFetching}
          setErrors={setErrors} // Pass setErrors
        />
      ),
      label: "Business Info",
      description: "Capture the partner’s organisation and industry details.",
      validate: BusinessInfo.validate,
    },
    {
      component: (props: any) => (
        <BusinessAddress
          {...props}
          countries={countries}
          isCountriesFetching={isCountriesFetching}
          states={states}
          isStatesFetching={isStatesFetching}
          cities={cities}
          isCitiesFetching={isCitiesFetching}
          setErrors={setErrors} // Pass setErrors to BusinessAddress if needed
        />
      ),
      label: "Business Address",
      description: "Confirm geographic information and statutory identifiers.",
      validate: BusinessAddress.validate,
    },
    {
      component: (props: any) => (
        <UploadFiles
          {...props}
          setErrors={setErrors} // Pass setErrors to UploadFiles if needed
        />
      ),
      label: "Upload Document",
      description: "Attach supporting documentation to complete onboarding.",
      validate: UploadFiles.validate,
    },
    {
      component: (props: any) => (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">Default Pricing Discount</h3>
            <p className="text-sm text-slate-500">
              Optionally apply a default discount for this tenant. This discount will apply to all
              purchases.
            </p>
          </header>
          <DiscountFormSection
            formData={discountFormData}
            onChange={(data) => setDiscountFormData((prev) => ({ ...prev, ...data }))}
            errors={errors}
          />
        </div>
      ),
      label: "Discount Settings",
      description: "Set optional default pricing discount for this tenant.",
      validate: () => ({}), // No validation required for discount step
    },
    {
      component: (props: any) => (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">Billing Configuration</h3>
            <p className="text-sm text-slate-500">
              Configure billing model, credit limits, and payment terms for this partner.
            </p>
          </header>
          <BillingConfigStep {...props} />
        </div>
      ),
      label: "Billing Settings",
      description: "Set billing model, credit limits, and payment gateway permissions.",
      validate: BillingConfigStep.validate,
    },
  ];

  const validateStep = () => {
    const stepErrors = steps[currentStep].validate(formData);
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
      setErrors({});
    } else {
      ToastUtils.error("Please correct the errors in the form.");
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    setErrors({});
  };

  const handleSubmit = () => {
    if (validateStep()) {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.business.phone,
        email: formData.email,
        role: formData.role,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
        force_password_reset: formData.force_password_reset,
        status: formData.status,
        domain: `${formData.domain}.unicloudafrica.com`,
        verified: formData.verified,
        verification_token: formData.verification_token,
        business: {
          name: formData.business.name,
          company_type: formData.business.company_type,
          type: formData.business.type,
          industry: formData.business.industry,
          address: formData.business.address,
          registration_number: formData.business.registration_number,
          tin_number: formData.business.tin_number,
          email: formData.business.email,
          phone: formData.business.phone,
          website: formData.business.website,
          zip: formData.business.zip,
          country: formData.business.country,
          country_id: formData.business.country_id,
          city: formData.business.city,
          state: formData.business.state,
          registration_document: formData.business.registration_document,
          utility_bill_document: formData.business.utility_bill_document,
          tin_certificate: formData.business.tinCertificate,
          national_id_document: formData.business.nationalIdDocument,
          logo: formData.business.businessLogo,
          dependant_tenant: formData.business.dependant_tenant,
          verified: formData.business.verified,
        },
        // Billing configuration
        billing_model: formData.billing?.billing_model || "direct",
        allowed_billing_models: formData.billing?.allowed_billing_models || [
          "direct",
          "prepaid_credit",
        ],
        credit_limit_cents: formData.billing?.credit_limit_cents || 0,
        margin_percent: formData.billing?.margin_percent || 0,
        payment_terms_days: formData.billing?.payment_terms_days || 30,
        auto_suspend_on_overdue: formData.billing?.auto_suspend_on_overdue ?? true,
        allow_client_gateway: formData.billing?.allow_client_gateway ?? false,
      };

      createTenant(payload, {
        onSuccess: (response: any) => {
          const tenantId = response?.data?.id;

          // If discount is enabled and we have a tenant ID, assign the discount
          if (discountFormData.enabled && discountFormData.value && tenantId) {
            const discountPayload = {
              discount_type: discountFormData.type,
              value: parseFloat(discountFormData.value),
              starts_at: discountFormData.isPermanent ? null : discountFormData.startsAt || null,
              ends_at: discountFormData.isPermanent ? null : discountFormData.endsAt || null,
              notes: discountFormData.notes || null,
            };

            assignDiscount(
              { entityType: "tenant", entityId: tenantId, data: discountPayload },
              {
                onSuccess: () => {
                  ToastUtils.success("Partner added with discount successfully!");
                  resetFormAndClose();
                },
                onError: () => {
                  ToastUtils.warning("Partner created but discount assignment failed.");
                  resetFormAndClose();
                },
              }
            );
          } else {
            ToastUtils.success("Partner added successfully!");
            resetFormAndClose();
          }

          function resetFormAndClose() {
            setFormData({
              email: "",
              password: "",
              confirmPassword: "",
              role: "tenant",
              force_password_reset: true,
              status: "",
              domain: "",
              first_name: "",
              last_name: "",
              verified: false,
              verification_token: "",
              business: {
                email: "",
                name: "",
                type: "CAC_BASIC",
                company_type: "",
                industry: "",
                address: "",
                registration_number: "",
                tin_number: "",
                website: "",
                zip: "",
                country: "",
                country_id: "",
                city: "",
                state: "",
                phone: "",
                registration_document: null,
                utility_bill_document: null,
                tinCertificate: null,
                nationalIdDocument: null,
                businessLogo: null,
                dependant_tenant: false,
                verified: false,
              },
              billing: {
                billing_model: "direct",
                allowed_billing_models: ["direct", "prepaid_credit"],
                credit_limit_cents: 0,
                margin_percent: 0,
                payment_terms_days: 30,
                auto_suspend_on_overdue: true,
                allow_client_gateway: false,
              },
            });
            setDiscountFormData(getDefaultDiscountFormData());
            setCurrentStep(0);
            onClose();
          }
        },
        onError: (error: any) => {
          // ToastUtils.error(error.message || "Failed to add tenant");
        },
      });
    } else {
      ToastUtils.error("Please correct the errors in the form.");
    }
  };

  const accent = formAccent.primary;
  const docKeys = [
    "registration_document",
    "utility_bill_document",
    "tinCertificate",
    "nationalIdDocument",
    "businessLogo",
  ];

  const uploadedDocs = docKeys.filter((key) => (formData.business as any)[key]).length;
  const progress = Math.round(((currentStep + 1) / steps.length) * 100);
  const domainPreview = formData.domain ? `${formData.domain}.unicloudafrica.com` : "Not assigned";
  const contactName = [formData.first_name, formData.last_name].filter(Boolean).join(" ").trim();

  const toTitle = (value: string) =>
    value
      ? value
          .toString()
          .replace(/[_-]+/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase())
      : "Not provided";

  const ActiveStep = steps[currentStep].component as React.ComponentType<any>;
  const activeStepContent = (
    <ActiveStep
      formData={formData}
      setFormData={setFormData}
      errors={errors}
      setErrors={setErrors as any}
    />
  );

  const summarySections = useMemo(
    () => [
      {
        title: "Account Contact",
        items: [
          { label: "Full name", value: contactName || "Pending contact" },
          { label: "Email", value: formData.email || "Pending email" },
          { label: "Status", value: toTitle(formData.status) },
          { label: "Domain", value: domainPreview },
        ],
      },
      {
        title: "Business Profile",
        items: [
          {
            label: "Legal name",
            value: formData.business.name || "Not captured",
          },
          {
            label: "Industry",
            value: formData.business.industry || "Select industry",
          },
          {
            label: "Company type",
            value: formData.business.company_type || "Pending selection",
          },
          {
            label: "Phone",
            value: formData.business.phone || "Not provided",
          },
        ],
      },
      {
        title: "Compliance & Docs",
        items: [
          {
            label: "Registration No.",
            value: formData.business.registration_number || "—",
          },
          { label: "TIN number", value: formData.business.tin_number || "—" },
          {
            label: "Attachments",
            value: `${uploadedDocs}/${docKeys.length} uploaded`,
          },
          {
            label: "Website",
            value: formData.business.website || "Not provided",
          },
        ],
      },
    ],
    [
      contactName,
      domainPreview,
      formData.email,
      formData.business.name,
      formData.business.industry,
      formData.business.company_type,
      formData.business.phone,
      formData.business.registration_number,
      formData.business.tin_number,
      formData.business.website,
      uploadedDocs,
      docKeys.length,
      formData.status,
    ]
  );

  const asideContent = (
    <>
      <StepNavigation
        steps={steps}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        validateStep={validateStep}
        orientation="vertical"
        accentColor={accent.color}
      />
      <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Completion
            </p>
            <p className="text-lg font-semibold text-slate-800">{progress}% complete</p>
          </div>
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
            style={{
              backgroundColor: getAccentRgba(accent.color, 0.12),
              color: accent.color,
            }}
          >
            {currentStep + 1}
          </span>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${getAccentRgba(
                accent.color,
                0.6
              )} 0%, ${accent.color} 100%)`,
            }}
          />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          You can revisit earlier sections at any time without losing the captured data.
        </p>
      </div>
      {summarySections.map((section: any) => (
        <div
          key={section.title}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-800">{section.title}</h3>
          <dl className="mt-3 space-y-3">
            {section.items.map((item: any) => (
              <div
                key={`${section.title}-${item.label}`}
                className="flex items-start justify-between gap-3 text-sm"
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
    </>
  );

  const footer = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={currentStep > 0 ? handleBack : onClose}
        disabled={isPending}
        className="w-full rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {currentStep > 0 ? "Previous step" : "Cancel"}
      </button>
      {currentStep < steps.length - 1 ? (
        <button
          type="button"
          onClick={handleNext}
          disabled={isPending}
          className="inline-flex w-full items-center justify-center rounded-full bg-[#0F62FE] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b51d3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F62FE] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        >
          Continue
          {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin text-white" />}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="inline-flex w-full items-center justify-center rounded-full bg-[#047857] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#036149] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#047857] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        >
          {isPending ? (
            <>
              Creating
              <Loader2 className="ml-2 h-4 w-4 animate-spin text-white" />
            </>
          ) : (
            "Create partner"
          )}
        </button>
      )}
    </div>
  );

  const meta = [
    {
      label: "Current stage",
      value: `${currentStep + 1} / ${steps.length}`,
      hint: steps[currentStep].label,
    },
    {
      label: "Subdomain",
      value: domainPreview,
    },
    {
      label: "Documents",
      value: `${uploadedDocs}/${docKeys.length} uploaded`,
    },
  ];

  const shouldRender = isPageMode || isOpen;
  if (!shouldRender) return null;

  return (
    <FormLayout
      mode={mode}
      onClose={onClose}
      isProcessing={isPending}
      title="Add Partner"
      description="Capture partner profile, regional presence, and supporting documentation to complete onboarding."
      accentGradient={accent.gradient}
      accentColor={accent.color}
      meta={meta as any}
      aside={asideContent}
      footer={footer}
      maxWidthClass="max-w-8xl"
    >
      {activeStepContent}
    </FormLayout>
  );
};

export default AddPartner;
