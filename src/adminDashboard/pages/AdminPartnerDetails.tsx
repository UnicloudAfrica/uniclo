import { useEffect, useState } from "react";
import AdminActiveTab from "../components/adminActiveTab";
import OverviewPartner from "../components/partnersComponent/OverviewPartner";
import PartnerModules from "../components/partnersComponent/PartnerModules";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Boxes,
  Building2,
  Globe2,
  LayoutDashboard,
  Loader2,
  Mail,
  Cloud,
  ShieldCheck,
  Users2,
  ClipboardList,
  Wallet,
  FlaskConical,
  KeyRound,
} from "lucide-react";
import { useFetchTenantById } from "@/hooks/adminHooks/tenantHooks";
import PartnerClients from "../components/partnersComponent/PartnerClients";
import AdminPageShell from "../components/AdminPageShell";
import OnboardingStatusBoard from "../components/onboarding/OnboardingStatusBoard";
import TenantBillingTab from "./tenantComps/TenantBillingTab";
import TenantNetworkPolicyTab from "./tenantComps/TenantNetworkPolicyTab";
import TenantPocTrialTab from "../components/tenantComponents/TenantPocTrialTab";
import AccessEntitlementsPanel from "@/shared/components/entitlements/AccessEntitlementsPanel";
import { useTenantBroadcasting } from "@/hooks/useTenantBroadcasting";
import InfoTile from "@/shared/components/ui/InfoTile";
import logger from "@/utils/logger";

const accent = "var(--theme-color)";

type PartnerBusiness = {
  name?: string;
  industry?: string;
  country?: string;
  city?: string;
};

type PartnerDetails = {
  business?: PartnerBusiness | null;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  verified?: number;
  updated_at?: string;
};

// Function to decode the ID from URL (re-used from other files)
const decodeId = (encodedId: string) => {
  try {
    return atob(decodeURIComponent(encodedId));
  } catch (e) {
    logger.error("Error decoding ID:", e);
    return null;
  }
};

export default function AdminPartnerDetails() {
  const [activeButton, setActiveButton] = useState("overview");

  const location = useLocation(); // Hook to access URL query parameters
  const navigate = useNavigate(); // Hook to navigate programmatically

  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState("Partner"); // Default name
  const [openEditOnLoad, setOpenEditOnLoad] = useState(false);

  // Extract ID and name from URL query parameters on component mount
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const encodedId = queryParams.get("id");
    const nameFromUrl = queryParams.get("name");
    const editFromUrl = queryParams.get("edit");
    const shouldOpenEdit = Boolean(editFromUrl);

    if (encodedId) {
      const decodedId = decodeId(encodedId);
      setTenantId(decodedId);
    }
    if (nameFromUrl) {
      setTenantName(decodeURIComponent(nameFromUrl));
    }

    setOpenEditOnLoad(shouldOpenEdit);

    if (shouldOpenEdit) {
      queryParams.delete("edit");
      const updated = queryParams.toString();
      navigate(`${location.pathname}${updated ? `?${updated}` : ""}`, { replace: true });
    }
  }, [location.search, location.pathname, navigate]);

  // Use broadcasting hook for real-time updates
  useTenantBroadcasting(tenantId);

  // Fetch tenant details using the custom hook
  const {
    data: partnerDetailsData,
    isFetching: isPartnerFetching,
    isError: isPartnerError,
    error: partnerError,
  } = useFetchTenantById(tenantId as unknown);
  const partnerDetails =
    partnerDetailsData && typeof partnerDetailsData === "object"
      ? (partnerDetailsData as PartnerDetails)
      : null;

  const formatDate = (value: string) => {
    if (!value) return null;
    try {
      return new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      logger.error("Unable to format date", error);
      return null;
    }
  };

  const isVerified = partnerDetails?.verified === 1;

  const summaryCards = [
    {
      label: "Partner Account",
      value: partnerDetails?.business?.name || tenantName,
      hint: partnerDetails?.business?.industry
        ? `Industry • ${partnerDetails.business.industry}`
        : "Industry not captured",
      icon: Building2,
    },
    {
      label: "Primary Contact",
      value: partnerDetails?.email || "No email provided",
      hint: partnerDetails?.phone ? `Phone • ${partnerDetails.phone}` : "Phone number unavailable",
      icon: Mail,
    },
    {
      label: "Location",
      value: partnerDetails?.business?.country || partnerDetails?.country || "Not specified",
      hint:
        partnerDetails?.business?.city || partnerDetails?.city
          ? `City • ${partnerDetails.business?.city || partnerDetails.city || "—"}`
          : "City not provided",
      icon: Globe2,
    },
    {
      label: "Verification",
      value: (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold ${
            isVerified
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
              : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
          }`}
        >
          {isVerified ? "Verified" : "Unverified"}
        </span>
      ),
      hint: partnerDetails?.updated_at
        ? `Updated ${formatDate(partnerDetails.updated_at)}`
        : "Awaiting latest review",
      icon: ShieldCheck,
    },
  ];

  const tabs = [
    {
      label: "Overview",
      value: "overview",
      icon: LayoutDashboard,
      component: (
        <OverviewPartner
          partnerDetails={partnerDetails}
          tenantId={tenantId!}
          openEditOnLoad={openEditOnLoad}
        />
      ),
    },
    {
      label: "Clients",
      value: "clients",
      icon: Users2,
      component: <PartnerClients tenantId={tenantId!} />,
    },
    {
      label: "Modules",
      value: "purchased",
      icon: Boxes,
      component: <PartnerModules tenantId={tenantId!} />,
    },
    {
      label: "Onboarding",
      value: "onboarding",
      icon: ClipboardList,
      component: (
        <OnboardingStatusBoard
          target="tenant"
          persona="tenant_business"
          userId={tenantId!}
          entityName={tenantName}
        />
      ),
    },
    {
      label: "Billing",
      value: "billing",
      icon: Wallet,
      component: <TenantBillingTab tenantId={tenantId!} />,
    },
    {
      label: "Network Policy",
      value: "network-policy",
      icon: Cloud,
      component: <TenantNetworkPolicyTab tenantId={tenantId!} />,
    },
    {
      label: "POC Trials",
      value: "poc-trials",
      icon: FlaskConical,
      component: <TenantPocTrialTab tenantId={tenantId!} />,
    },
    {
      label: "Access & Entitlements",
      value: "entitlements",
      icon: KeyRound,
      component: <AccessEntitlementsPanel scope="tenant" accountId={tenantId!} />,
    },
  ];

  // Handle loading state
  if (isPartnerFetching) {
    return (
      <>
        <AdminActiveTab />
        <AdminPageShell contentClassName="p-6 md:p-8 flex items-center justify-center flex-col">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--theme-color)]" />
          <p className="ml-2 text-gray-700 dark:text-gray-300 mt-2">Loading partner details...</p>
        </AdminPageShell>
      </>
    );
  }

  // Handle error or no data found state
  if (isPartnerError || !partnerDetails) {
    return (
      <>
        <AdminActiveTab />
        <AdminPageShell contentClassName="p-6 md:p-8 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Partner details not found.
          </p>
          {partnerError?.message && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{partnerError.message}</p>
          )}
          <button
            onClick={() => navigate("/admin-dashboard/partners")}
            className="px-6 py-3 bg-[var(--theme-color)] text-white font-medium rounded-full hover:bg-[var(--theme-color)] transition-colors"
          >
            Go back to Partners List
          </button>
        </AdminPageShell>
      </>
    );
  }

  return (
    <>
      <AdminActiveTab />
      <AdminPageShell
        title={`${tenantName} Details`}
        description="Review partner account activity and compliance documents."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                navigate(
                  `/admin-dashboard/partners/monitoring?id=${encodeURIComponent(btoa(tenantId!))}`,
                )
              }
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-[var(--theme-color)] hover:text-[var(--theme-color)]"
            >
              <Activity className="w-4 h-4" />
              Monitoring
            </button>
            <button
              onClick={() => navigate("/admin-dashboard/partners")}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-[var(--theme-color)] hover:text-[var(--theme-color)]"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Partners
            </button>
          </div>
        }
        contentClassName="space-y-6"
      >
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map(({ label, value, hint, icon: Icon }) => (
            <InfoTile key={label} label={label} value={value} hint={hint} icon={<Icon size={18} />} />
          ))}
        </section>

        <div className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-700">
          {tabs.map(({ value, label, icon: Icon }) => {
            const isActive = activeButton === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setActiveButton(value)}
                className={`-mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-gray-900 dark:text-white"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
                style={isActive ? { borderColor: accent } : undefined}
              >
                <Icon size={15} />
                {label}
              </button>
            );
          })}
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          {(tabs.find((tab) => tab.value === activeButton) ?? tabs[0])?.component ?? null}
        </section>
      </AdminPageShell>
    </>
  );
}
