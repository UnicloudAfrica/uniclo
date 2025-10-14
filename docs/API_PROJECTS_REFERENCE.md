# Projects API Reference & Response Structures

This document provides the exact API response structures for the Projects endpoints to guide UI development.

---

## Base Information

**Base URLs:**
- Admin: `/admin/v1/projects`
- Tenant: `/tenant/v1/admin/projects`
- Client: `/api/v1/business/projects`

**Authentication:** Required (Bearer token)

---

## Endpoints Overview

### 1. GET `/projects` - List Projects

**Purpose:** Retrieve paginated list of projects

**Query Parameters:**
- `page` (integer, optional) - Page number (default: 1)
- `per_page` (integer, optional) - Items per page (default: 15)
- `region` (string, optional) - Filter by region code
- `status` (string, optional) - Filter by status
- `tenant_id` (integer, optional, admin-only) - Filter by tenant

**Response Structure:**
```json
{
  "data": [
    {
      "id": 1,
      "identifier": "proj-abc123",
      "name": "Production Environment",
      "description": "Main production infrastructure",
      "region": "lagos1",
      "status": "active",
      "type": "standard",
      "tenant_id": 5,
      "tenant": {
        "id": 5,
        "name": "Acme Corporation",
        "email": "contact@acme.com"
      },
      "provider": "zadara",
      "provider_project_id": "prj-xyz789",
      "cloud_account_id": "acc-456",
      "metadata": {
        "vlan_id": "100",
        "vpc_id": "vpc-abc123",
        "edge_network_id": "edge-001",
        "default_vpc_cidr": "10.0.0.0/16"
      },
      "quotas": {
        "instances": 10,
        "cores": 40,
        "ram": 81920,
        "volumes": 20,
        "gigabytes": 1000
      },
      "resources_count": {
        "instances": 3,
        "volumes": 5,
        "vpcs": 1,
        "subnets": 2
      },
      "is_active": true,
      "provisioning_status": "completed",
      "created_at": "2025-01-15T10:30:00.000000Z",
      "updated_at": "2025-01-15T15:45:00.000000Z"
    }
  ],
  "links": {
    "first": "http://localhost:8000/admin/v1/projects?page=1",
    "last": "http://localhost:8000/admin/v1/projects?page=5",
    "prev": null,
    "next": "http://localhost:8000/admin/v1/projects?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 5,
    "links": [...],
    "path": "http://localhost:8000/admin/v1/projects",
    "per_page": 15,
    "to": 15,
    "total": 73
  }
}
```

### 2. POST `/projects` - Create Project

**Purpose:** Create a new project

**Request Body:**
```json
{
  "name": "New Project",
  "description": "Project description",
  "region": "lagos1",
  "tenant_id": 5,  // Admin-only
  "type": "standard",  // optional: standard, premium, etc.
  "quotas": {  // optional
    "instances": 10,
    "cores": 40,
    "ram": 81920
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "id": 15,
    "identifier": "proj-new123",
    "name": "New Project",
    "description": "Project description",
    "region": "lagos1",
    "status": "pending",
    "provisioning_status": "pending",
    // ... other fields as in list response
    "created_at": "2025-01-20T12:00:00.000000Z",
    "updated_at": "2025-01-20T12:00:00.000000Z"
  }
}
```

**Validation Errors (422):**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "name": [
      "The name field is required."
    ],
    "region": [
      "The selected region is invalid."
    ],
    "tenant_id": [
      "The tenant id field is required."
    ]
  }
}
```

### 3. GET `/projects/{project}` - Show Project Details

**Purpose:** Get detailed information about a specific project

**URL Parameters:**
- `{project}` - Project ID or identifier

**Response Structure:**
```json
{
  "data": {
    "id": 1,
    "identifier": "proj-abc123",
    "name": "Production Environment",
    // ... all fields from list response, plus:
    "users": [
      {
        "id": 10,
        "name": "John Doe",
        "email": "john@example.com",
        "role": "member",
        "permissions": ["view", "edit"]
      }
    ],
    "infrastructure": {
      "vpcs": 1,
      "subnets": 2,
      "instances": 3,
      "volumes": 5,
      "security_groups": 4,
      "key_pairs": 2
    },
    "edge_config": {
      "edge_network_id": "edge-001",
      "ip_pool_id": "pool-001",
      "is_configured": true
    }
  }
}
```

### 4. GET `/projects/{project}/status` - Get Project Status

**Purpose:** Get detailed provisioning status

**Response Structure:**
```json
{
  "data": {
    "project_id": 1,
    "identifier": "proj-abc123",
    "status": "active",
    "provisioning_status": "completed",
    "provider_status": "active",
    "infrastructure_ready": true,
    "checks": {
      "provider_project_exists": true,
      "vpc_created": true,
      "default_network_created": true,
      "edge_configured": true
    },
    "resources": {
      "instances": {
        "total": 3,
        "running": 2,
        "stopped": 1
      },
      "volumes": {
        "total": 5,
        "available": 5
      }
    },
    "last_checked_at": "2025-01-20T14:30:00.000000Z"
  }
}
```

### 5. PUT `/projects/{project}` - Update Project

**Purpose:** Update project information

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "type": "premium"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    // Updated project object
  }
}
```

### 6. DELETE `/projects/{project}` - Delete Project

**Purpose:** Delete a project

**Success Response (200):**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Cannot delete project with active resources"
}
```

### 7. POST `/projects/{project}/provision` - Provision Project

**Purpose:** Trigger project provisioning on cloud provider

**Response Structure:**
```json
{
  "success": true,
  "message": "Project provisioning initiated",
  "data": {
    "project_id": 1,
    "provider_project_id": "prj-xyz789",
    "status": "provisioning"
  }
}
```

### 8. POST `/projects/{project}/enable-vpc` - Enable VPC

**Purpose:** Enable VPC networking for the project

**Request Body:**
```json
{
  "vpc_cidr": "10.0.0.0/16"  // optional
}
```

**Response Structure:**
```json
{
  "success": true,
  "message": "VPC enabled successfully",
  "data": {
    "vpc_id": "vpc-abc123",
    "cidr": "10.0.0.0/16",
    "default_subnet_id": "subnet-001"
  }
}
```

---

## Field Descriptions

### Project Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique identifier (numeric) |
| `identifier` | string | Human-friendly identifier (e.g., "proj-abc123") |
| `name` | string | Project name |
| `description` | string\|null | Project description |
| `region` | string | Region code (e.g., "lagos1") |
| `status` | string | Project status: `pending`, `active`, `inactive`, `error` |
| `provisioning_status` | string | Provisioning status: `pending`, `provisioning`, `completed`, `failed` |
| `type` | string | Project type: `standard`, `premium`, etc. |
| `tenant_id` | integer | Owning tenant ID |
| `provider` | string | Cloud provider: `zadara`, `aws`, etc. |
| `provider_project_id` | string\|null | Provider's project ID |
| `cloud_account_id` | string\|null | Associated cloud account |
| `metadata` | object | Additional provider-specific data |
| `quotas` | object | Resource quotas |
| `resources_count` | object | Count of resources in project |
| `is_active` | boolean | Whether project is active |
| `created_at` | string | ISO 8601 timestamp |
| `updated_at` | string | ISO 8601 timestamp |

### Status Values

**status:**
- `pending` - Project created, not yet provisioned
- `active` - Project is active and operational
- `inactive` - Project is deactivated
- `error` - Project encountered an error

**provisioning_status:**
- `pending` - Provisioning not started
- `provisioning` - Currently provisioning
- `completed` - Provisioning completed successfully
- `failed` - Provisioning failed

---

## UI Development Guidelines

### 1. List View

```javascript
const { data, isLoading } = useFetchProjects({ page: 1, per_page: 15 });

// Access projects
const projects = data?.data || [];

// Access pagination
const pagination = data?.meta;
const totalProjects = pagination?.total || 0;
const currentPage = pagination?.current_page || 1;
```

### 2. Status Display

```javascript
const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'green';
    case 'pending': return 'yellow';
    case 'error': return 'red';
    default: return 'gray';
  }
};
```

### 3. Create Form

```javascript
const createProject = useCreateProject();

const handleSubmit = async (formData) => {
  try {
    const response = await createProject.mutateAsync({
      name: formData.name,
      description: formData.description,
      region: formData.region,
      tenant_id: formData.tenantId  // Admin only
    });
    toast.success('Project created successfully');
  } catch (error) {
    // Show validation errors
    if (error.response?.data?.errors) {
      setErrors(error.response.data.errors);
    }
  }
};
```

### 4. Empty State

```javascript
if (projects.length === 0 && !isLoading) {
  return (
    <EmptyState 
      icon={<FolderOpen />}
      title="No projects yet"
      description="Create your first project to get started"
      action={
        <Button onClick={openCreateModal}>
          Create Project
        </Button>
      }
    />
  );
}
```

---

## Common Patterns

### Filtering by Region

```javascript
const [selectedRegion, setSelectedRegion] = useState('');

const { data } = useFetchProjects({ 
  page: currentPage,
  per_page: itemsPerPage,
  region: selectedRegion || undefined
});
```

### Pagination

```javascript
const handlePageChange = (newPage) => {
  setCurrentPage(newPage);
  // Optional: Update URL
  setSearchParams({ page: newPage, per_page: itemsPerPage });
};
```

### Real-time Status Updates

```javascript
// Poll for status updates
const { data: statusData } = useQuery({
  queryKey: ['project-status', projectId],
  queryFn: () => fetchProjectStatus(projectId),
  refetchInterval: project.provisioning_status === 'provisioning' ? 5000 : false
});
```

---

## Notes

- **Always use `identifier` for navigation** (preferred over numeric `id`)
- **Handle loading states** with skeletons
- **Show validation errors** field-by-field
- **Implement optimistic updates** for better UX
- **Poll status** when `provisioning_status` is `provisioning`

---

**Last Updated:** 2025-01-20
