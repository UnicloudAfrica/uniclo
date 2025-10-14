# UniCloud Frontend - Quick Start Guide

Welcome to the UniCloud Africa frontend project! This guide will get you up and running quickly.

---

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# Copy environment file (if it doesn't exist)
cp .env.example .env

# Edit .env and set:
# REACT_APP_API_USER_BASE_URL=http://localhost:8000
# REACT_APP_PAYSTACK_KEY=your_paystack_key_here
```

### 3. Start Backend (Required)

```bash
# In another terminal window
cd ../uca-backend
php artisan serve
```

### 4. Start Frontend

```bash
npm start
```

The app will open at `http://localhost:3000`

---

## 🔧 Development Workflow

### Testing Backend APIs

Before building any UI component, test the backend endpoint:

```bash
# Quick test all endpoints
./scripts/quick-test-api.sh

# View saved responses
cat api-responses/api_v1_product-pricing.json | jq
```

### Building a Component

**Step 1: Test Endpoint**
```bash
./scripts/quick-test-api.sh
```

**Step 2: Check Response Structure**
```bash
cat api-responses/api_v1_product-pricing.json
```

**Step 3: Create Hook**
```javascript
// src/hooks/pricingHooks.js
export const useFetchProductPricing = () => {
  return useQuery({
    queryKey: ['product-pricing'],
    queryFn: async () => {
      const response = await api.get('/product-pricing');
      return response.data; // Match backend structure
    }
  });
};
```

**Step 4: Build UI**
```javascript
// src/pages/PricingList.js
import { useFetchProductPricing } from '../hooks/pricingHooks';

const PricingList = () => {
  const { data, isLoading } = useFetchProductPricing();
  const items = data?.data || []; // Match backend response
  
  if (isLoading) return <Skeleton count={5} />;
  
  return (
    <div>
      {items.map(item => (
        <div key={item.id}>
          {/* Use exact field names from backend */}
          <h3>{item.product_name}</h3>
          <p>${item.price}</p>
        </div>
      ))}
    </div>
  );
};
```

---

## 📁 Project Structure

```
src/
├── adminDashboard/        # Admin context (/admin-dashboard/*)
│   ├── pages/            # Admin pages
│   └── components/       # Admin components
├── dashboard/            # Tenant context (/dashboard/*)
│   ├── pages/           # Tenant pages
│   └── components/      # Tenant components
├── clientDashboard/      # Client context (/client-dashboard/*)
│   ├── pages/           # Client pages
│   └── components/      # Client components
├── hooks/               # React Query hooks
│   ├── adminHooks/     # Admin-scoped hooks
│   ├── clientHooks/    # Client-scoped hooks
│   └── *.js            # Shared hooks
├── stores/              # Zustand state stores
│   ├── adminAuthStore.js
│   ├── userAuthStore.js
│   └── clientAuthStore.js
├── index/               # API clients
│   ├── admin/          # Admin API client
│   ├── client/         # Client API client
│   ├── tenant/         # Tenant API client
│   ├── api.js          # Base API client
│   └── silent.js       # Silent API (no toasts)
└── components/          # Shared components
```

---

## 🎯 Key Concepts

### 1. Multi-Context Architecture

The app has **three separate contexts** with isolated auth and routing:

- **Admin** (`/admin-dashboard/*`) - Super admin
- **Tenant** (`/dashboard/*`) - Tenant admin
- **Client** (`/client-dashboard/*`) - End user

**Important:** Each context uses its own auth store. Never mix tokens!

### 2. API Integration

```javascript
// ❌ DON'T: Hardcode URLs
fetch('http://localhost:8000/api/v1/projects')

// ✅ DO: Use config and API client
import api from '../index/api';
const response = await api.get('/business/projects');

// ❌ DON'T: Use localStorage for auth
const token = localStorage.getItem('token');

// ✅ DO: Use auth store
import useAdminAuthStore from '../stores/adminAuthStore';
const { token } = useAdminAuthStore.getState();
```

### 3. Data Fetching with TanStack Query

```javascript
import { useQuery } from '@tanstack/react-query';

export const useFetchProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/business/projects');
      return response.data;
    }
  });
};
```

### 4. ESLint Rules (Important!)

**Admin dashboard files CANNOT import:**
- `src/index/tenant/*`
- `src/stores/userAuthStore`

**Tenant/Client dashboards CANNOT import:**
- `src/index/admin/*`
- `src/stores/adminAuthStore`

This prevents cross-context token leakage!

---

## 📚 Documentation

- **WARP.md** - Complete development guide
- **docs/FRONTEND_DEVELOPMENT_GUIDE.md** - Testing backend & building UI
- **docs/INTEGRATION_RULES.md** - Backend integration rules (CRITICAL!)
- **docs/API.md** - Backend API documentation
- **docs/HOOKS_DOCUMENTATION.md** - Hook usage examples
- **scripts/README.md** - API testing scripts

---

## 🐛 Common Issues

### Backend Connection Refused

```bash
# Start the backend
cd ../uca-backend
php artisan serve
```

### Empty API Responses

```bash
# Seed the database
cd ../uca-backend
php artisan db:seed
```

### CORS Errors

Check `uca-backend/config/cors.php`:
```php
'allowed_origins' => ['http://localhost:3000'],
```

### ESLint Import Errors

Don't import admin APIs in tenant/client code (or vice versa). Check the ESLint rules section above.

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- ComponentName.test.js

# Run with coverage
npm test -- --coverage --watchAll=false
```

---

## 🎨 Styling

This project uses **TailwindCSS**:

```javascript
// Use Tailwind utility classes
<div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
  <h2 className="text-2xl font-bold text-primary-700">Title</h2>
</div>

// Custom primary color: #288DD1
// Custom font: Outfit
// Custom utility: .scrollbar-hide
```

---

## ⚡️ Pro Tips

1. **Always test endpoints before building UI**
   ```bash
   ./scripts/quick-test-api.sh
   ```

2. **Match backend field names exactly**
   ```javascript
   // ❌ Assuming
   <p>{item.title}</p>
   
   // ✅ Check response first
   <p>{item.product_name}</p>
   ```

3. **Handle all UI states**
   ```javascript
   if (isLoading) return <Skeleton />;
   if (error) return <Error />;
   if (items.length === 0) return <EmptyState />;
   return <DataDisplay />;
   ```

4. **Use toast notifications**
   ```javascript
   import { toast } from 'sonner';
   toast.success('Success!');
   toast.error('Error!');
   ```

5. **Follow the patterns**
   - Look at existing components in the same context
   - Match the code style
   - Reuse existing hooks when possible

---

## 🚦 Next Steps

1. ✅ Read `WARP.md` for architecture overview
2. ✅ Test backend APIs with `./scripts/quick-test-api.sh`
3. ✅ Review `docs/INTEGRATION_RULES.md` for API contracts
4. ✅ Build your first component following the workflow above
5. ✅ Ask for help if stuck!

---

## 🆘 Getting Help

- **Architecture questions:** Check `WARP.md`
- **API integration:** Check `docs/INTEGRATION_RULES.md`
- **Response structures:** Run `./scripts/quick-test-api.sh`
- **Hook patterns:** Check `docs/HOOKS_DOCUMENTATION.md`

---

**Happy coding! 🎉**
