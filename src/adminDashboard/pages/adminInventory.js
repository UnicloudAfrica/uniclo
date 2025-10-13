import React, { useState, useEffect } from "react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import ModernCard from "../components/ModernCard";
import ModernStatsCard from "../components/ModernStatsCard";
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

  useEffect(() => {
    if (
      !isRegionsFetching &&
      regions &&
      regions.length > 0 &&
      !selectedRegion
    ) {
      setSelectedRegion(regions[0].code);
    }
  }, [isRegionsFetching, regions, selectedRegion]);

  const productComponents = [
    { 
      id: "bandwidth", 
      name: "Bandwidth Management", 
      Component: BandWidth,
      icon: Wifi,
      description: "Manage network bandwidth allocations"
    },
    { 
      id: "os-image", 
      name: "OS Images Management", 
      Component: OSImages,
      icon: HardDrive,
      description: "Manage operating system images"
    },
    { 
      id: "ebs-volumes", 
      name: "EBS Volumes Management", 
      Component: EBSImages,
      icon: Database,
      description: "Manage elastic block storage volumes"
    },
    { 
      id: "vms", 
      name: "VMs Management", 
      Component: Vms,
      icon: Server,
      description: "Manage virtual machine instances"
    },
    {
      id: "colocation",
      name: "Colocation Management",
      Component: ColocationSetting,
      icon: Cpu,
      description: "Manage colocation services"
    },
    { 
      id: "ips", 
      name: "Floating IP Management", 
      Component: FloatingIP,
      icon: Globe,
      description: "Manage floating IP addresses"
    },
    {
      id: "cross-connect",
      name: "Cross Connect Management",
      Component: CrossConnect,
      icon: Globe,
      description: "Manage network cross connections"
    },
  ];

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
  }, [location.search, activeProductTab]);

  // Mock inventory statistics (in a real app, these would come from APIs)
  const inventoryStats = {
    totalVMs: 142,
    activeIPs: 89,
    storageVolumes: 67,
    totalBandwidth: "2.5TB",
    osImages: 24,
    crossConnections: 15
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleProductTabChange = (tabId) => {
    setActiveProductTab(tabId);
  };

  const handleRegionChange = (region) => {
    setSelectedRegion(region);
  };

  const ActiveComponent = productComponents.find(
    (product) => product.id === activeProductTab
  );

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />
      <main 
        className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] min-h-full p-6 md:p-8"
        style={{ backgroundColor: designTokens.colors.neutral[25] }}
      >
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 
                className="text-2xl font-bold"
                style={{ color: designTokens.colors.neutral[900] }}
              >
                Inventory Management
              </h1>
              <p 
                className="mt-1 text-sm"
                style={{ color: designTokens.colors.neutral[600] }}
              >
                Monitor and manage infrastructure resources across regions
              </p>
            </div>
            
            {/* Region Selector */}
            <div className="relative w-full max-w-[200px]">
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: designTokens.colors.neutral[700] }}
              >
                Select Region
              </label>
              <div className="relative">
                <select
                  value={selectedRegion}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  className="appearance-none w-full px-4 py-2 pr-8 rounded-lg border"
                  style={{
                    backgroundColor: designTokens.colors.neutral[0],
                    borderColor: designTokens.colors.neutral[300],
                    color: designTokens.colors.neutral[900]
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
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                  style={{ color: designTokens.colors.neutral[400] }}
                />
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ModernStatsCard
              title="Virtual Machines"
              value={inventoryStats.totalVMs}
              icon={<Server size={24} />}
              change={12}
              trend="up"
              color="primary"
              description="Active instances"
            />
            <ModernStatsCard
              title="Floating IPs"
              value={inventoryStats.activeIPs}
              icon={<Globe size={24} />}
              change={3}
              trend="up"
              color="success"
              description="Available IPs"
            />
            <ModernStatsCard
              title="Storage Volumes"
              value={inventoryStats.storageVolumes}
              icon={<Database size={24} />}
              change={-2}
              trend="down"
              color="warning"
              description="EBS volumes"
            />
            <ModernStatsCard
              title="Total Bandwidth"
              value={inventoryStats.totalBandwidth}
              icon={<Wifi size={24} />}
              color="info"
              description="Monthly allocation"
            />
          </div>

          {/* Inventory Management Interface */}
          <div className="flex flex-col lg:flex-row w-full gap-6">
            <ProductSideMenu
              activeTab={activeProductTab}
              onTabChange={handleProductTabChange}
            />
            <ModernCard className="flex-1 lg:w-[76%]">
              {ActiveComponent && !isRegionsFetching ? (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div 
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: designTokens.colors.primary[50],
                        color: designTokens.colors.primary[600]
                      }}
                    >
                      <ActiveComponent.icon size={20} />
                    </div>
                    <div>
                      <h2 
                        className="text-xl font-semibold"
                        style={{ color: designTokens.colors.neutral[900] }}
                      >
                        {ActiveComponent.name}
                      </h2>
                      <p 
                        className="text-sm"
                        style={{ color: designTokens.colors.neutral[600] }}
                      >
                        {ActiveComponent.description}
                      </p>
                    </div>
                  </div>
                  <ActiveComponent.Component selectedRegion={selectedRegion} />
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="mb-4">
                    <Server 
                      size={48} 
                      style={{ 
                        color: designTokens.colors.neutral[400],
                        margin: '0 auto'
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
        </div>
      </main>
    </>
  );
}
