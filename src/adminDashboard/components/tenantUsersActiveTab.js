import React from "react";
import { NavLink } from "react-router-dom";

const ManagementSideMenu = () => {
  const tabs = [
    { id: "partners", name: "Partners", path: "/admin-dashboard/partners" },
    { id: "clients", name: "Clients", path: "/admin-dashboard/clients" },
    // { id: "admins", name: "Admin Users", path: "/admin-dashboard/admin-users" },
  ];

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4 font-Outfit">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
            Tenants & Users
          </p>
          <h3 className="text-lg font-semibold text-gray-900">
            Manage people segments
          </h3>
        </div>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Active workspace
        </span>
      </div>

      <nav className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.id}
            to={tab.path}
            className={({ isActive }) =>
              `px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                isActive
                  ? "bg-[#eef6ff] border-[#c6e0ff] text-[#0b63ce] shadow-sm"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900"
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

export default ManagementSideMenu;
