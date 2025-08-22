import React, { useEffect, useState } from "react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import { useLocation, useNavigate } from "react-router-dom";
import { useFetchProjectById } from "../../hooks/adminHooks/projectHooks";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import EditDescriptionModal from "./projectComps/editProject";
import ConfirmDeleteModal from "./projectComps/deleteProject";
import EditProjectModal from "./projectComps/editProject";
import AddAdminInstance from "./instanceComp/addInstance";

// Function to decode the ID from URL
const decodeId = (encodedId) => {
  try {
    return atob(decodeURIComponent(encodedId));
  } catch (e) {
    console.error("Error decoding ID:", e);
    return null; // Handle invalid encoded ID
  }
};

export default function AdminProjectDetails() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [instances, setInstances] = useState([]); // Local state for instances, will be populated from projectDetails
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [isAddInstanceOpen, setAddInstanceOpen] = useState(false);
  const [isEditDescriptionModalOpen, setIsEditDescriptionModalOpen] =
    useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] =
    useState(false);

  const queryParams = new URLSearchParams(location.search);
  const encodedProjectId = queryParams.get("id");
  const projectId = decodeId(encodedProjectId);

  const {
    data: projectDetails,
    isFetching: isProjectFetching,
    error: projectError,
  } = useFetchProjectById(projectId);

  // Update local instances state when projectDetails changes
  useEffect(() => {
    if (projectDetails?.instances) {
      setInstances(projectDetails.instances);
    } else {
      setInstances([]);
    }
  }, [projectDetails]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateString);

    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      ...(isDateOnly
        ? {}
        : { hour: "numeric", minute: "2-digit", hour12: true }),
    };

    return date
      .toLocaleString("en-US", options)
      .replace(/,([^,]*)$/, isDateOnly ? "$1" : " -$1");
  };

  const openAddInstance = () => setAddInstanceOpen(true);
  const closeAddInstance = () => setAddInstanceOpen(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = instances.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(instances.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleRowClick = (item) => {
    // Encode the ID using btoa then encodeURIComponent
    const encodedId = encodeURIComponent(btoa(item.identifier));
    const instanceName = item.name; // No need to encode name as per request

    // Navigate to the instance details page
    navigate(
      `/admin-dashboard/instances/details?id=${encodedId}&name=${instanceName}`
    );
  };

  // Determine if project can be deleted (only if no instances)
  const canDeleteProject = instances.length === 0;

  // Loading state for project details
  if (isProjectFetching) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <AdminActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8 flex items-center justify-center flex-col">
          <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
          <p className="ml-2 text-gray-700 mt-2">Loading project details...</p>
        </main>
      </>
    );
  }

  // "Not Found" state if no projectDetails or an error occurred
  if (!projectDetails || projectError) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <AdminActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8 flex items-center justify-center flex-col text-center">
          <p className=" text-sm md:text-base font-normal text-gray-700 mb-4">
            This project could not be found.
          </p>
          <button
            onClick={() => navigate("/admin-dashboard/projects")}
            className="px-6 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors"
          >
            Go to Projects Page
          </button>
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#1E1E1EB2]">
            Project Details
          </h1>
          {canDeleteProject && (
            <button
              onClick={() => setIsDeleteConfirmModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
              title="Delete Project"
            >
              <Trash2 className="w-4 h-4" />
              Delete Project
            </button>
          )}
        </div>

        {/* Project Details Section */}
        <div className="bg-white rounded-[12px] p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-[#575758] mb-4">
            Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">Project Name:</span>
              <span className="text-gray-900">{projectDetails.name}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">Type:</span>
              <span className="text-gray-900 uppercase">
                {projectDetails.type}
              </span>
            </div>
            <div className="flex flex-col md:col-span-1">
              <span className="font-medium text-gray-600 flex items-center gap-2">
                Description:
                <button
                  onClick={() => setIsEditDescriptionModalOpen(true)}
                  className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                  title="Edit Description"
                >
                  <Pencil className="w-3" />
                </button>
              </span>
              <span className="text-gray-900">
                {projectDetails.description}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">Created At:</span>
              <span className="text-gray-900">
                {formatDate(projectDetails.created_at)}
              </span>
            </div>
            {/* Owner field is not in the provided project object, so it's removed */}
          </div>
        </div>

        <div className=" w-full flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#575758] ">Instances</h2>
          <button
            onClick={openAddInstance}
            className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base hover:bg-[#1976D2] transition-colors"
          >
            Add Instance
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto mt-6 rounded-[12px] border border-gray-200">
          <table className="w-full">
            <thead className="bg-[#F5F5F5]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Disk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  EBS Volume
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Operating System
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Action
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
                      {item.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.storage_size_gb
                        ? `${item.storage_size_gb} GiB`
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.ebs_volume?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.os_image?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                          item.status === "Running"
                            ? "bg-green-100 text-green-800"
                            : item.status === "Stopped"
                            ? "bg-red-100 text-red-800"
                            : item.status === "spawning"
                            ? "bg-blue-100 text-blue-800"
                            : item.status === "payment_pending"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-gray-100 text-gray-800" // Default for other statuses
                        }`}
                      >
                        {item.status?.replace(/_/g, " ") || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-normal">
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click from firing
                          handleRowClick(item);
                        }}
                        className="text-[#288DD1] hover:underline text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6" // Updated colspan to match new column count
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No instances found for this project.
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
                    {item.name || "N/A"}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                      item.status === "Running"
                        ? "bg-green-100 text-green-800"
                        : item.status === "Stopped"
                        ? "bg-red-100 text-red-800"
                        : item.status === "spawning"
                        ? "bg-blue-100 text-blue-800"
                        : item.status === "payment_pending"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {item.status?.replace(/_/g, " ") || "N/A"}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span className="font-medium">Disk:</span>
                    <span>
                      {item.storage_size_gb
                        ? `${item.storage_size_gb} GiB`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">EBS Volume:</span>
                    <span>{item.ebs_volume?.name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">OS:</span>
                    <span>{item.os_image?.name || "N/A"}</span>
                  </div>
                </div>
                <div className="mt-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent row click from firing
                      handleRowClick(item);
                    }}
                    className="text-[#288DD1] hover:underline text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-[12px] shadow-sm p-4 text-center text-gray-500">
              No instances found for this project.
            </div>
          )}
        </div>

        {/* Pagination */}
        {instances.length > itemsPerPage && (
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

      {/*
       */}
      {/* <AddAdminInstance isOpen={isAddInstanceOpen} onClose={closeAddInstance} /> */}
      <EditProjectModal
        isOpen={isEditDescriptionModalOpen}
        onClose={() => setIsEditDescriptionModalOpen(false)}
        projectId={projectId}
        projectDetails={projectDetails}
      />
      <ConfirmDeleteModal
        isOpen={isDeleteConfirmModalOpen}
        onClose={() => setIsDeleteConfirmModalOpen(false)}
        projectId={projectId}
        projectName={projectDetails?.name || "this project"}
      />
    </>
  );
}
