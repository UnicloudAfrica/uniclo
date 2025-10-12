# Instance Management API Migration Guide

This document explains the changes made to instance management after the removal of `/business/instance-management` endpoints and how to use the new API services.

## Background

The `/business/instance-management` routes were removed from the backend as part of consolidating shared resources. These endpoints provided enhanced instance operations including bulk actions, console access, and advanced status management.

## What Was Removed

### Backend Routes
- `POST /business/instance-management/{id}/actions` - Instance actions (start, stop, reboot, etc.)
- `POST /business/instance-management/{id}/refresh` - Status refresh  
- `GET /business/instance-management/{id}/console` - Console access
- `GET /business/instance-management` - Enhanced instance listing with actions

### Frontend Components
- Instance management routes in `App.js`
- Navigation links in admin sidebar
- Console access functionality in `EmbeddedConsole.js`
- Bulk action operations

## Replacement Strategy

### 1. Standard CRUD Operations
Instance management now uses standard REST endpoints:
- `GET /business/instances` - List instances
- `GET /business/instances/{id}` - Get instance details
- `POST /business/instances` - Create instance
- `PUT /business/instances/{id}` - Update instance
- `DELETE /business/instances/{id}` - Delete instance

### 2. New API Service
A new `instanceApi.js` service provides:
- Standard CRUD operations
- Multi-instance creation
- Deprecated method warnings
- Consistent error handling

### 3. React Hooks
New `useInstanceApi.js` hooks provide:
- `useInstanceApi()` - Basic operations with loading states
- `useInstanceList()` - List management with filtering and selection

## Usage Examples

### Basic Instance Operations

```javascript
import instanceApiService from '../services/instanceApi';

// Fetch all instances
const instances = await instanceApiService.fetchInstances();

// Get specific instance
const instance = await instanceApiService.fetchInstanceById('instance-id');

// Create new instance
const newInstance = await instanceApiService.createInstance({
  name: 'my-instance',
  compute_instance_id: 1,
  // ... other fields
});

// Delete instance
await instanceApiService.deleteInstance('instance-id');
```

### Using React Hooks

```javascript
import { useInstanceApi, useInstanceList } from '../hooks/useInstanceApi';

function InstanceComponent() {
  const { loading, error, fetchInstances } = useInstanceApi();
  
  const handleRefresh = async () => {
    try {
      const result = await fetchInstances();
      console.log('Instances loaded:', result.data);
    } catch (err) {
      console.error('Failed to load instances:', err);
    }
  };

  // ...
}

function InstanceListComponent() {
  const {
    instances,
    filteredInstances,
    loading,
    loadInstances,
    setSearchTerm,
    selectInstance
  } = useInstanceList();

  useEffect(() => {
    loadInstances();
  }, [loadInstances]);

  // ...
}
```

## Migration Checklist

### For Components Using Old Instance Management:

1. **Update API calls**
   - Replace `fetch('/business/instance-management/...')` with `instanceApiService` methods
   - Handle deprecated method warnings appropriately

2. **Update navigation**
   - Remove links to `/admin-dashboard/instance-management`
   - Update to point to standard instance pages

3. **Replace console access**
   - Console functionality is temporarily disabled
   - Show appropriate messaging to users

4. **Handle bulk actions**
   - Bulk actions are no longer available
   - Implement individual operations or show warnings

### For New Development:

1. **Use the new services**
   ```javascript
   import instanceApiService from '../services/instanceApi';
   import { useInstanceApi } from '../hooks/useInstanceApi';
   ```

2. **Follow standard CRUD patterns**
   - Use standard HTTP methods and endpoints
   - Implement proper error handling

3. **Leverage React hooks**
   - Use provided hooks for state management
   - Handle loading and error states consistently

## Disabled Features

### Console Access
Console access has been temporarily disabled due to the removal of console endpoints. The `getConsoleUrl()` method will show a warning message.

**Future restoration**: Console access will be restored through alternative endpoints.

### Instance Actions
Bulk instance actions (start, stop, reboot, suspend, hibernate) are no longer available through dedicated action endpoints.

**Alternatives**: 
- Delete operations are supported through standard DELETE endpoint
- Other actions will need to be implemented through alternative approaches

### Bulk Operations
Bulk operations on multiple instances are no longer supported.

**Alternatives**:
- Perform operations on individual instances
- Implement client-side batching if needed

## Error Handling

The new API service provides consistent error handling:

```javascript
try {
  await instanceApiService.fetchInstances();
} catch (error) {
  // Error is automatically shown via ToastUtils
  console.error('Operation failed:', error.message);
}
```

## Testing

To test the migration:

1. Verify instance listing works with standard endpoint
2. Confirm instance details can be fetched by ID
3. Test instance creation and deletion
4. Verify deprecated methods show appropriate warnings
5. Check that navigation works correctly

## Support

For questions about this migration:
1. Check the API service documentation in `instanceApi.js`
2. Review existing hook usage in `useInstanceApi.js`
3. Consult the WARP.md rules for Laravel backend patterns