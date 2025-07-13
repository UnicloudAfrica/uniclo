import React, { useState } from "react";
import CartFloat from "../components/cartFloat";
import Headbar from "../components/headbar";
import ActiveTab from "../components/activeTab";
import Sidebar from "../components/sidebar";
import AddProjectModal from "../components/addProject";

export default function Project() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddProjectOpen, setAddProject] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const openAddProject = () => setAddProject(true);
  const closeAddProject = () => setAddProject(false);

  // Mock data based on the screenshot
  const instances = [
    {
      id: 1,
      name: "Test-Windows",
      instanceType: "z2.large",
      vCPUs: "2",
      ram: "4 GB",
      disk: "30 GB",
      operatingSystem: "Windows S.L.",
      ha: "N/A",
      user: "manreet",
      account: "Tech-Supp",
      status: "Spawning",
    },
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(instances.length / itemsPerPage);

  const currentData = instances.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRowClick = (item) => {
    setSelectedItem(item);
    // Add modal logic if needed
  };

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
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-[#1C1C1C]">
            Compute Instances
          </h2>
          {/* <button className="flex items-center gap-2 px-3 py-2 text-sm bg-[#F2F4F8] rounded-[8px] text-gray-600 hover:text-gray-900 transition-colors">
            Quick Start
          </button> */}
        </div>

        <button
          onClick={openAddProject}
          className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base mt-5 "
        >
          Add client
        </button>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto mt-6 rounded-[12px]">
          <table className="w-full">
            <thead className="bg-[#F5F5F5]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Instance Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  vCPUs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  RAM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Disk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Operating System
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  HA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E8E6EA]">
              {currentData.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => handleRowClick(item)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {item.instanceType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {item.vCPUs}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {item.ram}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {item.disk}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {item.operatingSystem}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {item.ha}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {item.user}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {item.account}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {item.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden mt-6">
          {currentData.map((item) => (
            <div
              key={item.id}
              onClick={() => handleRowClick(item)}
              className="border-b border-gray-200 py-4 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900">
                  {item.name}
                </h3>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize bg-[#F5A62333] text-[#F5A623]">
                  {item.status}
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span className="font-medium">Instance Type:</span>
                  <span>{item.instanceType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">vCPUs:</span>
                  <span>{item.vCPUs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">RAM:</span>
                  <span>{item.ram}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Disk:</span>
                  <span>{item.disk}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">OS:</span>
                  <span>{item.operatingSystem}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">HA:</span>
                  <span>{item.ha}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">User:</span>
                  <span>{item.user}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Account:</span>
                  <span>{item.account}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {instances.length > 0 && (
          <div className="flex items-center justify-center px-4 py-3 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <span className="text-sm text-gray-700">{currentPage}</span>
              <span className="text-sm text-gray-700">of</span>
              <span className="text-sm text-gray-700">{totalPages}</span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </main>

      <AddProjectModal isOpen={isAddProjectOpen} onClose={closeAddProject} />
    </>
  );
}
