import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Cloud,
} from "lucide-react";
import mobile from "./assets/mobile.svg";
import cloud from "./assets/cloud-connection.svg";
import monitor from "./assets/monitor.svg";
import { Link } from "react-router-dom";
import { useFetchClientProfile } from "../../hooks/clientHooks/resources";
import VerifyAccountPromptModal from "../components/verifyAccountPrompt";
import ClientActiveTab from "../components/clientActiveTab";
import { useFetchClientProductOffers } from "../../hooks/clientHooks/productsHook";
import useClientTheme from "../../hooks/clientHooks/useClientTheme";

// Placeholder hook for dashboard data
const useFetchTenantDashboard = () => {
  return {
    data: {
      message: {
        partners: 5,
        client: 120,
        active_instances: 150,
        pending_instances: 5,
        support: 2,
      },
    },
    isFetching: false,
  };
};

const MetricCardSkeleton = () => (
  <div className="flex-1 p-4 w-full rounded-[12px] bg-gray-100 border border-gray-200 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-6 bg-gray-300 rounded w-3/4"></div>
  </div>
);

export default function ClientDashboard() {
  const { data: profile, isFetching: isProfileFetching } =
    useFetchClientProfile();
  const { data: dashboard, isFetching: isDashboardFetching } =
    useFetchTenantDashboard();
  const {
    data: offers = { trial: [], discount: [] },
    isFetching: isOffersFetching,
  } = useFetchClientProductOffers();

  const [showVerifyModal, setShowVerifyModal] = useState(false);

  useEffect(() => {
    if (
      !isProfileFetching &&
      profile &&
      (profile.verified === 0 || profile.verified === false)
    ) {
      setShowVerifyModal(true);
    }
  }, [isProfileFetching, profile]);

  const handleCloseVerifyModal = () => {
    setShowVerifyModal(false);
  };

  const iconMap = {
    mobile: mobile,
    storage: cloud,
  };

  const formatAmount = (amount) => {
    return amount.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Prepare metrics data from dashboard.message
  const metrics = useMemo(() => {
    if (!dashboard?.message) return [];
    const { partners, client, active_instances, pending_instances, support } =
      dashboard.message;
    return [
      { label: "Partners", value: partners },
      { label: "Clients", value: client },
      { label: "Active Instances", value: active_instances },
      { label: "Pending Instances", value: pending_instances },
      { label: "Support Tickets", value: support },
    ];
  }, [dashboard]);

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
      <ClientActiveTab />
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8">
        <p className="text-[#7e7e7e] font-Outfit text-sm font-normal">
          Welcome, {profile?.first_name} 👋🏽
        </p>

        <div className="w-full md:w-[352px] mt-4 bg-[--theme-color-10] py-6 px-5 rounded-[10px]">
          <div className="flex items-center space-x-1">
            <Cloud className="text-[--theme-color]" />
            <p className="font-medium text-base text-[--theme-color]">
              Current Module
            </p>
          </div>
          <p className="mt-2 text-[#676767] font-normal text-sm">
            Explore all Unicloud African modules that you have purchased
          </p>
          <Link
            to="/dashboard/purchased-modules"
            className="mt-2 space-x-2 flex items-center"
          >
            <p className="font-Outfit font-normal text-xs text-[--theme-color]">
              SEE PURCHASED MODULES
            </p>
            <ChevronRight className="w-4 text-[--theme-color]" />
          </Link>
        </div>

        {/* New Metrics Section */}
        <div className="flex w-full flex-col md:flex-row justify-between items-center gap-4 mb-6 mt-6">
          {isDashboardFetching ? (
            <>
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </>
          ) : metrics.length > 0 ? (
            metrics.map((metric, index) => (
              <div
                key={index}
                className="flex-1 p-4 w-full rounded-[12px] border bg-[--theme-color-10] border-[--theme-color-20]"
              >
                <p className="text-xs text-[#676767] capitalize">
                  {metric.label}
                </p>
                <div className="flex items-center mt-4 space-x-1.5">
                  <p className="text-lg md:text-2xl font-medium text-[--secondary-color]">
                    {metric.value}
                  </p>
                  {/* Removed upward/downward conditional rendering as per request */}
                </div>
              </div>
            ))
          ) : (
            <div className="flex-1 p-4 w-full rounded-[12px] bg-gray-100 border border-gray-200 text-center text-gray-500">
              No metrics available.
            </div>
          )}
        </div>

        <div className="mt-6 w-full">
          <p className="text-[#7e7e7e] font-Outfit text-base font-normal">
            For you
          </p>
          {/* Trial Offers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {isOffersFetching ? (
              <OfferSkeleton />
            ) : offers?.trial?.length > 0 ? (
              offers?.trial?.map((offer) => (
                <div
                  className="relative w-full mt-4 border border-[#E9EAF4] py-6 px-5 rounded-[10px]"
                  key={offer.id}
                >
                  <div className="max-w-[300px]">
                    <h3 className="text-[#31373D] font-Outfit font-medium text-base">
                      {offer.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-4">
                      <div className="flex items-center space-x-1">
                        <img src={monitor} className="" alt="" />
                        <p className="font-medium text-sm text-[#1E1E1EB2]">
                          {offer.productable.vcpus} vCPU •{" "}
                          {offer.productable.memory_gib} GiB Memory
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-2xl font-semibold text-[--theme-color]">
                      ₦{formatAmount(offer.fixed_price)}/{offer.period_days}{" "}
                      days
                    </p>
                    <p className="mt-4 text-[#676767] font-normal text-sm">
                      {offer.productable.description}
                    </p>
                    <button className="rounded-[30px] py-3 px-8 mt-4 font-normal text-base bg-[--theme-color-10] text-[--theme-color]">
                      Use Now
                    </button>
                  </div>
                  <img
                    src={iconMap[offer.productable.icon] || mobile}
                    className="absolute top-1/3 right-8 lg:right-[60px] w-10 lg:w-auto"
                    alt=""
                  />
                </div>
              ))
            ) : (
              <p className="text-[#676767] font-normal text-sm">
                No trial offers available.
              </p>
            )}
          </div>

          {/* Discount Offers */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            {isOffersFetching ? (
              <>
                <OfferSkeleton />
                <OfferSkeleton />
              </>
            ) : offers?.discount?.length > 0 ? (
              offers?.discount?.map((offer) => (
                <div
                  className="relative w-full mt-4 border border-[#E9EAF4] py-6 px-5 rounded-[10px]"
                  key={offer.id}
                >
                  <div className="max-w-[300px]">
                    <h3 className="text-[#31373D] font-Outfit font-medium text-base">
                      {offer.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-4">
                      <div className="flex items-center space-x-1">
                        <img src={monitor} className="" alt="" />
                        <p className="font-medium text-sm text-[#1E1E1EB2]">
                          {offer.productable.media_type} Storage
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-2xl font-semibold text-[--theme-color]">
                      ₦
                      {formatAmount(
                        offer.productable.price_per_month *
                          (1 - offer.discount_percentage / 100)
                      )}
                      /{offer.period_days} days
                    </p>
                    <p className="mt-4 text-[#676767] font-normal text-sm">
                      {offer.productable.description}
                    </p>
                    <button className="rounded-[30px] py-3 px-8 mt-4 font-normal text-base bg-[--theme-color-10] text-[--theme-color]">
                      Purchase
                    </button>
                  </div>
                  <img
                    src={iconMap[offer.productable.icon] || cloud}
                    className="absolute top-1/3 right-8 lg:right-[60px] w-10 lg:w-auto"
                    alt=""
                  />
                </div>
              ))
            ) : (
              <p className="text-[#676767] font-normal text-sm">
                No discount offers available.
              </p>
            )}
          </div>
        </div>
      </main>
      <VerifyAccountPromptModal
        isOpen={showVerifyModal}
        onClose={handleCloseVerifyModal}
      />
    </>
  );
}
