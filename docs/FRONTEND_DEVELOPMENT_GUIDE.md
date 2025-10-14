# Frontend Development Guide

## Testing Backend & Building UI from Real Responses

This guide explains how to test the backend API, capture real response structures, and use them to build the frontend UI.

---

## Table of Contents

1. [Setup](#setup)
2. [Testing the Backend](#testing-the-backend)
3. [Understanding API Responses](#understanding-api-responses)
4. [Building UI Components](#building-ui-components)
5. [Best Practices](#best-practices)

---

## Setup

### 1. Ensure Backend is Running

```bash
# Navigate to backend directory
cd ../uca-backend

# Start the Laravel development server
php artisan serve
```

The backend should be running at `http://localhost:8000`

### 2. Seed the Database (if needed)

```bash
# In the uca-backend directory
cd ../uca-backend

# Run migrations
php artisan migrate

# Seed the database with test data
php artisan db:seed

# Or run specific seeders
php artisan db:seed --class=RegionsFromConfigSeeder
php artisan db:seed --class=InstanceTypesTableSeeder
php artisan db:seed --class=OsImageSeeder
php artisan db:seed --class=UserTableSeeder
```

---

## Testing the Backend

### Quick Method: Using the Bash Script

```bash
# Make sure you're in the frontend directory
cd /Users/mac_1/Documents/GitHub/unicloud/uca-frontend

# Run the quick test script
./scripts/quick-test-api.sh

# With admin credentials
ADMIN_EMAIL=admin@unicloudafrica.com ADMIN_PASSWORD=your_password ./scripts/quick-test-api.sh
```

This will:
- Test all public endpoints
- Attempt admin login
- Test authenticated endpoints  
- Save all responses to `./api-responses/` directory
- Generate an INDEX.md file with all responses

### Detailed Method: Using the Node.js Script

```bash
# Make sure you're in the frontend directory
cd /Users/mac_1/Documents/GitHub/unicloud/uca-frontend

# Test all endpoints and save responses
node scripts/test-api-responses.js --save-responses

# Test a specific endpoint
node scripts/test-api-responses.js --endpoint=/api/v1/product-pricing
```

### Manual Testing with curl

```bash
# Test a public endpoint
curl -s http://localhost:8000/api/v1/product-pricing \
  -H "Accept: application/json" | jq

# Test with authentication
TOKEN="your_admin_token_here"
curl -s http://localhost:8000/admin/v1/projects \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## Understanding API Responses

### Common Response Patterns

#### 1. **List Response (Laravel Pagination)**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Resource Name",
      "created_at": "2025-01-01T00:00:00.000000Z"
    }
  ],
  "links": {
    "first": "http://localhost:8000/api/v1/resource?page=1",
    "last": "http://localhost:8000/api/v1/resource?page=5",
    "prev": null,
    "next": "http://localhost:8000/api/v1/resource?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 5,
    "per_page": 15,
    "to": 15,
    "total": 75
  }
}
```

**Usage in React:**
```javascript
const { data, isLoading } = useFetchResources();

// Access the actual items
const items = data?.data || [];

// Access pagination
const pagination = data?.meta;
```

#### 2. **Single Resource Response**
```json
{
  "data": {
    "id": 1,
    "name": "Resource Name",
    "attributes": {},
    "created_at": "2025-01-01T00:00:00.000000Z"
  }
}
```

#### 3. **Success Response**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Resource data
  }
}
```

#### 4. **Error Response**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": [
      "The email field is required."
    ],
    "password": [
      "The password must be at least 8 characters."
    ]
  }
}
```

---

## Building UI Components

### Step 1: Capture Real Response

```bash
# Test the endpoint
./scripts/quick-test-api.sh

# Check the response
cat api-responses/api_v1_product-pricing.json | jq
```

### Step 2: Create Hook Based on Response

Let's say the response looks like this:
```json
{
  "data": [
    {
      "id": 1,
      "product_name": "Standard Instance",
      "productable_type": "compute_instance",
      "productable_id": 10,
      "price": "50.00",
      "region": {
        "code": "us-east-1",
        "name": "US East"
      }
    }
  ],
  "meta": {
    "current_page": 1,
    "total": 25
  }
}
```

**Create the hook:**
```javascript
// src/hooks/pricingHooks.js
import { useQuery } from '@tanstack/react-query';
import api from '../index/api';

export const useFetchProductPricing = (params = {}) => {
  return useQuery({
    queryKey: ['product-pricing', params],
    queryFn: async () => {
      const queryString = new URLSearchParams(params).toString();
      const url = `/product-pricing${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return response.data;
    }
  });
};
```

### Step 3: Create UI Component

```javascript
// src/pages/ProductPricingList.js
import React from 'react';
import { useFetchProductPricing } from '../hooks/pricingHooks';
import Skeleton from 'react-loading-skeleton';

const ProductPricingList = () => {
  const { data, isLoading, error } = useFetchProductPricing({
    region: 'us-east-1',
    productable_type: 'compute_instance'
  });

  if (isLoading) {
    return (
      <div>
        <Skeleton count={5} height={60} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error loading pricing: {error.message}
      </div>
    );
  }

  const items = data?.data || [];
  const pagination = data?.meta;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Product Pricing</h1>
      
      {items.length === 0 ? (
        <p>No pricing data available</p>
      ) : (
        <>
          <div className="grid gap-4">
            {items.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <h3 className="font-semibold">{item.product_name}</h3>
                <p className="text-gray-600">
                  Region: {item.region.name} ({item.region.code})
                </p>
                <p className="text-primary-600 font-bold">
                  ${item.price}/month
                </p>
              </div>
            ))}
          </div>
          
          {pagination && (
            <div className="flex justify-between items-center mt-4">
              <span>
                Showing {pagination.from} to {pagination.to} of {pagination.total}
              </span>
              <div className="space-x-2">
                {/* Add pagination buttons */}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductPricingList;
```

### Step 4: Handle Forms Based on Validation Errors

```javascript
// src/pages/CreateProjectForm.js
import React, { useState } from 'react';
import { useCreateProject } from '../hooks/projectHooks';
import { toast } from 'sonner';

const CreateProjectForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    region: ''
  });
  const [errors, setErrors] = useState({});

  const createProject = useCreateProject();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    try {
      await createProject.mutateAsync(formData);
      toast.success('Project created successfully');
      // Reset form or redirect
    } catch (error) {
      // Backend validation errors
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        toast.error(error.response?.data?.message || 'Failed to create project');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Project Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`w-full border rounded px-3 py-2 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name[0]}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className={`w-full border rounded px-3 py-2 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          rows={4}
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={createProject.isPending}
        className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 disabled:opacity-50"
      >
        {createProject.isPending ? 'Creating...' : 'Create Project'}
      </button>
    </form>
  );
};

export default CreateProjectForm;
```

---

## Best Practices

### 1. **Always Test Endpoints First**

Before building any UI component:
1. Run the test script to capture the actual response
2. Examine the response structure
3. Note any pagination, filtering, or sorting parameters
4. Check for nested relationships

### 2. **Handle Loading States**

```javascript
if (isLoading) return <Skeleton count={5} />;
if (error) return <ErrorDisplay error={error} />;
if (!data) return <EmptyState />;
```

### 3. **Handle Empty States**

```javascript
const items = data?.data || [];

if (items.length === 0) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">No items found</p>
      <button className="mt-4">Create New Item</button>
    </div>
  );
}
```

### 4. **Validate Against Backend Responses**

```javascript
// Don't assume field names
// ❌ Bad
const name = item.title;

// ✅ Good - check response first
const name = item.name || item.title || 'Unnamed';
```

### 5. **Use TypeScript Interfaces (Optional but Recommended)**

```typescript
// Based on actual API response
interface ProductPricing {
  id: number;
  product_name: string;
  productable_type: string;
  productable_id: number;
  price: string;
  region: {
    code: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    from: number;
    to: number;
    total: number;
    per_page: number;
    last_page: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}
```

### 6. **Document Response Structures**

Create a `RESPONSE_STRUCTURES.md` file:

```markdown
## Product Pricing Response

**Endpoint:** `GET /api/v1/product-pricing`

**Response:**
\`\`\`json
{
  "data": [...],
  "meta": {...}
}
\`\`\`

**Fields:**
- `id`: number - Unique identifier
- `product_name`: string - Display name
- `price`: string - Price in USD (always as string)
- `region`: object - Region details
  - `code`: string - Region code (e.g., "us-east-1")
  - `name`: string - Human-readable name
```

---

## Workflow Summary

1. **Start Backend**
   ```bash
   cd ../uca-backend && php artisan serve
   ```

2. **Seed Data (if needed)**
   ```bash
   php artisan db:seed
   ```

3. **Test Endpoints**
   ```bash
   cd ../uca-frontend
   ./scripts/quick-test-api.sh
   ```

4. **Review Responses**
   ```bash
   cat api-responses/api_v1_product-pricing.json | jq
   ```

5. **Create Hook**
   - Based on actual response structure
   - Handle pagination/errors

6. **Build UI Component**
   - Use the hook
   - Handle loading/error/empty states
   - Match backend field names exactly

7. **Test UI**
   ```bash
   npm start
   ```

8. **Document**
   - Add notes about response structure
   - Document any quirks or special cases

---

## Troubleshooting

### Backend Not Responding

```bash
# Check if backend is running
curl http://localhost:8000

# Restart backend
cd ../uca-backend
php artisan serve
```

### No Data in Responses

```bash
# Seed the database
cd ../uca-backend
php artisan db:seed
```

### Authentication Errors

```bash
# Create a test user
cd ../uca-backend
php artisan tinker

# In tinker:
\App\Models\Admin::create([
    'name' => 'Test Admin',
    'email' => 'admin@test.com',
    'password' => bcrypt('password')
]);
```

### CORS Errors

Check `uca-backend/config/cors.php` and ensure:
```php
'paths' => ['api/*', 'admin/*', 'tenant/*'],
'allowed_origins' => ['http://localhost:3000'],
```

---

## Next Steps

1. ✅ Test all endpoints
2. ✅ Document response structures
3. ✅ Create hooks for each resource
4. ✅ Build UI components
5. ✅ Add proper error handling
6. ✅ Implement loading states
7. ✅ Add empty states
8. ✅ Test with real data

---

**Happy coding! 🚀**
