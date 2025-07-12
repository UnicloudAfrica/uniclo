import React, { useState } from "react";
import Headbar from "../components/headbar";
import Sidebar from "../components/sidebar";
import ActiveTab from "../components/activeTab";
import cloudCheck from "./assets/cloucCheck.svg";
import { ChevronRight, Loader2 } from "lucide-react";
import mobile from "./assets/mobile.svg";
import cloud from "./assets/cloud-connection.svg";
import monitor from "./assets/monitor.svg";
import { Link } from "react-router-dom";
import {
  useFetchProductOffers,
  useFetchProducts,
} from "../../hooks/productsHook";
import useAuthRedirect from "../../utils/authRedirect";
import CartFloat from "../components/cartFloat";
import { useFetchSubs } from "../../hooks/subscriptionHooks";
import { useFetchProfile } from "../../hooks/resource";

export default function Dashboard() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: subs, isFetching: isSubsFetching } = useFetchSubs();
  const { isLoading } = useAuthRedirect();
  const { data: profile, isFetching: isProfileFetching } = useFetchProfile();
  const {
    data: offers = { trial: [], discount: [] },
    isFetching: isOffersFetching,
  } = useFetchProductOffers();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Map icon strings to imported images
  const iconMap = {
    mobile: mobile,
    storage: cloud,
  };

  // Function to format amounts with thousand separators
  const formatAmount = (amount) => {
    return amount.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Skeleton component for offer cards
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

  if (isLoading || isProfileFetching) {
    return (
      <div className="w-full h-svh flex items-center justify-center">
        <Loader2 className="w-12 text-[#288DD1] animate-spin" />
      </div>
    );
  }

  return (
    <>
      <CartFloat />
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ActiveTab />
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-8">
        <p className="text-[#7e7e7e] font-Outfit text-sm font-normal">
          Welcome back, {profile?.first_name} 👋🏽
        </p>

        <div className="w-full md:w-[352px] mt-4 bg-[#288DD10D] py-6 px-5 rounded-[10px]">
          <div className="flex items-center space-x-1">
            <img src={cloudCheck} className="" alt="" />
            <p className="font-medium text-base text-[#288DD1]">
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
            <p className="font-Outfit font-normal text-xs text-[#288DD1]">
              SEE PURCHASED MODULES
            </p>
            <ChevronRight className="w-4 text-[#288DD1]" />
          </Link>
        </div>

        <div className="mt-6 w-full">
          <p className="text-[#7e7e7e] font-Outfit text-base font-normal">
            For you
          </p>
          {/* Trial Offers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {isOffersFetching ? (
              <OfferSkeleton />
            ) : offers.trial.length > 0 ? (
              offers.trial.map((offer) => (
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
                    <p className="text-[#288DD1] mt-4 text-2xl font-semibold">
                      ₦{formatAmount(offer.fixed_price)}/{offer.period_days}{" "}
                      days
                    </p>
                    <p className="mt-4 text-[#676767] font-normal text-sm">
                      {offer.productable.description}
                    </p>
                    <button className="bg-[#288DD11A] rounded-[30px] py-3 px-8 mt-4 text-[#288DD1] font-normal text-base">
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
            ) : offers.discount.length > 0 ? (
              offers.discount.map((offer) => (
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
                    <p className="text-[#288DD1] mt-4 text-2xl font-semibold">
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
                    <button className="bg-[#288DD11A] rounded-[30px] py-3 px-8 mt-4 text-[#288DD1] font-normal text-base">
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
    </>
  );
}
