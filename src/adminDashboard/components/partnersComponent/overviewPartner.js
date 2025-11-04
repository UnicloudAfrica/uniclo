import React, { useMemo, useState } from "react";
import { CalendarClock, SquarePen, Trash2 } from "lucide-react";
import EditPartnerModal from "../../pages/tenantComps/editTenant";
import DeletePartnerModal from "../../pages/tenantComps/deleteTenant";
import ModernButton from "../ModernButton";
import StatusPill from "../StatusPill";
import IconBadge from "../IconBadge";

const OverviewPartner = ({ partnerDetails }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const formatDate = (value) => {
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
      console.error("Failed to format date", error);
      return "—";
    }
  };

  const business = partnerDetails?.business ?? {};
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
    { title: "National ID Document", path: partnerDetails?.national_id_document },
    { title: "Registration Document", path: partnerDetails?.registration_document },
    { title: "Utility Bill Document", path: partnerDetails?.utility_bill_document },
    { title: "Company Logo", path: partnerDetails?.logo },
  ].filter((doc) => doc.path);

  const contactItems = useMemo(
    () => [
      {
        label: "Primary email",
        value: partnerDetails?.email || business?.email || "Not provided",
        type: "mailto",
        iconKey: "contact.email",
        tone: "primary",
      },
      {
        label: "Phone number",
        value: partnerDetails?.phone || business?.phone || "Not provided",
        iconKey: "contact.phone",
        tone: "indigo",
      },
      {
        label: "Domain",
        value: domain || "Not configured",
        type: domain ? "url" : undefined,
        iconKey: "contact.domain",
        tone: "primary",
      },
      {
        label: "Account ID",
        value: partnerDetails?.identifier || "—",
        iconKey: "contact.accountId",
        tone: "slate",
      },
    ],
    [partnerDetails, business, domain]
  );

  const addressLine = useMemo(() => {
    const segments = [
      business?.address,
      business?.city,
      business?.state,
      business?.country,
    ].filter(Boolean);
    return segments.length ? segments.join(", ") : "Address not captured";
  }, [business]);

  const businessItems = [
    {
      label: "Company type",
      value: business?.company_type || "—",
      iconKey: "business.companyType",
      tone: "indigo",
    },
    {
      label: "Industry",
      value: business?.industry || "—",
      iconKey: "business.industry",
      tone: "indigo",
    },
    {
      label: "Website",
      value: business?.website || partnerDetails?.website || "—",
      type: "url",
      iconKey: "business.website",
      tone: "primary",
    },
    {
      label: "Registered address",
      value: addressLine,
      iconKey: "business.registeredAddress",
      tone: "slate",
    },
  ];

  const complianceItems = [
    { label: "Registration number", value: business?.registration_number || "—" },
    { label: "TIN number", value: business?.tin_number || "—" },
    { label: "Verification token", value: partnerDetails?.verification_token || "—" },
    { label: "Last updated", value: formatDate(partnerDetails?.updated_at) },
  ];

  if (!partnerDetails) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-10 text-center text-sm text-slate-500">
        No partner details available.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="rounded-3xl border border-[#EAECF0] bg-gradient-to-br from-white via-[#F4F7FB] to-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Partner Profile
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">
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

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoStat label="Identifier" value={partnerDetails.identifier || "—"} />
            <InfoStat label="Status" value={verificationLabel} />
            <InfoStat label="Last activity" value={formatDate(partnerDetails.updated_at)} />
            <InfoStat
              label="Dependants"
              value={
                Array.isArray(business?.dependant_tenant)
                  ? business.dependant_tenant.length
                  : "—"
              }
            />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-[#EAECF0] bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Key Contacts</h3>
              <ul className="mt-4 space-y-3">
                {contactItems.map(({ iconKey, tone, label, value, type }) => (
                  <li key={label} className="flex items-start gap-3 text-sm">
                    <IconBadge iconKey={iconKey} tone={tone} size="sm" className="mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {label}
                      </p>
                      {type === "mailto" && value && value !== "Not provided" ? (
                        <a
                          href={`mailto:${value}`}
                          className="text-sm font-semibold text-[#288DD1] hover:underline"
                        >
                          {value}
                        </a>
                      ) : type === "url" && value && value !== "Not configured" ? (
                        <a
                          href={value.startsWith("http") ? value : `https://${value}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-[#288DD1] hover:underline"
                        >
                          {value}
                        </a>
                      ) : (
                        <p className="text-sm font-semibold text-slate-800">{value}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-dashed border-[#D8DFE8] bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Compliance Library</h3>
              {documents.length > 0 ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {documents.map((doc, index) => (
                    <div
                      key={`${doc.title}-${index}`}
                      className="rounded-2xl border border-[#EAECF0] bg-[#F8FAFC] p-4 text-center"
                    >
                      <img
                        src={doc.path}
                        alt={doc.title}
                        className="mx-auto h-24 w-auto rounded-lg object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://placehold.co/200x120/E0E0E0/676767?text=Preview";
                        }}
                      />
                      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {doc.title}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No compliance documents uploaded yet.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-[#EAECF0] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <IconBadge
                  iconKey="business.companyType"
                  tone="primary"
                  size="sm"
                />
                <h3 className="text-sm font-semibold text-slate-900">Business Profile</h3>
              </div>
              <dl className="mt-4 space-y-4">
                {businessItems.map(({ iconKey, tone, label, value, type }) => (
                  <div
                    key={label}
                    className="flex items-start gap-3 rounded-2xl border border-[#EEF2F6] bg-[#F9FAFB] p-3"
                  >
                    <IconBadge iconKey={iconKey} tone={tone} />
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {label}
                      </dt>
                      {type === "url" && value && value !== "—" ? (
                        <a
                          href={value.startsWith("http") ? value : `https://${value}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-[#288DD1] hover:underline"
                        >
                          {value}
                        </a>
                      ) : (
                        <dd className="text-sm font-semibold text-slate-800">{value}</dd>
                      )}
                    </div>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-3xl border border-[#EAECF0] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <IconBadge icon={CalendarClock} tone="indigo" size="sm" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Compliance & Lifecycle
                </h3>
              </div>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {complianceItems.map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-[#EEF2F6] bg-[#F9FAFB] p-3"
                  >
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-800">
                      {value || "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
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
        tenantId={partnerDetails?.id || partnerDetails?.identifier}
        tenantName={partnerDetails?.name}
      />
    </>
  );
};

const InfoStat = ({ label, value }) => (
  <div className="rounded-2xl border border-[#EEF2F6] bg-white p-4 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </p>
    <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
  </div>
);

export default OverviewPartner;
