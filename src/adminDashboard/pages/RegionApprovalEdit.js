import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import adminRegionApi from '../../services/adminRegionApi';
import ToastUtils from '../../utils/toastUtil';
import AdminSidebar from '../components/adminSidebar';
import AdminHeadbar from '../components/adminHeadbar';

const RegionApprovalEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const action = searchParams.get('action') || 'approve';
  
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    platform_fee_percentage: '',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    fetchRegionDetail();
  }, [id]);

  const fetchRegionDetail = async () => {
    try {
      setLoading(true);
      const response = await adminRegionApi.fetchRegionApprovalById(id);
      setRegion(response.data);
      setFormData({
        platform_fee_percentage: response.data.platform_fee_percentage || 20,
        reason: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error fetching region:', error);
      ToastUtils.error('Failed to load region details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      switch (action) {
        case 'approve':
          await adminRegionApi.approveRegion(id, {
            platform_fee_percentage: parseFloat(formData.platform_fee_percentage),
            notes: formData.notes,
          });
          ToastUtils.success('Region approved successfully');
          break;
        case 'reject':
          await adminRegionApi.rejectRegion(id, formData.reason);
          ToastUtils.success('Region rejected');
          break;
        case 'suspend':
          await adminRegionApi.suspendRegion(id, formData.reason);
          ToastUtils.success('Region suspended');
          break;
        case 'reactivate':
          await adminRegionApi.reactivateRegion(id);
          ToastUtils.success('Region reactivated successfully');
          break;
        case 'update_fee':
          await adminRegionApi.updatePlatformFee(id, parseFloat(formData.platform_fee_percentage));
          ToastUtils.success('Platform fee updated');
          break;
        default:
          break;
      }
      
      navigate(`/admin-dashboard/region-approvals/${id}`);
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
    } finally {
      setSubmitting(false);
    }
  };

  const getActionTitle = () => {
    const titles = {
      approve: 'Approve Region',
      reject: 'Reject Region',
      suspend: 'Suspend Region',
      reactivate: 'Reactivate Region',
      update_fee: 'Update Platform Fee',
    };
    return titles[action] || 'Edit Region';
  };

  const getActionButtonText = () => {
    const texts = {
      approve: 'Approve',
      reject: 'Reject',
      suspend: 'Suspend',
      reactivate: 'Reactivate',
      update_fee: 'Update Fee',
    };
    return texts[action] || 'Submit';
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
            <div className="max-w-3xl mx-auto">
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

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar isMobileMenuOpen={isMobileMenuOpen} closeMobileMenu={() => setIsMobileMenuOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeadbar toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <Link
                to={`/admin-dashboard/region-approvals/${id}`}
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 mb-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Region Detail
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">{getActionTitle()}</h1>
              <p className="text-gray-600 mt-1">Region: {region.name} ({region.code})</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="space-y-6">
                {/* Platform Fee (for approve and update_fee) */}
                {(action === 'approve' || action === 'update_fee') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Platform Fee Percentage <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.platform_fee_percentage}
                        onChange={(e) => setFormData({ ...formData, platform_fee_percentage: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="20.00"
                        required
                      />
                      <span className="absolute right-4 top-2.5 text-gray-500">%</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      The percentage of revenue the platform will collect from this region
                    </p>
                  </div>
                )}

                {/* Reason (for reject and suspend) */}
                {(action === 'reject' || action === 'suspend') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="4"
                      placeholder={`Please provide a reason for ${action === 'reject' ? 'rejecting' : 'suspending'} this region...`}
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      This will be visible to the tenant owner
                    </p>
                  </div>
                )}

                {/* Notes (for approve) */}
                {action === 'approve' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Notes <span className="text-gray-500">(optional)</span>
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="4"
                      placeholder="Add any internal notes about this approval..."
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Internal notes (not visible to tenant)
                    </p>
                  </div>
                )}

                {/* Confirmation (for reactivate) */}
                {action === 'reactivate' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      Are you sure you want to reactivate this region? This will restore full access and allow new orders.
                    </p>
                  </div>
                )}

                {/* Info Box */}
                <div className={`border rounded-lg p-4 ${
                  action === 'reject' || action === 'suspend' 
                    ? 'bg-red-50 border-red-200' 
                    : action === 'reactivate'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex gap-3">
                    <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      action === 'reject' || action === 'suspend' ? 'text-red-600' : action === 'reactivate' ? 'text-green-600' : 'text-blue-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className={`text-sm ${
                      action === 'reject' || action === 'suspend' ? 'text-red-800' : action === 'reactivate' ? 'text-green-800' : 'text-blue-800'
                    }`}>
                      {action === 'approve' && (
                        <>
                          <p className="font-medium mb-1">What happens when you approve?</p>
                          <ul className="list-disc list-inside space-y-1 text-blue-700">
                            <li>Region becomes active and visible to clients</li>
                            <li>Tenant can start earning revenue from this region</li>
                            <li>Platform fee will be applied to all transactions</li>
                            {region.fulfillment_mode === 'automated' && (
                              <li>Automated provisioning will be enabled (requires MSP credentials)</li>
                            )}
                          </ul>
                        </>
                      )}
                      {action === 'reject' && (
                        <>
                          <p className="font-medium mb-1">⚠️ Warning</p>
                          <p>This will permanently reject the region request. The tenant will be notified with your reason.</p>
                        </>
                      )}
                      {action === 'suspend' && (
                        <>
                          <p className="font-medium mb-1">⚠️ Warning</p>
                          <p>This will temporarily suspend the region. Existing resources will remain but new orders will be blocked.</p>
                        </>
                      )}
                      {action === 'reactivate' && (
                        <>
                          <p className="font-medium mb-1">✓ Reactivation</p>
                          <p>This will restore the region to active status and re-enable all operations including new orders.</p>
                        </>
                      )}
                      {action === 'update_fee' && (
                        <>
                          <p className="font-medium mb-1">Platform Fee Update</p>
                          <p>Changing the platform fee will affect future transactions only. Existing orders are not affected.</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => navigate(`/admin-dashboard/region-approvals/${id}`)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 px-6 py-3 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    action === 'reject' || action === 'suspend'
                      ? 'bg-red-600 hover:bg-red-700'
                      : action === 'update_fee'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {submitting ? 'Processing...' : getActionButtonText()}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RegionApprovalEdit;
