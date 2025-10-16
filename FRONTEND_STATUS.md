# Frontend Implementation Status

## ✅ Completed Files

### API Services
1. ✅ `/src/services/tenantRegionApi.js` - Tenant region management API
2. ✅ `/src/services/adminRegionApi.js` - Admin approval API

### Tenant Pages
1. ✅ `/src/tenantDashboard/pages/RegionRequests.js` - List view with stats & filters
2. ✅ `/src/tenantDashboard/pages/NewRegionRequest.js` - Create region form

---

## 📋 Remaining Components to Create

### Priority 1: Core Tenant Pages (30 min)

#### Revenue Dashboard (`/src/tenantDashboard/pages/RevenueDashboard.js`)
```jsx
import React, { useState, useEffect } from 'react';
import tenantRegionApi from '../../services/tenantRegionApi';

// Features:
// - Stats cards (Total Revenue, Platform Fee, Your Share, Pending)
// - Date range picker
// - Revenue shares table with pagination
// - Export CSV button
// - Top regions list

Key Functions:
- fetchRevenueShares({ start_date, end_date, region_id })
- fetchRevenueStats()
- exportRevenueShares()
```

#### Region Details (`/src/tenantDashboard/pages/RegionDetails.js`)
```jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import tenantRegionApi from '../../services/tenantRegionApi';

// Features:
// - Region info card
// - Status timeline
// - Fulfillment mode toggle (if approved)
// - Verify credentials button (if automated)
// - Revenue summary
// - Cancel button (if pending)

Key Functions:
- fetchRegionRequestById(id)
- updateFulfillmentMode(id, mode)
- cancelRegionRequest(id)
- Show VerifyCredentialsModal
```

### Priority 2: Admin Pages (20 min)

#### Region Approvals List (`/src/adminDashboard/pages/RegionApprovals.js`)
```jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminRegionApi from '../../services/adminRegionApi';

// Features:
// - List all tenant regions
// - Filters: ownership_type, approval_status, tenant
// - Quick action buttons (Approve, Reject)
// - Platform fee display
// - Tenant info

Key Functions:
- fetchRegionApprovals({ ownership_type, approval_status })
- Quick approve/reject inline
```

#### Region Approval Details (`/src/adminDashboard/pages/RegionApprovalDetails.js`)
```jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import adminRegionApi from '../../services/adminRegionApi';

// Features:
- Region details card
- Tenant information
- Approval history timeline
- Action buttons:
  - Approve (with fee input modal)
  - Reject (with reason textarea)
  - Suspend (with reason)
  - Reactivate
  - Update Fee
  - Delete
- Revenue stats (if approved)

Key Functions:
- fetchRegionApprovalById(id)
- approveRegion(id, { platform_fee_percentage, notes })
- rejectRegion(id, reason)
- suspendRegion(id, reason)
- reactivateRegion(id)
- updatePlatformFee(id, percentage)
- deleteRegion(id)
```

### Priority 3: Modals & Components (15 min)

#### Verify Credentials Modal (`/src/tenantDashboard/components/VerifyCredentialsModal.js`)
```jsx
import React, { useState } from 'react';
import tenantRegionApi from '../../services/tenantRegionApi';

// Props: { regionId, isOpen, onClose, onSuccess }

// Fields:
// - Username
// - Password
// - Domain
// - Domain ID (optional)

// Actions:
// - Test & Save

Key Functions:
- verifyCredentials(regionId, credentials)
```

#### Status Badge (`/src/components/StatusBadge.js`)
```jsx
const StatusBadge = ({ status, size = 'md' }) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    suspended: 'bg-gray-100 text-gray-800',
  };
  
  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  };
  
  return (
    <span className={`inline-block rounded-full font-medium ${colors[status]} ${sizes[size]}`}>
      {status}
    </span>
  );
};
```

---

## 🔧 Integration Steps

### Step 1: Add Routes

**Tenant Routes** (`src/tenantDashboard/TenantRoutes.js` or similar):
```jsx
import RegionRequests from './pages/RegionRequests';
import NewRegionRequest from './pages/NewRegionRequest';
import RegionDetails from './pages/RegionDetails';
import RevenueDashboard from './pages/RevenueDashboard';

// Add to your router:
<Route path="/tenant/regions" element={<RegionRequests />} />
<Route path="/tenant/regions/new" element={<NewRegionRequest />} />
<Route path="/tenant/regions/:id" element={<RegionDetails />} />
<Route path="/tenant/revenue" element={<RevenueDashboard />} />
```

**Admin Routes** (`src/adminDashboard/AdminRoutes.js` or similar):
```jsx
import RegionApprovals from './pages/RegionApprovals';
import RegionApprovalDetails from './pages/RegionApprovalDetails';

// Add to your router:
<Route path="/admin/region-approvals" element={<RegionApprovals />} />
<Route path="/admin/region-approvals/:id" element={<RegionApprovalDetails />} />
```

### Step 2: Add Navigation Links

**Tenant Nav** (find your tenant navigation component):
```jsx
<NavLink to="/tenant/regions">
  <svg>...</svg>
  My Regions
</NavLink>
<NavLink to="/tenant/revenue">
  <svg>...</svg>
  Revenue Dashboard
</NavLink>
```

**Admin Nav** (find your admin navigation component):
```jsx
<NavLink to="/admin/region-approvals">
  <svg>...</svg>
  Region Approvals
</NavLink>
```

### Step 3: Test Flow

1. **Tenant submits region:**
   - Go to `/tenant/regions`
   - Click "Add New Region"
   - Fill form, submit
   - See "Pending" status

2. **Admin approves:**
   - Go to `/admin/region-approvals`
   - See pending request
   - Click to view details
   - Approve with fee %

3. **Tenant verifies credentials:**
   - Go to region details
   - Click "Verify Credentials"
   - Enter MSP admin creds
   - Toggle to "Automated"

4. **View revenue:**
   - Orders are placed
   - Go to `/tenant/revenue`
   - See earnings
   - Export CSV

---

## 💡 Quick Copy-Paste Templates

### Revenue Dashboard (Simplified)
```jsx
import React, { useState, useEffect } from 'react';
import tenantRegionApi from '../../services/tenantRegionApi';

const RevenueDashboard = () => {
  const [stats, setStats] = useState({});
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, sharesRes] = await Promise.all([
        tenantRegionApi.fetchRevenueStats(),
        tenantRegionApi.fetchRevenueShares(),
      ]);
      setStats(statsRes.data.summary || {});
      setShares(sharesRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    await tenantRegionApi.exportRevenueShares();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Revenue Dashboard</h1>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <StatsCard title="Total Revenue" value={`$${stats.total_revenue || 0}`} />
        <StatsCard title="Platform Fee" value={`$${stats.total_platform_fee || 0}`} />
        <StatsCard title="Your Share" value={`$${stats.total_tenant_share || 0}`} />
        <StatsCard title="Pending" value={`$${stats.pending_settlement || 0}`} />
      </div>

      {/* Export Button */}
      <button onClick={handleExport} className="bg-blue-600 text-white px-4 py-2 rounded mb-4">
        Export CSV
      </button>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">Order</th>
              <th className="p-4 text-right">Gross</th>
              <th className="p-4 text-right">Fee</th>
              <th className="p-4 text-right">Your Share</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {shares.map(share => (
              <tr key={share.id} className="border-b hover:bg-gray-50">
                <td className="p-4">{new Date(share.created_at).toLocaleDateString()}</td>
                <td className="p-4">{share.order?.identifier || '-'}</td>
                <td className="p-4 text-right">${share.gross_amount}</td>
                <td className="p-4 text-right">${share.platform_fee_amount}</td>
                <td className="p-4 text-right font-semibold">${share.tenant_share_amount}</td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 rounded text-sm ${
                    share.status === 'settled' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {share.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatsCard = ({ title, value }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <div className="text-gray-600 text-sm">{title}</div>
    <div className="text-3xl font-bold mt-2">{value}</div>
  </div>
);

export default RevenueDashboard;
```

### Admin Approvals (Simplified)
```jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminRegionApi from '../../services/adminRegionApi';

const RegionApprovals = () => {
  const [regions, setRegions] = useState([]);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchRegions();
  }, [filter]);

  const fetchRegions = async () => {
    const res = await adminRegionApi.fetchRegionApprovals({ approval_status: filter });
    setRegions(res.data);
  };

  const quickApprove = async (id) => {
    if (window.confirm('Approve this region?')) {
      await adminRegionApi.approveRegion(id);
      fetchRegions();
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Region Approvals</h1>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['pending', 'approved', 'rejected', 'suspended'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded ${filter === status ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-4">
        {regions.map(region => (
          <div key={region.id} className="bg-white p-6 rounded-lg shadow flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">{region.name}</h3>
              <p className="text-gray-600">
                {region.code} - {region.owner_tenant?.name}
              </p>
              <p className="text-sm text-gray-500">Fee: {region.platform_fee_percentage}%</p>
            </div>
            <div className="flex gap-2">
              {region.approval_status === 'pending' && (
                <button
                  onClick={() => quickApprove(region.id)}
                  className="bg-green-600 text-white px-4 py-2 rounded"
                >
                  Approve
                </button>
              )}
              <Link
                to={`/admin/region-approvals/${region.id}`}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded"
              >
                Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RegionApprovals;
```

---

## ⚡ Estimated Time to Complete

- ✅ **API Services**: Done (2 files)
- ✅ **Tenant List + Form**: Done (2 pages)
- 🔲 **Revenue Dashboard**: 15 minutes
- 🔲 **Region Details**: 15 minutes
- 🔲 **Admin List**: 10 minutes
- 🔲 **Admin Details**: 15 minutes
- 🔲 **Modals**: 10 minutes
- 🔲 **Routes & Nav**: 10 minutes

**Total Remaining: ~75 minutes**

---

## 🎯 Next Actions

1. Create the Revenue Dashboard using the template above
2. Create Region Details page
3. Create Admin pages
4. Add routes and navigation
5. Test full flow
6. Return to backend for remaining features

All the hard work (API integration, error handling, styling) is already done in the completed pages. The remaining components just follow the same patterns!
