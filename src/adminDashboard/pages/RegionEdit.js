import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import adminRegionApi from '../../services/adminRegionApi';
import ToastUtils from '../../utils/toastUtil';
import AdminSidebar from '../components/adminSidebar';
import AdminHeadbar from '../components/adminHeadbar';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { designTokens } from '../../styles/designTokens';

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
      <>
        <AdminHeadbar toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <AdminSidebar isMobileMenuOpen={isMobileMenuOpen} closeMobileMenu={() => setIsMobileMenuOpen(false)} />
        <div 
          className="min-h-screen pt-[126px] px-4 md:px-6 lg:px-8 md:ml-20 lg:ml-[20%]"
          style={{ backgroundColor: designTokens.colors.neutral[50] }}
        >
          <div className="flex items-center justify-center py-20">
            <Loader2 size={48} className="animate-spin" style={{ color: designTokens.colors.primary[600] }} />
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
          <div className="max-w-4xl mx-auto py-8">
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center" style={{ borderColor: designTokens.colors.neutral[200], borderWidth: '1px' }}>
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <Link
              to={`/admin-dashboard/regions/${region.code}`}
              className="inline-flex font-medium items-center gap-2 mb-4 md:mb-6 transition-all hover:gap-3"
              style={{ color: designTokens.colors.primary[600] }}
            >
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Back to Region Detail</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2" style={{ color: designTokens.colors.neutral[900] }}>Edit Region</h1>
            <p className="text-sm sm:text-base" style={{ color: designTokens.colors.neutral[600] }}>
              Update region: <span className="font-semibold">{region.name}</span> <span className="font-mono">({region.code})</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8" style={{ borderColor: designTokens.colors.neutral[200], borderWidth: '1px' }}>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8">
                <button
                  type="button"
                  onClick={() => navigate(`/admin-dashboard/regions/${region.code}`)}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border rounded-lg font-medium transition-colors"
                  style={{ borderColor: designTokens.colors.neutral[300], color: designTokens.colors.neutral[700] }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = designTokens.colors.neutral[50]}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: designTokens.colors.primary[600] }}
                  onMouseEnter={(e) => !submitting && (e.currentTarget.style.backgroundColor = designTokens.colors.primary[700])}
                  onMouseLeave={(e) => !submitting && (e.currentTarget.style.backgroundColor = designTokens.colors.primary[600])}
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {submitting ? 'Updating...' : 'Update Region'}
                </button>
              </div>
            </form>
        </div>
      </main>
    </>
  );
};

export default RegionEdit;
