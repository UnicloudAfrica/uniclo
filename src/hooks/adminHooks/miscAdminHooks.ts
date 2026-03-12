/**
 * Miscellaneous admin API functions from the original adminHooks.ts god file.
 * Covers: Tax Configurations (legacy), Colocation Settings, Products,
 * Product Compute Instances, Multi Initiation Previews
 */
import adminApi from "../../index/admin/api";
import silentAdminApi from "../../index/admin/silent";

type Id = string | number;
type ApiPayload = Record<string, unknown> | FormData | null | undefined;
type ApiResponse<T = unknown> = { data?: T } & Record<string, unknown>;
type QueryParams = Record<string, string | number | boolean | null | undefined>;
type UpdatePayload<K extends string, T extends ApiPayload = ApiPayload> = { id: Id } & Record<K, T>;

const buildQueryString = (params: QueryParams): string => {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null
  );
  if (entries.length === 0) {
    return "";
  }
  const stringParams = entries.reduce<Record<string, string>>((acc, [key, value]) => {
    acc[key] = String(value);
    return acc;
  }, {});
  return new URLSearchParams(stringParams).toString();
};

// ================================
// Tax Configurations API Functions (legacy)
// ================================

const fetchAdminTaxConfigurations = async (params: QueryParams = {}) => {
  const queryString = buildQueryString(params);
  const res = await silentAdminApi<ApiResponse>(
    "GET",
    `/tax-configurations${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch admin tax configurations");
  return res;
};

const createAdminTaxConfiguration = async (taxConfigData: ApiPayload) => {
  const res = await adminApi<ApiResponse>("POST", "/tax-configurations", taxConfigData);
  if (!res.data) throw new Error("Failed to create admin tax configuration");
  return res.data;
};

const fetchAdminTaxConfigurationById = async (id: Id) => {
  const res = await silentAdminApi<ApiResponse>("GET", `/tax-configurations/${id}`);
  if (!res.data) throw new Error(`Failed to fetch admin tax configuration with ID ${id}`);
  return res.data;
};

const updateAdminTaxConfiguration = async ({
  id,
  taxConfigData,
}: UpdatePayload<"taxConfigData">) => {
  const res = await adminApi<ApiResponse>("PUT", `/tax-configurations/${id}`, taxConfigData);
  if (!res.data) throw new Error(`Failed to update admin tax configuration with ID ${id}`);
  return res.data;
};

const deleteAdminTaxConfiguration = async (id: Id) => {
  const res = await adminApi<ApiResponse>("DELETE", `/tax-configurations/${id}`);
  if (!res.data) throw new Error(`Failed to delete admin tax configuration with ID ${id}`);
  return res.data;
};

// ================================
// Colocation Settings API Functions (legacy)
// ================================

const fetchColocationSettings = async () => {
  const res = await silentAdminApi<ApiResponse>("GET", "/colocation-settings");
  if (!res.data) throw new Error("Failed to fetch colocation settings");
  return res;
};

const createColocationSetting = async (colocationData: ApiPayload) => {
  const res = await adminApi<ApiResponse>("POST", "/colocation-settings", colocationData);
  if (!res.data) throw new Error("Failed to create colocation setting");
  return res.data;
};

// ================================
// Products API Functions (legacy)
// ================================

const fetchAdminProducts = async (params: QueryParams = {}) => {
  const queryString = buildQueryString(params);
  const res = await silentAdminApi<ApiResponse>(
    "GET",
    `/products${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch admin products");
  return res;
};

const createAdminProduct = async (productData: ApiPayload) => {
  const res = await adminApi<ApiResponse>("POST", "/products", productData);
  if (!res.data) throw new Error("Failed to create admin product");
  return res.data;
};

const fetchAdminProductById = async (id: Id) => {
  const res = await silentAdminApi<ApiResponse>("GET", `/products/${id}`);
  if (!res.data) throw new Error(`Failed to fetch admin product with ID ${id}`);
  return res.data;
};

const updateAdminProduct = async ({ id, productData }: UpdatePayload<"productData">) => {
  const res = await adminApi<ApiResponse>("PUT", `/products/${id}`, productData);
  if (!res.data) throw new Error(`Failed to update admin product with ID ${id}`);
  return res.data;
};

const deleteAdminProduct = async (id: Id) => {
  const res = await adminApi<ApiResponse>("DELETE", `/products/${id}`);
  if (!res.data) throw new Error(`Failed to delete admin product with ID ${id}`);
  return res.data;
};

// ================================
// Product Compute Instance API Functions
// ================================

const fetchAdminProductComputeInstances = async (params: QueryParams = {}) => {
  const queryString = buildQueryString(params);
  const res = await silentAdminApi<ApiResponse>(
    "GET",
    `/product-compute-instance${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch admin product compute instances");
  return res;
};

const createAdminProductComputeInstance = async (instanceData: ApiPayload) => {
  const res = await adminApi<ApiResponse>("POST", "/product-compute-instance", instanceData);
  if (!res.data) throw new Error("Failed to create admin product compute instance");
  return res.data;
};

// ================================
// Multi Initiation Previews API Functions
// ================================

const createAdminMultiInitiationPreview = async (previewData: ApiPayload) => {
  const res = await adminApi<ApiResponse>("POST", "/multi-initiation-previews", previewData);
  if (!res.data) throw new Error("Failed to create admin multi initiation preview");
  return res.data;
};

// Export all API functions
export {
  fetchAdminTaxConfigurations,
  createAdminTaxConfiguration,
  fetchAdminTaxConfigurationById,
  updateAdminTaxConfiguration,
  deleteAdminTaxConfiguration,
  fetchColocationSettings,
  createColocationSetting,
  fetchAdminProducts,
  createAdminProduct,
  fetchAdminProductById,
  updateAdminProduct,
  deleteAdminProduct,
  fetchAdminProductComputeInstances,
  createAdminProductComputeInstance,
  createAdminMultiInitiationPreview,
};
