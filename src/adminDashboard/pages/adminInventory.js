import React, { useCallback, useEffect, useMemo, useState } from "react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import ProductSideMenu from "./inventoryComponents/productssidemenu";
import BandWidth from "./inventoryComponents/bandwidth";
import OSImages from "./inventoryComponents/osImages";
import EBSImages from "./inventoryComponents/ebsImages";
import Vms from "./inventoryComponents/vms";
import FloatingIP from "./inventoryComponents/floatingIP";
import CrossConnect from "./inventoryComponents/crossConnect";

import ObjectStorageInventory from "./inventoryComponents/objectStorage";

import { useFetchRegions } from "../../hooks/adminHooks/regionHooks";
import { useLocation, useNavigate } from "react-router-dom";
import { Wifi, HardDrive, Database, Server, Globe, Cable, FileText } from "lucide-react";
import ResourceHero from "../components/ResourceHero";
import ModernCard from "../components/ModernCard";

export default function AdminInventory() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeProductTab, setActiveProductTab] = useState("os-images");
  const [selectedRegion, setSelectedRegion] = useState("");
  const { isFetching: isRegionsFetching, data: regions } = useFetchRegions();
  const location = useLocation();
  const navigate = useNavigate();
  const [heroState, setHeroState] = useState({
    title: "Inventory",
    description:
      "Monitor and curate the catalogue of infrastructure assets available to provisioning teams.",
    metrics: [],
  });

  const productComponents = useMemo(
    () => [
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
        name: "Object Storage",
        Component: ObjectStorageInventory,
        icon: HardDrive,
        caption: "S3-compatible",
        summary: {
          description:
            "Monitor object storage availability across regions. Ensure tenant accounts and quotas stay aligned with provider limits.",
          metrics: [
            { label: "Storage accounts", value: "—", description: "Tenant accounts" },
            { label: "Buckets", value: "—", description: "Provisioned containers" },
          ],
        },
      },
    ],
    []
  );

  useEffect(() => {
    if (!isRegionsFetching && regions && regions.length > 0 && !selectedRegion) {
      setSelectedRegion(regions[0].code);
    }
  }, [isRegionsFetching, regions, selectedRegion]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (
      tabParam &&
      tabParam !== activeProductTab &&
      productComponents.some((product) => product.id === tabParam)
    ) {
      setActiveProductTab(tabParam);
    }
  }, [location.search, activeProductTab, productComponents]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (!tabParam) {
      params.set("tab", activeProductTab || "os-images");
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    }
  }, [location.pathname, location.search, activeProductTab, navigate]);

  const buildHeroState = useCallback(
    (product) => ({
      title: product?.name ?? "Inventory",
      description:
        product?.summary?.description ??
        "Monitor and manage platform inventory across all regions.",
      metrics: product?.summary?.metrics ?? [],
    }),
    []
  );

  useEffect(() => {
    if (activeProductTab === null && productComponents.length > 0) {
      setActiveProductTab(productComponents[0].id);
    }
  }, [activeProductTab, productComponents]);

  const activeProduct = useMemo(
    () => productComponents.find((product) => product.id === activeProductTab),
    [productComponents, activeProductTab]
  );
  const ActiveComponent = activeProduct?.Component;

  useEffect(() => {
    setHeroState(buildHeroState(activeProduct));
  }, [activeProduct, selectedRegion, buildHeroState]);

  const handleSummaryChange = useCallback(
    (payload) => {
      if (!payload) return;
      setHeroState((prev) => ({
        ...prev,
        description: payload.description ?? prev.description,
        metrics: Array.isArray(payload.metrics) ? payload.metrics : prev.metrics,
      }));
    },
    []
  );

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const handleProductTabChange = (tabId) => {
    setActiveProductTab(tabId);
    const nextActive = productComponents.find((product) => product.id === tabId);
    setHeroState(buildHeroState(nextActive));
    const params = new URLSearchParams(location.search);
    params.set("tab", tabId);
    navigate(`${location.pathname}?${params.toString()}`, { replace: false });
  };
  const handleRegionChange = (regionCode) => setSelectedRegion(regionCode);

  const regionSelector = (
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
          regions?.map((region) => (
            <option key={region.code} value={region.code}>
              {region.name}
            </option>
          ))
        )}
      </select>
    </div>
  );

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
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
            items={productComponents.map((product) => ({
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
