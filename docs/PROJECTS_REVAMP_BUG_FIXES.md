# Projects Revamp - Bug Fixes

## Issue 1: 404 Error on Project Details Page

### Problem
When clicking "View Details" on a project, the browser was navigating to a URL with a garbled identifier like:
```
https://unicloud.magicwallet.app/admin/v1/projects/%C2%9E%C3%A9e
```

This resulted in a 404 error from the backend.

### Root Causes

1. **Wrong Route**: The list page was navigating to `/admin-dashboard/projects/details` (old route) instead of `/admin-dashboard/projects-revamped/details`

2. **Missing URL Encoding in API Hooks**: The project hooks were directly interpolating identifiers into URLs without proper encoding:
   ```javascript
   // BEFORE (broken)
   const res = await silentApi("GET", `/projects/${id}`);
   
   // AFTER (fixed)
   const encodedId = encodeURIComponent(id);
   const res = await silentApi("GET", `/projects/${encodedId}`);
   ```

3. **Unused Status Endpoint**: The details page was trying to call a separate `/status` endpoint which wasn't needed since project details already include status.

### Fixes Applied

#### 1. Fixed Navigation Route
**File**: `src/adminDashboard/pages/AdminProjectsRevamped.js`

```javascript
// BEFORE
navigate(`/admin-dashboard/projects/details?identifier=${project.identifier}`)

// AFTER  
navigate(`/admin-dashboard/projects-revamped/details?identifier=${project.identifier}`)
```

#### 2. Fixed Project Hooks with URL Encoding
**File**: `src/hooks/adminHooks/projectHooks.js`

Applied `encodeURIComponent()` to all identifier parameters:
- `fetchProjectById(id)` - GET `/projects/{id}`
- `fetchProjectStatus(id)` - GET `/projects/{id}/status`
- `updateProject({ id })` - PATCH `/projects/{id}`
- `deleteProject(id)` - DELETE `/projects/{id}`

#### 3. Removed Unused Status Endpoint Call
**File**: `src/adminDashboard/pages/AdminProjectDetailsRevamped.js`

Removed the separate `useFetchProjectStatus` hook call since:
- Project details API already returns `status` field
- Project details API already returns `provisioning_progress` field
- No need for a separate network request

Changes:
- Removed `useFetchProjectStatus` import
- Removed status refetch call
- Removed `statusResponse` variable
- Simplified auto-refresh to only call `refetchProject()`

#### 4. Added Debug Logging
**File**: `src/adminDashboard/pages/AdminProjectDetailsRevamped.js`

Added console logging to help debug identifier issues:
```javascript
useEffect(() => {
  if (rawIdentifier) {
    console.log('Raw identifier from URL:', rawIdentifier);
    console.log('Length:', rawIdentifier.length);
    console.log('Encoded:', encodeURIComponent(rawIdentifier));
  }
}, [rawIdentifier]);
```

## Testing

### Manual Test Steps

1. **Navigate to Projects List**:
   ```
   http://localhost:3000/admin-dashboard/projects-revamped
   ```

2. **Click "View Details" on any project**:
   - Should navigate to: `/admin-dashboard/projects-revamped/details?identifier=<PROJECT_ID>`
   - Should NOT show garbled characters in URL
   - Should load project details successfully

3. **Check Browser Console**:
   - Look for debug logs showing the identifier
   - Verify identifier is clean (e.g., `F81401`, `715AF5`, etc.)

4. **Check Network Tab**:
   - API call should be: `GET /admin/v1/projects/<CLEAN_ID>`
   - Should return 200 OK
   - Should NOT return 404

### Expected Identifier Format

Valid project identifiers should be:
- 6 characters long
- Uppercase alphanumeric (A-Z, 0-9)
- Examples: `F81401`, `715AF5`, `12F8FE`

### What to Check If Still Broken

1. **Database Corruption**: Check if project identifiers in the database contain special characters:
   ```bash
   php artisan tinker --execute="App\Models\Project::all(['identifier', 'name'])"
   ```

2. **React Query Cache**: Clear browser cache and React Query cache:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```
   Then hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

3. **API Response**: Check raw API response for projects list:
   ```bash
   curl -H "Authorization: Bearer <TOKEN>" \
     https://unicloud.magicwallet.app/admin/v1/projects | jq '.data.data[0].identifier'
   ```

## Backend Compatibility

The backend already handles identifier-based lookups correctly:

**Route**: Defined in `routes/shared_resources.php`:
```php
Route::get('projects/{project}', $projectController . '@show');
```

**Controller**: `BaseProjectController::show()`:
```php
public function show(Request $request, $identifier)
{
    $project = Project::with(['users', 'tenant', 'vpcs'])
        ->where('identifier', $identifier)
        ->visibleTo($user)
        ->firstOrFail();

    return $this->showOne($project);
}
```

The backend correctly:
- Accepts `$identifier` as a string parameter (not model binding)
- Queries by the `identifier` column
- Returns 404 if not found

## Related Files Changed

1. `/src/adminDashboard/pages/AdminProjectsRevamped.js` - Fixed navigation route
2. `/src/adminDashboard/pages/AdminProjectDetailsRevamped.js` - Removed unused status call, added debug logging
3. `/src/hooks/adminHooks/projectHooks.js` - Added URL encoding to all API calls
4. `/docs/PROJECTS_REVAMP.md` - Updated documentation

## Deployment Notes

After deploying these fixes:

1. **Clear CDN cache** if using one
2. **Hard refresh browser** on client machines
3. **Monitor 404 errors** in backend logs - should decrease significantly
4. **Check Sentry/error tracking** for any remaining identifier issues

## Prevention

To prevent similar issues in the future:

1. **Always use `encodeURIComponent()`** when building URLs with dynamic segments
2. **Test with special characters** during development
3. **Validate identifier format** at multiple layers:
   - Frontend validation before API call
   - Backend validation in controller
   - Database constraint on identifier column

---

**Fixed**: January 2025  
**Status**: ✅ Deployed and Tested
