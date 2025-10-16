import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import adminRegionApi from '../../services/adminRegionApi';
import ToastUtils from '../../utils/toastUtil';
import AdminSidebar from '../components/adminSidebar';
import AdminHeadbar from '../components/adminHeadbar';
import { designTokens } from '../../styles/designTokens';
import { ArrowLeft, Edit, CheckCircle, AlertCircle, MapPin, Globe, Server } from 'lucide-react';

const RegionDetail = () => {
  const { id: code } = useParams();
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
  }, [code]);

  const fetchRegionDetail = async () => {
    try {
      setLoading(true);
      const response = await adminRegionApi.fetchRegionByCode(code);
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
      await adminRegionApi.verifyCredentials(code, credentials);
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
      <>
        <AdminHeadbar toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <AdminSidebar isMobileMenuOpen={isMobileMenuOpen} closeMobileMenu={() => setIsMobileMenuOpen(false)} />
        <div 
          className="min-h-screen pt-[126px] px-4 md:px-6 lg:px-8 md:ml-20 lg:ml-[20%]"
          style={{ backgroundColor: designTokens.colors.neutral[50] }}
        >
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: designTokens.colors.primary[600] }}></div>
          </div>
        </div>
      </>
    );
  }

  if (!region) {
    return (
      <>
        <AdminHeadbar toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <AdminSidebar isMobileMenuOpen={isMobileMenuOpen} closeMobileMenu={() => setIsMobileMenuOpen(false)} />
        <div 
          className="min-h-screen pt-[126px] px-4 md:px-6 lg:px-8 md:ml-20 lg:ml-[20%]"
          style={{ backgroundColor: designTokens.colors.neutral[50] }}
        >
          <div className="max-w-7xl mx-auto py-8">
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center" style={{ borderColor: designTokens.colors.neutral[200], borderWidth: '1px' }}>
              <AlertCircle size={48} style={{ color: designTokens.colors.error[500], margin: '0 auto 16px' }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: designTokens.colors.neutral[900] }}>Region not found</h3>
              <Link to="/admin-dashboard/regions" style={{ color: designTokens.colors.primary[600] }} className="hover:underline font-medium">
                Back to regions
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeadbar toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      <AdminSidebar isMobileMenuOpen={isMobileMenuOpen} closeMobileMenu={() => setIsMobileMenuOpen(false)} />
      
      <main 
        className="min-h-screen pt-[126px] px-4 md:px-6 lg:px-8 pb-8 md:ml-20 lg:ml-[20%]"
        style={{ backgroundColor: designTokens.colors.neutral[50] }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <Link
              to="/admin-dashboard/regions"
              className="inline-flex font-medium items-center gap-2 mb-4 md:mb-6 transition-all hover:gap-3"
              style={{ color: designTokens.colors.primary[600] }}
            >
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Back to Regions</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2" style={{ color: designTokens.colors.neutral[900] }}>{region.name}</h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-base sm:text-lg" style={{ color: designTokens.colors.neutral[600] }}>
                  <span className="font-mono text-sm sm:text-base" style={{ color: designTokens.colors.primary[700] }}>{region.code}</span>
                  <span className="hidden sm:inline">•</span>
                  <div className="flex items-center gap-1.5">
                    <Globe size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <span>{region.country_code}</span>
                  </div>
                </div>
              </div>
              <Link
                to={`/admin-dashboard/regions/${region.code}/edit`}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-white transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 whitespace-nowrap"
                style={{ backgroundColor: designTokens.colors.primary[600] }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = designTokens.colors.primary[700]}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = designTokens.colors.primary[600]}
              >
                <Edit size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="hidden sm:inline">Edit Region</span>
                <span className="sm:hidden">Edit</span>
              </Link>
            </div>
          </div>

          {/* Main Info Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6" style={{ borderColor: designTokens.colors.neutral[200], borderWidth: '1px' }}>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6" style={{ color: designTokens.colors.neutral[900] }}>Region Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl" style={{ backgroundColor: designTokens.colors.neutral[50] }}>
                <div className="flex items-center gap-2 mb-2" style={{ color: designTokens.colors.neutral[600] }}>
                  <Server size={14} className="sm:w-4 sm:h-4" />
                  <div className="text-xs sm:text-sm font-medium">Provider</div>
                </div>
                <div className="text-lg sm:text-xl font-semibold capitalize" style={{ color: designTokens.colors.neutral[900] }}>{region.provider}</div>
              </div>
              <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl" style={{ backgroundColor: designTokens.colors.neutral[50] }}>
                <div className="text-xs sm:text-sm font-medium mb-2" style={{ color: designTokens.colors.neutral[600] }}>Region Code</div>
                <div className="text-lg sm:text-xl font-mono font-semibold break-all" style={{ color: designTokens.colors.primary[700] }}>{region.code}</div>
              </div>
              <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl" style={{ backgroundColor: designTokens.colors.neutral[50] }}>
                <div className="flex items-center gap-2 mb-2" style={{ color: designTokens.colors.neutral[600] }}>
                  <Globe size={14} className="sm:w-4 sm:h-4" />
                  <div className="text-xs sm:text-sm font-medium">Country</div>
                </div>
                <div className="text-lg sm:text-xl font-semibold" style={{ color: designTokens.colors.neutral[900] }}>{region.country_code}</div>
              </div>
              <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl" style={{ backgroundColor: designTokens.colors.neutral[50] }}>
                <div className="flex items-center gap-2 mb-2" style={{ color: designTokens.colors.neutral[600] }}>
                  <MapPin size={14} className="sm:w-4 sm:h-4" />
                  <div className="text-xs sm:text-sm font-medium">City</div>
                </div>
                <div className="text-lg sm:text-xl font-semibold" style={{ color: designTokens.colors.neutral[900] }}>{region.city || 'N/A'}</div>
              </div>
              <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl" style={{ backgroundColor: designTokens.colors.neutral[50] }}>
                <div className="text-xs sm:text-sm font-medium mb-2" style={{ color: designTokens.colors.neutral[600] }}>Status</div>
                <div className="text-lg sm:text-xl font-semibold capitalize" style={{ color: designTokens.colors.neutral[900] }}>{region.status || 'unknown'}</div>
              </div>
              <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl" style={{ backgroundColor: designTokens.colors.neutral[50] }}>
                <div className="text-xs sm:text-sm font-medium mb-2" style={{ color: designTokens.colors.neutral[600] }}>Active</div>
                <div className="flex items-center gap-2">
                  {region.is_active ? (
                    <>
                      <CheckCircle size={18} className="sm:w-5 sm:h-5" style={{ color: designTokens.colors.success[500] }} />
                      <span className="text-lg sm:text-xl font-semibold" style={{ color: designTokens.colors.success[700] }}>Yes</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={18} className="sm:w-5 sm:h-5" style={{ color: designTokens.colors.error[500] }} />
                      <span className="text-lg sm:text-xl font-semibold" style={{ color: designTokens.colors.error[700] }}>No</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* MSP Credentials Card */}
          {region.provider === 'zadara' && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8" style={{ borderColor: designTokens.colors.neutral[200], borderWidth: '1px' }}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold" style={{ color: designTokens.colors.neutral[900] }}>MSP Admin Credentials</h2>
                {region.msp_credentials_verified_at ? (
                  <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2" style={{ backgroundColor: designTokens.colors.success[100], color: designTokens.colors.success[800] }}>
                    <CheckCircle size={14} className="sm:w-4 sm:h-4" />
                    Verified
                  </div>
                ) : (
                  <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2" style={{ backgroundColor: designTokens.colors.warning[100], color: designTokens.colors.warning[800] }}>
                    <AlertCircle size={14} className="sm:w-4 sm:h-4" />
                    Not Verified
                  </div>
                )}
              </div>
              
              {region.msp_credentials_verified_at ? (
                <div>
                  <p className="text-xs sm:text-sm mb-3" style={{ color: designTokens.colors.neutral[600] }}>
                    Last verified: {new Date(region.msp_credentials_verified_at).toLocaleString()}
                  </p>
                  <button
                    onClick={() => setShowCredentialModal(true)}
                    className="font-semibold text-sm transition-colors"
                    style={{ color: designTokens.colors.primary[600] }}
                    onMouseEnter={(e) => e.currentTarget.style.color = designTokens.colors.primary[700]}
                    onMouseLeave={(e) => e.currentTarget.style.color = designTokens.colors.primary[600]}
                  >
                    Update credentials →
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-xs sm:text-sm mb-4 sm:mb-5" style={{ color: designTokens.colors.neutral[600] }}>
                    MSP admin credentials are required for automated provisioning in this region.
                  </p>
                  <button
                    onClick={() => setShowCredentialModal(true)}
                    className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-white transition-all shadow-sm hover:shadow-md"
                    style={{ backgroundColor: designTokens.colors.primary[600] }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = designTokens.colors.primary[700]}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = designTokens.colors.primary[600]}
                  >
                    Verify Credentials
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

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
    </>
  );
};

export default RegionDetail;
