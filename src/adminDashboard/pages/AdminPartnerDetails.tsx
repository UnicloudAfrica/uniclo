// @ts-nocheck
import { useState, useEffect } from "react";
import AdminActiveTab from "../components/adminActiveTab";
import OverviewPartner from "../components/partnersComponent/OverviewPartner";
import PartnerModules from "../components/partnersComponent/PartnerModules";
import { useLocation, useNavigate } from "react-router-dom";
import {
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
} from "lucide-react";
import { useFetchTenantById } from "../../hooks/adminHooks/tenantHooks";
import PartnerClients from "../components/partnersComponent/PartnerClients";
import AdminPageShell from "../components/AdminPageShell";
import OnboardingStatusBoard from "../components/onboarding/OnboardingStatusBoard";
import TenantBillingTab from "./tenantComps/TenantBillingTab";
import TenantNetworkPolicyTab from "./tenantComps/TenantNetworkPolicyTab";
import { useTenantBroadcasting } from "../../hooks/useTenantBroadcasting";

// Function to decode the ID from URL (re-used from other files)
const decodeId = (encodedId: string) => {
  try {
    return atob(decodeURIComponent(encodedId));
  } catch (e) {
    console.error("Error decoding ID:", e);
    return null;
  }
};

export default function AdminPartnerDetails() {
  const [activeButton, setActiveButton] = useState("overview");

  const location = useLocation(); // Hook to access URL query parameters
  const navigate = useNavigate(); // Hook to navigate programmatically

  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState("Partner"); // Default name

  // Extract ID and name from URL query parameters on component mount
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const encodedId = queryParams.get("id");
    const nameFromUrl = queryParams.get("name");

    if (encodedId) {
      const decodedId = decodeId(encodedId);
      setTenantId(decodedId);
    }
    if (nameFromUrl) {
      setTenantName(decodeURIComponent(nameFromUrl));
    }
  }, [location.search]);

  // Use broadcasting hook for real-time updates
  useTenantBroadcasting(tenantId);

  // Fetch tenant details using the custom hook
  const {
    data: partnerDetails,
    isFetching: isPartnerFetching,
    isError: isPartnerError,
    error: partnerError,
  } = useFetchTenantById(tenantId);

  const formatDate = (value: string) => {
    if (!value) return null;
    try {
      return new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      console.error("Unable to format date", error);
      return null;
    }
  };

  const summaryCards = [
    {
      label: "Partner Account",
      value: partnerDetails?.business?.name || tenantName,
      hint: partnerDetails?.business?.industry
        ? `Industry • ${partnerDetails.business.industry}`
        : "Industry not captured",
      icon: Building2,
      accentBg: "bg-primary/10",
      accentText: "text-[#288DD1]",
    },
    {
      label: "Primary Contact",
      value: partnerDetails?.email || "No email provided",
      hint: partnerDetails?.phone ? `Phone • ${partnerDetails.phone}` : "Phone number unavailable",
      icon: Mail,
      accentBg: "bg-emerald-50",
      accentText: "text-emerald-600",
    },
    {
      label: "Location",
      value: partnerDetails?.business?.country || partnerDetails?.country || "Not specified",
      hint:
        partnerDetails?.business?.city || partnerDetails?.city
          ? `City • ${partnerDetails.business?.city || partnerDetails.city || "—"}`
          : "City not provided",
      icon: Globe2,
      accentBg: "bg-slate-100",
      accentText: "text-slate-700",
    },
    {
      label: "Verification",
      value: partnerDetails?.verified === 1 ? "Verified" : "Unverified",
      hint: partnerDetails?.updated_at
        ? `Updated ${formatDate(partnerDetails.updated_at)}`
        : "Awaiting latest review",
      icon: ShieldCheck,
      accentBg: partnerDetails?.verified === 1 ? "bg-emerald-50" : "bg-amber-50",
      accentText: partnerDetails?.verified === 1 ? "text-emerald-600" : "text-amber-600",
    },
  ];

  const tabs = [
    {
      label: "Overview",
      value: "overview",
      description: "Compliance, documents, and account metadata",
      icon: LayoutDashboard,
      component: <OverviewPartner partnerDetails={partnerDetails} tenantId={tenantId!} />,
    },
    {
      label: "Clients",
      value: "clients",
      description: "Linked customers managed by this partner",
      icon: Users2,
      component: <PartnerClients tenantId={tenantId!} />,
    },
    {
      label: "Modules",
      value: "purchased",
      description: "Purchased history and provisioning trail",
      icon: Boxes,
      component: <PartnerModules tenantId={tenantId!} />,
    },
    {
      label: "Onboarding",
      value: "onboarding",
      description: "Track review steps and outstanding approvals",
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
      description: "Billing model, credit limits, and payment settings",
      icon: Wallet,
      component: <TenantBillingTab tenantId={tenantId!} />,
    },
    {
      label: "Network Policy",
      value: "network-policy",
      description: "Elastic IP enforcement and preset safeguards",
      icon: Cloud,
      component: <TenantNetworkPolicyTab tenantId={tenantId!} />,
    },
  ];

  // Handle loading state
  if (isPartnerFetching) {
    return (
      <>
        <AdminActiveTab />
        <AdminPageShell contentClassName="p-6 md:p-8 flex items-center justify-center flex-col">
          <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
          <p className="ml-2 text-gray-700 mt-2">Loading partner details...</p>
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
          <p className="text-lg font-semibold text-gray-700 mb-2">Partner details not found.</p>
          {partnerError?.message && (
            <p className="text-sm text-gray-500 mb-4">{partnerError.message}</p>
          )}
          <button
            onClick={() => navigate("/admin-dashboard/partners")}
            className="px-6 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors"
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
          <button
            onClick={() => navigate("/admin-dashboard/partners")}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-[#288DD1] hover:text-[#288DD1]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Partners
          </button>
        }
        contentClassName="space-y-8"
      >
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map(({ label, value, hint, icon: Icon, accentBg, accentText }) => (
            <div
              key={label}
              className="rounded-3xl border border-[#EAECF0] bg-white p-5 shadow-sm transition hover:border-primary/50 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl ${accentBg} ${accentText}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                  </p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{value}</p>
                  {hint && <p className="mt-2 text-xs font-medium text-slate-500">{hint}</p>}
                </div>
              </div>
            </div>
          ))}
        </section>

        <section>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {tabs.map(({ value, label, description, icon: Icon }: any) => {
              const isActive = activeButton === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActiveButton(value)}
                  className={`group flex items-start gap-3 rounded-3xl border px-5 py-4 text-left shadow-sm transition ${
                    isActive
                      ? "border-[#288DD1] bg-[#F3FAFF] shadow-md"
                      : "border-transparent bg-white hover:border-primary/40 hover:shadow-md"
                  }`}
                >
                  <span
                    className={`mt-1 flex h-10 w-10 items-center justify-center rounded-2xl ${
                      isActive ? "bg-primary/15 text-[#288DD1]" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        isActive ? "text-[#0F172A]" : "text-slate-700"
                      }`}
                    >
                      {label}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">{description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-[#EAECF0] bg-white p-6 shadow-sm">
          {tabs.find((tab) => tab.value === activeButton)?.component ?? tabs[0].component}
        </section>
      </AdminPageShell>
    </>
  );
}
