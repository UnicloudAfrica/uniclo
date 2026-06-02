/**
 * Subscription Plan Hooks — Context-aware CRUD hooks for billing plans.
 *
 * Backed by the admin `apiResource('subscription-plans')` routes. In the
 * admin context `urlPrefix` is "", so these resolve to `/subscription-plans`.
 * Update uses PUT to match the resource route (Route::put via apiResource).
 */
import { createResourceHooks } from "../createResourceHooks";

const subscriptionPlanHooks = createResourceHooks({
  resourcePath: "subscription-plans",
  queryKeyBase: "subscriptionPlans",
  updateMethod: "put",
});

export const {
  useFetchList: useFetchSubscriptionPlans,
  useFetchById: useFetchSubscriptionPlanById,
  useCreate: useCreateSubscriptionPlan,
  useUpdate: useUpdateSubscriptionPlan,
  useDelete: useDeleteSubscriptionPlan,
  queryKeys: subscriptionPlanKeys,
} = subscriptionPlanHooks;

export default subscriptionPlanHooks;
