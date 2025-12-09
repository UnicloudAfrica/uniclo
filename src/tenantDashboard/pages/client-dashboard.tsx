// @ts-nocheck
import React, { useState } from "react";
import Sidebar from "../components/TenantSidebar";
import HeaderBar from "../components/clientHeadbar";
import BreadcrumbNav from "../components/clientAciveTab";
import logo from "./assets/logo.png";
import cloudCheck from "./assets/cloucCheck.svg";
import { ChevronRight } from "lucide-react";
import mobile from "./assets/mobile.svg";
import cloud from "./assets/cloud-connection.svg";
import monitor from "./assets/monitor.svg";
import { Link } from "react-router-dom";
import WorkInProgressModal from "../components/workInProgress";

const ClientDashboard = ({ tenant = "Tenant" }: any) => {
  // Use dummy tenant data directly without fetching
  const [tenantData] = useState({
    name: tenant === "Tenant" ? "Default Tenant" : `${tenant} Corp`,
    logo: logo, // Placeholder logo
    color: tenant === "Tenant" ? "#FF5722" : "#FF5722", // Consistent dummy color
  });

  const [activeTab, setActiveTab] = useState("dashboard");
  const [showWipModal, setShowWipModal] = useState(true);

  const handleOpenWipModal = () => {
    // Function to open WIP modal
    setShowWipModal(true);
  };

  const handleCloseWipModal = () => {
    // Function to close WIP modal
    setShowWipModal(false);
  };

  const dummyData = {
    profile: {
      first_name: "John",
      email: "john.doe@example.com",
    },
    offers: {
      trial: [
        {
          id: 1,
          name: "Trial Compute Instance",
          productable: {
            vcpus: 2,
            memory_gib: 4,
            description: "A trial compute instance for testing.",
            icon: "mobile",
          },
          fixed_price: 0.0,
          period_days: 7,
        },
      ],
      discount: [
        {
          id: 2,
          name: "Discounted Storage",
          productable: {
            media_type: "SSD",
            price_per_month: 50.0,
            description: "High-performance storage with 20% discount.",
            icon: "cloud",
          },
          discount_percentage: 20,
          period_days: 30,
        },
      ],
    },
  };

  // Function to format amounts with thousand separators
  const formatAmount = (amount: any) => {
    return amount.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Skeleton component for offer cards (unchanged)
  const OfferSkeleton = () => (
    <div className="relative w-full mt-4 border border-[#E9EAF4] py-6 px-5 rounded-[10px] animate-pulse">
      <div className="max-w-[300px]">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="flex items-center space-x-2 mt-4">
          <div className="flex items-center space-x-1">
            <div className="w-5 h-5 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
        <div className="h-6 bg-gray-200 rounded w-1/2 mt-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mt-4"></div>
        <div className="h-10 bg-gray-200 rounded-[30px] w-32 mt-4"></div>
      </div>
      <div className="absolute top-1/3 right-8 lg:right-[60px] w-10 h-10 bg-gray-200 rounded"></div>
    </div>
  );

  return (
    <>
      <Sidebar tenantData={tenantData} activeTab={activeTab} setActiveTab={setActiveTab} />
      <HeaderBar tenantData={tenantData} onMenuClick={() => {}} /> {/* Placeholder onMenuClick */}
      <BreadcrumbNav tenantData={tenantData} activeTab={activeTab} />
      <main className="dashboard-content-shell p-6 md:p-8">
        <p className="text-[#7e7e7e] font-Outfit text-sm font-normal">
          Welcome back, {dummyData.profile.first_name} 👋🏽
        </p>

        <div
          className="w-full md:w-[352px] mt-4 bg-[tenantData.color]10 py-6 px-5 rounded-[10px]"
          style={{ backgroundColor: tenantData.color + "10" }}
        >
          <div className="flex items-center space-x-1">
            <img src={cloudCheck} className="" alt="Cloud Check" />
            <p className="font-medium text-base" style={{ color: tenantData.color }}>
              Current Module
            </p>
          </div>
          <p className="mt-2 text-[#676767] font-normal text-sm">
            Explore all {tenantData.name} modules that you have purchased
          </p>
          <Link to="/dashboard/purchased-modules" className="mt-2 space-x-2 flex items-center">
            <p className="font-Outfit font-normal text-xs" style={{ color: tenantData.color }}>
              SEE PURCHASED MODULES
            </p>
            <ChevronRight className="w-4" style={{ color: tenantData.color }} />
          </Link>
        </div>

        <div className="mt-6 w-full">
          <p className="text-[#7e7e7e] font-Outfit text-base font-normal">For you</p>
          {/* Trial Offers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {dummyData.offers.trial.map((offer: any) => (
              <div
                className="relative w-full mt-4 border border-[#E9EAF4] py-6 px-5 rounded-[10px]"
                key={offer.id}
              >
                <div className="max-w-[300px]">
                  <h3 className="text-[#31373D] font-Outfit font-medium text-base">{offer.name}</h3>
                  <div className="flex items-center space-x-2 mt-4">
                    <div className="flex items-center space-x-1">
                      <img src={monitor} className="" alt="Monitor" />
                      <p className="font-medium text-sm text-[#1E1E1EB2]">
                        {offer.productable.vcpus} vCPU • {offer.productable.memory_gib} GiB Memory
                      </p>
                    </div>
                  </div>
                  <p
                    className="text-[tenantData.color] mt-4 text-2xl font-semibold"
                    style={{ color: tenantData.color }}
                  >
                    ₦{formatAmount(offer.fixed_price)}/{offer.period_days} days
                  </p>
                  <p className="mt-4 text-[#676767] font-normal text-sm">
                    {offer.productable.description}
                  </p>
                  <button
                    className="bg-[tenantData.color]10 rounded-[30px] py-3 px-8 mt-4 text-[tenantData.color] font-normal text-base"
                    style={{
                      backgroundColor: tenantData.color + "10",
                      color: tenantData.color,
                    }}
                  >
                    Use Now
                  </button>
                </div>
                <img
                  src={mobile}
                  className="absolute top-1/3 right-8 lg:right-[60px] w-10 lg:w-auto"
                  alt="Mobile Icon"
                />
              </div>
            ))}
          </div>

          {/* Discount Offers */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            {dummyData.offers.discount.map((offer: any) => (
              <div
                className="relative w-full mt-4 border border-[#E9EAF4] py-6 px-5 rounded-[10px]"
                key={offer.id}
              >
                <div className="max-w-[300px]">
                  <h3 className="text-[#31373D] font-Outfit font-medium text-base">{offer.name}</h3>
                  <div className="flex items-center space-x-2 mt-4">
                    <div className="flex items-center space-x-1">
                      <img src={monitor} className="" alt="Monitor" />
                      <p className="font-medium text-sm text-[#1E1E1EB2]">
                        {offer.productable.media_type} Storage
                      </p>
                    </div>
                  </div>
                  <p
                    className="text-[tenantData.color] mt-4 text-2xl font-semibold"
                    style={{ color: tenantData.color }}
                  >
                    ₦
                    {formatAmount(
                      offer.productable.price_per_month * (1 - offer.discount_percentage / 100)
                    )}
                    /{offer.period_days} days
                  </p>
                  <p className="mt-4 text-[#676767] font-normal text-sm">
                    {offer.productable.description}
                  </p>
                  <button
                    className="bg-[tenantData.color]10 rounded-[30px] py-3 px-8 mt-4 text-[tenantData.color] font-normal text-base"
                    style={{
                      backgroundColor: tenantData.color + "10",
                      color: tenantData.color,
                    }}
                  >
                    Purchase
                  </button>
                </div>
                <img
                  src={cloud}
                  className="absolute top-1/3 right-8 lg:right-[60px] w-10 lg:w-auto"
                  alt="Cloud Icon"
                />
              </div>
            ))}
          </div>
        </div>
      </main>
      <WorkInProgressModal isOpen={showWipModal} onClose={handleCloseWipModal} />
    </>
  );
};

export default ClientDashboard;
