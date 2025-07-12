// config.js
const API_BASE_URL = process.env.REACT_APP_API_USER_BASE_URL;

const config = {
  baseURL: `${API_BASE_URL}/api/v1`,
  adminURL: `${API_BASE_URL}/admin/v1`,
};

export default config;
