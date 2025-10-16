import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import adminRegionApi from '../../services/adminRegionApi';
import ToastUtils from '../../utils/toastUtil';
import AdminSidebar from '../components/adminSidebar';
import AdminHeadbar from '../components/adminHeadbar';

const RegionEdit = () => {
  const { id: code } = useParams();
  const navigate = useNavigate();
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    country_code: '',
    city: '',
    base_url: '',
    status: 'healthy',
    is_active: true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchRegionDetail();
  }, [code]);

  const fetchRegionDetail = async () => {
    try {
      setLoading(true);
      const response = await adminRegionApi.fetchRegionByCode(code);
      const regionData = response.data;
      setRegion(regionData);
      setFormData({
        name: regionData.name || '',
        code: regionData.code || '',
        country_code: regionData.country_code || '',
        city: regionData.city || '',
        base_url: regionData.base_url || '',
        status: regionData.status || 'healthy',
        is_active: regionData.is_active !== undefined ? regionData.is_active : true,
      });
    } catch (error) {
      console.error('Error fetching region:', error);
      ToastUtils.error('Failed to load region details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Region name is required';
    if (!formData.code) newErrors.code = 'Region code is required';
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
      await adminRegionApi.updateRegion(code, formData);
      ToastUtils.success('Region updated successfully');
      navigate(`/admin-dashboard/regions/${region.code}`);
    } catch (error) {
      console.error('Error updating region:', error);
      ToastUtils.error('Failed to update region');
    } finally {
      setSubmitting(false);
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
            <div className="max-w-3xl mx-auto">
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
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <Link
                to={`/admin-dashboard/regions/${region.code}`}
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 mb-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Region Detail
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Edit Region</h1>
              <p className="text-gray-600 mt-1">Update region: {region.name} ({region.code})</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="space-y-6">
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

                {/* Region Code (readonly) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    readOnly
                    disabled
                  />
                  <p className="text-sm text-gray-500 mt-1">Region code cannot be changed</p>
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
                    placeholder="https://api.example.com"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.base_url ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.base_url && <p className="text-sm text-red-500 mt-1">{errors.base_url}</p>}
                </div>

                {/* Status and Active */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="healthy">Healthy</option>
                      <option value="degraded">Degraded</option>
                      <option value="down">Down</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Active Status
                    </label>
                    <label className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Region is active</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => navigate(`/admin-dashboard/regions/${region.code}`)}
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
                  {submitting ? 'Updating...' : 'Update Region'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RegionEdit;
