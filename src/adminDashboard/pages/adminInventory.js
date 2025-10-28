import React, { useState, useEffect, useMemo } from "react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import ModernCard from "../components/ModernCard";
import ProductSideMenu from "./inventoryComponents/productssidemenu";
import BandWidth from "./inventoryComponents/bandwidth";
import OSImages from "./inventoryComponents/osImages";
import EBSImages from "./inventoryComponents/ebsImages";
import Vms from "./inventoryComponents/vms";
import FloatingIP from "./inventoryComponents/floatingIP";
import CrossConnect from "./inventoryComponents/crossConnect";
import ColocationSetting from "./inventoryComponents/colocation";
import { useFetchRegions } from "../../hooks/adminHooks/regionHooks";
import { useLocation } from "react-router-dom";
import { ChevronDown, Server, HardDrive, Globe, Cpu, Database, Wifi } from "lucide-react";
import { designTokens } from "../../styles/designTokens";

export default function AdminInventory() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeProductTab, setActiveProductTab] = useState("os-image");
  const [selectedRegion, setSelectedRegion] = useState("");
  const { isFetching: isRegionsFetching, data: regions } = useFetchRegions();
  const location = useLocation();

  const productComponents = useMemo(
    () => [
      {
        id: "bandwidth",
        name: "Bandwidth Management",
        Component: BandWidth,
        icon: Wifi,
        description: "Manage network bandwidth allocations",
      },
      {
        id: "os-image",
        name: "OS Images Management",
        Component: OSImages,
        icon: HardDrive,
        description: "Manage operating system images",
      },
      {
        id: "ebs-volumes",
        name: "EBS Volumes Management",
        Component: EBSImages,
        icon: Database,
        description: "Manage elastic block storage volumes",
      },
      {
        id: "vms",
        name: "VMs Management",
        Component: Vms,
        icon: Server,
        description: "Manage virtual machine instances",
      },
      {
        id: "colocation",
        name: "Colocation Management",
        Component: ColocationSetting,
        icon: Cpu,
        description: "Manage colocation services",
      },
      {
        id: "ips",
        name: "Floating IP Management",
        Component: FloatingIP,
        icon: Globe,
        description: "Manage floating IP addresses",
      },
      {
        id: "cross-connect",
        name: "Cross Connect Management",
        Component: CrossConnect,
        icon: Globe,
        description: "Manage network cross connections",
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

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const handleProductTabChange = (tabId) => setActiveProductTab(tabId);
  const handleRegionChange = (region) => setSelectedRegion(region);

  const activeProduct = useMemo(
    () => productComponents.find((product) => product.id === activeProductTab),
    [productComponents, activeProductTab]
  );
  const ActiveIcon = activeProduct?.icon;
  const ActiveComponent = activeProduct?.Component;

  const regionSelector = (
    <div className="w-full max-w-xs">
      <label
        className="mb-2 block text-sm font-medium"
        style={{ color: designTokens.colors.neutral[700] }}
      >
        Select Region
      </label>
      <div className="relative">
        <select
          value={selectedRegion}
          onChange={(e) => handleRegionChange(e.target.value)}
          className="w-full appearance-none rounded-lg border px-4 py-2 pr-8"
          style={{
            backgroundColor: designTokens.colors.neutral[0],
            borderColor: designTokens.colors.neutral[300],
            color: designTokens.colors.neutral[900],
          }}
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
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
          style={{ color: designTokens.colors.neutral[400] }}
        />
      </div>
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
        title="Inventory Management"
        description="Monitor and manage infrastructure resources across regions."
        subHeaderContent={regionSelector}
        contentClassName="space-y-6"
      >
        <div className="flex w-full flex-col gap-6 lg:flex-row">
          <ProductSideMenu
            activeTab={activeProductTab}
            onTabChange={handleProductTabChange}
          />
          <ModernCard className="flex-1 lg:w-[76%]">
            {ActiveComponent && !isRegionsFetching ? (
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <div
                    className="rounded-lg p-2"
                    style={{
                      backgroundColor: designTokens.colors.primary[50],
                      color: designTokens.colors.primary[600],
                    }}
                  >
                    {ActiveIcon && <ActiveIcon size={20} />}
                  </div>
                  <div>
                    <h2
                      className="text-xl font-semibold"
                      style={{ color: designTokens.colors.neutral[900] }}
                    >
                      {activeProduct.name}
                    </h2>
                    <p
                      className="text-sm"
                      style={{ color: designTokens.colors.neutral[600] }}
                    >
                      {activeProduct.description}
                    </p>
                  </div>
                </div>
                <ActiveComponent selectedRegion={selectedRegion} />
              </div>
            ) : (
              <div className="py-16 text-center">
                <div className="mb-4">
                  <Server
                    size={48}
                    style={{
                      color: designTokens.colors.neutral[400],
                      margin: "0 auto",
                    }}
                  />
                </div>
                <p
                  className="text-lg font-medium"
                  style={{ color: designTokens.colors.neutral[500] }}
                >
                  {isRegionsFetching
                    ? "Loading regions..."
                    : "Select an inventory category from the menu."}
                </p>
              </div>
            )}
          </ModernCard>
        </div>
      </AdminPageShell>
    </>
  );
}
