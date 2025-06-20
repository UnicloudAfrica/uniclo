import React, { useState } from "react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import {
  ArrowDownRight,
  ArrowUpRight,
  MoreVertical,
  Settings2,
  Upload,
} from "lucide-react";

export default function AdminDashboard() {
  // State to control mobile menu visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Function to toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Function to close mobile menu
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  const metrics = [
    {
      label: "Total Active Partners",
      value: "50.8K",
      upward: "28.4%",
    },
    {
      label: "Total Active Clients",
      value: "46,769",
      downward: "12.6%",
    },
    { label: "Total Modules", value: "50" },
    { label: "Pending Tickets", value: "10" },
  ];

  const recentPartners = [
    {
      id: "PTL-001",
      name: "Sumo Partners",
      email: "email@gmail.com",
      phone: "081112233",
      clients: "20",
    },
    {
      id: "PTL-002",
      name: "Sumo Partners",
      email: "email@gmail.com",
      phone: "081112233",
      clients: "2",
    },
    {
      id: "PTL-003",
      name: "Sumo Partners",
      email: "email@gmail.com",
      phone: "081112233",
      clients: "15",
    },
    {
      id: "PTL-004",
      name: "Sumo Partners",
      email: "email@gmail.com",
      phone: "081112233",
      clients: "4",
    },
    {
      id: "PTL-005",
      name: "Sumo Partners",
      email: "email@gmail.com",
      phone: "081112233",
      clients: "1",
    },
  ];

  const recentClients = [
    {
      id: "CTL-001",
      name: "Sumo Partners",
      email: "email@gmail.com",
      phone: "081112233",
      module: "Current Module",
    },
    {
      id: "CTL-002",
      name: "Sumo Partners",
      email: "email@gmail.com",
      phone: "081112233",
      module: "Z4 Compute Instances",
    },
    {
      id: "CTL-003",
      name: "Sumo Partners",
      email: "email@gmail.com",
      phone: "081112233",
      module: "Z6 Compute Instances",
    },
  ];

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-8">
        {/* Header with Export and Filter Buttons */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-normal text-[#288DD1]">Overview</h2>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm bg-[#F2F4F8] rounded-[8px] text-[#676767] hover:text-gray-900 transition-colors">
              <Upload className="w-4 h-4 text-[#676767]" />
              Export
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm bg-[#F2F4F8] rounded-[8px] text-[#676767] hover:text-gray-900 transition-colors">
              <Settings2 className="w-4 h-4 text-[#676767]" />
              Filter
            </button>
          </div>
        </div>

        {/* Metrics Header */}
        <div className="flex w-full flex-col md:flex-row justify-between items-center gap-4 mb-6">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className={`flex-1 p-4 w-full rounded-[12px] bg-[#288DD10D] border border-[#288dd12d]`}
            >
              <p className="text-xs text-[#676767] capitalize">
                {metric.label}
              </p>
              <div className="flex items-center mt-4 space-x-1.5">
                <p className="text-lg md:text-2xl font-medium text-[#3272CA]">
                  {metric.value}
                </p>
                {metric.upward && (
                  <span className="bg-[#00BF6B14] text-[#00BF6B] px-1 py-0.5 rounded-sm flex items-center font-medium text-[12px]">
                    {metric.upward}
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  </span>
                )}
                {metric.downward && (
                  <span className="bg-[#EB417833] text-[#EB4178] px-1 py-0.5 rounded-sm flex items-center font-medium text-[12px]">
                    {metric.downward}
                    <ArrowDownRight className="w-3 h-3 mr-0.5" />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Partners Table/Card */}
        <div className="mb-6 w-full">
          <div className="flex items-center w-full justify-between mb-4">
            <h2 className="text-base font-medium text-[#1C1C1C]">
              Recent Partners
            </h2>
            <button className="flex items-center px-3 py-2 text-sm bg-[#F2F4F8] rounded-[8px] text-[#676767] hover:text-gray-900 transition-colors">
              See all
            </button>
          </div>
          <div className="overflow-x-auto mt-4 rounded-[12px]">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead className="bg-[#F5F5F5]">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-[#555E67] uppercase">
                      Partner ID
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-[#555E67] uppercase">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-[#555E67] uppercase">
                      Email
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-[#555E67] uppercase">
                      Phone Number
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-[#555E67] uppercase">
                      Number of Clients
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-[#555E67] uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E6EA]">
                  {recentPartners.map((partner) => (
                    <tr key={partner.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-[#575758]">
                        {partner.id}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-[#575758]">
                        {partner.name}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-[#575758]">
                        {partner.email}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-[#575758]">
                        {partner.phone}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-[#575758]">
                        {partner.clients}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-[#288DD1] cursor-pointer text-center flex items-center">
                        <MoreVertical className="text-[#288DD1] w-3" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden">
              {recentPartners.map((partner) => (
                <div
                  key={partner.id}
                  className="border-b border-gray-200 py-4 px-4 bg-white rounded-[12px] mb-2"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900">
                      {partner.name}
                    </h3>
                    <span className="text-sm text-[#288DD1] cursor-pointer flex items-center">
                      <MoreVertical className="text-[#288DD1] w-3 mr-1" />
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span className="font-medium">Partner ID:</span>
                      <span>{partner.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Email:</span>
                      <span>{partner.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Phone:</span>
                      <span>{partner.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Clients:</span>
                      <span>{partner.clients}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Clients Table/Card */}
        <div className="w-full">
          <div className="flex items-center w-full justify-between mb-4">
            <h2 className="text-base font-medium text-[#1C1C1C]">
              Recent Clients
            </h2>
            <button className="flex items-center px-3 py-2 text-sm bg-[#F2F4F8] rounded-[8px] text-[#676767] hover:text-gray-900 transition-colors">
              See all
            </button>
          </div>
          <div className="overflow-x-auto mt-4 rounded-[12px]">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead className="bg-[#F5F5F5]">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-[#555E67] uppercase">
                      ID
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-[#555E67] uppercase">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-[#555E67] uppercase">
                      Email
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-[#555E67] uppercase">
                      Phone Number
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-[#555E67] uppercase">
                      Current Module
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-[#555E67] uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E6EA]">
                  {recentClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-[#575758]">
                        {client.id}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-[#575758]">
                        {client.name}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-[#575758]">
                        {client.email}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-[#575758]">
                        {client.phone}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-[#575758]">
                        {client.module}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-[#288DD1] cursor-pointer text-center flex items-center">
                        <MoreVertical className="text-[#288DD1] w-3" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden">
              {recentClients.map((client) => (
                <div
                  key={client.id}
                  className="border-b border-gray-200 py-4 px-4 bg-white rounded-[12px] mb-2"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900">
                      {client.name}
                    </h3>
                    <span className="text-sm text-[#288DD1] cursor-pointer flex items-center">
                      <MoreVertical className="text-[#288DD1] w-3 mr-1" />
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span className="font-medium">ID:</span>
                      <span>{client.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Email:</span>
                      <span>{client.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Phone:</span>
                      <span>{client.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Module:</span>
                      <span>{client.module}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
