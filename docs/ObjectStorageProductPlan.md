# Object Storage Product SKU – Frontend Plan

With the backend seeder in place, the admin UI needs light wiring so the new SKU can be managed alongside existing services. Proposed steps:

1. **Admin Pricing Table**
   - Extend the product/pricing grids under `adminDashboard/pages/adminProducts.js` to include a row when `product_name === 'Object Storage (GB-month)'` and allow editing of the seeded `ProductPricing`.

2. **Tenant Pricing Overrides**
   - On tenant pricing screens (using `tenant_product_pricings`), add toggle/edit controls so ops can enable the SKU per tenant and override the default price-per-GB.

3. **Region Management**
   - When displaying a region, indicate whether object storage inventory exists (look for a `Product` with `productable_type = object_storage_configuration`) and show the default price if available.

4. **Ordering / Calculator**
   - Fetch object storage pricing alongside compute/volume SKUs so calculators and quotes can include it once the tenant has the SKU enabled.

These UI adjustments can happen incrementally; backend already exposes the SKU via the shared pricing endpoints, so the front end only needs to display and edit the seeded records.
