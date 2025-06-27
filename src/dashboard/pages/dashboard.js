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
import { useFetchProducts } from "../../hooks/productsHook";
import useAuthRedirect from "../../utils/authRedirect";
import CartFloat from "../components/cartFloat";
import { useFetchSubs } from "../../hooks/subscriptionHooks";
import { useFetchProfile } from "../../hooks/resource";

export default function Dashboard() {
  // State to control mobile menu visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: subs, isFetching: isSubsFetching } = useFetchSubs();
  const { isLoading } = useAuthRedirect();
  const { data: profile, isFetching: isProfileFetching } = useFetchProfile();

  // Function to toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Function to close mobile menu
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const freeTrail = {
    id: 1,
    title: "Z2 Large Compute Instances",
    specs: "2 vCPU • 4 GiB Memory",
    price: "₦0.00",
    period: "2 weeks",
    description: "Use free trial for 2 weeks",
    icon: mobile,
  };

  const pricingData = [
    {
      id: 2,
      title: "Z2 Large Compute Instances",
      specs: "2 vCPU • 4 GiB Memory",
      price: "₦98,256.80",
      period: "month",
      description: "Ideal for medium-scale processing workloads.",
      icon: mobile,
    },
    {
      id: 3,
      title: "Z8 xLarge Compute Instances",
      specs: "4 vCPU • 32 GiB Memory",
      price: "₦300,499.20",
      period: "month",
      description: "Ideal for medium-scale processing workloads.",
      icon: cloud,
    },
  ];

  if (isLoading) {
    return (
      <div className=" w-full h-svh flex items-center justify-center">
        <Loader2 className=" w-12 text-[#288DD1] animate-spin" />
      </div>
    ); // Or a spinner
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
      <main className=" absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%]  bg-[#FAFAFA]  min-h-full p-8">
        <p className=" text-[#7e7e7e] font-Outfit text-sm font-normal">
          Welcome back, {profile?.first_name} 👋🏽
        </p>

        <div className=" w-full md:w-[352px] mt-4 bg-[#288DD10D] py-6 px-5 rounded-[10px]">
          <div className=" flex items-center space-x-1">
            <img src={cloudCheck} className="" alt="" />
            <p className=" font-medium text-base text-[#288DD1]">
              Current Module
            </p>
          </div>
          <p className=" mt-2 text-[#676767] font-normal text-sm">
            Explore all Unicloud African modules that you have purchased
          </p>

          <Link
            to="/dashboard/purchased-modules"
            className=" mt-2 space-x-2 flex items-center"
          >
            <p className=" font-Outfit font-normal text-xs text-[#288DD1]">
              SEE PURCHASED MODULES
            </p>
            <ChevronRight className=" w-4 text-[#288DD1]" />
          </Link>
        </div>

        <div className=" mt-6 w-full ">
          <p className=" text-[#7e7e7e] font-Outfit text-base font-normal">
            For you
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className=" relative w-full mt-4 border border-[#E9EAF4] py-6 px-5 rounded-[10px]">
              <div className=" max-w-[300px]">
                <h3 className=" text-[#31373D] font-Outfit font-medium text-base">
                  {freeTrail.title}
                </h3>
                <div className=" flex items-center space-x-2 mt-4">
                  <div className=" flex items-center space-x-1">
                    <img src={monitor} className="" alt="" />
                    <p className=" font-medium text-sm text-[#1E1E1EB2]">
                      {freeTrail.specs}
                    </p>
                  </div>
                </div>

                <p className=" text-[#288DD1] mt-4 text-2xl font-semibold">
                  {freeTrail.price}/{freeTrail.period}
                </p>
                <p className=" mt-4 text-[#676767] font-normal text-sm">
                  {freeTrail.description}
                </p>

                <button className=" bg-[#288DD11A] rounded-[30px] py-3 px-8 mt-4 text-[#288DD1] font-normal text-base">
                  Use Now
                </button>
              </div>
              <img
                src={freeTrail.icon}
                className=" absolute top-1/3 right-8 lg:right-[60px] w-10  lg:w-auto"
                alt=""
              />
            </div>
          </div>

          <div className=" w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            {pricingData.map((plan, index) => (
              <div
                className=" relative w-full mt-4 border border-[#E9EAF4] py-6 px-5 rounded-[10px]"
                key={index}
              >
                <div className=" max-w-[300px]">
                  <h3 className=" text-[#31373D] font-Outfit font-medium text-base">
                    {plan.title}
                  </h3>
                  <div className=" flex items-center space-x-2 mt-4">
                    <div className=" flex items-center space-x-1">
                      <img src={monitor} className="" alt="" />
                      <p className=" font-medium text-sm text-[#1E1E1EB2]">
                        {plan.specs}
                      </p>
                    </div>
                  </div>

                  <p className=" text-[#288DD1] mt-4 text-2xl font-semibold">
                    {plan.price}/{plan.period}
                  </p>
                  <p className=" mt-4 text-[#676767] font-normal text-sm">
                    {plan.description}
                  </p>

                  <button className=" bg-[#288DD11A] rounded-[30px] py-3 px-8 mt-4 text-[#288DD1] font-normal text-base">
                    Purchase
                  </button>
                </div>
                <img
                  src={plan.icon}
                  className="  absolute top-1/3 right-8 lg:right-[60px] w-10  lg:w-auto"
                  alt=""
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
