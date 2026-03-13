/**
 * Product and pricing types matching backend API Resources.
 *
 * Products in UniCloud use a morphable pattern: FloatingIp, Bandwidth,
 * CrossConnect, InstanceType, VolumeType, OsImage all have a morphOne
 * relationship to the Product table.
 */

export interface ProductResource {
  id: string | number;
  name: string;
  sku?: string;
  slug?: string;
  description?: string;
  productable_id?: number;
  productable_type?: string;
  price?: number | string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface RegionPricingResource {
  id: number;
  product: {
    type: string;
    id: number;
    sku: string;
    name: string;
  };
  scope?: {
    level: string;
    country_code?: string;
  };
  price: number;
  local_price?: number;
  local_currency?: string;
  updated_at?: string;
  provider?: string;
}

export interface ProductPricingEntry {
  id: string | number;
  product_id?: string | number;
  region?: string;
  provider?: string;
  price?: number | string;
  local_price?: number | string;
  currency?: string;
  country_code?: string;
  [key: string]: unknown;
}
