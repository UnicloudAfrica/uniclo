import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  useFetchCountries,
  useFetchIndustries,
  useFetchStatesById,
  useFetchCitiesById,
} from "../../../hooks/resource";
import CreateAccount from "../../../adminDashboard/pages/tenantComps/CreateAccount";
import BusinessInfo from "../../../adminDashboard/pages/tenantComps/BusinessInfo";
import BusinessAddress from "../../../adminDashboard/pages/tenantComps/BusinessAddress";
import UploadFiles from "../../../adminDashboard/pages/tenantComps/UploadFiles";
import StepNavigation from "../../../adminDashboard/pages/tenantComps/StepNavigation";
import FormLayout, {
  formAccent,
  getAccentRgba,
} from "../../../adminDashboard/components/FormLayout";
import ToastUtils from "../../../utils/toastUtil.ts";
import { useCreateTenantPartner } from "../../../hooks/tenantHooks/partnerHooks";
import { getBaseDomain } from "../../../utils/getSubdomain";

const TenantAddPartnerWizard = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const baseDomain = getBaseDomain();
  const domainSuffix = baseDomain ? `.${baseDomain}` : "";
  const displaySuffix = domainSuffix || ".your-domain.com";
  const exampleDomain = baseDomain ? `acme.${baseDomain}` : "acme.your-domain.com";
  const domainHint = baseDomain
    ? `Suffix: ${baseDomain}. Example: ${exampleDomain}`
    : `Suffix uses your deployment base domain in production. Example: ${exampleDomain}`;
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "tenant",
    force_password_reset: true,
    status: "",
    verified: false,
    verification_token: "",
    domain: "",
    first_name: "",
    last_name: "",
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
      dependant_tenant: true,
      verified: false,
    },
  });
  const [errors, setErrors] = useState({});

  const { mutate: createPartner, isPending } = useCreateTenantPartner();
  const { data: industries, isFetching: isIndustriesFetching } = useFetchIndustries();
  const { data: countries, isFetching: isCountriesFetching } = useFetchCountries();
  const { data: states, isFetching: isStatesFetching } = useFetchStatesById(
    formData.business.country_id,
    { enabled: !!formData.business.country_id }
  );
  const { data: cities, isFetching: isCitiesFetching } = useFetchCitiesById(
    formData.business.state,
    { enabled: !!formData.business.state }
  );

  const steps = [
    {
      component: CreateAccount,
      label: "Create Account",
      description: "Set the account owner and authentication details.",
      validate: CreateAccount.validate,
    },
    {
      component: (props) => (
        <BusinessInfo
          {...props}
          industries={industries}
          isIndustriesFetching={isIndustriesFetching}
          setErrors={setErrors}
        />
      ),
      label: "Business Info",
      description: "Capture the partner’s organisation and industry details.",
      validate: BusinessInfo.validate,
    },
    {
      component: (props) => (
        <BusinessAddress
          {...props}
          countries={countries}
          isCountriesFetching={isCountriesFetching}
          states={states}
          isStatesFetching={isStatesFetching}
          cities={cities}
          isCitiesFetching={isCitiesFetching}
          setErrors={setErrors}
        />
      ),
      label: "Business Address",
      description: "Confirm geographic information and statutory identifiers.",
      validate: BusinessAddress.validate,
    },
    {
      component: (props) => <UploadFiles {...props} setErrors={setErrors} />,
      label: "Upload Document",
      description: "Attach supporting documentation to complete onboarding.",
      validate: UploadFiles.validate,
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
    if (!validateStep()) {
      ToastUtils.error("Please correct the errors in the form.");
      return;
    }

    const payload = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.business.phone,
      email: formData.email,
      password: formData.password,
      password_confirmation: formData.confirmPassword,
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
      },
    };

    if (formData.domain) {
      payload.domain = `${formData.domain}${domainSuffix}`;
    }

    createPartner(payload, {
      onSuccess: () => {
        ToastUtils.success("Partner workspace created.");
        onClose?.();
      },
      onError: (error) => {
        ToastUtils.error(error?.message || "Failed to create partner.");
      },
    });
  };

  const accent = formAccent.primary;
  const docKeys = [
    "registration_document",
    "utility_bill_document",
    "tinCertificate",
    "nationalIdDocument",
    "businessLogo",
  ];

  const uploadedDocs = docKeys.filter((key) => formData.business[key]).length;
  const progress = Math.round(((currentStep + 1) / steps.length) * 100);
  const domainPreview = formData.domain ? `${formData.domain}${displaySuffix}` : "Not assigned";
  const contactName = [formData.first_name, formData.last_name].filter(Boolean).join(" ").trim();

  const toTitle = (value) =>
    value
      ? value
          .toString()
          .replace(/[_-]+/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase())
      : "Not provided";

  const ActiveStep = steps[currentStep].component;
  const activeStepContent = ActiveStep({
    formData,
    setFormData,
    errors,
    setErrors,
  });

  const summarySections = useMemo(
    () => [
      {
        title: "Account Contact",
        items: [
          { label: "Name", value: contactName || "—" },
          { label: "Email", value: formData.email || "—" },
          { label: "Phone", value: formData.business.phone || "—" },
        ],
      },
      {
        title: "Business Overview",
        items: [
          { label: "Company", value: formData.business.name || "—" },
          { label: "Industry", value: toTitle(formData.business.industry) },
          { label: "Company Type", value: toTitle(formData.business.company_type) },
        ],
      },
      {
        title: "Location",
        items: [
          { label: "Country", value: formData.business.country || "—" },
          { label: "State", value: formData.business.state || "—" },
          { label: "City", value: formData.business.city || "—" },
        ],
      },
    ],
    [contactName, formData]
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
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
            style={{ background: accent.gradient }}
          >
            {currentStep + 1}
          </div>
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
          You can revisit earlier sections at any time without losing the data.
        </p>
      </div>
      {summarySections.map((section) => (
        <div
          key={section.title}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-800">{section.title}</h3>
          <dl className="mt-3 space-y-3">
            {section.items.map((item) => (
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
      hint: domainHint,
    },
    {
      label: "Documents",
      value: `${uploadedDocs}/${docKeys.length} uploaded`,
    },
  ];

  return (
    <FormLayout
      mode="page"
      onClose={onClose}
      isProcessing={isPending}
      title="Add Partner"
      description="Capture partner profile, regional presence, and supporting documentation to complete onboarding."
      accentGradient={accent.gradient}
      accentColor={accent.color}
      meta={meta}
      aside={asideContent}
      footer={footer}
      maxWidthClass="max-w-8xl"
    >
      {activeStepContent}
    </FormLayout>
  );
};

export default TenantAddPartnerWizard;
