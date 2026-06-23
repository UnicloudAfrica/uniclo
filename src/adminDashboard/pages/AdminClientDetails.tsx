import { ReactNode, useEffect, useState } from "react";
import AdminActiveTab from "../components/adminActiveTab";
import OverviewClient from "../components/clientsComps/OverviewClient";
import ClientModules from "../components/clientsComps/ClientModules";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  Building2,
  CircleUserRound,
  LayoutDashboard,
  Loader2,
  Mail,
  ShieldCheck,
  ClipboardList,
  KeyRound,
  LucideIcon,
} from "lucide-react";
import { useFetchClientById } from "@/hooks/adminHooks/clientHooks";
import AdminPageShell from "../components/AdminPageShell";
import OnboardingStatusBoard from "../components/onboarding/OnboardingStatusBoard";
import AccessEntitlementsPanel from "@/shared/components/entitlements/AccessEntitlementsPanel";
import { useUserBroadcasting } from "@/hooks/useUserBroadcasting";
import InfoTile from "@/shared/components/ui/InfoTile";

const accent = "var(--theme-color)";

type ClientTenant = {
  name?: string;
  identifier?: string;
};

type ClientDetails = {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  verified?: number;
  updated_at?: string;
  phone?: string;
  tenant?: ClientTenant | null;
};

type SummaryCardItem = {
  label: string;
  value: ReactNode;
  hint: string;
  icon: LucideIcon;
};

type ClientTab = {
  label: string;
  value: string;
  icon: LucideIcon;
  component: ReactNode;
};

const decodeId = (encodedId: string) => {
  try {
    return atob(decodeURIComponent(encodedId));
  } catch {
    return null;
  }
};

const AdminClientDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeButton, setActiveButton] = useState("overview");
  const [clientId, setClientId] = useState<string | null>(null);
  const [openEditOnLoad, setOpenEditOnLoad] = useState(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const encodedClientId = queryParams.get("id");
    const editFromUrl = queryParams.get("edit");
    const shouldOpenEdit = Boolean(editFromUrl);

    if (encodedClientId) {
      const decodedId = decodeId(encodedClientId);
      setClientId(decodedId);
    }

    setOpenEditOnLoad(shouldOpenEdit);
    if (shouldOpenEdit) {
      queryParams.delete("edit");
      const updated = queryParams.toString();
      navigate(`${location.pathname}${updated ? `?${updated}` : ""}`, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  // Use broadcasting hook for real-time updates
  useUserBroadcasting(clientId);

  const {
    data: clientDetailsData,
    isFetching: isClientFetching,
    isError,
    error,
  } = useFetchClientById(clientId as unknown);
  const clientDetails =
    clientDetailsData && typeof clientDetailsData === "object"
      ? (clientDetailsData as ClientDetails)
      : null;

  const handleGoBack = () => {
    navigate("/admin-dashboard/clients");
  };

  const formatDate = (value: string) => {
    if (!value) return null;
    try {
      return new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return null;
    }
  };

  const fullName = [clientDetails?.first_name, clientDetails?.middle_name, clientDetails?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  const primaryEmail = clientDetails?.email || "No email provided";

  const isActive = clientDetails?.verified === 1;

  const summaryCards: SummaryCardItem[] = [
    {
      label: "Client Profile",
      value: fullName || "Unnamed client",
      hint: clientDetails?.role ? `Role • ${clientDetails.role}` : "Role not assigned",
      icon: CircleUserRound,
    },
    {
      label: "Status",
      value: (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold ${
            isActive
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
              : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
          }`}
        >
          {isActive ? "Active" : "Pending"}
        </span>
      ),
      hint: clientDetails?.updated_at
        ? `Updated ${formatDate(clientDetails.updated_at)}`
        : "Never reviewed",
      icon: ShieldCheck,
    },
    {
      label: "Contact",
      value: clientDetails?.email || "No email provided",
      hint: clientDetails?.phone ? `Phone • ${clientDetails.phone}` : "Phone number unavailable",
      icon: Mail,
    },
    {
      label: "Tenant",
      value: clientDetails?.tenant?.name || "No tenant assigned",
      hint: clientDetails?.tenant?.identifier
        ? `ID • ${clientDetails?.tenant?.identifier}`
        : "Identifier unavailable",
      icon: Building2,
    },
  ];

  const tabs: ClientTab[] = [
    {
      label: "Overview",
      value: "overview",
      icon: LayoutDashboard,
      component: <OverviewClient client={clientDetails} openEditOnLoad={openEditOnLoad} />,
    },
    {
      label: "Modules",
      value: "purchased",
      icon: Boxes,
      component: <ClientModules client={clientDetails} />,
    },
    {
      label: "Onboarding",
      value: "onboarding",
      icon: ClipboardList,
      component: (
        <OnboardingStatusBoard
          target="client"
          persona="tenant_client_business"
          userId={clientId!}
          entityName={fullName || primaryEmail}
          {...(clientDetails?.tenant?.name ? { contextName: clientDetails.tenant.name } : {})}
        />
      ),
    },
    {
      label: "Access & Entitlements",
      value: "entitlements",
      icon: KeyRound,
      component: <AccessEntitlementsPanel scope="client" accountId={clientId!} />,
    },
  ];

  if (isClientFetching || clientId === null) {
    return (
      <>
        <AdminActiveTab />
        <AdminPageShell contentClassName="p-6 md:p-8 flex items-center justify-center flex-col">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--theme-color)]" />
          <p className="ml-2 text-gray-700 dark:text-gray-300 mt-2">Loading client details...</p>
        </AdminPageShell>
      </>
    );
  }

  if (isError || !clientDetails) {
    return (
      <>
        <AdminActiveTab />
        <AdminPageShell contentClassName="p-6 md:p-8 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
            This client could not be found.
          </p>
          {error?.message && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error.message}</p>
          )}
          <button
            onClick={handleGoBack}
            className="px-6 py-3 bg-[var(--theme-color)] text-white font-medium rounded-full hover:bg-[var(--theme-color)] transition-colors"
          >
            Go back to Clients List
          </button>
        </AdminPageShell>
      </>
    );
  }

  return (
    <>
      <AdminActiveTab />
      <AdminPageShell
        title={`Client • ${fullName || "Record"}`}
        description={primaryEmail}
        actions={
          <button
            onClick={handleGoBack}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-[var(--theme-color)] hover:text-[var(--theme-color)]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Clients
          </button>
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
};

export default AdminClientDetails;
