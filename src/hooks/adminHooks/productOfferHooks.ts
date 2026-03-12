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
// Product Offers API Functions
// ================================

const fetchAdminProductOffers = async (params: QueryParams = {}) => {
  const queryString = buildQueryString(params);
  const res = await silentAdminApi<ApiResponse>(
    "GET",
    `/product-offers${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch admin product offers");
  return res;
};

const createAdminProductOffer = async (offerData: ApiPayload) => {
  const res = await adminApi<ApiResponse>("POST", "/product-offers", offerData);
  if (!res.data) throw new Error("Failed to create admin product offer");
  return res.data;
};

const fetchAdminProductOfferById = async (id: Id) => {
  const res = await silentAdminApi<ApiResponse>("GET", `/product-offers/${id}`);
  if (!res.data) throw new Error(`Failed to fetch admin product offer with ID ${id}`);
  return res.data;
};

const updateAdminProductOffer = async ({ id, offerData }: UpdatePayload<"offerData">) => {
  const res = await adminApi<ApiResponse>("PUT", `/product-offers/${id}`, offerData);
  if (!res.data) throw new Error(`Failed to update admin product offer with ID ${id}`);
  return res.data;
};

const deleteAdminProductOffer = async (id: Id) => {
  const res = await adminApi<ApiResponse>("DELETE", `/product-offers/${id}`);
  if (!res.data) throw new Error(`Failed to delete admin product offer with ID ${id}`);
  return res.data;
};

// Export API functions for direct use
export {
  fetchAdminProductOffers,
  createAdminProductOffer,
  fetchAdminProductOfferById,
  updateAdminProductOffer,
  deleteAdminProductOffer,
};
