import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminRegionApi from '../../services/adminRegionApi';
import ToastUtils from '../../utils/toastUtil';
import AdminSidebar from '../components/adminSidebar';
import AdminHeadbar from '../components/adminHeadbar';

const RegionApprovals = () => {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    ownership_type: '',
    approval_status: '',
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchRegions();
  }, [filters]);

  const fetchRegions = async () => {
    try {
      setLoading(true);
      const response = await adminRegionApi.fetchRegionApprovals(filters);
      setRegions(response.data || []);
    } catch (error) {
      console.error('Error fetching regions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      suspended: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const stats = {
    total: regions.length,
    pending: regions.filter(r => r.approval_status === 'pending').length,
    approved: regions.filter(r => r.approval_status === 'approved').length,
    rejected: regions.filter(r => r.approval_status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar isMobileMenuOpen={isMobileMenuOpen} closeMobileMenu={() => setIsMobileMenuOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminHeadbar toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
          <div className="flex items-center justify-center flex-1">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar isMobileMenuOpen={isMobileMenuOpen} closeMobileMenu={() => setIsMobileMenuOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeadbar toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Region Approvals</h1>
                  <p className="text-gray-600 mt-1">Review and manage region requests</p>
                </div>
                <Link
                  to="/admin-dashboard/region-approvals/create"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Platform Region
                </Link>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="text-gray-500 text-sm font-medium">Total Requests</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="text-gray-500 text-sm font-medium">Pending</div>
                <div className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="text-gray-500 text-sm font-medium">Approved</div>
                <div className="text-3xl font-bold text-green-600 mt-2">{stats.approved}</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="text-gray-500 text-sm font-medium">Rejected</div>
                <div className="text-3xl font-bold text-red-600 mt-2">{stats.rejected}</div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
              <h3 className="text-lg font-semibold mb-4">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ownership Type</label>
                  <select
                    name="ownership_type"
                    value={filters.ownership_type}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    <option value="platform">Platform</option>
                    <option value="tenant_owned">Tenant Owned</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Approval Status</label>
                  <select
                    name="approval_status"
                    value={filters.approval_status}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Regions Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Region
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Owner Tenant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fulfillment
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        MSP Credentials
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fee %
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {regions.length === 0 ? (
                                <tr>
                        <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                          No region requests found
                        </td>
                      </tr>
                    ) : (
                      regions.map((region) => (
                        <tr key={region.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{region.name}</div>
                              <div className="text-sm text-gray-500">{region.code}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {region.owner_tenant?.name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {region.city}, {region.country_code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {region.fulfillment_mode}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {region.fulfillment_mode === 'automated' ? (
                              region.msp_credentials_verified_at ? (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800" title={`Verified: ${new Date(region.msp_credentials_verified_at).toLocaleString()}`}>
                                  ✓ Verified
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  Pending
                                </span>
                              )
                            ) : (
                              <span className="text-gray-400 text-xs">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {getStatusBadge(region.approval_status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            {region.platform_fee_percentage}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                            <div className="flex justify-center gap-2">
                              <Link
                                to={`/admin-dashboard/region-approvals/${region.id}`}
                                className="text-blue-600 hover:text-blue-900"
                                title="View details"
                              >
                                View
                              </Link>
                              {region.approval_status === 'pending' && (
                                <>
                                  <Link
                                    to={`/admin-dashboard/region-approvals/${region.id}/edit?action=approve`}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    Approve
                                  </Link>
                                  <Link
                                    to={`/admin-dashboard/region-approvals/${region.id}/edit?action=reject`}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Reject
                                  </Link>
                                </>
                              )}
                              {region.approval_status === 'approved' && (
                                <>
                                  <Link
                                    to={`/admin-dashboard/region-approvals/${region.id}/edit?action=update_fee`}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    Edit
                                  </Link>
                                  <Link
                                    to={`/admin-dashboard/region-approvals/${region.id}/edit?action=suspend`}
                                    className="text-orange-600 hover:text-orange-900"
                                  >
                                    Suspend
                                  </Link>
                                </>
                              )}
                              {region.approval_status === 'suspended' && (
                                <Link
                                  to={`/admin-dashboard/region-approvals/${region.id}/edit?action=reactivate`}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Reactivate
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

    </div>
  );
};

export default RegionApprovals;
