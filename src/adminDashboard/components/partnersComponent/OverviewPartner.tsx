import React, { useEffect, useMemo, useState } from "react";
import { Building2, CalendarClock, FileText, Mail, SquarePen, Trash2 } from "lucide-react";
import EditPartnerModal from "../../pages/tenantComps/EditTenant";
import DeletePartnerModal from "../../pages/tenantComps/DeleteTenant";
import { ModernButton } from "@/shared/components/ui";
import StatusPill from "@/shared/components/ui/StatusPill";
import SetupProgressCard from "@/shared/components/projects/details/SetupProgressCard";
import logger from "@/utils/logger";

const accent = "var(--theme-color)";

interface PartnerDetails {
  id?: string | number;
  identifier?: string;
  name?: string;
  email?: string;
  phone?: string;
  domain?: string;
  verified?: number | boolean;
  verification_token?: string;
  website?: string;
  national_id_document?: string;
  registration_document?: string;
  utility_bill_document?: string;
  logo?: string;
  updated_at?: string;
  created_at?: string;
  business?: {
    email?: string;
    phone?: string;
    domain?: string;
    company_type?: string;
    industry?: string;
    website?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    registration_number?: string;
    tin_number?: string;
  };
  provisioning_progress?: Array<{
    id: string;
    label: string;
    status: string;
    updated_at: string;
    context?: unknown;
  }>;
  [key: string]: unknown;
}

interface OverviewPartnerProps {
  partnerDetails: PartnerDetails | null | undefined;
  tenantId?: string;
  openEditOnLoad?: boolean;
}

const OverviewPartner: React.FC<OverviewPartnerProps> = ({ partnerDetails, openEditOnLoad }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (openEditOnLoad) {
      setIsEditModalOpen(true);
    }
  }, [openEditOnLoad]);

  const formatDate = (value: string) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      logger.error("Failed to format date", error);
      return "—";
    }
  };

  const business = useMemo(() => partnerDetails?.business ?? {}, [partnerDetails]);
  const verificationTone = partnerDetails?.verified === 1 ? "success" : "warning";
  const verificationLabel =
    partnerDetails?.verified === 1 ? "Verified partner" : "Verification pending";

  const domain =
    partnerDetails?.domain ||
    business?.domain ||
    (partnerDetails?.name
      ? `${partnerDetails.name.toLowerCase().replace(/\s+/g, "-")}.unicloudafrica.com`
      : null);

  const documents = [
    {
      title: "National ID Document",
      path: partnerDetails?.national_id_document,
    },
    {
      title: "Registration Document",
      path: partnerDetails?.registration_document,
    },
    {
      title: "Utility Bill Document",
      path: partnerDetails?.utility_bill_document,
    },
    { title: "Company Logo", path: partnerDetails?.logo },
  ].filter((doc) => doc.path);

  const contactItems = useMemo(
    () => [
      {
        label: "Primary email",
        value: partnerDetails?.email || business?.email || "Not provided",
        type: "mailto",
      },
      {
        label: "Phone number",
        value: partnerDetails?.phone || business?.phone || "Not provided",
      },
      {
        label: "Domain",
        value: domain || "Not configured",
        type: domain ? "url" : undefined,
      },
      {
        label: "Account ID",
        value: partnerDetails?.identifier || "—",
      },
    ],
    [partnerDetails, business, domain]
  );

  const addressLine = useMemo(() => {
    const segments = [business?.address, business?.city, business?.state, business?.country].filter(
      Boolean
    );
    return segments.length ? segments.join(", ") : "Address not captured";
  }, [business]);

  const businessItems = [
    {
      label: "Company type",
      value: business?.company_type || "—",
    },
    {
      label: "Industry",
      value: business?.industry || "—",
    },
    {
      label: "Website",
      value: business?.website || partnerDetails?.website || "—",
      type: "url",
    },
    {
      label: "Registered address",
      value: addressLine,
    },
  ];

  const complianceItems = [
    {
      label: "Registration number",
      value: business?.registration_number || "—",
    },
    { label: "TIN number", value: business?.tin_number || "—" },
    {
      label: "Verification token",
      value: partnerDetails?.verification_token || "—",
    },
    { label: "Last updated", value: formatDate(partnerDetails?.updated_at) },
  ];

  const provisioningSteps = Array.isArray(partnerDetails?.provisioning_progress)
    ? partnerDetails.provisioning_progress.map((step) => ({
        id: step.id,
        label: step.label,
        status: step.status,
        updated_at: step.updated_at,
        context: step.context,
      }))
    : [];

  const showProvisioning = provisioningSteps.length > 0;

  if (!partnerDetails) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
        No partner details available.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {showProvisioning && (
          <div className="grid grid-cols-1 gap-6">
            <SetupProgressCard
              steps={provisioningSteps as never}
              isLoading={partnerDetails?.onboarding_status === "processing"}
            />
          </div>
        )}

        {/* Header */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Partner Profile
              </p>
              <h2 className="mt-1 truncate text-2xl font-semibold text-gray-900 dark:text-white">
                {partnerDetails.name || "Unnamed partner"}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusPill label={verificationLabel} tone={verificationTone} />
                <StatusPill
                  label={`Created ${formatDate(partnerDetails.created_at)}`}
                  tone="neutral"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ModernButton
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setIsEditModalOpen(true)}
              >
                <SquarePen className="h-4 w-4" />
                Edit Profile
              </ModernButton>
              <ModernButton
                variant="danger"
                size="sm"
                className="gap-2"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Remove Partner
              </ModernButton>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
          <div className="space-y-6">
            {/* Key contacts */}
            <SectionCard icon={<Mail size={16} />} title="Key Contacts">
              <ul className="space-y-3">
                {contactItems.map(({ label, value, type }) => (
                  <li key={label} className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      {label}
                    </p>
                    {type === "mailto" && value && value !== "Not provided" ? (
                      <a
                        href={`mailto:${value}`}
                        className="block break-all text-sm font-medium hover:underline"
                        style={{ color: accent }}
                      >
                        {value}
                      </a>
                    ) : type === "url" && value && value !== "Not configured" ? (
                      <a
                        href={value.startsWith("http") ? value : `https://${value}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block break-all text-sm font-medium hover:underline"
                        style={{ color: accent }}
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="break-all text-sm font-medium text-gray-900 dark:text-white">
                        {value}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </SectionCard>

            {/* Compliance library */}
            <SectionCard icon={<FileText size={16} />} title="Compliance Library">
              {documents.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {documents.map((doc, index) => (
                    <div
                      key={`${doc.title}-${index}`}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-900/40"
                    >
                      <img
                        src={doc.path}
                        alt={doc.title}
                        className="mx-auto h-24 w-auto rounded-lg object-contain"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          const target = e.currentTarget;
                          target.onerror = null;
                          target.src = "https://placehold.co/200x120/E0E0E0/676767?text=Preview";
                        }}
                      />
                      <p className="mt-3 break-words text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        {doc.title}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
                  No compliance documents uploaded yet.
                </div>
              )}
            </SectionCard>
          </div>

          <div className="space-y-6">
            {/* Business profile */}
            <SectionCard icon={<Building2 size={16} />} title="Business Profile">
              <dl className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {businessItems.map(({ label, value, type }) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      {label}
                    </dt>
                    {type === "url" && value && value !== "—" ? (
                      <a
                        href={value.startsWith("http") ? value : `https://${value}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 block break-all text-sm font-medium hover:underline"
                        style={{ color: accent }}
                      >
                        {value}
                      </a>
                    ) : (
                      <dd className="mt-0.5 break-words text-sm font-medium text-gray-900 dark:text-white">
                        {value}
                      </dd>
                    )}
                  </div>
                ))}
              </dl>
            </SectionCard>

            {/* Compliance & lifecycle */}
            <SectionCard icon={<CalendarClock size={16} />} title="Compliance & Lifecycle">
              <dl className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {complianceItems.map(({ label, value }: { label: string; value: string }) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      {label}
                    </dt>
                    <dd className="mt-0.5 break-all text-sm font-medium text-gray-900 dark:text-white">
                      {value || "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            </SectionCard>
          </div>
        </div>
      </div>

      <EditPartnerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        partnerDetails={partnerDetails}
      />
      <DeletePartnerModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        tenantDetails={partnerDetails}
      />
    </>
  );
};

const SectionCard = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <div className="mb-4 flex items-center gap-2">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: "var(--theme-color-10)", color: accent }}
      >
        {icon}
      </span>
      <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
    </div>
    {children}
  </div>
);

export default OverviewPartner;
