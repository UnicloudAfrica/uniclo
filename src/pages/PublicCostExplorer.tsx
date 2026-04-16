import { useState, useEffect } from "react";
import { Calculator, Sparkles } from "lucide-react";
import ServiceSidebar from "@/components/cost-explorer/ServiceSidebar";
import CartPanel from "@/components/cost-explorer/CartPanel";
import ComputeConfigurator from "@/components/cost-explorer/configurators/ComputeConfigurator";
import StorageConfigurator from "@/components/cost-explorer/configurators/StorageConfigurator";
import ObjectStorageConfigurator from "@/components/cost-explorer/configurators/ObjectStorageConfigurator";
import DatabaseConfigurator from "@/components/cost-explorer/configurators/DatabaseConfigurator";
import MigrationConfigurator from "@/components/cost-explorer/configurators/MigrationConfigurator";
import BackupConfigurator from "@/components/cost-explorer/configurators/BackupConfigurator";
import ShieldConfigurator from "@/components/cost-explorer/configurators/ShieldConfigurator";
import MonitoringConfigurator from "@/components/cost-explorer/configurators/MonitoringConfigurator";
import ProtectionConfigurator from "@/components/cost-explorer/configurators/ProtectionConfigurator";
import { useFetchPublicBranding } from "@/hooks/useCostExplorer";

const CONFIGURATORS: Record<string, React.FC> = {
  compute: ComputeConfigurator,
  storage: StorageConfigurator,
  "object-storage": ObjectStorageConfigurator,
  databases: DatabaseConfigurator,
  migration: MigrationConfigurator,
  backup: BackupConfigurator,
  shield: ShieldConfigurator,
  monitoring: MonitoringConfigurator,
  protection: ProtectionConfigurator,
};

export default function PublicCostExplorer() {
  const [activeService, setActiveService] = useState("compute");
  const { data: branding } = useFetchPublicBranding();

  const brandName = branding?.branding?.company?.name || "UniCloud Africa";
  const primaryColor = branding?.branding?.brand?.primary_color || "#1a56db";
  const logoUrl = branding?.branding?.logo || null;

  useEffect(() => {
    if (primaryColor) document.documentElement.style.setProperty("--brand-primary", primaryColor);
  }, [primaryColor]);

  const ActiveConfigurator = CONFIGURATORS[activeService];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 px-6 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={brandName} className="h-8" />
            ) : (
              <h1 className="text-xl font-bold" style={{ color: primaryColor }}>{brandName}</h1>
            )}
          </div>
          <div className="flex items-center gap-3">
            <a href="/sign-in" className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900">Sign In</a>
            <a href="/sign-up" className="rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40" style={{ backgroundColor: primaryColor }}>Get Started Free</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden border-b px-6 py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(147, 51, 234, 0.3) 0%, transparent 50%)" }} />
        <div className="relative z-10 mx-auto max-w-7xl text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shadow-lg ring-1 ring-white/20">
            <Calculator className="h-7 w-7 text-blue-300" />
          </div>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Cloud Cost Explorer</h2>
          <p className="mx-auto mt-3 max-w-lg text-base text-gray-300">
            Configure your cloud infrastructure and get instant pricing. No account required.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-amber-300">All prices in Nigerian Naira (₦) with 7.5% VAT</span>
          </div>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex gap-6">
          {/* Left: Services (20%) */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-20 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
              <ServiceSidebar activeService={activeService} onSelect={setActiveService} />
            </div>
          </aside>

          {/* Mobile service selector */}
          <div className="mb-4 lg:hidden">
            <select
              value={activeService}
              onChange={(e) => setActiveService(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium shadow-sm"
            >
              <option value="compute">Compute</option>
              <option value="storage">Block Storage</option>
              <option value="object-storage">Object Storage</option>
              <option value="databases">Managed Databases</option>
              <option value="migration">Migration & DR</option>
              <option value="backup">Backup</option>
              <option value="protection">Protection Plans</option>
              <option value="shield">Shield</option>
              <option value="monitoring">Monitoring</option>
            </select>
          </div>

          {/* Center: Configurator (flex-1) */}
          <main className="min-w-0 flex-1">
            <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
              {ActiveConfigurator ? <ActiveConfigurator /> : <p className="text-gray-400">Select a service</p>}
            </div>
          </main>

          {/* Right: Cart */}
          <aside className="hidden w-72 shrink-0 xl:block">
            <div className="sticky top-20 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
              <CartPanel currency="NGN" vatRate={7.5} />
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white/50 px-6 py-8">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-xs text-gray-400">Prices are estimates based on current product pricing. Final costs may vary based on actual usage, promotions, and billing cycle.</p>
          <p className="mt-2 text-xs text-gray-400">© {new Date().getFullYear()} {brandName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
