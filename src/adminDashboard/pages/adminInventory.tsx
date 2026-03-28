import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import AdminPageShell from "../components/AdminPageShell";
import ProductSideMenu from "./inventoryComponents/productssidemenu";
import BandWidth from "./inventoryComponents/bandwidth";
import OSImages from "./inventoryComponents/osImages";
import EBSImages from "./inventoryComponents/ebsImages";
import Vms from "./inventoryComponents/vms";
import FloatingIP from "./inventoryComponents/floatingIP";
import CrossConnect from "./inventoryComponents/crossConnect";

import ObjectStorageInventory from "./inventoryComponents/objectStorage";
import ManagedDatabaseInventory from "./inventoryComponents/managedDatabaseInventory";

import { useFetchRegions, useFetchAvailabilityZones } from "@/hooks/adminHooks/regionHooks";
import { useLocation, useNavigate } from "react-router-dom";
import { Wifi, HardDrive, Database, Server, Globe, Cable, Cylinder } from "lucide-react";
import ResourceHero from "@/shared/components/ui/ResourceHero";
import { ModernCard, getRegionOptionLabel } from "@/shared/components/ui";

interface RegionRecord {
  code: string;
  name: string;
  provider?: string;
}

interface InventoryMetric {
  label: string;
  value: string;
  description: string;
}

interface ProductSummary {
  description: string;
  metrics: InventoryMetric[];
}

interface InventoryHeroState {
  title: string;
  description: string;
  metrics: InventoryMetric[];
}

interface ProductDefinition {
  id: string;
  name: string;
  Component: ComponentType<{
    selectedRegion: string;
    selectedProvider?: string;
    selectedAZ?: string;
    onMetricsChange?: (payload: { description?: string; metrics?: InventoryMetric[] }) => void;
  }>;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  caption: string;
  summary: ProductSummary;
  /** Which providers support this category. Omit = all providers. */
  providers?: string[];
}

export default function AdminInventory() {
  const [activeProductTab, setActiveProductTab] = useState("os-images");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedAZ, setSelectedAZ] = useState("");
  const { isFetching: isRegionsFetching, data: regionsData } = useFetchRegions();
  const { data: availabilityZones = [], isFetching: isAZsFetching } =
    useFetchAvailabilityZones(selectedRegion || undefined);
  const regions: RegionRecord[] = useMemo(
    () => (Array.isArray(regionsData) ? (regionsData as RegionRecord[]) : []),
    [regionsData]
  );
  const location = useLocation();
  const navigate = useNavigate();
  const [heroState, setHeroState] = useState<InventoryHeroState>({
    title: "Inventory",
    description:
      "Monitor and curate the catalogue of infrastructure assets available to provisioning teams.",
    metrics: [],
  });

  const productComponents = useMemo(
    (): ProductDefinition[] => [
      {
        id: "bandwidth",
        name: "Bandwidth",
        Component: BandWidth,
        icon: Wifi,
        caption: "Network throughput",
        summary: {
          description:
            "Fine-tune network throughput tiers and surface cost-effective options across your regions.",
          metrics: [
            { label: "Bandwidth SKUs", value: "—", description: "Available tiers" },
            { label: "Median price", value: "—", description: "Avg USD cost" },
            { label: "Premium tier", value: "—", description: "Highest SKU price" },
          ],
        },
      },
      {
        id: "os-images",
        name: "OS Images",
        Component: OSImages,
        icon: HardDrive,
        caption: "Golden templates",
        summary: {
          description:
            "Govern golden images and template readiness so provisioning stays consistent across tenants.",
          metrics: [
            { label: "Templates", value: "—", description: "Total OS images" },
            { label: "Licensed", value: "—", description: "Compliant images" },
            { label: "Unlicensed", value: "—", description: "Require action" },
          ],
        },
      },
      {
        id: "ebs-volumes",
        name: "Volumes",
        Component: EBSImages,
        icon: Database,
        caption: "Performance tiers",
        summary: {
          description:
            "Shape volume performance tiers so workloads stay predictable across throughput and IOPS.",
          metrics: [
            { label: "Volume types", value: "—", description: "Provisioning SKUs" },
            { label: "Avg read IOPS", value: "—", description: "Performance baseline" },
            { label: "Avg write IOPS", value: "—", description: "Sustained throughput" },
          ],
        },
      },
      {
        id: "vms",
        name: "Compute",
        Component: Vms,
        icon: Server,
        caption: "Instance classes",
        summary: {
          description:
            "Curate compute classes that balance CPU, memory, and sockets for customer workloads.",
          metrics: [
            { label: "Compute classes", value: "—", description: "VM profiles" },
            { label: "Total vCPUs", value: "—", description: "Aggregate capacity" },
            { label: "Avg memory", value: "—", description: "Per profile" },
          ],
        },
      },
      {
        id: "ips",
        name: "Floating IPs",
        Component: FloatingIP,
        icon: Globe,
        caption: "Public connectivity",
        summary: {
          description:
            "Manage routable IP pools across data centres and balance costs with carrier pricing.",
          metrics: [
            { label: "IP pools", value: "—", description: "Available pools" },
            { label: "Regions", value: "—", description: "Coverage footprint" },
            { label: "Avg price", value: "—", description: "Monthly cost" },
          ],
        },
      },
      {
        id: "cross-connect",
        name: "Cross Connects",
        Component: CrossConnect,
        icon: Cable,
        caption: "Partner links",
        providers: ["zadara"],
        summary: {
          description:
            "Expose carrier cross-connect offers and keep private networking pricing aligned.",
          metrics: [
            { label: "Cross connect SKUs", value: "—", description: "Available offers" },
            { label: "Providers", value: "—", description: "Partner carriers" },
            { label: "Avg price", value: "—", description: "Monthly charge" },
          ],
        },
      },
      {
        id: "object-storage",
        name: "Silo Storage",
        Component: ObjectStorageInventory,
        icon: HardDrive,
        caption: "S3-compatible",
        summary: {
          description:
            "Monitor Silo Storage availability across regions. Ensure tenant accounts and quotas stay aligned with provider limits.",
          metrics: [
            { label: "Storage accounts", value: "—", description: "Tenant accounts" },
            { label: "Silos", value: "—", description: "Provisioned silos" },
          ],
        },
      },
      {
        id: "managed-databases",
        name: "Lattice Databases",
        Component: ManagedDatabaseInventory,
        icon: Cylinder,
        caption: "Dedicated VMs",
        summary: {
          description:
            "Manage database plan inventory across engines. Ensure plans are available for tenant provisioning.",
          metrics: [
            { label: "Database plans", value: "—", description: "Total plans" },
            { label: "Active", value: "—", description: "Available for provisioning" },
            { label: "Engines", value: "—", description: "Supported DB engines" },
          ],
        },
      },
    ],
    []
  );

  // Derive the selected provider from the selected AZ (preferred) or from the region's AZs
  const selectedProvider = useMemo(() => {
    // If a specific AZ is selected, use its provider
    if (selectedAZ && Array.isArray(availabilityZones)) {
      const az = (availabilityZones as any[]).find((a) => a.code === selectedAZ);
      if (az?.provider) return az.provider.toLowerCase();
    }
    // Derive from first AZ of the region (provider no longer lives on region)
    if (Array.isArray(availabilityZones) && availabilityZones.length > 0) {
      return (availabilityZones[0] as any)?.provider?.toLowerCase() || "";
    }
    // Legacy fallback
    if (!selectedRegion || !regions.length) return "";
    const region = regions.find((r) => r.code === selectedRegion);
    return region?.provider?.toLowerCase() || "";
  }, [selectedRegion, selectedAZ, regions, availabilityZones]);

  // Filter products to only show categories supported by the selected provider
  const visibleProducts = useMemo(() => {
    if (!selectedProvider) return productComponents;
    return productComponents.filter(
      (product) => !product.providers || product.providers.includes(selectedProvider)
    );
  }, [productComponents, selectedProvider]);

  useEffect(() => {
    if (!isRegionsFetching && regions.length > 0 && !selectedRegion) {
      const defaultRegion = regions[0]?.code;
      if (defaultRegion) {
        setSelectedRegion(defaultRegion);
      }
    }
  }, [isRegionsFetching, regions, selectedRegion]);

  // When the region changes, if the active tab is not supported by this provider, switch to the first supported tab
  useEffect(() => {
    if (!visibleProducts.length) return;
    const isCurrentTabVisible = visibleProducts.some((p) => p.id === activeProductTab);
    if (!isCurrentTabVisible) {
      const firstVisible = visibleProducts[0]?.id;
      if (firstVisible) {
        setActiveProductTab(firstVisible);
        const params = new URLSearchParams(location.search);
        params.set("tab", firstVisible);
        navigate(`${location.pathname}?${params.toString()}`, { replace: true });
      }
    }
  }, [visibleProducts, activeProductTab, location.pathname, location.search, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (
      tabParam &&
      tabParam !== activeProductTab &&
      visibleProducts.some((product) => product.id === tabParam)
    ) {
      setActiveProductTab(tabParam);
    }
  }, [location.search, activeProductTab, visibleProducts]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (!tabParam) {
      params.set("tab", activeProductTab || "os-images");
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    }
  }, [location.pathname, location.search, activeProductTab, navigate]);

  const buildHeroState = useCallback(
    (product: ProductDefinition | undefined): InventoryHeroState => ({
      title: product?.name ?? "Inventory",
      description:
        product?.summary?.description ??
        "Monitor and manage platform inventory across all regions.",
      metrics: product?.summary?.metrics ?? [],
    }),
    []
  );

  useEffect(() => {
    if (!activeProductTab && visibleProducts.length > 0) {
      const defaultTab = visibleProducts[0]?.id;
      if (defaultTab) {
        setActiveProductTab(defaultTab);
      }
    }
  }, [activeProductTab, visibleProducts]);

  const activeProduct = useMemo(
    () => visibleProducts.find((product) => product.id === activeProductTab),
    [visibleProducts, activeProductTab]
  );
  const ActiveComponent = activeProduct?.Component;

  useEffect(() => {
    setHeroState(buildHeroState(activeProduct));
  }, [activeProduct, selectedRegion, buildHeroState]);

  const handleSummaryChange = useCallback(
    (payload: { description?: string; metrics?: InventoryMetric[] } | null) => {
      if (!payload) return;
      setHeroState((prev) => ({
        ...prev,
        description: payload.description ?? prev.description,
        metrics: Array.isArray(payload.metrics) ? payload.metrics : prev.metrics,
      }));
    },
    []
  );

  const handleProductTabChange = (tabId: string) => {
    setActiveProductTab(tabId);
    const nextActive = visibleProducts.find((product) => product.id === tabId);
    setHeroState(buildHeroState(nextActive));
    const params = new URLSearchParams(location.search);
    params.set("tab", tabId);
    navigate(`${location.pathname}?${params.toString()}`, { replace: false });
  };
  const handleRegionChange = (regionCode: string) => {
    setSelectedRegion(regionCode);
    setSelectedAZ("");
  };

  const regionSelector = (
    <div className="flex items-end gap-4">
      <div className="flex flex-col gap-2 text-left">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Region
        </label>
        <select
          value={selectedRegion}
          onChange={(event) => handleRegionChange(event.target.value)}
          className="min-w-[200px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-primary-200 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isRegionsFetching}
        >
          {isRegionsFetching ? (
            <option value="" disabled>
              Loading regions...
            </option>
          ) : (
            regions.map((region) => (
              <option key={region.code} value={region.code}>
                {getRegionOptionLabel(region)}
              </option>
            ))
          )}
        </select>
      </div>

      {selectedRegion && (
        <div className="flex flex-col gap-2 text-left">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Availability Zone
          </label>
          <select
            value={selectedAZ}
            onChange={(event) => setSelectedAZ(event.target.value)}
            className="min-w-[200px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-primary-200 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isAZsFetching}
          >
            <option value="">
              {isAZsFetching ? "Loading AZs..." : "All AZs"}
            </option>
            {Array.isArray(availabilityZones) &&
              availabilityZones.map((az: { code: string; name: string | null; provider: string }) => (
                <option key={az.code} value={az.code}>
                  {az.name || az.code} ({az.provider})
                </option>
              ))}
          </select>
        </div>
      )}
    </div>
  );

  return (
    <>
      <AdminPageShell
        contentClassName="space-y-8"
        description="Monitor and manage platform inventory across all regions to keep provisioning ready."
      >
        <ResourceHero
          title={heroState.title || activeProduct?.name || "Inventory"}
          subtitle="Inventory"
          description={heroState.description}
          metrics={heroState.metrics}
          accent="midnight"
          rightSlot={regionSelector}
        />

        <div className="flex flex-col gap-6 lg:flex-row">
          <ProductSideMenu
            items={visibleProducts.map((product: ProductDefinition) => ({
              id: product.id,
              name: product.name,
              icon: product.icon,
              caption: product.caption,
            }))}
            activeTab={activeProductTab}
            onTabChange={handleProductTabChange}
          />

          <ModernCard className="flex-1 overflow-hidden border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur">
            {ActiveComponent && !isRegionsFetching ? (
              <ActiveComponent
                selectedRegion={selectedRegion}
                selectedProvider={selectedProvider}
                selectedAZ={selectedAZ || undefined}
                onMetricsChange={handleSummaryChange}
              />
            ) : (
              <div className="py-16 text-center text-sm text-slate-500">
                {isRegionsFetching
                  ? "Loading regions..."
                  : "Select an inventory category from the side menu."}
              </div>
            )}
          </ModernCard>
        </div>
      </AdminPageShell>
    </>
  );
}
