import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import tenantRegionApi from '../../services/tenantRegionApi';
import ToastUtils from '../../utils/toastUtil';
import Sidebar from '../components/clientSidebar';
import HeaderBar from '../components/clientHeadbar';
import BreadcrumbNav from '../components/clientAciveTab';

const RegionRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    domain: '',
    domain_id: '',
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('regions');
  const contentRef = useRef(null);

  const tenantData = {
    name: 'Your Organization',
    logo: '',
    color: '#288DD1',
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    fetchRegionDetail();
  }, [id]);

  const fetchRegionDetail = async () => {
    try {
      setLoading(true);
      const response = await tenantRegionApi.fetchRegionRequestById(id);
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
      await tenantRegionApi.verifyCredentials(id, credentials);
      setShowCredentialModal(false);
      setCredentials({ username: '', password: '', domain: '', domain_id: '' });
      fetchRegionDetail(); // Refresh to show verification status
    } catch (error) {
      console.error('Error verifying credentials:', error);
    } finally {
      setVerifying(false);
    }
  };

  const handleUpdateFulfillmentMode = async (mode) => {
    try {
      await tenantRegionApi.updateFulfillmentMode(id, mode);
      fetchRegionDetail();
    } catch (error) {
      console.error('Error updating fulfillment mode:', error);
    }
  };

  const handleCancelRequest = async () => {
    if (!window.confirm('Are you sure you want to cancel this region request?')) {
      return;
    }

    try {
      await tenantRegionApi.cancelRegionRequest(id);
      navigate('/tenant/regions');
    } catch (error) {
      console.error('Error cancelling request:', error);
    }
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

  const credentialSummary = region?.msp_credential_summary || {};
  const hasMspCredentials = Boolean(region?.has_msp_credentials);

  if (!region) {
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
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Region not found</h3>
              <Link to="/tenant-dashboard/region-requests" className="text-blue-600 hover:text-blue-700">
                Back to regions
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  const statusBadge = getStatusBadge(region.approval_status);

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
      <main
        ref={contentRef}
        className="dashboard-content-shell p-6 md:p-8 overflow-y-auto"
      >
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/tenant-dashboard/region-requests"
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Regions
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
          </div>
        </div>

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
              <div className="text-sm text-gray-500">Credential Status</div>
              <div className="text-lg font-medium text-gray-900">
                {hasMspCredentials ? 'Stored' : 'Not Stored'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Username</div>
              <div className="text-lg font-medium text-gray-900">
                {credentialSummary.username_preview || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Fulfillment Mode Card */}
        {region.approval_status === 'approved' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Fulfillment Mode</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleUpdateFulfillmentMode('manual')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  region.fulfillment_mode === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Manual
              </button>
              <button
                onClick={() => handleUpdateFulfillmentMode('automated')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  region.fulfillment_mode === 'automated'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Automated
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              {region.fulfillment_mode === 'automated'
                ? 'Region will automatically provision resources when orders are placed.'
                : 'Admin will manually provision resources for this region.'}
            </p>
          </div>
        )}

        {/* MSP Credentials Card */}
        {region.approval_status === 'approved' && region.fulfillment_mode === 'automated' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">MSP Admin Credentials</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Verify your Managed Service Provider admin credentials for automated provisioning
                </p>
              </div>
              {region.msp_credentials_verified_at ? (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Verified
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
                    <p className="text-xs text-green-600 mt-2">
                      Your MSP admin credentials authenticate using the default project token where you have msp_admin role.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCredentialModal(true)}
                  className="mt-4 text-sm text-green-700 hover:text-green-800 font-medium"
                >
                  Update Credentials
                </button>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="font-medium text-yellow-900">Credentials Required</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Please verify your MSP admin credentials to enable automated provisioning.
                    </p>
                    <p className="text-xs text-yellow-600 mt-2">
                      Note: MSP admins authenticate using the default project token. Make sure you have msp_admin role in your default project.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCredentialModal(true)}
                  className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Verify Credentials
                </button>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {region.approval_status === 'pending' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
            <button
              onClick={handleCancelRequest}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Cancel Request
            </button>
          </div>
        )}
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
                    Ensure you have <strong>msp_admin</strong> role in your default project for super-admin powers across all projects.
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
      </main>
    </>
  );
};

export default RegionRequestDetail;
