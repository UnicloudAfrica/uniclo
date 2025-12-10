// @ts-nocheck
import React, { useState, useEffect } from "react";
import tenantRegionApi from "../../services/tenantRegionApi";
import TenantPageShell from "../../dashboard/components/TenantPageShell";
import { Download } from "lucide-react";

const RevenueDashboard = () => {
  const [stats, setStats] = useState({});
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
    region_id: "",
    status: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, sharesRes] = await Promise.all([
        tenantRegionApi.fetchRevenueStats(filters),
        tenantRegionApi.fetchRevenueShares(filters),
      ]);
      setStats(statsRes.data.summary || {});
      setShares(sharesRes.data || []);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: any) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    fetchData();
  };

  const handleExport = async () => {
    try {
      await tenantRegionApi.exportRevenueShares(filters);
    } catch (error) {
      console.error("Error exporting:", error);
    }
  };

  const ExportButton = (
    <button
      onClick={handleExport}
      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
    >
      <Download className="w-5 h-5" />
      Export CSV
    </button>
  );

  return (
    <TenantPageShell
      title="Revenue Dashboard"
      description="Track your earnings from tenant-owned regions"
      actions={ExportButton}
    >
      {loading ? (
        <div className="flex items-center justify-center min-h-[calc(100vh-300px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-gray-500 text-sm font-medium">Total Revenue</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                ${(stats.total_revenue || 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-500 mt-1">{stats.total_orders || 0} orders</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-gray-500 text-sm font-medium">Platform Fee</div>
              <div className="text-3xl font-bold text-orange-600 mt-2">
                ${(stats.total_platform_fee || 0).toFixed(2)}
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-gray-500 text-sm font-medium">Your Share</div>
              <div className="text-3xl font-bold text-green-600 mt-2">
                ${(stats.total_tenant_share || 0).toFixed(2)}
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-gray-500 text-sm font-medium">Pending Settlement</div>
              <div className="text-3xl font-bold text-yellow-600 mt-2">
                ${(stats.pending_settlement || 0).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
            <h3 className="text-lg font-semibold mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={filters.start_date}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  name="end_date"
                  value={filters.end_date}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="settled">Settled</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleApplyFilters}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>

          {/* Revenue Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Region
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gross
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fee %
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fee Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Your Share
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shares.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                        No revenue shares found
                      </td>
                    </tr>
                  ) : (
                    shares.map((share: any) => (
                      <tr key={share.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(share.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {share.region?.name || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {share.order?.identifier || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          ${share.gross_amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                          {share.platform_fee_percentage}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600">
                          ${share.platform_fee_amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                          ${share.tenant_share_amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              share.status === "settled"
                                ? "bg-green-100 text-green-800"
                                : share.status === "cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {share.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </TenantPageShell>
  );
};

export default RevenueDashboard;
