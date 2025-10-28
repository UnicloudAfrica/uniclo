import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Eye, Edit, Plus, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import adminRegionApi from '../../services/adminRegionApi';
import ToastUtils from '../../utils/toastUtil';
import AdminSidebar from '../components/adminSidebar';
import AdminHeadbar from '../components/adminHeadbar';
import ModernCard from '../components/ModernCard';
import ModernTable from '../components/ModernTable';
import ModernStatsCard from '../components/ModernStatsCard';
import ModernButton from '../components/ModernButton';
import { designTokens } from '../../styles/designTokens';
import AdminPageShell from "../components/AdminPageShell";

const RegionApprovals = () => {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    ownership_type: '',
    approval_status: '',
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRegions();
  }, [filters]);

  const fetchRegions = async () => {
    try {
      setLoading(true);
      const response = await adminRegionApi.fetchRegionApprovals(filters);
      setRegions(response.data || []);
    } catch (error) {
      console.error('Error fetching regions:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };


  const stats = {
    total: regions.length,
    pending: regions.filter(r => r.approval_status === 'pending').length,
    approved: regions.filter(r => r.approval_status === 'approved').length,
    rejected: regions.filter(r => r.approval_status === 'rejected').length,
  };

  // Filter regions based on search and filters
  const filteredRegions = regions.filter(region => {
    const matchesSearch = !searchTerm || 
      region.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      region.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      region.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesOwnership = !filters.ownership_type || region.ownership_type === filters.ownership_type;
    const matchesStatus = !filters.approval_status || region.approval_status === filters.approval_status;
    
    return matchesSearch && matchesOwnership && matchesStatus;
  });

  // Define columns for ModernTable
  const columns = [
    {
      key: 'serialNumber',
      header: 'S/N',
      render: (value, row, index) => index + 1
    },
    {
      key: 'name',
      header: 'Region',
      render: (value, row) => (
        <div>
          <div className="font-medium" style={{ color: designTokens.colors.neutral[900] }}>{value}</div>
          <div className="text-sm" style={{ color: designTokens.colors.neutral[500] }}>{row.code}</div>
        </div>
      )
    },
    {
      key: 'owner_tenant',
      header: 'Owner Tenant',
      render: (value) => (
        <span style={{ color: designTokens.colors.neutral[700] }}>{value?.name || '-'}</span>
      )
    },
    {
      key: 'city',
      header: 'Location',
      render: (value, row) => (
        <span style={{ color: designTokens.colors.neutral[700] }}>{value}, {row.country_code}</span>
      )
    },
    {
      key: 'fulfillment_mode',
      header: 'Fulfillment',
      render: (value) => (
        <span className="capitalize" style={{ color: designTokens.colors.neutral[700] }}>{value}</span>
      )
    },
    {
      key: 'msp_credentials_verified_at',
      header: 'MSP Credentials',
      render: (value, row) => {
        if (row.fulfillment_mode !== 'automated') {
          return <span className="text-xs" style={{ color: designTokens.colors.neutral[400] }}>N/A</span>;
        }
        return value ? (
          <span 
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: designTokens.colors.success[50],
              color: designTokens.colors.success[700]
            }}
          >
            <CheckCircle size={12} />
            Verified
          </span>
        ) : (
          <span 
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: designTokens.colors.warning[50],
              color: designTokens.colors.warning[700]
            }}
          >
            <Clock size={12} />
            Pending
          </span>
        );
      }
    },
    {
      key: 'approval_status',
      header: 'Status',
      render: (value) => {
        const statusConfig = {
          pending: { bg: designTokens.colors.warning[50], color: designTokens.colors.warning[700], icon: <Clock size={12} /> },
          approved: { bg: designTokens.colors.success[50], color: designTokens.colors.success[700], icon: <CheckCircle size={12} /> },
          rejected: { bg: designTokens.colors.error[50], color: designTokens.colors.error[700], icon: <XCircle size={12} /> },
          suspended: { bg: designTokens.colors.neutral[100], color: designTokens.colors.neutral[700], icon: <AlertCircle size={12} /> },
        };
        const config = statusConfig[value] || statusConfig.pending;
        return (
          <span 
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize"
            style={{ backgroundColor: config.bg, color: config.color }}
          >
            {config.icon}
            {value}
          </span>
        );
      }
    },
    {
      key: 'platform_fee_percentage',
      header: 'Fee %',
      render: (value) => (
        <span style={{ color: designTokens.colors.neutral[700] }}>{value}%</span>
      )
    },
  ];

  // Define actions for ModernTable
  const actions = [
    {
      icon: <Eye size={16} />,
      label: '',
      onClick: (item) => window.location.href = `/admin-dashboard/region-approvals/${item.id}`
    },
    {
      icon: <Edit size={16} />,
      label: '',
      onClick: (item) => {
        if (item.approval_status === 'pending') {
          window.location.href = `/admin-dashboard/region-approvals/${item.id}/edit?action=approve`;
        } else {
          window.location.href = `/admin-dashboard/region-approvals/${item.id}/edit?action=update_fee`;
        }
      }
    },
  ];

  if (loading) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <AdminPageShell
          contentClassName="p-6 md:p-8 flex items-center justify-center"
        >
          <Loader2
            className="w-12 animate-spin"
            style={{ color: designTokens.colors.primary[500] }}
          />
        </AdminPageShell>
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
      <AdminPageShell
        title="Region Approvals"
        description="Review and manage region requests"
        actions={
          <Link to="/admin-dashboard/region-approvals/create">
            <ModernButton className="flex items-center gap-2">
              <Plus size={18} />
              Create Platform Region
            </ModernButton>
          </Link>
        }
        contentClassName="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ModernStatsCard
            title="Total Requests"
            value={stats.total}
            icon={<Clock size={24} />}
            color="primary"
            description="All region requests"
          />
          <ModernStatsCard
            title="Pending"
            value={stats.pending}
            icon={<Clock size={24} />}
            color="warning"
            description="Awaiting approval"
          />
          <ModernStatsCard
            title="Approved"
            value={stats.approved}
            icon={<CheckCircle size={24} />}
            color="success"
            description="Active regions"
          />
          <ModernStatsCard
            title="Rejected"
            value={stats.rejected}
            icon={<XCircle size={24} />}
            color="error"
            description="Declined requests"
          />
        </div>

        <ModernCard>
          <ModernTable
            title="Region Approval Requests"
            data={filteredRegions}
            columns={columns}
            actions={actions}
            searchable
            filterable
            exportable
            sortable
            loading={loading}
            onRowClick={(region) =>
              (window.location.href = `/admin-dashboard/region-approvals/${region.id}`)
            }
            emptyMessage="No region requests found"
          />
        </ModernCard>
      </AdminPageShell>
    </>
  );
};

export default RegionApprovals;
