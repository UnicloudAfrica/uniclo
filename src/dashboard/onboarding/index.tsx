import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  useOnboardingState,
  useOnboardingStep,
  usePostOnboardingThread,
  useUpdateOnboardingStep,
} from "@/hooks/onboardingHooks";
import { getStepsForTarget } from "./stepConfig";
import ToastUtils from "@/utils/toastUtil";
import PartnerRegionQualificationForm from "./PartnerRegionQualificationForm";
import BusinessProfileForm, { ensureBusinessProfileDefaults } from "./BusinessProfileForm";
import BrandingThemeForm, { ensureBrandingThemeDefaults } from "./BrandingThemeForm";
import FieldInput from "./FieldInput";
import ConversationThread from "./ConversationThread";
import {
  type FormValues,
  type SubmitAction,
  statusCopy,
  defaultStatusMeta,
  isRecord,
  getErrorMessage,
  isBlank,
  validatePartnerRegionPayload,
  normalisePartnerRegionFormValues,
  validateBusinessProfilePayload,
  validateBrandingPayload,
} from "./validationHelpers";
import { useTenantBrandingTheme } from "@/hooks/useBrandingTheme";
import type {
  OnboardingDocument,
  OnboardingStateData,
  OnboardingSubmissionData,
  OnboardingThread,
} from "@/types/onboarding";

const OnboardingDashboard = () => {
  const { data: state, isLoading: isStateLoading } = useOnboardingState();
  const stateData = (state ?? {}) as OnboardingStateData;
  const { data: branding } = useTenantBrandingTheme();
  const brandName = branding?.company?.name || "your provider";
  const persona =
    typeof stateData.persona === "string"
      ? stateData.persona
      : typeof stateData.target === "string"
        ? stateData.target
        : "tenant";
  const hasTenantAssociation = Boolean(
    stateData.tenant_id ??
    stateData.tenant?.id ??
    stateData.account?.tenant_id ??
    stateData.workspace?.tenant_id ??
    stateData.relationships?.tenant_id ??
    stateData.context?.tenant_id
  );

  const definitions = useMemo(() => {
    const baseDefinitions = getStepsForTarget(persona);

    if (!hasTenantAssociation && ["client", "crm", "internal_client_business"].includes(persona)) {
      const excludedStepIds = new Set(["billing", "branding", "partner_region_qualification"]);
      return baseDefinitions.filter((step) => !excludedStepIds.has(step.id));
    }

    return baseDefinitions;
  }, [persona, hasTenantAssociation]);

  const initialStep = useMemo(() => {
    if (!definitions?.length) {
      return null;
    }

    const stateSteps = Array.isArray(stateData.steps) ? stateData.steps : [];
    const allowedIds = new Set(definitions.map((item) => item.id));
    const candidateOrder = [stateData.current_step, ...stateSteps.map((step) => step.id)];
    const matchingStep = candidateOrder.find((id) => id && allowedIds.has(id));

    return matchingStep ?? definitions[0]?.id ?? null;
  }, [definitions, stateData.current_step, stateData.steps]);

  const [activeStep, setActiveStep] = useState<string | null>(initialStep);
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
  const submissionData = (submission ?? {}) as OnboardingSubmissionData;
  const submissionStatus =
    typeof submissionData.status === "string" ? submissionData.status : "draft";
  const submissionMeta = isRecord(submissionData.meta) ? submissionData.meta : {};
  const submissionThreads = Array.isArray(submissionData.threads)
    ? (submissionData.threads as OnboardingThread[])
    : [];
  const submissionDocuments = Array.isArray(submissionData.documents)
    ? (submissionData.documents as OnboardingDocument[])
    : [];

  const [formValues, setFormValues] = useState<FormValues>({});
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
      setFormValues(ensureBusinessProfileDefaults(submissionData.payload ?? {}));
      setComment("");
      return;
    }

    if (definition.custom === "brandingTheme") {
      setFormValues(ensureBrandingThemeDefaults(submissionData.payload ?? {}));
      setComment("");
      return;
    }

    if (definition.custom === "partnerRegion") {
      setFormValues((submissionData.payload ?? {}) as FormValues);
      setComment("");
      return;
    }

    const payload = isRecord(submissionData.payload) ? submissionData.payload : {};
    const initialValues: FormValues = {};
    definition.fields?.forEach((field) => {
      const existingValue = payload[field.id];

      if (field.type === "collection") {
        initialValues[field.id] = Array.isArray(existingValue) ? existingValue : [];
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
  }, [submissionData.payload, definition]);

  const handleFieldChange = (id: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (id: string, file: File | null) => {
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

  const handleSubmit = async (action: SubmitAction) => {
    if (!activeStep) return;

    if (
      (action === "submit" || action === "resubmit") &&
      definition?.custom === "businessProfile"
    ) {
      const missing = validateBusinessProfilePayload(formValues);
      if (missing.length) {
        ToastUtils.error(`Please complete required fields: ${missing.join(", ")}.`);
        return;
      }
    }

    if ((action === "submit" || action === "resubmit") && definition?.custom === "brandingTheme") {
      const missing = validateBrandingPayload(formValues);
      if (missing.length) {
        ToastUtils.error(`Please complete required fields: ${missing.join(", ")}.`);
        return;
      }
    }

    if ((action === "submit" || action === "resubmit") && definition?.custom === "partnerRegion") {
      const missing = validatePartnerRegionPayload(formValues);
      if (missing.length) {
        ToastUtils.error(`Please complete required fields: ${missing.join(", ")}`);
        return;
      }
    }

    if ((action === "submit" || action === "resubmit") && definition?.fields) {
      const missingLabels: string[] = [];

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
          const hasInvalidItem = items.some((item) => {
            const itemRecord = isRecord(item) ? item : {};
            return subFields.some((sub) => sub.required && isBlank(itemRecord[sub.id]));
          });

          if (hasInvalidItem) {
            missingLabels.push(`${field.label} (complete required details)`);
          }

          return;
        }

        if (field.type === "file") {
          const fileRecord = isRecord(value) ? value : null;
          const hasFile =
            value &&
            ((typeof value === "string" && value.trim() !== "") ||
              Boolean(fileRecord && (fileRecord.path || fileRecord.document_id)));

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
        action === "submit" || action === "resubmit" ? "Step submitted for review." : "Draft saved."
      );
    } catch (error) {
      ToastUtils.error(getErrorMessage(error, "Unable to update onboarding step."));
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
      ToastUtils.error(getErrorMessage(error, "Unable to send message."));
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
      <div className="max-w-8xl mx-auto px-4 md:px-6 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">Complete your onboarding</h1>
          <p className="text-gray-600 mt-1 max-w-2xl">
            We'll unlock the full dashboard once these steps are approved. You can save drafts,
            upload documents, and have a running conversation with the {brandName} review team here.
          </p>
          <ProgressBar
            approved={stateData.progress?.approved ?? 0}
            required={stateData.progress?.required ?? 0}
          />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <aside className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
            {definitions.map((step) => {
              const stateSteps = Array.isArray(stateData.steps) ? stateData.steps : [];
              const status = stateSteps.find((s) => s.id === step.id)?.status ?? "draft";
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
                    {submissionStatus === "approved" && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" aria-hidden />
                    )}
                  </h2>
                  <p className="text-gray-600 mt-1 max-w-2xl">{definition.description}</p>
                  <StatusBlurb submission={submissionData} />
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
                        const action: SubmitAction =
                          submissionStatus === "changes_requested" ? "resubmit" : "submit";
                        handleSubmit(action);
                      }}
                      className="space-y-6"
                    >
                      {definition.custom === "partnerRegion" ? (
                        <PartnerRegionQualificationForm
                          value={formValues}
                          meta={submissionMeta}
                          onChange={
                            setFormValues as Dispatch<SetStateAction<Record<string, unknown>>>
                          }
                        />
                      ) : definition.custom === "brandingTheme" ? (
                        <BrandingThemeForm
                          value={formValues}
                          onChange={
                            setFormValues as Dispatch<SetStateAction<Record<string, unknown>>>
                          }
                        />
                      ) : definition.custom === "businessProfile" ? (
                        <BusinessProfileForm
                          value={formValues}
                          onChange={
                            setFormValues as Dispatch<SetStateAction<Record<string, unknown>>>
                          }
                        />
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {definition.fields?.map((field) => (
                            <FieldInput
                              key={field.id}
                              field={field}
                              value={
                                formValues?.[field.id] ?? (field.type === "collection" ? [] : "")
                              }
                              onChange={(nextValue) => handleFieldChange(field.id, nextValue)}
                              onFileChange={(file) => handleFileChange(field.id, file)}
                            />
                          ))}
                        </div>
                      )}

                      {submissionDocuments.length ? (
                        <DocumentGallery documents={submissionDocuments} />
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
                          ) : submissionStatus === "changes_requested" ? (
                            "Resubmit for review"
                          ) : (
                            "Submit for review"
                          )}
                        </button>
                      </div>
                    </form>

                    <ConversationThread
                      threads={submissionThreads}
                      comment={comment}
                      onCommentChange={setComment}
                      onSendMessage={handleSendMessage}
                      isSending={threadMutation.isPending}
                    />
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

interface StatusBlurbProps {
  submission: OnboardingSubmissionData;
}

const StatusBlurb = ({ submission }: StatusBlurbProps) => {
  if (typeof submission.status !== "string" || submission.status === "") {
    return null;
  }

  const meta = statusCopy[submission.status] ?? defaultStatusMeta;

  return (
    <div className="mt-4 flex items-center gap-2 text-sm">
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${meta.tone}`}
      >
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

interface ProgressBarProps {
  approved: number;
  required: number;
}

const ProgressBar = ({ approved, required }: ProgressBarProps) => {
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

interface DocumentGalleryProps {
  documents: OnboardingDocument[];
}

const DocumentGallery = ({ documents }: DocumentGalleryProps) => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
    <h3 className="text-sm font-semibold text-gray-800 mb-3">Uploaded documents</h3>
    <div className="space-y-2">
      {documents.map((document) => (
        <div
          key={document.id}
          className="flex flex-wrap items-center justify-between gap-2 text-sm"
        >
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
              Uploaded{" "}
              {document.created_at ? new Date(document.created_at).toLocaleDateString() : ""}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default OnboardingDashboard;
