// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import tenantRegionApi from "../../services/tenantRegionApi";
import Sidebar from "../components/TenantSidebar";
import HeaderBar from "../components/clientHeadbar";
import BreadcrumbNav from "../components/clientAciveTab";

const RegionRequests = () => {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("regions");
  const contentRef = useRef(null);

  const tenantData = {
    name: "Your Organization",
    logo: "",
    color: "#288DD1",
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      setLoading(true);
      const response = await tenantRegionApi.fetchRegionRequests();
      setRegions(response.data);
    } catch (error) {
      console.error("Error fetching regions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: any) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      suspended: "bg-gray-100 text-gray-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  const filteredRegions = regions.filter((region) => {
    if (filter === "all") return true;
    return region.approval_status === filter;
  });

  const stats = {
    total: regions.length,
    pending: regions.filter((r) => r.approval_status === "pending").length,
    approved: regions.filter((r) => r.approval_status === "approved").length,
    earning: regions.filter((r) => r.approval_status === "approved" && r.is_active).length,
  };

  if (loading) {
    return (
      <>
        <Sidebar
          tenantData={tenantData}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <HeaderBar tenantData={tenantData} onMenuClick={toggleMobileMenu} />
        <BreadcrumbNav tenantData={tenantData} activeTab={activeTab} />
        <main className="dashboard-content-shell p-6 md:p-8 overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Sidebar
        tenantData={tenantData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <HeaderBar tenantData={tenantData} onMenuClick={toggleMobileMenu} />
      <BreadcrumbNav tenantData={tenantData} activeTab={activeTab} />
      <main ref={contentRef} className="dashboard-content-shell p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Regions</h1>
              <p className="text-gray-600 mt-1">Manage your cloud hosting regions</p>
            </div>
            <Link
              to="/tenant-dashboard/region-requests/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add New Region
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-gray-500 text-sm font-medium">Total Regions</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-gray-500 text-sm font-medium">Pending Approval</div>
              <div className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-gray-500 text-sm font-medium">Approved</div>
              <div className="text-3xl font-bold text-green-600 mt-2">{stats.approved}</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-gray-500 text-sm font-medium">Earning</div>
              <div className="text-3xl font-bold text-blue-600 mt-2">{stats.earning}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="flex gap-2">
              {["all", "pending", "approved", "rejected", "suspended"].map((status: any) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === status
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Regions List */}
          {filteredRegions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No regions found</h3>
              <p className="text-gray-600 mb-4">
                {filter === "all"
                  ? "You haven't submitted any region requests yet."
                  : `No regions with status "${filter}"`}
              </p>
              {filter === "all" && (
                <Link
                  to="/tenant-dashboard/region-requests/new"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Submit Your First Region
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredRegions.map((region: any) => (
                <div
                  key={region.id}
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{region.name}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(region.approval_status)}`}
                        >
                          {region.approval_status}
                        </span>
                        {region.fulfillment_mode === "automated" && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Automated
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          {region.code} ({region.country_code})
                        </span>
                        <span>Provider: {region.provider}</span>
                        <span>Platform Fee: {region.platform_fee_percentage}%</span>
                      </div>
                    </div>
                    <Link
                      to={`/tenant-dashboard/region-requests/${region.id}`}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default RegionRequests;
