import React, { useState, useEffect } from 'react';
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
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [action, setAction] = useState('');
  const [actionData, setActionData] = useState({
    platform_fee_percentage: '',
    reason: '',
    notes: '',
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    domain: '',
    domain_id: '',
  });

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

  const openActionModal = (region, actionType) => {
    setSelectedRegion(region);
    setAction(actionType);
    setActionData({
      platform_fee_percentage: region.platform_fee_percentage || 20,
      reason: '',
      notes: '',
    });
    setShowActionModal(true);
  };

  const closeActionModal = () => {
    setShowActionModal(false);
    setSelectedRegion(null);
    setAction('');
    setActionData({ platform_fee_percentage: '', reason: '', notes: '' });
  };

  const openCredentialModal = (region) => {
    setSelectedRegion(region);
    setShowCredentialModal(true);
    setCredentials({ username: '', password: '', domain: '', domain_id: '' });
  };

  const closeCredentialModal = () => {
    setShowCredentialModal(false);
    setSelectedRegion(null);
    setCredentials({ username: '', password: '', domain: '', domain_id: '' });
  };

  const handleVerifyCredentials = async (e) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password || !credentials.domain) {
      ToastUtils.error('Please fill in all required fields');
      return;
    }

    try {
      setVerifying(true);
      await adminRegionApi.verifyCredentials(selectedRegion.id, credentials);
      closeCredentialModal();
      fetchRegions(); // Refresh to show verification status
    } catch (error) {
      console.error('Error verifying credentials:', error);
    } finally {
      setVerifying(false);
    }
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRegion) return;

    try {
      switch (action) {
        case 'approve':
          await adminRegionApi.approveRegion(selectedRegion.id, {
            platform_fee_percentage: parseFloat(actionData.platform_fee_percentage),
            notes: actionData.notes,
          });
          break;
        case 'reject':
          await adminRegionApi.rejectRegion(selectedRegion.id, actionData.reason);
          break;
        case 'suspend':
          await adminRegionApi.suspendRegion(selectedRegion.id, actionData.reason);
          break;
        case 'reactivate':
          await adminRegionApi.reactivateRegion(selectedRegion.id);
          break;
        case 'update_fee':
          await adminRegionApi.updatePlatformFee(
            selectedRegion.id,
            parseFloat(actionData.platform_fee_percentage)
          );
          break;
        default:
          break;
      }
      closeActionModal();
      fetchRegions();
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
    }
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
              <h1 className="text-3xl font-bold text-gray-900">Region Approvals</h1>
              <p className="text-gray-600 mt-1">Review and manage tenant-owned region requests</p>
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
                              {region.approval_status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => openActionModal(region, 'approve')}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => openActionModal(region, 'reject')}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {region.approval_status === 'approved' && (
                                <>
                                  {region.ownership_type === 'platform' && region.fulfillment_mode === 'automated' && !region.msp_credentials_verified_at && (
                                    <button
                                      onClick={() => openCredentialModal(region)}
                                      className="text-purple-600 hover:text-purple-900"
                                    >
                                      Verify Creds
                                    </button>
                                  )}
                                  <button
                                    onClick={() => openActionModal(region, 'update_fee')}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    Update Fee
                                  </button>
                                  <button
                                    onClick={() => openActionModal(region, 'suspend')}
                                    className="text-orange-600 hover:text-orange-900"
                                  >
                                    Suspend
                                  </button>
                                </>
                              )}
                              {region.approval_status === 'suspended' && (
                                <button
                                  onClick={() => openActionModal(region, 'reactivate')}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Reactivate
                                </button>
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

      {/* Action Modal */}
      {showActionModal && selectedRegion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4 capitalize">{action.replace('_', ' ')} Region</h2>
              <p className="text-sm text-gray-600 mb-4">
                Region: <strong>{selectedRegion.name}</strong>
              </p>
              <form onSubmit={handleActionSubmit}>
                <div className="space-y-4">
                  {(action === 'approve' || action === 'update_fee') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Platform Fee Percentage
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={actionData.platform_fee_percentage}
                        onChange={(e) => setActionData(prev => ({ ...prev, platform_fee_percentage: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  )}

                  {(action === 'reject' || action === 'suspend') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason
                      </label>
                      <textarea
                        value={actionData.reason}
                        onChange={(e) => setActionData(prev => ({ ...prev, reason: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        required
                      />
                    </div>
                  )}

                  {action === 'approve' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={actionData.notes}
                        onChange={(e) => setActionData(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows="3"
                      />
                    </div>
                  )}

                  {action === 'reactivate' && (
                    <p className="text-sm text-gray-600">
                      Are you sure you want to reactivate this region?
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={closeActionModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-white rounded-lg ${
                      action === 'reject' || action === 'suspend'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    Confirm
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Credential Verification Modal */}
      {showCredentialModal && selectedRegion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Verify MSP Admin Credentials</h3>
            <p className="text-sm text-gray-600 mb-4">
              Region: <strong>{selectedRegion.name}</strong> (Platform-owned)
            </p>
            <form onSubmit={handleVerifyCredentials}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="MSP admin username"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="MSP admin password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Domain <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={credentials.domain}
                    onChange={(e) => setCredentials({ ...credentials, domain: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="cloud_msp"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Domain ID <span className="text-gray-500">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={credentials.domain_id}
                    onChange={(e) => setCredentials({ ...credentials, domain_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="dom-xxxxx"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Admin Note:</strong> MSP admins authenticate using the default project token (compulsory). 
                    Ensure credentials have <strong>msp_admin</strong> role in the default project for super-admin powers across all projects.
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    <strong>⚠️ Platform-owned only:</strong> You can only verify credentials for platform-owned regions. 
                    Tenant-owned region credentials must be verified by the tenant themselves.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeCredentialModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  disabled={verifying}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={verifying}
                >
                  {verifying ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegionApprovals;
