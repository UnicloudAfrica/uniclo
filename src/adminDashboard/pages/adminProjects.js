import React, { useState } from "react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import { useFetchProjects } from "../../hooks/adminHooks/projectHooks";
import { ChevronLeft, ChevronRight, Eye, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CreateProjectModal from "./projectComps/addProject";

// Function to encode the ID for URL
const encodeId = (id) => {
  return encodeURIComponent(btoa(id));
};

export default function AdminProjects() {
  const navigate = useNavigate();
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

const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch projects with backend pagination
  const { data: projectsResponse, isFetching: isProjectsFetching } =
    useFetchProjects({ page: currentPage, per_page: itemsPerPage });

  // Extract list and pagination meta
  const currentData = projectsResponse?.data || [];
  const totalPages = projectsResponse?.meta?.last_page || 1;
  const totalProjects = projectsResponse?.meta?.total || 0;

const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePerPageChange = (e) => {
    const value = Number(e.target.value);
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  const handleRowClick = (item) => {
    setSelectedItem(item);
    // Encode the ID and name for URL safety
    const encodedId = encodeId(item.identifier); // Using the new encodeId function
    const encodedName = encodeURIComponent(item.name);
    // Navigate to the project details page with encoded ID and name
    navigate(
      `/admin-dashboard/projects/details?id=${encodedId}&name=${encodedName}`
    );
  };

  if (isProjectsFetching) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <AdminActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
          <p className="ml-2 text-gray-700">Loading projects...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />
<main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8">
        <div className="flex items-center justify-between mt-5">
          <button
            onClick={openAddProject}
            className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base hover:bg-[#1976D2] transition-colors"
          >
            Add Project
          </button>

          <div className="flex items-center space-x-2">
            <label htmlFor="per-page" className="text-sm text-gray-700">
              Per page:
            </label>
            <select
              id="per-page"
              value={itemsPerPage}
              onChange={handlePerPageChange}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
            </select>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto mt-6 rounded-[12px] border border-gray-200">
          <table className="w-full">
            <thead className="bg-[#F5F5F5]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Project Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Edge
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E8E6EA]">
              {currentData.length > 0 ? (
                currentData.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal uppercase">
                      {item.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#288DD1]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(item);
                        }}
                        className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const encodedId = encodeId(item.identifier);
                          const encodedName = encodeURIComponent(item.name);
                          navigate(`/admin-dashboard/projects/details?id=${encodedId}&name=${encodedName}&openEdge=1`);
                        }}
                        className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                        title="Configure Edge"
                      >
                        Configure
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
<td
                    colSpan="5"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No projects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden mt-6 space-y-4">
          {currentData.length > 0 ? (
            currentData.map((item) => (
              <div
                key={item.id}
                onClick={() => handleRowClick(item)}
                className="bg-white rounded-[12px] shadow-sm p-4 cursor-pointer border border-gray-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold text-gray-900">
                    {item.name}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRowClick(item);
                    }}
                    className="text-[#288DD1] hover:text-[#1976D2] transition-colors p-1"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span className="font-medium">Description:</span>
                    <span>{item.description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Type:</span>
                    <span className=" uppercase">{item.type}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-[12px] shadow-sm p-4 text-center text-gray-500">
              No projects found.
            </div>
          )}
        </div>

{/* Pagination */}
        {totalProjects > 0 && (
          <div className="flex items-center justify-center px-4 py-3 border-t border-gray-200 bg-white rounded-b-[12px] mt-6">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-700">{currentPage}</span>
              <span className="text-sm text-gray-700">of</span>
              <span className="text-sm text-gray-700">{totalPages}</span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      <CreateProjectModal isOpen={isAddProjectOpen} onClose={closeAddProject} />
    </>
  );
}
