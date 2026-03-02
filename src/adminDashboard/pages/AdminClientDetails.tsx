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
  LucideIcon,
} from "lucide-react";
import { useFetchClientById } from "../../hooks/adminHooks/clientHooks";
import AdminPageShell from "../components/AdminPageShell";
import OnboardingStatusBoard from "../components/onboarding/OnboardingStatusBoard";
import { useUserBroadcasting } from "../../hooks/useUserBroadcasting";

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
  value: string;
  hint: string;
  icon: LucideIcon;
  accentBg: string;
  accentText: string;
};

type ClientTab = {
  label: string;
  value: string;
  description: string;
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
  } = useFetchClientById(clientId as any);
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

  const summaryCards: SummaryCardItem[] = [
    {
      label: "Client Profile",
      value: fullName || "Unnamed client",
      hint: clientDetails?.role ? `Role • ${clientDetails.role}` : "Role not assigned",
      icon: CircleUserRound,
      accentBg: "bg-primary/10",
      accentText: "text-[var(--theme-color)]",
    },
    {
      label: "Status",
      value: clientDetails?.verified === 1 ? "Active" : "Pending",
      hint: clientDetails?.updated_at
        ? `Updated ${formatDate(clientDetails.updated_at)}`
        : "Never reviewed",
      icon: ShieldCheck,
      accentBg: clientDetails?.verified === 1 ? "bg-emerald-50" : "bg-amber-50",
      accentText: clientDetails?.verified === 1 ? "text-emerald-600" : "text-amber-600",
    },
    {
      label: "Contact",
      value: clientDetails?.email || "No email provided",
      hint: clientDetails?.phone ? `Phone • ${clientDetails.phone}` : "Phone number unavailable",
      icon: Mail,
      accentBg: "bg-slate-100",
      accentText: "text-slate-700",
    },
    {
      label: "Tenant",
      value: clientDetails?.tenant?.name || "No tenant assigned",
      hint: clientDetails?.tenant?.identifier
        ? `ID • ${clientDetails?.tenant?.identifier}`
        : "Identifier unavailable",
      icon: Building2,
      accentBg: "bg-indigo-50",
      accentText: "text-indigo-600",
    },
  ];

  const tabs: ClientTab[] = [
    {
      label: "Overview",
      value: "overview",
      description: "Profile, tenancy, and compliance summary",
      icon: LayoutDashboard,
      component: <OverviewClient client={clientDetails} openEditOnLoad={openEditOnLoad} />,
    },
    {
      label: "Modules",
      value: "purchased",
      description: "Provisioned services and billing snapshots",
      icon: Boxes,
      component: <ClientModules client={clientDetails} />,
    },
    {
      label: "Onboarding",
      value: "onboarding",
      description: "Track submission progress and review flags",
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
  ];

  if (isClientFetching || clientId === null) {
    return (
      <>
        <AdminActiveTab />
        <AdminPageShell contentClassName="p-6 md:p-8 flex items-center justify-center flex-col">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--theme-color)]" />
          <p className="ml-2 text-gray-700 mt-2">Loading client details...</p>
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
          <p className="text-lg font-semibold text-gray-700 mb-2">
            This client could not be found.
          </p>
          {error?.message && <p className="text-sm text-gray-500 mb-4">{error.message}</p>}
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
        contentClassName="space-y-8"
      >
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map(({ label, value, hint, icon: Icon, accentBg, accentText }) => (
            <div
              key={label}
              className="rounded-3xl border border-[var(--theme-surface-alt)] bg-white p-5 shadow-sm transition hover:border-primary/50 hover:shadow-md"
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
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {tabs.map(({ value, label, description, icon: Icon }) => {
              const isActive = activeButton === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActiveButton(value)}
                  className={`group flex items-start gap-3 rounded-3xl border px-5 py-4 text-left shadow-sm transition ${isActive ? "border-[var(--theme-color)] bg-[var(--theme-surface-alt)] shadow-md" : "border-transparent bg-white hover:border-primary/40 hover:shadow-md"}`}
                >
                  <span
                    className={`mt-1 flex h-10 w-10 items-center justify-center rounded-2xl ${isActive ? "bg-primary/15 text-[var(--theme-color)]" : "bg-slate-100 text-slate-500"}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p
                      className={`text-sm font-semibold ${isActive ? "text-[var(--theme-heading-color)]" : "text-slate-700"}`}
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

        <section className="rounded-3xl border border-[var(--theme-surface-alt)] bg-white p-6 shadow-sm">
          {(tabs.find((tab) => tab.value === activeButton) ?? tabs[0])?.component ?? null}
        </section>
      </AdminPageShell>
    </>
  );
};

export default AdminClientDetails;
