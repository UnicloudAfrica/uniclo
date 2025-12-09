// @ts-nocheck
import React from "react";
import { NavLink } from "react-router-dom";

interface Tab {
  id: string;
  name: string;
  path: string;
}

const LaunchSideMenu: React.FC = () => {
  const tabs: Tab[] = [
    {
      id: "calculator",
      name: "Calculator",
      path: "/client-dashboard/calculator",
    },
    {
      id: "instances",
      name: "Instances",
      path: "/client-dashboard/instances",
    },
  ];

  return (
    <div className="w-full lg:w-[20%] bg-white rounded-lg shadow-sm p-4 lg:p-6 flex flex-col space-y-2 mb-6 lg:mb-0 lg:mr-6 font-Outfit">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Network</h3>
      <nav className="flex flex-col space-y-1">
        {tabs.map((tab: any) => (
          <NavLink
            key={tab.id}
            to={tab.path}
            className={({ isActive }) =>
              `w-full text-left px-3 py-2 rounded-md transition-colors text-sm duration-200 ${
                isActive
                  ? "bg-gray-50 text-[#1c1c1c] font-medium"
                  : "text-[#676767] hover:bg-gray-100"
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

export default LaunchSideMenu;
