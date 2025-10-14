# Projects UI Revamp - Quick Start Guide

## 🚀 Testing the New Feature

### 1. Start the Frontend Development Server

```bash
cd /Users/mac_1/Documents/GitHub/unicloud/uca-frontend
npm start
```

The app should open at `http://localhost:3000`

### 2. Navigate to the New Projects Page

**Option A - Via Sidebar Menu:**
1. Login to admin dashboard at `/admin-signin`
2. Look for "Projects (Revamped)" in the sidebar menu
3. Click to navigate to `/admin-dashboard/projects-revamped`

**Option B - Direct URL:**
Navigate directly to: `http://localhost:3000/admin-dashboard/projects-revamped`

### 3. Test Backend API (Optional but Recommended)

Before testing the frontend, ensure the backend is responding correctly:

```bash
cd /Users/mac_1/Documents/GitHub/unicloud/uca-backend

# Run the API test script
chmod +x scripts/test-projects-api.sh
./scripts/test-projects-api.sh
```

This will:
- Test all project endpoints
- Create sample projects
- Save JSON responses to `./api-responses/projects/`
- Display status reports

### 4. Test Frontend Features

#### Projects List Page (`/admin-dashboard/projects-revamped`)

**✅ Test Stats Cards:**
- Verify total projects count
- Check active, provisioning, and inactive counts
- Confirm numbers match actual data

**✅ Test Search:**
- Type project name in search bar
- Type project identifier
- Type description keywords
- Verify real-time filtering

**✅ Test Filters:**
- **Status Filter:** Select "Active", "Inactive", "Provisioning", "Error"
- **Region Filter:** Select different regions (dynamic dropdown)
- **Provider Filter:** Select different providers (dynamic dropdown)
- **Clear Filters:** Click to reset all filters

**✅ Test Sorting:**
- Click "Name ↑↓" to sort alphabetically
- Click "Status ↑↓" to sort by status
- Click "Region ↑↓" to sort by region
- Click "Created ↑↓" to sort by creation date

**✅ Test Pagination:**
- Navigate between pages using "Previous" and "Next"
- Jump to specific page numbers
- Verify 10 projects per page

**✅ Test Project Cards:**
- Hover over cards (should show elevation effect)
- Check status badges with icons
- Verify resource counts display
- Check provisioning progress bars appear for provisioning projects

**✅ Test Actions:**
- Click "View Details" button → should navigate to details page
- Click "Edit" button → should show coming soon toast (not implemented yet)
- Click "Delete" button → should show coming soon toast (not implemented yet)

**✅ Test Refresh:**
- Click the refresh button at top
- Verify data reloads

#### Project Details Page (`/admin-dashboard/projects-revamped/details?identifier={id}`)

**✅ Test Project Header:**
- Verify project name, description, identifier display
- Check status badge shows correctly
- Test refresh button

**✅ Test Info Cards:**
- Region card shows correct region
- Provider card shows correct provider
- Instances count is accurate
- Volumes count is accurate

**✅ Test Auto-refresh:**
- If a project is provisioning, verify page auto-refreshes every 5 seconds
- Status should update in real-time

**✅ Test Provisioning Status Panel:**
- For provisioning projects, verify panel appears
- Check status, step, timestamps display correctly
- For completed projects, verify panel is hidden

**✅ Test Tabs:**
- **Overview Tab:**
  - Check all project information displays
  - Verify resource summary cards show counts
  - Icons should animate on hover
  
- **Instances Tab:**
  - Should show placeholder message
  - "View all instances →" link should navigate with project filter
  
- **Volumes Tab:**
  - Should show placeholder message
  
- **Networks Tab:**
  - Should show placeholder message
  
- **Security Tab:**
  - Should show placeholder message

**✅ Test Navigation:**
- Click "Back to Projects" button → should return to list page
- Test browser back button → should work correctly

**✅ Test Error States:**
- Navigate to invalid project: `/admin-dashboard/projects-revamped/details?identifier=invalid-id`
- Should show "Project not found" message with back button

### 5. Test Responsive Design

**Desktop (1920px+):**
- Sidebar should show full labels
- 4 stats cards in a row
- Cards in grid layout
- All tabs visible

**Tablet (768px - 1919px):**
- Sidebar icons may be smaller
- Stats cards may wrap to 2 per row
- Card grid adjusts

**Mobile (< 768px):**
- Hamburger menu appears
- Stats cards stack vertically
- Project cards stack
- Tabs may scroll horizontally

### 6. Test Loading States

**Initial Load:**
- Skeleton loaders should appear while fetching data
- Stats cards, filters, and project cards show skeletons

**Refresh:**
- Brief loading indicators during refresh

### 7. Test Empty States

**No Projects:**
- Clear database or filter to no results
- Should show friendly "No projects found" message
- Icon should display

**No Search Results:**
- Search for non-existent project name
- Should show "No projects match your search" message

### 8. Test Error Handling

**Network Errors:**
- Disconnect internet or stop backend
- Should show error state with retry option

**Invalid Data:**
- Backend returns malformed data
- Should gracefully handle without crashing

## 🐛 Common Issues & Solutions

### Issue: Page shows blank or loading forever
**Solution:** 
- Check backend is running on `http://127.0.0.1:8000`
- Verify API endpoint is correct in environment variables
- Check browser console for CORS errors

### Issue: Sidebar menu not showing "Projects (Revamped)"
**Solution:**
- Ensure you're logged in as admin
- Clear browser cache and refresh
- Check `adminSidebar.js` has the new menu item

### Issue: Clicking "View Details" shows 404
**Solution:**
- Verify route is added to `App.js`
- Check URL format: `?identifier={id}` not `?id={id}`
- Ensure project identifier exists in backend

### Issue: Stats cards show 0 for all counts
**Solution:**
- Run backend test script to create sample projects
- Check API response structure matches expected format
- Verify `useFetchProjects()` hook is working

### Issue: Auto-refresh not working during provisioning
**Solution:**
- Check `provisioning_progress.status === 'provisioning'` condition
- Verify `useEffect` dependencies are correct
- Open browser console to see if polling is happening

## 📝 Checklist Before Committing

- [ ] All features tested and working
- [ ] No console errors in browser
- [ ] Responsive design verified on all screen sizes
- [ ] Loading states display correctly
- [ ] Error states handle gracefully
- [ ] Navigation works both ways (list ↔ details)
- [ ] Backend API test script passes
- [ ] Documentation is up to date

## 🎯 Next Actions

After successful testing:

1. **Merge to Main Branch:**
   ```bash
   git add .
   git commit -m "feat: Add revamped Projects UI with search, filters, and real-time status"
   git push origin main
   ```

2. **Deploy to Staging:**
   Test in staging environment before production

3. **Gather Feedback:**
   Share with team for UX/UI feedback

4. **Plan Next Features:**
   - Implement Edit Project functionality
   - Add Delete confirmation modal
   - Build out Instances/Volumes/Networks tabs
   - Add bulk actions

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Review `/docs/PROJECTS_REVAMP.md` for detailed documentation
3. Run backend test script to verify API responses
4. Check that all dependencies are installed (`npm install`)

---

**Happy Testing! 🎉**
