/**
 * marketingContentHooks — context-aware CRUD hooks for the admin "Website
 * Content" CMS, one bundle per marketing content type.
 *
 * Backed by the admin `marketing/{type}` routes. In the admin context
 * `urlPrefix` is "", so these resolve to `/marketing/{type}` (the registry
 * baseURL already prepends `/admin/v1`). Default PATCH update method matches
 * the backend `PUT|PATCH /marketing/{type}/{id}` routes.
 *
 * Each type's bundle is created once and cached so the returned hook
 * references stay stable across renders.
 */
import { createResourceHooks, type ResourceHooks } from "../createResourceHooks";
import type { MarketingType } from "../../../adminDashboard/pages/websiteContent/marketingFieldConfig";

const bundleCache = new Map<MarketingType, ResourceHooks>();

export function marketingContentHooks(type: MarketingType): ResourceHooks {
  const cached = bundleCache.get(type);
  if (cached) {
    return cached;
  }
  const bundle = createResourceHooks({
    resourcePath: `marketing/${type}`,
    queryKeyBase: `marketing:${type}`,
  });
  bundleCache.set(type, bundle);
  return bundle;
}
