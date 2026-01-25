// @ts-nocheck
import React from "react";
import { NavLink } from "react-router-dom";

const NetworkSideMenu = () => {
  const tabs = [
    {
      id: "key-pairs",
      name: "Key Pairs",
      path: "/admin-dashboard/key-pairs",
    },
    {
      id: "security-groups",
      name: "SGs",
      path: "/admin-dashboard/security-groups",
    },
    { id: "vpcs", name: "VPCs", path: "/admin-dashboard/vpcs" },
    {
      id: "subnets",
      name: "Subnets",
      path: "/admin-dashboard/subnets",
    },
    { id: "igws", name: "IGWs", path: "/admin-dashboard/igws" },
    {
      id: "route-tables",
      name: "Route Tables",
      path: "/admin-dashboard/route-tables",
    },
    { id: "enis", name: "ENIs", path: "/admin-dashboard/enis" },
    { id: "eips", name: "EIPs", path: "/admin-dashboard/eips" },
  ];

  return (
    <div className="w-full lg:w-[20%] bg-[--theme-card-bg] rounded-lg shadow-sm p-4 lg:p-6 flex flex-col space-y-2 mb-6 lg:mb-0 lg:mr-6 font-Outfit">
      <h3 className="text-lg font-semibold text-[--theme-heading-color] mb-2">Network</h3>
      <nav className="flex flex-col space-y-1">
        {tabs.map((tab: any) => (
          <NavLink
            key={tab.id}
            to={tab.path}
            className={({ isActive }) =>
              `w-full text-left px-3 py-2 rounded-md transition-colors text-sm duration-200 ${
                isActive
                  ? "bg-[--theme-color-10] text-[--theme-heading-color] font-medium"
                  : "text-[--theme-muted-color] hover:bg-[--theme-color-10] hover:text-[--theme-heading-color]"
              }`
            }
          >
            {tab.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default NetworkSideMenu;
