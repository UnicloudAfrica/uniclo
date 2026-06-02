/**
 * Coupon Hooks — Context-aware CRUD hooks for discount coupons.
 *
 * Backed by `App\Http\Controllers\Api\V1\Business\CouponController`
 * (index / store / destroy). Coupons are tenant-scoped on the backend;
 * the resource path resolves to `${urlPrefix}/coupons` for the current
 * dashboard context.
 *
 * Note: the backend exposes no update route — a coupon is removed via
 * DELETE, so `useDeactivateCoupon` maps to the destroy endpoint.
 */
import { createResourceHooks } from "../createResourceHooks";

export type CouponType = "percentage" | "fixed";

export interface Coupon {
  id: number | string;
  code: string;
  type: CouponType | string;
  value: number | string;
  currency?: string | null;
  max_redemptions?: number | null;
  times_redeemed?: number | null;
  expires_at?: string | null;
  active?: boolean;
}

const couponHooks = createResourceHooks<Coupon>({
  resourcePath: "coupons",
  queryKeyBase: "coupons",
  deleteAcceptsPayload: false,
});

export const {
  useFetchList: useFetchCoupons,
  useFetchById: useFetchCouponById,
  useCreate: useCreateCoupon,
  useDelete: useDeactivateCoupon,
  queryKeys: couponKeys,
} = couponHooks;

export default couponHooks;
