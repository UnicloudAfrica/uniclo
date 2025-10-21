# Projects UI Revamp - Documentation

## Overview
This document describes the newly revamped Projects management UI for the admin dashboard, built to match the exact backend API response structure.

## Components Created

### 1. AdminProjectsRevamped (`src/adminDashboard/pages/AdminProjectsRevamped.js`)
**Path**: `/admin-dashboard/projects-revamped`

**Features**:
- **Stats Cards**: Display total projects, active projects, provisioning projects, and inactive projects
- **Search**: Real-time search by project name, identifier, or description
- **Filters**:
  - Status filter (All, Active, Inactive, Provisioning, Error)
  - Region filter (dynamic, based on available projects)
  - Provider filter (dynamic, based on available projects)
- **Sorting**: Sort by name, status, region, created date
- **Pagination**: 10 projects per page with page navigation
- **Project Cards**: Modern card design showing:
  - Project name and description
  - Status badge with visual indicators
  - Region and provider info
  - Resource counts (instances, volumes, VPCs, subnets)
  - Quick actions (View Details, Edit, Delete)
  - Provisioning progress indicator when applicable
- **Loading States**: Skeleton loaders for better UX
- **Empty States**: Friendly messages when no projects match filters
- **Refresh**: Manual refresh button to reload data

**Data Fields Used** (from backend API):
```json
{
  "id": "uuid",
  "identifier": "string",
  "name": "string",
  "description": "string",
  "status": "active|inactive|pending|error",
  "type": "string",
  "provider": "string",
  "region": "string",
  "provider_resource_id": "string",
  "provisioning_progress": {
    "status": "string",
    "step": "string"
  },
  "resources_count": {
    "instances": number,
    "volumes": number,
    "vpcs": number,
    "subnets": number
  },
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### 2. AdminProjectDetailsRevamped (`src/adminDashboard/pages/AdminProjectDetailsRevamped.js`)
**Path**: `/admin-dashboard/projects-revamped/details?identifier={id}`

**Features**:
- **Project Header**: 
  - Project name, description, and identifier
  - Real-time status badge
  - Manual refresh button
  - Quick info cards (Region, Provider, Instances, Volumes)
- **Auto-refresh**: Automatically polls every 5 seconds during provisioning
- **Provisioning Status Panel**: 
  - Shows current provisioning status, step, started/completed timestamps
  - Only displayed when provisioning metadata is present
- **Tabbed Interface**:
  - **Overview Tab**: Full project information and resource summary with visual cards
  - **Instances Tab**: Placeholder with link to instances page (filtered by project)
  - **Volumes Tab**: Placeholder for future implementation
  - **Networks Tab**: Placeholder for future implementation
  - **Security Tab**: Placeholder for future implementation
- **Navigation**: Back to projects list button
- **Error Handling**: User-friendly "not found" state

**API Endpoints Used**:
- `GET /api/v1/admin/projects/{identifier}` - Project details
- `GET /api/v1/admin/projects/{identifier}/status` - Project status

## Routes Added

### App.js Routes
```javascript
// Routes added to src/App.js
<Route path="/admin-dashboard/projects-revamped" element={<AdminProjectsRevamped />} />
<Route path="/admin-dashboard/projects-revamped/details" element={<AdminProjectDetailsRevamped />} />
```

## Sidebar Menu

### Menu Item Added
- **Name**: "Projects (Revamped)"
- **Icon**: FolderOpen (Lucide React)
- **Path**: `/admin-dashboard/projects-revamped`
- **Position**: Below "Projects" in the sidebar

The menu item properly highlights when on either:
- `/admin-dashboard/projects-revamped` (list page)
- `/admin-dashboard/projects-revamped/details` (details page)

## Backend API Integration

### Hooks Used
Located in `src/hooks/adminHooks/projectHooks.js`:

1. **`useFetchProjects()`**
   - Fetches paginated list of projects
   - Endpoint: `GET /api/v1/admin/projects`
   - Returns: `{ data: { data: [...projects], meta: {...pagination} } }`

2. **`useFetchProjectById(identifier)`**
   - Fetches single project details by identifier or ID
   - Endpoint: `GET /api/v1/admin/projects/{identifier}`
   - Returns: `{ data: { data: {...project} } }`

3. **`useFetchProjectStatus(identifier)`**
   - Fetches real-time project status
   - Endpoint: `GET /api/v1/admin/projects/{identifier}/status`
   - Returns: `{ data: { data: {...status} } }`

## Testing Script

A comprehensive bash testing script is available at:
**`scripts/test-projects-api.sh`**

**Features**:
- Tests all project-related endpoints with authentication
- Saves JSON responses to `./api-responses/projects/`
- Outputs colored status reports
- Creates sample test projects

**Usage**:
```bash
cd /Users/mac_1/Documents/GitHub/unicloud/uca-backend
chmod +x scripts/test-projects-api.sh
./scripts/test-projects-api.sh
```

## Next Steps

### Planned Enhancements
1. **Instances Tab**: Embed actual instances list filtered by project
2. **Volumes Tab**: Display project volumes with management actions
3. **Networks Tab**: Show VPCs, subnets, and network topology
4. **Security Tab**: Display security groups and firewall rules
5. **Edit Project**: Add modal or dedicated page for project editing
6. **Delete Confirmation**: Add proper confirmation modal with cascade warnings
7. **Bulk Actions**: Select multiple projects for batch operations
8. **Export**: Export project data to CSV/JSON
9. **Activity Log**: Show project history and audit trail
10. **User Management**: Assign/manage users per project

### Integration Points
- Link from "View Instances" to instances page with project filter applied
- Consider making this the default Projects page once fully tested
- Add similar revamped UIs for Instances, Volumes, Networks, etc.

## Design & UX

### Color Scheme
- **Primary**: `text-primary-600`, `bg-primary-600` (blue)
- **Success/Active**: `text-green-800`, `bg-green-100`
- **Warning/Provisioning**: `text-yellow-800`, `bg-yellow-100`
- **Error**: `text-red-800`, `bg-red-100`
- **Neutral/Inactive**: `text-gray-800`, `bg-gray-100`

### Typography
- Headers: `font-bold text-2xl/3xl`
- Body: `font-medium text-sm`
- Labels: `text-gray-600`

### Icons
Using **Lucide React** for consistency:
- Server, Database, Network, Shield, FolderOpen, RefreshCw, CheckCircle2, AlertCircle, Loader2, Clock, etc.

### Responsive Design
- Mobile-first approach with Tailwind responsive classes
- Sidebar collapses on mobile with hamburger menu
- Cards stack vertically on small screens
- Filters collapse into dropdown on mobile (future enhancement)

## Files Modified/Created

### Created Files
1. `/Users/mac_1/Documents/GitHub/unicloud/uca-frontend/src/adminDashboard/pages/AdminProjectsRevamped.js`
2. `/Users/mac_1/Documents/GitHub/unicloud/uca-frontend/src/adminDashboard/pages/AdminProjectDetailsRevamped.js`
3. `/Users/mac_1/Documents/GitHub/unicloud/uca-frontend/docs/PROJECTS_REVAMP.md`

### Modified Files
1. `/Users/mac_1/Documents/GitHub/unicloud/uca-frontend/src/App.js`
   - Added routes for revamped projects pages
   - Added component imports

2. `/Users/mac_1/Documents/GitHub/unicloud/uca-frontend/src/adminDashboard/components/adminSidebar.js`
   - Added "Projects (Revamped)" menu item
   - Added path mappings for new routes

## Backend Requirements

### Expected API Response Format
The components are built to match these exact response structures from the backend:

**Projects List** (`GET /api/v1/admin/projects`):
```json
{
  "success": true,
  "message": "Projects retrieved successfully",
  "data": {
    "data": [
      {
        "id": "uuid",
        "identifier": "string",
        "name": "string",
        "description": "string",
        "status": "active|inactive|pending|error",
        "type": "string",
        "provider": "zadara",
        "region": "lagos-1",
        "provider_resource_id": "string",
        "provisioning_progress": {
          "status": "completed|provisioning|pending|failed",
          "step": "string"
        },
        "provisioning_started_at": "timestamp",
        "provisioning_completed_at": "timestamp",
        "resources_count": {
          "instances": 0,
          "volumes": 0,
          "vpcs": 0,
          "subnets": 0
        },
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ],
    "meta": {
      "current_page": 1,
      "per_page": 10,
      "total": 100
    }
  }
}
```

**Project Details** (`GET /api/v1/admin/projects/{identifier}`):
Same structure as individual project object above.

**Project Status** (`GET /api/v1/admin/projects/{identifier}/status`):
```json
{
  "success": true,
  "data": {
    "status": "active|inactive|pending|error",
    "provisioning_progress": {
      "status": "completed|provisioning|pending|failed",
      "step": "string"
    }
  }
}
```

## Environment & Dependencies

### Required Packages
- `react`: ^18.x
- `react-router-dom`: ^6.x
- `@tanstack/react-query`: For data fetching
- `lucide-react`: For icons
- `react-loading-skeleton`: For loading states
- `sonner`: For toast notifications
- `tailwindcss`: For styling

### Environment Variables
The API base URL should be configured in your environment:
```
REACT_APP_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

---

**Last Updated**: January 2025
**Author**: AI Assistant (via Warp Terminal Agent Mode)
**Status**: ✅ Complete - Ready for Testing
