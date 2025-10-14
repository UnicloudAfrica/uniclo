# API Testing Scripts

This directory contains scripts for testing the backend API and capturing real response structures to inform frontend development.

---

## Scripts

### 1. `quick-test-api.sh` ⚡️

**Fast bash script using curl to test APIs**

```bash
# Basic usage
./scripts/quick-test-api.sh

# With admin credentials
ADMIN_EMAIL=admin@test.com ADMIN_PASSWORD=password ./scripts/quick-test-api.sh
```

**What it does:**
- ✅ Tests if backend is running
- ✅ Tests all public endpoints
- ✅ Attempts admin login
- ✅ Tests authenticated endpoints
- ✅ Saves all responses to `api-responses/` directory
- ✅ Generates INDEX.md with list of all responses
- ✅ Shows colored output for easy reading

**Requirements:**
- `curl` (pre-installed on macOS)
- `jq` (optional, for pretty JSON output)
- Backend running at `http://localhost:8000`

---

### 2. `test-api-responses.js` 🔍

**Detailed Node.js script for comprehensive API testing**

```bash
# Test all endpoints and save responses
node scripts/test-api-responses.js --save-responses

# Test specific endpoint
node scripts/test-api-responses.js --endpoint=/api/v1/product-pricing

# Basic test (console output only)
node scripts/test-api-responses.js
```

**What it does:**
- ✅ Tests public, admin, and business endpoints
- ✅ Analyzes response structure
- ✅ Generates markdown report
- ✅ Saves detailed JSON responses
- ✅ Shows data summaries
- ✅ Identifies pagination patterns

**Requirements:**
- Node.js (for fetch API)
- Backend running
- Test credentials in script

---

## Quick Start Guide

### Step 1: Start the Backend

```bash
cd ../uca-backend
php artisan serve
```

### Step 2: Seed Database (First Time Only)

```bash
cd ../uca-backend
php artisan migrate:fresh --seed

# Or specific seeders
php artisan db:seed --class=RegionsFromConfigSeeder
php artisan db:seed --class=InstanceTypesTableSeeder
php artisan db:seed --class=OsImageSeeder
```

### Step 3: Run Test Script

```bash
cd ../uca-frontend

# Quick test
./scripts/quick-test-api.sh

# Or detailed test
node scripts/test-api-responses.js --save-responses
```

### Step 4: Review Responses

```bash
# View saved responses
ls api-responses/

# Pretty print a response
cat api-responses/api_v1_product-pricing.json | jq

# View the index
cat api-responses/INDEX.md
```

---

## Understanding the Output

### Response Files

All responses are saved to `api-responses/` directory:

```
api-responses/
├── INDEX.md                           # List of all saved responses
├── api_v1_calculator-options.json    # Public endpoints
├── api_v1_product-pricing.json
├── admin_v1_projects.json            # Admin endpoints  
├── admin_v1_instances.json
└── ...
```

### Response Structure

Most responses follow Laravel's pagination format:

```json
{
  "data": [
    {
      "id": 1,
      "name": "Resource Name",
      "...": "other fields"
    }
  ],
  "links": {
    "first": "...",
    "last": "...",
    "prev": null,
    "next": "..."
  },
  "meta": {
    "current_page": 1,
    "total": 100,
    "per_page": 15
  }
}
```

---

## Common Issues

### Backend Not Running

```bash
# Error: Connection refused
cd ../uca-backend
php artisan serve
```

### No Data in Responses

```bash
# Empty arrays in responses
cd ../uca-backend
php artisan db:seed
```

### Authentication Failed

```bash
# Update credentials in script
export ADMIN_EMAIL=your@email.com
export ADMIN_PASSWORD=yourpassword

# Or create test user
cd ../uca-backend
php artisan tinker
\App\Models\Admin::create([
    'name' => 'Test Admin',
    'email' => 'admin@test.com', 
    'password' => bcrypt('password')
]);
```

### Permission Denied

```bash
# Make script executable
chmod +x scripts/quick-test-api.sh
```

---

## Using Responses for Frontend Development

### 1. Test Endpoint

```bash
./scripts/quick-test-api.sh
```

### 2. Review Response Structure

```bash
cat api-responses/api_v1_product-pricing.json | jq
```

Example output:
```json
{
  "data": [
    {
      "id": 1,
      "product_name": "Standard Instance",
      "price": "50.00",
      "region": {
        "code": "us-east-1",
        "name": "US East"
      }
    }
  ]
}
```

### 3. Create Hook Matching Response

```javascript
// src/hooks/pricingHooks.js
import { useQuery } from '@tanstack/react-query';
import api from '../index/api';

export const useFetchProductPricing = () => {
  return useQuery({
    queryKey: ['product-pricing'],
    queryFn: async () => {
      const response = await api.get('/product-pricing');
      // Response structure: { data: [...] }
      return response.data;
    }
  });
};
```

### 4. Build UI Component

```javascript
// src/pages/PricingList.js
import { useFetchProductPricing } from '../hooks/pricingHooks';

const PricingList = () => {
  const { data, isLoading } = useFetchProductPricing();
  
  // Match backend field names exactly!
  const items = data?.data || [];
  
  return (
    <div>
      {items.map(item => (
        <div key={item.id}>
          <h3>{item.product_name}</h3>
          <p>${item.price}</p>
          <p>{item.region.name}</p>
        </div>
      ))}
    </div>
  );
};
```

---

## Tips

✅ **Always test endpoints before building UI**
- Ensures you match exact field names
- Reveals pagination structure
- Shows nested relationships

✅ **Save responses for reference**
- Use `--save-responses` flag
- Keep responses in git (in docs or examples)
- Reference when building components

✅ **Check response structure carefully**
- Is it an array or object?
- Is data nested under `data` key?
- Are there pagination `meta` and `links`?
- What are the exact field names?

✅ **Handle all states in UI**
- Loading state
- Error state
- Empty state
- Success with data

✅ **Never assume field names**
- ❌ `item.title` (assuming)
- ✅ Check response first, then use `item.product_name`

---

## Additional Resources

- **Full Guide:** `docs/FRONTEND_DEVELOPMENT_GUIDE.md`
- **Integration Rules:** `docs/INTEGRATION_RULES.md`
- **API Documentation:** `docs/API.md`
- **WARP Guide:** `WARP.md`

---

**Happy Testing! 🚀**
