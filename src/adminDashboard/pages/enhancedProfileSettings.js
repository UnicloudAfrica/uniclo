import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  Bell,
  Shield,
  Globe,
  Palette,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Camera,
  Upload,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle,
  Settings,
  Key,
  Smartphone,
  Clock,
  Activity,
  CreditCard,
  FileText,
  Loader2,
  Edit2,
  X,
  Check,
  Info
} from "lucide-react";

import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import ToastUtils from "../../utils/toastUtil";

// Profile Avatar Component
const ProfileAvatar = ({ user, onAvatarChange }) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(user?.profile_picture_url || null);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      ToastUtils.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      ToastUtils.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/v1/settings/profile/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setPreviewUrl(data.data.avatar_url);
        onAvatarChange(data.data.avatar_url);
        ToastUtils.success('Profile picture updated successfully');
      } else {
        throw new Error(data.error || 'Failed to upload avatar');
      }
    } catch (err) {
      ToastUtils.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    try {
      const response = await fetch('/api/v1/settings/profile/avatar', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setPreviewUrl(null);
        onAvatarChange(null);
        ToastUtils.success('Profile picture removed');
      } else {
        throw new Error(data.error || 'Failed to remove avatar');
      }
    } catch (err) {
      ToastUtils.error(err.message);
    }
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="relative">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-gray-500">
              {getInitials(user?.name)}
            </span>
          )}
        </div>

        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}

        <label className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1.5 cursor-pointer hover:bg-blue-700 transition-colors">
          <Camera className="w-3 h-3 text-white" />
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900">{user?.name || 'Unknown User'}</h3>
        <p className="text-sm text-gray-500">{user?.email}</p>
        <div className="flex items-center space-x-2 mt-2">
          <button
            onClick={() => document.querySelector('input[type="file"]').click()}
            disabled={uploading}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            Change Photo
          </button>
          {previewUrl && (
            <>
              <span className="text-gray-300">•</span>
              <button
                onClick={removeAvatar}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Settings Section Component
const SettingsSection = ({ title, description, children, icon: Icon }) => {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-start space-x-3 mb-6">
        {Icon && (
          <div className="p-2 bg-blue-100 rounded-lg">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
};

// Form Field Component
const FormField = ({ 
  label, 
  value, 
  onChange, 
  type = 'text', 
  placeholder, 
  error, 
  required = false,
  disabled = false,
  icon: Icon,
  description
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleSave = () => {
    onChange(tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Icon className="w-4 h-4 text-gray-400" />
          </div>
        )}

        {disabled && !isEditing ? (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
            <span className={`${Icon ? 'pl-8' : ''} text-sm text-gray-900`}>
              {value || 'Not set'}
            </span>
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-800"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        ) : isEditing ? (
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <input
                type={inputType}
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                placeholder={placeholder}
                className={`
                  w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${Icon ? 'pl-10' : ''}
                  ${error ? 'border-red-300' : 'border-gray-300'}
                `}
              />
              
              {type === 'password' && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              )}
            </div>
            
            <button
              onClick={handleSave}
              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Check className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleCancel}
              className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type={inputType}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className={`
                w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${Icon ? 'pl-10' : ''}
                ${error ? 'border-red-300' : 'border-gray-300'}
                ${disabled ? 'bg-gray-50 text-gray-500' : ''}
              `}
            />
            
            {type === 'password' && !disabled && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
};

// Main Component
export default function EnhancedProfileSettings() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile Data
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    timezone: '',
    profile_picture_url: null,
  });

  // Security Data
  const [securityData, setSecurityData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
    two_factor_enabled: false,
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    sms_notifications: false,
    instance_alerts: true,
    billing_alerts: true,
    security_alerts: true,
    marketing_emails: false,
  });

  // Preferences
  const [preferences, setPreferences] = useState({
    language: 'en',
    theme: 'light',
    dashboard_layout: 'default',
    items_per_page: 25,
  });

  const [errors, setErrors] = useState({});

  // Fetch profile settings
  useEffect(() => {
    fetchProfileSettings();
  }, []);

  const fetchProfileSettings = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/v1/settings/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        const settings = data.data;
        setProfileData({
          name: settings.name || '',
          email: settings.email || '',
          phone: settings.phone || '',
          bio: settings.bio || '',
          location: settings.location || '',
          timezone: settings.timezone || '',
          profile_picture_url: settings.profile_picture_url || null,
        });

        setNotificationSettings({
          email_notifications: settings.email_notifications ?? true,
          sms_notifications: settings.sms_notifications ?? false,
          instance_alerts: settings.instance_alerts ?? true,
          billing_alerts: settings.billing_alerts ?? true,
          security_alerts: settings.security_alerts ?? true,
          marketing_emails: settings.marketing_emails ?? false,
        });

        setPreferences({
          language: settings.language || 'en',
          theme: settings.theme || 'light',
          dashboard_layout: settings.dashboard_layout || 'default',
          items_per_page: settings.items_per_page || 25,
        });

        setSecurityData({
          ...securityData,
          two_factor_enabled: settings.two_factor_enabled ?? false,
        });
      } else {
        throw new Error(data.error || 'Failed to fetch profile settings');
      }
    } catch (err) {
      ToastUtils.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Save profile settings
  const saveProfileSettings = async (sectionData, section) => {
    setSaving(true);
    setErrors({});

    try {
      const response = await fetch('/api/v1/settings/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          section,
          data: sectionData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        ToastUtils.success('Settings updated successfully');
        
        // Refresh profile data if needed
        if (section === 'profile') {
          setProfileData({ ...profileData, ...sectionData });
        }
      } else if (data.errors) {
        setErrors(data.errors);
        ToastUtils.error('Please fix the validation errors');
      } else {
        throw new Error(data.error || 'Failed to save settings');
      }
    } catch (err) {
      ToastUtils.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (securityData.new_password !== securityData.confirm_password) {
      setErrors({ confirm_password: 'Passwords do not match' });
      return;
    }

    await saveProfileSettings({
      current_password: securityData.current_password,
      new_password: securityData.new_password,
    }, 'security');

    // Clear password fields on success
    setSecurityData({
      ...securityData,
      current_password: '',
      new_password: '',
      confirm_password: '',
    });
  };

  // Export settings
  const exportSettings = async () => {
    try {
      const response = await fetch('/api/v1/settings/profile/export', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        // Create and download file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], {
          type: 'application/json'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `profile-settings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        ToastUtils.success('Settings exported successfully');
      } else {
        throw new Error(data.error || 'Failed to export settings');
      }
    } catch (err) {
      ToastUtils.error(err.message);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Settings },
  ];

  if (loading) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <AdminActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-gray-700">Loading profile settings...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />

      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 md:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage your account settings and preferences
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={exportSettings}
                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Settings
              </button>
              
              <button
                onClick={fetchProfileSettings}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-6 md:px-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 md:p-8">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Picture */}
              <SettingsSection
                title="Profile Picture"
                description="Upload and manage your profile picture"
                icon={Camera}
              >
                <ProfileAvatar
                  user={profileData}
                  onAvatarChange={(url) => setProfileData({ ...profileData, profile_picture_url: url })}
                />
              </SettingsSection>

              {/* Personal Information */}
              <SettingsSection
                title="Personal Information"
                description="Update your personal details and contact information"
                icon={User}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Full Name"
                    value={profileData.name}
                    onChange={(value) => setProfileData({ ...profileData, name: value })}
                    placeholder="Enter your full name"
                    required
                    icon={User}
                    error={errors.name}
                  />
                  
                  <FormField
                    label="Email Address"
                    value={profileData.email}
                    onChange={(value) => setProfileData({ ...profileData, email: value })}
                    type="email"
                    placeholder="Enter your email"
                    required
                    icon={Mail}
                    error={errors.email}
                    disabled
                    description="Contact support to change your email address"
                  />
                  
                  <FormField
                    label="Phone Number"
                    value={profileData.phone}
                    onChange={(value) => setProfileData({ ...profileData, phone: value })}
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    icon={Phone}
                    error={errors.phone}
                  />
                  
                  <FormField
                    label="Timezone"
                    value={profileData.timezone}
                    onChange={(value) => setProfileData({ ...profileData, timezone: value })}
                    placeholder="Select timezone"
                    icon={Globe}
                    error={errors.timezone}
                  />
                </div>

                <div className="mt-6">
                  <FormField
                    label="Location"
                    value={profileData.location}
                    onChange={(value) => setProfileData({ ...profileData, location: value })}
                    placeholder="City, State, Country"
                    icon={Globe}
                    error={errors.location}
                  />
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.bio && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.bio}
                    </p>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => saveProfileSettings(profileData, 'profile')}
                    disabled={saving}
                    className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </button>
                </div>
              </SettingsSection>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Password Change */}
              <SettingsSection
                title="Change Password"
                description="Update your account password for better security"
                icon={Lock}
              >
                <div className="space-y-6">
                  <FormField
                    label="Current Password"
                    value={securityData.current_password}
                    onChange={(value) => setSecurityData({ ...securityData, current_password: value })}
                    type="password"
                    placeholder="Enter current password"
                    required
                    icon={Lock}
                    error={errors.current_password}
                  />
                  
                  <FormField
                    label="New Password"
                    value={securityData.new_password}
                    onChange={(value) => setSecurityData({ ...securityData, new_password: value })}
                    type="password"
                    placeholder="Enter new password"
                    required
                    icon={Lock}
                    error={errors.new_password}
                  />
                  
                  <FormField
                    label="Confirm New Password"
                    value={securityData.confirm_password}
                    onChange={(value) => setSecurityData({ ...securityData, confirm_password: value })}
                    type="password"
                    placeholder="Confirm new password"
                    required
                    icon={Lock}
                    error={errors.confirm_password}
                  />
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handlePasswordChange}
                    disabled={saving}
                    className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Key className="w-4 h-4 mr-2" />
                    )}
                    Update Password
                  </button>
                </div>
              </SettingsSection>

              {/* Two-Factor Authentication */}
              <SettingsSection
                title="Two-Factor Authentication"
                description="Add an extra layer of security to your account"
                icon={Smartphone}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${securityData.two_factor_enabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Two-factor authentication is {securityData.two_factor_enabled ? 'enabled' : 'disabled'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {securityData.two_factor_enabled 
                          ? 'Your account is protected with 2FA'
                          : 'Enable 2FA for enhanced security'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      // TODO: Implement 2FA toggle
                      ToastUtils.info('Two-factor authentication setup coming soon');
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      securityData.two_factor_enabled
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {securityData.two_factor_enabled ? 'Disable' : 'Enable'} 2FA
                  </button>
                </div>
              </SettingsSection>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <SettingsSection
                title="Notification Preferences"
                description="Choose how you want to receive notifications"
                icon={Bell}
              >
                <div className="space-y-4">
                  {Object.entries(notificationSettings).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {key === 'email_notifications' && 'Receive general email notifications'}
                          {key === 'sms_notifications' && 'Receive SMS notifications on your phone'}
                          {key === 'instance_alerts' && 'Alerts about your instance status changes'}
                          {key === 'billing_alerts' && 'Notifications about billing and payments'}
                          {key === 'security_alerts' && 'Security-related notifications'}
                          {key === 'marketing_emails' && 'Product updates and promotional content'}
                        </p>
                      </div>
                      
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            [key]: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => saveProfileSettings(notificationSettings, 'notifications')}
                    disabled={saving}
                    className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Preferences
                  </button>
                </div>
              </SettingsSection>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <SettingsSection
                title="Application Preferences"
                description="Customize your application experience"
                icon={Settings}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                    <select
                      value={preferences.language}
                      onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                    <select
                      value={preferences.theme}
                      onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Items per Page</label>
                    <select
                      value={preferences.items_per_page}
                      onChange={(e) => setPreferences({ ...preferences, items_per_page: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dashboard Layout</label>
                    <select
                      value={preferences.dashboard_layout}
                      onChange={(e) => setPreferences({ ...preferences, dashboard_layout: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="default">Default</option>
                      <option value="compact">Compact</option>
                      <option value="detailed">Detailed</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => saveProfileSettings(preferences, 'preferences')}
                    disabled={saving}
                    className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Preferences
                  </button>
                </div>
              </SettingsSection>
            </div>
          )}
        </div>
      </main>
    </>
  );
}