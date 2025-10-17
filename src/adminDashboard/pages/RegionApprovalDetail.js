import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import adminRegionApi from '../../services/adminRegionApi';
import ToastUtils from '../../utils/toastUtil';
import AdminSidebar from '../components/adminSidebar';
import AdminHeadbar from '../components/adminHeadbar';

const RegionApprovalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
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
    fetchRegionDetail();
  }, [id]);

  const fetchRegionDetail = async () => {
    try {
      setLoading(true);
      const response = await adminRegionApi.fetchRegionApprovalById(id);
      setRegion(response.data);
    } catch (error) {
      console.error('Error fetching region:', error);
      ToastUtils.error('Failed to load region details');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCredentials = async (e) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password || !credentials.domain) {
      ToastUtils.error('Please fill in all required fields');
      return;
    }

    try {
      setVerifying(true);
      await adminRegionApi.verifyCredentials(id, credentials);
      setShowCredentialModal(false);
      setCredentials({ username: '', password: '', domain: '', domain_id: '' });
      fetchRegionDetail(); // Refresh to show verification status
    } catch (error) {
      console.error('Error verifying credentials:', error);
    } finally {
      setVerifying(false);
    }
  };

  const handleApprove = () => {
    navigate(`/admin-dashboard/region-approvals/${id}/edit?action=approve`);
  };

  const handleReject = () => {
    navigate(`/admin-dashboard/region-approvals/${id}/edit?action=reject`);
  };

  const handleSuspend = () => {
    navigate(`/admin-dashboard/region-approvals/${id}/edit?action=suspend`);
  };

  const handleReactivate = async () => {
    if (!window.confirm('Are you sure you want to reactivate this region?')) {
      return;
    }
    try {
      await adminRegionApi.reactivateRegion(id);
      fetchRegionDetail();
    } catch (error) {
      console.error('Error reactivating region:', error);
    }
  };

  const credentialSummary = region?.msp_credential_summary || {};
  const hasMspCredentials = Boolean(region?.has_msp_credentials);
  const recentRevenue = region?.recent_revenue_shares || [];

  const formatCurrency = (value) =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Number(value ?? 0));

  const handleUpdateFee = () => {
    navigate(`/admin-dashboard/region-approvals/${id}/edit?action=update_fee`);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Approval' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      suspended: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Suspended' },
    };
    return badges[status] || badges.pending;
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

  if (!region) {
    return (
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar isMobileMenuOpen={isMobileMenuOpen} closeMobileMenu={() => setIsMobileMenuOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminHeadbar toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Region not found</h3>
                <Link to="/admin-dashboard/region-approvals" className="text-blue-600 hover:text-blue-700">
                  Back to region approvals
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(region.approval_status);

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar isMobileMenuOpen={isMobileMenuOpen} closeMobileMenu={() => setIsMobileMenuOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeadbar toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <Link
                to="/admin-dashboard/region-approvals"
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 mb-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Region Approvals
              </Link>
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{region.name}</h1>
                  <p className="text-gray-600 mt-1">{region.code} • {region.country_code}</p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                  {statusBadge.label}
                </span>
              </div>
            </div>

            {/* Main Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Region Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Provider</div>
                  <div className="text-lg font-medium text-gray-900 capitalize">{region.provider}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Region Code</div>
                  <div className="text-lg font-medium text-gray-900">{region.code}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Country</div>
                  <div className="text-lg font-medium text-gray-900">{region.country_code}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">City</div>
                  <div className="text-lg font-medium text-gray-900">{region.city || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Platform Fee</div>
                  <div className="text-lg font-medium text-gray-900">{region.platform_fee_percentage}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Base URL</div>
                  <div className="text-lg font-medium text-gray-900 truncate">{region.base_url || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Ownership Type</div>
                  <div className="text-lg font-medium text-gray-900 capitalize">{region.ownership_type?.replace('_', ' ')}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Fulfillment Mode</div>
                  <div className="text-lg font-medium text-gray-900 capitalize">{region.fulfillment_mode}</div>
                </div>
              </div>
            </div>

            {/* Tenant Info Card */}
            {region.owner_tenant && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Owner Tenant</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Tenant Name</div>
                    <div className="text-lg font-medium text-gray-900">{region.owner_tenant.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Tenant ID</div>
                    <div className="text-lg font-medium text-gray-900 font-mono text-xs">{region.owner_tenant.id}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Credential Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Credential Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Domain</div>
                  <div className="text-lg font-medium text-gray-900">
                    {credentialSummary.domain || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Default Project</div>
                  <div className="text-lg font-medium text-gray-900">
                    {credentialSummary.default_project || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Credential Stored</div>
                  <div className="text-lg font-medium text-gray-900">
                    {hasMspCredentials ? 'Yes' : 'No'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Username Preview</div>
                  <div className="text-lg font-medium text-gray-900">
                    {credentialSummary.username_preview || '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* MSP Credentials Card */}
            {region.fulfillment_mode === 'automated' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">MSP Admin Credentials</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Automated provisioning requires verified MSP admin credentials
                    </p>
                  </div>
                  {region.msp_credentials_verified_at ? (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Verified
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Not Verified
                    </span>
                  )}
                </div>

                {region.msp_credentials_verified_at ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-medium text-green-900">Credentials Verified</p>
                        <p className="text-sm text-green-700 mt-1">
                          Last verified: {new Date(region.msp_credentials_verified_at).toLocaleString()}
                        </p>
                        {region.ownership_type === 'tenant_owned' && (
                          <p className="text-xs text-green-600 mt-2">
                            Verified by tenant owner
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-medium text-yellow-900">Credentials Required</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          {region.ownership_type === 'platform' 
                            ? 'Platform-owned region requires admin verification'
                            : 'Tenant must verify their MSP admin credentials'}
                        </p>
                      </div>
                    </div>
                    {region.ownership_type === 'platform' && region.approval_status === 'approved' && (
                      <button
                        onClick={() => setShowCredentialModal(true)}
                        className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Verify Credentials
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Recent Revenue */}
            {recentRevenue.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Revenue Shares</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Gross
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Platform Fee
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Tenant Share
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentRevenue.map((share) => (
                        <tr key={share.id}>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {share.created_at ? new Date(share.created_at).toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {formatCurrency(share.gross_amount)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {formatCurrency(share.platform_fee_amount)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {formatCurrency(share.tenant_share_amount)}
                          </td>
                          <td className="px-4 py-2 text-sm capitalize text-gray-700">
                            {share.status || 'pending'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Admin Notes */}
            {region.admin_notes && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Admin Notes</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{region.admin_notes}</p>
              </div>
            )}

            {/* Rejection/Suspension Reason */}
            {(region.approval_status === 'rejected' || region.approval_status === 'suspended') && region.rejection_reason && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {region.approval_status === 'rejected' ? 'Rejection' : 'Suspension'} Reason
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap">{region.rejection_reason}</p>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Admin Actions</h2>
              <div className="flex flex-wrap gap-3">
                {region.approval_status === 'pending' && (
                  <>
                    <button
                      onClick={handleApprove}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Approve Region
                    </button>
                    <button
                      onClick={handleReject}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Reject Region
                    </button>
                  </>
                )}
                {region.approval_status === 'approved' && (
                  <>
                    <button
                      onClick={handleUpdateFee}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Update Platform Fee
                    </button>
                    <button
                      onClick={handleSuspend}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Suspend Region
                    </button>
                  </>
                )}
                {region.approval_status === 'suspended' && (
                  <button
                    onClick={handleReactivate}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Reactivate Region
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Credential Verification Modal */}
      {showCredentialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Verify MSP Admin Credentials</h3>
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
                    <strong>Note:</strong> MSP admins authenticate using the default project token. 
                    Ensure credentials have <strong>msp_admin</strong> role in the default project.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCredentialModal(false);
                    setCredentials({ username: '', password: '', domain: '', domain_id: '' });
                  }}
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

export default RegionApprovalDetail;
