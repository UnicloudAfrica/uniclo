# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

---

## Edge Configuration (Admin + Tenant)

This app includes Edge configuration features for projects.

- Tenant view: shows the project's current edge configuration and warns when missing.
  - Component: `src/dashboard/components/EdgeConfigPanel.js`
  - Hook: `src/hooks/edgeHooks.js` (GET `/admin/projects/{id}/edge-config`)

- Admin view: shows the edge configuration, lists edge networks/IP pools, and assigns them.
  - Components:
    - Panel: `src/adminDashboard/components/AdminEdgeConfigPanel.js`
    - Modal: `src/adminDashboard/pages/projectComps/assignEdgeConfig.js`
  - Hooks: `src/hooks/adminHooks/edgeHooks.js`
    - GET `/business/projects/{id}/edge-config`
    - GET `/business/edge-networks?project_id={id}`
    - GET `/business/ip-pools?project_id={id}`
    - POST `/business/projects/{id}/edge-config`

### Where to find it

- Tenant Project Details: `src/dashboard/pages/projectDetails.js`
  - Displays tenant Edge panel.
  - If an admin is logged in (admin token present), also displays the admin panel and a "Configure Edge" button that jumps to Admin Project Details.

- Admin Project Details: `src/adminDashboard/pages/adminProjectDetails.js`
  - Header and Overview card have a "Configure Edge" button.
  - Shows the Admin Edge panel.
  - Supports `?openEdge=1` to auto-open the modal (used by the Projects list quick action).

- Admin Projects list: `src/adminDashboard/pages/adminProjects.js`
  - New "Edge" column with a "Configure" action; navigates with `openEdge=1`.

### Aligning API routes

If your backend routes differ, update only these files:

- Tenant: `src/hooks/edgeHooks.js`
- Admin: `src/hooks/adminHooks/edgeHooks.js`

### Dev notes

- Admin detection is based on the presence of an admin token in `useAdminAuthStore`.
- Subnet creation is disabled when edge config is missing and validates subnet CIDR against the VPC CIDR.
