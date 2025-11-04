import React, { useEffect, useMemo, useState } from "react";
import { Loader2, AlertCircle, CheckCircle2, MessageCircle, Plus, Trash2 } from "lucide-react";
import {
  useOnboardingState,
  useOnboardingStep,
  usePostOnboardingThread,
  useUpdateOnboardingStep,
} from "../../hooks/onboardingHooks";
import { getStepsForTarget } from "./stepConfig";
import ToastUtils from "../../utils/toastUtil";
import PartnerRegionQualificationForm from "./PartnerRegionQualificationForm";
import BusinessProfileForm, {
  ensureBusinessProfileDefaults,
} from "./BusinessProfileForm";
import BrandingThemeForm, {
  ensureBrandingThemeDefaults,
} from "./BrandingThemeForm";
import FileDropInput from "./FileDropInput";

const statusCopy = {
  draft: { label: "Draft", tone: "bg-slate-100 text-slate-700" },
  submitted: { label: "Submitted", tone: "bg-blue-100 text-blue-700" },
  in_review: { label: "In review", tone: "bg-blue-100 text-blue-700" },
  changes_requested: { label: "Changes requested", tone: "bg-amber-100 text-amber-700" },
  approved: { label: "Approved", tone: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rejected", tone: "bg-rose-100 text-rose-700" },
};

const defaultStatusMeta = { label: "Draft", tone: "bg-slate-100 text-slate-700" };

const OnboardingDashboard = () => {
  const { data: state, isLoading: isStateLoading } = useOnboardingState();
  const persona = state?.persona ?? state?.target ?? "tenant";
  const definitions = useMemo(() => getStepsForTarget(persona), [persona]);

  const initialStep = useMemo(() => {
    if (!state?.steps?.length) {
      return definitions[0]?.id ?? null;
    }

    const stepFromState = state.current_step || state.steps[0]?.id;
    return stepFromState;
  }, [state?.current_step, state?.steps, definitions]);

  const [activeStep, setActiveStep] = useState(initialStep);
  useEffect(() => {
    setActiveStep(initialStep);
  }, [initialStep]);

  const definition = useMemo(
    () => definitions.find((item) => item.id === activeStep),
    [definitions, activeStep]
  );

  const {
    data: submission,
    isLoading: isStepLoading,
    isFetching: isStepFetching,
  } = useOnboardingStep(activeStep, { enabled: Boolean(activeStep) });

  const [formValues, setFormValues] = useState({});
  const [comment, setComment] = useState("");
  const updateMutation = useUpdateOnboardingStep();
  const threadMutation = usePostOnboardingThread();

  useEffect(() => {
    if (!definition) {
      setFormValues({});
      setComment("");
      return;
    }

    if (definition.custom === "businessProfile") {
      setFormValues(
        ensureBusinessProfileDefaults(submission?.payload ?? {})
      );
      setComment("");
      return;
    }

    if (definition.custom === "brandingTheme") {
      setFormValues(
        ensureBrandingThemeDefaults(submission?.payload ?? {})
      );
      setComment("");
      return;
    }

    if (definition.custom === "partnerRegion") {
      setFormValues(submission?.payload ?? {});
      setComment("");
      return;
    }

    const payload = submission?.payload ?? {};
    const initialValues = {};

    definition.fields?.forEach((field) => {
      const existingValue = payload[field.id];

      if (field.type === "collection") {
        initialValues[field.id] = Array.isArray(existingValue)
          ? existingValue
          : [];
        return;
      }

      if (field.type === "file") {
        initialValues[field.id] = existingValue ?? "";
        return;
      }

      initialValues[field.id] = existingValue ?? "";
    });

    setFormValues(initialValues);
    setComment("");
  }, [submission, definition]);

  const handleFieldChange = (id, value) => {
    setFormValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (id, file) => {
    if (!file) {
      handleFieldChange(id, "");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      handleFieldChange(id, event.target?.result ?? "");
    };
    reader.onerror = () => {
      ToastUtils.error("We couldn't read that file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (action) => {
    if (!activeStep) return;

    if (
      (action === "submit" || action === "resubmit") &&
      definition?.custom === "businessProfile"
    ) {
      const missing = validateBusinessProfilePayload(formValues);
      if (missing.length) {
        ToastUtils.error(
          `Please complete required fields: ${missing.join(", ")}.`
        );
        return;
      }
    }

    if (
      (action === "submit" || action === "resubmit") &&
      definition?.custom === "brandingTheme"
    ) {
      const missing = validateBrandingPayload(formValues);
      if (missing.length) {
        ToastUtils.error(
          `Please complete required fields: ${missing.join(", ")}.`
        );
        return;
      }
    }

    if (
      (action === "submit" || action === "resubmit") &&
      definition?.custom === "partnerRegion"
    ) {
      const missing = validatePartnerRegionPayload(formValues);
      if (missing.length) {
        ToastUtils.error(`Please complete required fields: ${missing.join(", ")}`);
        return;
      }
    }

    if ((action === "submit" || action === "resubmit") && definition?.fields) {
      const missingLabels = [];

      definition.fields.forEach((field) => {
        if (!field.required) {
          return;
        }

        const value = formValues?.[field.id];

        if (field.type === "collection") {
          const items = Array.isArray(value) ? value : [];
          if (!items.length) {
            missingLabels.push(field.label);
            return;
          }

          const subFields = field.fields ?? [];
          const hasInvalidItem = items.some((item) =>
            subFields.some((sub) =>
              sub.required && (!item || !item[sub.id] || `${item[sub.id]}`.trim() === "")
            )
          );

          if (hasInvalidItem) {
            missingLabels.push(`${field.label} (complete required details)`);
          }

          return;
        }

        if (field.type === "file") {
          const hasFile =
            value &&
            ((typeof value === "string" && value.trim() !== "") ||
              (typeof value === "object" && (value.path || value.document_id)));

          if (!hasFile) {
            missingLabels.push(field.label);
          }

          return;
        }

        if (value === undefined || value === null || `${value}`.trim() === "") {
          missingLabels.push(field.label);
        }
      });

      if (missingLabels.length) {
        ToastUtils.error(`Please complete required fields: ${missingLabels.join(", ")}.`);
        return;
      }
    }

    const normalisedPayload =
      definition?.custom === "businessProfile"
        ? ensureBusinessProfileDefaults(formValues)
        : definition?.custom === "brandingTheme"
        ? ensureBrandingThemeDefaults(formValues)
        : definition?.custom === "partnerRegion"
        ? normalisePartnerRegionFormValues(formValues)
        : formValues;

    try {
      await updateMutation.mutateAsync({
        step: activeStep,
        payload: {
          payload: normalisedPayload,
          action,
          comment: comment || undefined,
        },
      });

      if (comment) {
        setComment("");
      }

      ToastUtils.success(
        action === "submit" || action === "resubmit"
          ? "Step submitted for review."
          : "Draft saved."
      );
    } catch (error) {
      ToastUtils.error(error.message ?? "Unable to update onboarding step.");
    }
  };

  const handleSendMessage = async () => {
    if (!comment?.trim() || !activeStep) {
      return;
    }

    try {
      await threadMutation.mutateAsync({
        step: activeStep,
        payload: {
          message: comment.trim(),
          action: "comment",
        },
      });
      setComment("");
    } catch (error) {
      ToastUtils.error(error.message ?? "Unable to send message.");
    }
  };

  if (isStateLoading) {
    return (
      <div className="w-full h-svh flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[--theme-color] animate-spin" />
      </div>
    );
  }

  if (!definitions?.length) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold text-gray-800">
          Onboarding steps are not configured yet.
        </h1>
        <p className="text-gray-500 mt-2">Please contact support for assistance.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">Complete your onboarding</h1>
          <p className="text-gray-600 mt-1 max-w-2xl">
            We’ll unlock the full dashboard once these steps are approved. You can save drafts,
            upload documents, and have a running conversation with the Unicloud review team here.
          </p>
          <ProgressBar approved={state?.progress?.approved ?? 0} required={state?.progress?.required ?? 0} />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <aside className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
            {definitions.map((step) => {
              const status = state?.steps?.find((s) => s.id === step.id)?.status ?? "draft";
              const meta = statusCopy[status] ?? defaultStatusMeta;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    activeStep === step.id
                      ? "border-[--theme-color] bg-[--theme-color-10]"
                      : "border-transparent hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800">{step.label}</p>
                    <span className={`text-[10px] px-2 py-1 rounded-full ${meta.tone}`}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 line-clamp-2">{step.description}</p>
                </button>
              );
            })}
          </aside>

          <section className="bg-white rounded-xl border border-gray-200 p-6">
            {!activeStep || !definition ? (
              <div className="flex items-center justify-center h-48 text-gray-500">
                Choose a step to get started.
              </div>
            ) : (
              <div className="space-y-6">
                <header className="border-b border-gray-100 pb-4">
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                    {definition.label}
                    {submission?.status === "approved" && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" aria-hidden />
                    )}
                  </h2>
                  <p className="text-gray-600 mt-1 max-w-2xl">{definition.description}</p>
                  <StatusBlurb submission={submission} />
                </header>

                {isStepLoading || isStepFetching ? (
                  <div className="flex items-center justify-center h-48 text-gray-500">
                    <Loader2 className="w-8 h-8 text-[--theme-color] animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        const action = submission?.status === "changes_requested" ? "resubmit" : "submit";
                        handleSubmit(action);
                      }}
                      className="space-y-6"
                    >
                      {definition.custom === "partnerRegion" ? (
                        <PartnerRegionQualificationForm
                          value={formValues}
                          meta={submission?.meta ?? {}}
                          onChange={setFormValues}
                        />
                      ) : definition.custom === "brandingTheme" ? (
                        <BrandingThemeForm
                          value={formValues}
                          onChange={setFormValues}
                        />
                      ) : definition.custom === "businessProfile" ? (
                        <BusinessProfileForm
                          value={formValues}
                          onChange={setFormValues}
                        />
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {definition.fields?.map((field) => (
                            <FieldInput
                              key={field.id}
                              field={field}
                              value={formValues?.[field.id] ?? (field.type === "collection" ? [] : "")}
                              onChange={(value) => handleFieldChange(field.id, value)}
                              onFileChange={(file) => handleFileChange(field.id, file)}
                            />
                          ))}
                        </div>
                      )}

                      {submission?.documents?.length ? (
                        <DocumentGallery documents={submission.documents} />
                      ) : null}

                      <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <button
                          type="button"
                          className="px-4 py-2 rounded-full border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                          onClick={() => handleSubmit("save")}
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                            </span>
                          ) : (
                            "Save draft"
                          )}
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-full bg-[--theme-color] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                            </span>
                          ) : submission?.status === "changes_requested" ? (
                            "Resubmit for review"
                          ) : (
                            "Submit for review"
                          )}
                        </button>
                      </div>
                    </form>

                    <div className="border-t border-gray-100 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-[--theme-color]" /> Conversation history
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Keep everything in one place. We will notify you when reviewers respond.
                      </p>

                      <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                        {submission?.threads?.length ? (
                          submission.threads.map((thread) => (
                            <div
                              key={thread.id}
                              className="bg-gray-50 border border-gray-100 rounded-lg p-4 text-sm text-gray-700"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium">
                                  {thread.author?.name ?? thread.author?.type ?? "Reviewer"}
                                </p>
                                <span className="text-xs text-gray-400">
                                  {thread.created_at
                                    ? new Date(thread.created_at).toLocaleString()
                                    : ""}
                                </span>
                              </div>
                              <p className="whitespace-pre-line text-gray-700">{thread.message}</p>
                              {thread.action === "request_changes" && (
                                <span className="inline-flex items-center mt-2 text-xs font-medium text-amber-600">
                                  <AlertCircle className="w-4 h-4 mr-1" /> Changes requested
                                </span>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500">No messages yet. Submit a note to start.</div>
                        )}
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Leave a note for the review team
                        </label>
                        <textarea
                          value={comment}
                          onChange={(event) => setComment(event.target.value)}
                          rows={3}
                          className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-[--theme-color] focus:outline-none text-sm p-3"
                          placeholder="Share clarifications or let us know when you’ve made an update."
                        />
                        <div className="flex flex-col md:flex-row md:items-center gap-3 mt-3">
                          <button
                            type="button"
                            onClick={handleSendMessage}
                            disabled={!comment.trim() || threadMutation.isPending}
                            className="px-4 py-2 rounded-full bg-[--secondary-color] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                          >
                            {threadMutation.isPending ? (
                              <span className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                              </span>
                            ) : (
                              "Send message"
                            )}
                          </button>
                          <p className="text-xs text-gray-500">
                            You can also submit the step to send a final note with your update.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

const StatusBlurb = ({ submission }) => {
  if (!submission?.status) {
    return null;
  }

  const meta = statusCopy[submission.status] ?? defaultStatusMeta;

  return (
    <div className="mt-4 flex items-center gap-2 text-sm">
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${meta.tone}`}>
        {meta.label}
      </span>
      {submission.status === "changes_requested" && (
        <span className="text-amber-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          Please review the comments below and resubmit.
        </span>
      )}
      {submission.status === "approved" && (
        <span className="text-emerald-600 flex items-center gap-1">
          <CheckCircle2 className="w-4 h-4" /> Great! This step is approved.
        </span>
      )}
    </div>
  );
};

const FieldInput = ({ field, value, onChange, onFileChange }) => {
  const baseClass =
    "w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-[--theme-color] focus:outline-none text-sm";

  if (field.type === "textarea") {
    return (
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {field.required && <span className="text-red-500"> *</span>}
        </label>
        <textarea
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          rows={field.rows ?? 4}
          className={`${baseClass} p-3`}
        />
        {field.helperText && <p className="text-xs text-gray-500 mt-1">{field.helperText}</p>}
      </div>
    );
  }

  if (field.type === "file") {
    const handleSelect = (file) => {
      if (onFileChange) {
        onFileChange(file);
        return;
      }

      if (!file) {
        onChange("");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        onChange(event.target?.result ?? "");
      };
      reader.onerror = () => {
        ToastUtils.error("We couldn't read that file. Please try again.");
      };
      reader.readAsDataURL(file);
    };

    const spanClass = field.fullWidth === false ? "" : "md:col-span-2";
    return (
      <div className={spanClass}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {field.label}
          {field.required && <span className="text-red-500"> *</span>}
        </label>
        <FileDropInput
          accept={field.accept ?? ".pdf,.png,.jpg,.jpeg"}
          value={value}
          helperText={field.helperText}
          onFileSelected={handleSelect}
        />
        {value && typeof value === "object" && value.url && (
          <a
            href={value.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[--theme-color] font-medium mt-2"
          >
            View current file
          </a>
        )}
      </div>
    );
  }

  if (field.type === "select") {
    const options = field.options ?? [];
    const hasValueOption =
      value !== undefined && value !== null && value !== "" && options.some((option) => option.value === value);
    const computedOptions = hasValueOption
      ? options
      : value
      ? [...options, { value, label: value }]
      : options;

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {field.required && <span className="text-red-500"> *</span>}
        </label>
        <select
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          className={`${baseClass} h-11 px-3 bg-white`}
        >
          <option value="" disabled>
            Select an option
          </option>
          {computedOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {field.helperText && <p className="text-xs text-gray-500 mt-1">{field.helperText}</p>}
      </div>
    );
  }

  if (field.type === "collection") {
    return (
      <CollectionField
        field={field}
        value={Array.isArray(value) ? value : []}
        onChange={onChange}
      />
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500"> *</span>}
      </label>
      <input
        type={field.type ?? "text"}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className={`${baseClass} h-11 px-3`}
        placeholder={field.placeholder}
      />
      {field.helperText && <p className="text-xs text-gray-500 mt-1">{field.helperText}</p>}
    </div>
  );
};

const isBlank = (value) => {
  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return value === undefined || value === null || `${value}`.trim() === "";
};

const validatePartnerRegionPayload = (payload) => {
  const missing = [];

  if (!payload || typeof payload !== "object") {
    missing.push("Tell us if you operate a region");
    return missing;
  }

  if (payload.has_datacenter_node === null || payload.has_datacenter_node === undefined) {
    missing.push("Tell us if you operate a region");
    return missing;
  }

  if (payload.has_datacenter_node === false) {
    return missing;
  }

  const region = payload.region ?? {};

  [
    ["provider", "Cloud provider"],
    ["code", "Region code"],
    ["country_code", "Country ISO"],
    ["fulfillment_mode", "Fulfilment mode"],
  ].forEach(([key, label]) => {
    if (isBlank(region[key] ?? "")) {
      missing.push(label);
    }
  });

  const provider = (region.provider ?? "").toLowerCase();

  if (provider && provider !== "zadara" && region.fulfillment_mode === "automated") {
    missing.push("Automated fulfilment is only available for Zadara right now");
  }

  if (provider !== "zadara") {
    return [...new Set(missing)];
  }

  if (region.fulfillment_mode && !["manual", "automated"].includes(region.fulfillment_mode)) {
    missing.push("Choose a fulfilment mode");
  }

  if (region.fulfillment_mode === "automated") {
    const credentials = region.msp_credentials ?? {};

    [
      ["base_url", "MSP base URL"],
      ["username", "MSP username"],
      ["password", "MSP password"],
      ["domain", "MSP domain"],
    ].forEach(([key, label]) => {
      if (isBlank(credentials[key] ?? "")) {
        missing.push(label);
      }
    });

    if (!isValidUrl(credentials.base_url ?? "")) {
      missing.push("MSP base URL (valid URL)");
    }

    const objectStorage = credentials.object_storage ?? {};
    if (objectStorage.enabled) {
      if (isBlank(objectStorage.base_url ?? "")) {
        missing.push("Object storage base URL");
      } else if (!isValidUrl(objectStorage.base_url)) {
        missing.push("Object storage base URL (valid URL)");
      }
    }
  }

  return [...new Set(missing)];
};

const normalisePartnerRegionFormValues = (payload) => {
  if (!payload || typeof payload !== "object") {
    return { has_datacenter_node: null };
  }

  if (payload.has_datacenter_node === false) {
    return { has_datacenter_node: false };
  }

  const region = payload.region ?? {};
  const meta = region.meta ?? {};
  const credentials = region.msp_credentials ?? {};

  const objectStorage = credentials.object_storage ?? {};

  return {
    has_datacenter_node:
      typeof payload.has_datacenter_node === "boolean"
        ? payload.has_datacenter_node
        : null,
    region: {
      ...region,
      provider: (region.provider ?? "").toLowerCase(),
      meta,
      msp_credentials: {
        ...credentials,
        object_storage: objectStorage,
      },
    },
  };
};

const validateBusinessProfilePayload = (payload) => {
  const data = ensureBusinessProfileDefaults(payload);
  const missing = [];

  if (isBlank(data.company_name)) missing.push("Company name");
  if (isBlank(data.registration_number)) missing.push("Incorporation number");
  if (isBlank(data.company_type)) missing.push("Business type");
  if (isBlank(data.business_model)) missing.push("Business model");
  if (isBlank(data.date_of_incorporation)) missing.push("Date of incorporation");
  if (isBlank(data.industry)) missing.push("Industry");
  if (isBlank(data.website) || !isValidUrl(data.website)) missing.push("Company website (valid URL)");
  if (isBlank(data.address)) missing.push("Business address");
  if (isBlank(data.country) || isBlank(data.country_id)) missing.push("Country");
  if (isBlank(data.state) || isBlank(data.state_id)) missing.push("State / Region");
  if (isBlank(data.city)) missing.push("City");
  if (isBlank(data.support_contact_name)) missing.push("Support contact name");

  if (!isValidEmail(data.support_contact_email ?? "")) {
    missing.push("Support contact email (valid)");
  }

  if (isBlank(data.support_contact_phone)) {
    missing.push("Support contact phone");
  }

  if (!isValidEmail(data.support_email ?? "")) {
    missing.push("Generic support email (valid)");
  }

  [
    ["privacy_policy_url", "Privacy policy URL"],
    ["help_center_url", "Help centre URL"],
    ["unsubscription_url", "Email unsubscription URL"],
    ["logo_href", "Logo target URL"],
  ].forEach(([key, label]) => {
    const value = data[key];
    if (!isBlank(value) && !isValidUrl(value)) {
      missing.push(`${label} (valid URL)`);
    }
  });

  return [...new Set(missing)];
};

const isValidEmail = (value) =>
  typeof value === "string" && /\S+@\S+\.\S+/.test(value.trim());

const validateBrandingPayload = (payload) => {
  const data = ensureBrandingThemeDefaults(payload);
  const missing = [];

  if (isBlank(data.logo)) {
    missing.push("Company logo");
  }

  if (isBlank(data.privacy_policy_url) || !isValidUrl(data.privacy_policy_url)) {
    missing.push("Privacy policy URL (valid)");
  }

  [
    ["help_center_url", "Help centre URL"],
    ["unsubscription_url", "Email unsubscription URL"],
    ["logo_href", "Logo target URL"],
  ].forEach(([key, label]) => {
    const value = data[key];
    if (!isBlank(value) && !isValidUrl(value)) {
      missing.push(`${label} (valid URL)`);
    }
  });

  return [...new Set(missing)];
};

const isValidUrl = (value) => {
  if (typeof value !== "string" || value.trim() === "") {
    return false;
  }

  try {
    const parsed = new URL(value);
    return Boolean(parsed.protocol && parsed.host);
  } catch (error) {
    return false;
  }
};

const ProgressBar = ({ approved, required }) => {
  const safeRequired = required > 0 ? required : 1;
  const clampedApproved = Math.min(approved, safeRequired);
  const percentage = Math.round((clampedApproved / safeRequired) * 100);

  return (
    <div className="mt-4">
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[--theme-color] transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
        <span>
          {clampedApproved} of {required} steps approved
        </span>
        <span>{percentage}% complete</span>
      </div>
    </div>
  );
};

const DocumentGallery = ({ documents }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
    <h3 className="text-sm font-semibold text-gray-800 mb-3">Uploaded documents</h3>
    <div className="space-y-2">
      {documents.map((document) => (
        <div key={document.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800">{document.category}</span>
            <span className="text-xs text-gray-500">v{document.version}</span>
            <span className="text-xs text-gray-500">{document.status}</span>
          </div>
          <div className="flex items-center gap-3">
            {document.url && (
              <a
                href={document.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[--theme-color] font-medium"
              >
                View
              </a>
            )}
            <span className="text-xs text-gray-400">
              Uploaded {document.created_at ? new Date(document.created_at).toLocaleDateString() : ""}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const CollectionField = ({ field, value, onChange }) => {
  const items = Array.isArray(value) ? value : [];

  const handleAdd = () => {
    const template = (field.fields ?? []).reduce((acc, sub) => {
      acc[sub.id] = "";
      return acc;
    }, {});

    onChange([...(items ?? []), template]);
  };

  const handleRemove = (index) => {
    const next = items.filter((_, idx) => idx !== index);
    onChange(next);
  };

  const handleItemChange = (index, key, newValue) => {
    const next = items.map((item, idx) =>
      idx === index ? { ...item, [key]: newValue } : item
    );

    onChange(next);
  };

  const handleItemFileChange = (index, key, file) => {
    if (!file) {
      handleItemChange(index, key, "");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      handleItemChange(index, key, event.target?.result ?? "");
    };
    reader.onerror = () => {
      ToastUtils.error("We couldn't read that file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="md:col-span-2">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500"> *</span>}
        </label>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1 text-xs font-medium text-[--theme-color] hover:opacity-80"
        >
          <Plus className="w-4 h-4" /> Add {field.itemLabel ?? "entry"}
        </button>
      </div>
      {field.helperText && <p className="text-xs text-gray-500 mb-3">{field.helperText}</p>}

      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">No entries yet. Use the button above to add one.</p>
        ) : (
          items.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-800">
                  {field.itemLabel ?? "Entry"} {index + 1}
                </p>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600"
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(field.fields ?? []).map((subField) => (
                  <div key={subField.id} className={subField.type === "textarea" ? "md:col-span-2" : ""}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {subField.label}
                      {subField.required && <span className="text-red-500"> *</span>}
                    </label>
                    {subField.type === "textarea" ? (
                      <textarea
                        value={item?.[subField.id] ?? ""}
                        onChange={(event) => handleItemChange(index, subField.id, event.target.value)}
                        rows={subField.rows ?? 3}
                        className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-[--theme-color] focus:outline-none text-sm p-2"
                      />
                    ) : subField.type === "select" ? (
                      <select
                        value={item?.[subField.id] ?? ""}
                        onChange={(event) => handleItemChange(index, subField.id, event.target.value)}
                        className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-[--theme-color] focus:outline-none text-sm h-10 px-3 bg-white"
                      >
                        <option value="" disabled>
                          Select an option
                        </option>
                        {(subField.options ?? []).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : subField.type === "file" ? (
                      <>
                        <FileDropInput
                          accept={subField.accept ?? ".pdf,.png,.jpg,.jpeg"}
                          value={item?.[subField.id]}
                          helperText={subField.helperText}
                          onFileSelected={(file) => handleItemFileChange(index, subField.id, file)}
                        />
                        {item?.[subField.id] &&
                          typeof item[subField.id] === "object" &&
                          item[subField.id]?.url && (
                            <a
                              href={item[subField.id].url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-[--theme-color] mt-1"
                            >
                              View current file
                            </a>
                          )}
                      </>
                    ) : (
                      <input
                        type={subField.type ?? "text"}
                        value={item?.[subField.id] ?? ""}
                        onChange={(event) => handleItemChange(index, subField.id, event.target.value)}
                        className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-[--theme-color] focus:outline-none text-sm h-10 px-3"
                        placeholder={subField.placeholder}
                      />
                    )}
                    {subField.helperText && subField.type !== "file" && (
                      <p className="text-[10px] text-gray-500 mt-1">{subField.helperText}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OnboardingDashboard;
