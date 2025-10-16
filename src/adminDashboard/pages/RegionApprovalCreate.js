import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import adminRegionApi from '../../services/adminRegionApi';
import ToastUtils from '../../utils/toastUtil';
import AdminSidebar from '../components/adminSidebar';
import AdminHeadbar from '../components/adminHeadbar';

const RegionApprovalCreate = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    provider: 'zadara',
    code: '',
    name: '',
    country_code: '',
    city: '',
    base_url: '',
    platform_fee_percentage: '20',
    fulfillment_mode: 'automated',
    is_active: true,
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.code) newErrors.code = 'Region code is required';
    if (!formData.name) newErrors.name = 'Region name is required';
    if (!formData.country_code) newErrors.country_code = 'Country code is required';
    if (!formData.base_url) newErrors.base_url = 'Base URL is required';
    else if (!/^https?:\/\/.+/.test(formData.base_url)) newErrors.base_url = 'Must be a valid URL';
    
    if (!formData.platform_fee_percentage) {
      newErrors.platform_fee_percentage = 'Platform fee is required';
    } else if (parseFloat(formData.platform_fee_percentage) < 0 || parseFloat(formData.platform_fee_percentage) > 100) {
      newErrors.platform_fee_percentage = 'Must be between 0 and 100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        ownership_type: 'platform',
        platform_fee_percentage: parseFloat(formData.platform_fee_percentage),
      };
      await adminRegionApi.createPlatformRegion(payload);
      ToastUtils.success('Platform region created successfully');
      navigate('/admin-dashboard/region-approvals');
    } catch (error) {
      console.error('Error creating region:', error);
      ToastUtils.error('Failed to create region');
    } finally {
      setSubmitting(false);
    }
  };

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
                to="/admin-dashboard/region-approvals"
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 mb-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Region Approvals
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Create Platform Region</h1>
              <p className="text-gray-600 mt-1">Add a new platform-owned region (auto-approved)</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="space-y-6">
                {/* Provider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provider <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="provider"
                    value={formData.provider}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="zadara">Zadara</option>
                    <option value="aws">AWS</option>
                    <option value="azure">Azure</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">Cloud infrastructure provider</p>
                </div>

                {/* Region Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="e.g., lagos-1"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.code ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.code && <p className="text-sm text-red-500 mt-1">{errors.code}</p>}
                  <p className="text-sm text-gray-500 mt-1">Unique identifier (lowercase, no spaces)</p>
                </div>

                {/* Region Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Lagos Region 1"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                </div>

                {/* Country and City */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="country_code"
                      value={formData.country_code}
                      onChange={handleChange}
                      placeholder="NG"
                      maxLength={2}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase ${
                        errors.country_code ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.country_code && <p className="text-sm text-red-500 mt-1">{errors.country_code}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Lagos"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Base URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    name="base_url"
                    value={formData.base_url}
                    onChange={handleChange}
                    placeholder="https://api.lagos1.example.com"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.base_url ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.base_url && <p className="text-sm text-red-500 mt-1">{errors.base_url}</p>}
                  <p className="text-sm text-gray-500 mt-1">API endpoint for this region</p>
                </div>

                {/* Platform Fee */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform Fee Percentage <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="platform_fee_percentage"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.platform_fee_percentage}
                      onChange={handleChange}
                      placeholder="20.00"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.platform_fee_percentage ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    <span className="absolute right-4 top-2.5 text-gray-500">%</span>
                  </div>
                  {errors.platform_fee_percentage && <p className="text-sm text-red-500 mt-1">{errors.platform_fee_percentage}</p>}
                  <p className="text-sm text-gray-500 mt-1">Revenue percentage for the platform</p>
                </div>

                {/* Fulfillment Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Fulfillment Mode <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="fulfillment_mode"
                        value="automated"
                        checked={formData.fulfillment_mode === 'automated'}
                        onChange={handleChange}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-900">Automated (Recommended)</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Orders are automatically provisioned using MSP admin credentials
                        </div>
                      </div>
                    </label>
                    <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="fulfillment_mode"
                        value="manual"
                        checked={formData.fulfillment_mode === 'manual'}
                        onChange={handleChange}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-900">Manual</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Admin manually processes each order
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Active Status */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Activate immediately</div>
                      <div className="text-sm text-gray-600">Region will be visible to clients upon creation</div>
                    </div>
                  </label>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Platform-Owned Region</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-700">
                        <li>Automatically approved upon creation</li>
                        <li>Full platform control and visibility</li>
                        <li>Platform receives the fee percentage from all transactions</li>
                        {formData.fulfillment_mode === 'automated' && (
                          <li>Requires MSP admin credentials for automated provisioning</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => navigate('/admin-dashboard/region-approvals')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating...' : 'Create Region'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RegionApprovalCreate;
