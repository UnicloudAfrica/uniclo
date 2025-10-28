import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import tenantRegionApi from '../../services/tenantRegionApi';
import Sidebar from '../components/clientSidebar';
import HeaderBar from '../components/clientHeadbar';
import BreadcrumbNav from '../components/clientAciveTab';

const NewRegionRequest = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    provider: 'zadara',
    code: '',
    name: '',
    country_code: '',
    city: '',
    base_url: '',
    fulfillment_mode: 'automated',
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

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    try {
      setSubmitting(true);
      await tenantRegionApi.createRegionRequest(formData);
      navigate('/tenant-dashboard/region-requests');
    } catch (error) {
      console.error('Error creating region:', error);
    } finally {
      setSubmitting(false);
    }
  };

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
        <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Request New Region</h1>
          <p className="text-gray-600 mt-1">Submit a request to host your own cloud region</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Provider */}
          <div className="mb-6">
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
            </select>
            <p className="text-sm text-gray-500 mt-1">Currently only Zadara is supported</p>
          </div>

          {/* Region Code */}
          <div className="mb-6">
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
            <p className="text-sm text-gray-500 mt-1">Unique identifier for your region (lowercase, no spaces)</p>
          </div>

          {/* Region Name */}
          <div className="mb-6">
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
          <div className="grid grid-cols-2 gap-6 mb-6">
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
          <div className="mb-6">
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

          {/* Fulfillment Mode */}
          <div className="mb-6">
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
                    Orders are automatically provisioned using your MSP admin credentials. Provides full client isolation.
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
                    You manually process each order. Payment is collected on the platform, then you fulfill the request.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">What happens next?</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Your request will be reviewed by our admin team</li>
                  <li>You'll be notified once approved or if more information is needed</li>
                  <li>After approval, you can verify your MSP credentials and start earning</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/tenant-dashboard/region-requests')}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
        </div>
      </main>
    </>
  );
};

export default NewRegionRequest;
