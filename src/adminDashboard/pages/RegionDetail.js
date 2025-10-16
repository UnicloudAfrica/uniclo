import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import adminRegionApi from '../../services/adminRegionApi';
import ToastUtils from '../../utils/toastUtil';
import AdminSidebar from '../components/adminSidebar';
import AdminHeadbar from '../components/adminHeadbar';

const RegionDetail = () => {
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
    default_project: '',
  });

  useEffect(() => {
    fetchRegionDetail();
  }, [id]);

  const fetchRegionDetail = async () => {
    try {
      setLoading(true);
      const response = await adminRegionApi.fetchRegionById(id);
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
      setCredentials({ username: '', password: '', domain: '', domain_id: '', default_project: '' });
      fetchRegionDetail(); // Refresh to show verification status
      ToastUtils.success('Credentials verified successfully');
    } catch (error) {
      console.error('Error verifying credentials:', error);
    } finally {
      setVerifying(false);
    }
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
                <Link to="/admin-dashboard/regions" className="text-blue-600 hover:text-blue-700">
                  Back to regions
                </Link>
              </div>
            </div>
          </main>
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
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <Link
                to="/admin-dashboard/regions"
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
                <div className="flex gap-3">
                  <Link
                    to={`/admin-dashboard/regions/${id}/edit`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Edit Region
                  </Link>
                </div>
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
                  <div className="text-sm text-gray-500">Status</div>
                  <div className="text-lg font-medium text-gray-900 capitalize">{region.status || 'unknown'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Active</div>
                  <div className="text-lg font-medium text-gray-900">{region.is_active ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>

            {/* MSP Credentials Card */}
            {region.provider === 'zadara' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">MSP Admin Credentials</h2>
                  {region.msp_credentials_verified_at ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                      ✓ Verified
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                      Not Verified
                    </span>
                  )}
                </div>
                
                {region.msp_credentials_verified_at ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Last verified: {new Date(region.msp_credentials_verified_at).toLocaleString()}
                    </p>
                    <button
                      onClick={() => setShowCredentialModal(true)}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Update credentials
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      MSP admin credentials are required for automated provisioning in this region.
                    </p>
                    <button
                      onClick={() => setShowCredentialModal(true)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Verify Credentials
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Credential Verification Modal */}
      {showCredentialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Verify MSP Admin Credentials</h3>
            <p className="text-sm text-gray-600 mb-4">
              Region: <strong>{region.name}</strong>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Project <span className="text-gray-500">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={credentials.default_project}
                    onChange={(e) => setCredentials({ ...credentials, default_project: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="default"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> MSP admins authenticate using the default project token. 
                    Ensure credentials have <strong>msp_admin</strong> role.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCredentialModal(false);
                    setCredentials({ username: '', password: '', domain: '', domain_id: '', default_project: '' });
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

export default RegionDetail;
