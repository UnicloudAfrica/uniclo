# Frontend ↔ Backend Integration Rules

Audience: Frontend contributors working in uca-frontend who integrate with the UniCloud backend APIs.

Purpose: Eliminate mismatches and accidental regressions when wiring frontend to backend. Treat this as a living spec/checklist before you open a PR.

---

## 0) Golden rules

- Never invent field names. Use exactly the backend contract (request/response).
- Only send optional fields when present. Do not send null/empty unless the backend requires it.
- Always include proper auth headers from the admin auth store. Do not use localStorage for tokens.
- Use config.baseURL for all admin API calls.
- Prefer stable identifiers (e.g., instance.identifier, project.identifier) over numeric IDs in navigation/links when the backend supports them.
- Reset dependent fields (and refetch) when the parent selection changes (e.g., region → project → infra).

---

## 1) Auth and base URL

- Read token via: `const { token } = useAdminAuthStore.getState()`.
- Add headers:
  - `Authorization: Bearer ${token}`
  - `Accept: application/json`
  - `Content-Type: application/json` for POST/PATCH/PUT/DELETE with JSON bodies.
- All admin requests use `config.baseURL`.

---

## 2) Identifiers vs IDs

- Projects: use `project.identifier` when referencing a project in the UI and for project_id in payloads (string identifier).
- Instances: prefer `instance.identifier` for navigation and lookups (details accept `?identifier=...`). Numeric fallback (encoded id) is allowed for legacy links.
- Products (pricing): `compute_instance_id`, `os_image_id`, and `volume_type_id` are the backend entity IDs (from product pricing), typically pulled from `product.productable_id` in `/product-pricing` responses.

---

## 3) Regions

- Fetch cloud regions from `/business/cloud-regions`.
- Regions may come as:
  - An object with `{ code, name }` or similar keys
  - A string code
- The UI must map defensively: display name + code; value should be the code.

---

## 4) Product pricing sources (region-scoped)

- Use `/product-pricing?region={code}&productable_type={type}` for:
  - `compute_instance` → supplies `product.productable_id` (compute_instance_id)
  - `os_image` → supplies `product.productable_id` (os_image_id)
  - `volume_type` → supplies `product.productable_id` (volume_type_id)
  - Other: `bandwidth`, `ip` (floating IP), `cross_connect` when needed
- Always enable these queries only when a region is selected.

---

## 5) Projects (region filtering)

- Fetch projects with `/projects` (admin). Optionally use `?region={code}` if supported.
- In the UI, filter projects by `project.region || project.region === selectedRegion`.
- Project selection is optional. If provided, infra lists must be fetched scoped to {project, region}.

---

## 6) Infra lists (require BOTH region and project)

- Security groups: `/business/security-groups?project_id={identifier}&region={code}`
- Key pairs: `/business/key-pairs?project_id={identifier}&region={code}`
- Subnets: `/business/subnets?project_id={identifier}&region={code}`
- Network interfaces (networks): `/business/network-interfaces?project_id={identifier}&region={code}`
- Disable these selects until both region and project are set. Reset infra selections if project/region changes.

---

## 7) Multi-instance creation payload (strict mapping)

Backend request (simplified):

```json path=null start=null
{
  "tenant_id": "optional integer for admin",
  "user_id": "optional integer for admin",
  "fast_track": "boolean (optional)",
  "tags": ["optional", "strings"],
  "pricing_requests": [
    {
      "region": "required without project_id (string region code)",
      "project_id": "required without region (string project identifier)",
      "compute_instance_id": "required integer",
      "os_image_id": "required integer",
      "months": "required integer >= 1",
      "number_of_instances": "required integer >= 1",
      "volume_types": [
        {
          "volume_type_id": "required integer",
          "storage_size_gb": "required integer >= 1"
        }
      ],
      "bandwidth_id": "optional integer",
      "bandwidth_count": "optional integer >= 1 (required_with bandwidth_id)",
      "floating_ip_count": "optional integer >= 0 (omit if 0)",
      "cross_connect_id": "optional integer",
      "cross_connect_count": "optional integer >= 1 (required_with cross_connect_id)",
      "network_id": "optional integer",
      "subnet_id": "optional integer",
      "security_group_ids": ["optional integers"],
      "keypair_name": "optional string (keypair name)"
    }
  ]
}
```

Frontend must:
- Send exactly the field names above.
- Omit optional fields when not set. Do not send null/empty unless required.
- Use `project_id` as the string project identifier, not numeric id.
- Use IDs from product pricing for compute/os/volume types (product.productable_id).
- Only include `bandwidth_count` when `bandwidth_id` is present.
- Only include `floating_ip_count` when > 0.
- Only include `cross_connect_count` when `cross_connect_id` is present.
- `security_group_ids` only when non-empty.
- `keypair_name` is the key pair name string from the infra list, not an id.

---

## 8) Admin-only assignment in Multi-Instance

- Top-level `tenant_id` or `user_id` (not both) may be included for admin flows.
- If a tenant is selected, `tenant_id` is set and the optional user list can be the sub-tenant clients.
- If a user (client) is selected, send `user_id`.

---

## 9) Optionality reflected in UI

- Labels must indicate optional fields: Project (Optional), Network (Optional), Subnet (Optional), Security Groups (Optional).
- Default option text for optional infra: "None (use default)".
- Keep selects disabled until prerequisites are satisfied (e.g., need project+region to list infra), but do NOT block submission when these are empty.

---

## 10) Instance Management & Details (consistency)

- Management list: `/business/instances` with admin token.
- Details page navigation: `/admin-dashboard/instance-management/details?identifier={instance.identifier}` (prefer identifier; legacy `?id=` base64 numeric is fallback only).
- Details page requests: `/business/instances?identifier={identifier}` or `/business/instances/{id}`.
- Actions: `/business/instance-management/{id}/actions` (POST) with `{ action, confirmed: true }`.
- Refresh: `/business/instance-management/{id}/refresh` (POST).

---

## 11) Error handling & validation

- If preview/create returns `errors`, surface them field-by-field. Do not swallow backend messages.
- Warn and block only on fields that are required by the backend contract (see section 7).
- Show toast notifications for success, warnings, and errors.

---

## 12) State reset rules

- When region changes:
  - Clear project_id and infra selections; refetch region-scoped products.
- When project changes:
  - Clear infra selections (network/subnet/security groups/key pair); refetch infra lists.

---

## 13) QA checklist before PR

- [ ] All requests use `config.baseURL` and admin token from store.
- [ ] No use of localStorage tokens.
- [ ] Multi-instance preview payload strictly matches section 7.
- [ ] Multi-instance create payload strictly matches section 7.
- [ ] Optional fields omitted when not set (verify in network tab).
- [ ] Project list filtered by selected region.
- [ ] Infra lists disabled until region+project; optional once enabled.
- [ ] Keypair uses `name` as `keypair_name`.
- [ ] Instance details loads by `identifier`.
- [ ] Actions POST include `{ confirmed: true }`.

---

## 14) Notes on defensive mapping

- Regions can be objects or strings → always derive a `code` for value.
- Product pricing entries vary by type → always read `product.productable_id` for the backend ID; `product.name` for UI.

---

## 15) Change log

- v1.0: Initial rules added to prevent field mismatches in instance creation and management flows.

---

## 16) Backend Endpoints Quick Reference (Frontend)

Public (/api/v1)
- Calculator and catalogs
  - GET /api/v1/calculator-options — Options for calculators (accepts region; optional tenant_id)
  - GET /api/v1/product-pricing — Product pricing catalog (region, productable_type)
  - GET /api/v1/product-bandwidth | /api/v1/product-os-image | /api/v1/product-compute-instance | /api/v1/product-volume-type | /api/v1/product-cross-connect
  - GET /api/v1/product-floating-ip (index, show)
  - POST /api/v1/calculator/pricing — Real-time pricing calculation
- Quotes
  - POST /api/v1/quote-previews — Quote preview (requires auth)
  - POST /api/v1/multi-quotes — Create quote invoices

Shared Business Infra (auth) (/api/v1/business)
- Notes
  - Requires Authorization: Bearer {token}
  - Most endpoints require region and/or project_id (string project identifier)
- Key pairs
  - /api/v1/business/key-pairs (index, store, show, update, destroy)
- Security groups & rules
  - /api/v1/business/security-groups (index, store, show, update, destroy)
  - /api/v1/business/security-group-ingress-rules (store, destroy)
  - /api/v1/business/security-group-egress-rules (store, destroy)
- VPC and networking
  - /api/v1/business/vpcs (full REST)
  - /api/v1/business/vpcs/available-cidrs
  - /api/v1/business/nat-gateways (full REST) + attach/detach
  - /api/v1/business/network-acls (full REST) + entries + associate/disassociate subnets
  - /api/v1/business/vpc-security-postures (full REST) + refresh/assess/remediate
  - /api/v1/business/vpc-policies (full REST) + attach/detach/simulate
  - /api/v1/business/vpc-compliances (full REST) + refresh/assess/remediate/generate-report
  - /api/v1/business/vpc-peering-connections (full REST) + accept/reject
  - /api/v1/business/vpc-endpoints (full REST) | /api/v1/business/vpc-flow-logs (full REST)
- Subnets
  - /api/v1/business/subnets (index, store, show, update, destroy)
- Volumes & attachments
  - /api/v1/business/volumes (index, store, show, destroy)
  - PATCH /api/v1/business/volumes/{id}/meta
  - POST /api/v1/business/volume-resizes
  - /api/v1/business/volume-attachments (index, store, destroy)
  - GET /api/v1/business/volume-types
- Elastic IPs
  - /api/v1/business/elastic-ips (index, store, update, destroy)
  - /api/v1/business/elastic-ip-associations (store, destroy)
- Internet gateways
  - /api/v1/business/internet-gateways (index, store, update, destroy)
  - /api/v1/business/internet-gateway-attachments (store, destroy)
- Routing
  - GET /api/v1/business/route-tables
  - POST /api/v1/business/route-table-associations
  - POST /api/v1/business/routes; DELETE /api/v1/business/routes; DELETE /api/v1/business/routes/{id}
- Network interfaces
  - /api/v1/business/network-interfaces (index, store, update, destroy)
  - /api/v1/business/network-interface-security-groups (store, destroy)
- Edge configuration
  - GET /api/v1/business/edge-config | edge-networks | edge-ip-pools
  - POST /api/v1/business/edge-config/assign

Admin (auth) (/admin/v1)
- Quotes & previews: POST /admin/v1/multi-initiation-previews; resource /admin/v1/multi-quote
- Other: /admin/v1/instances, /admin/v1/product-pricing, /admin/v1/products, /admin/v1/regions, /admin/v1/tax-configurations

Tenant (auth) (/tenant/v1/admin)
- Quotes & previews: POST /tenant/v1/admin/multi-initiation-previews; POST /tenant/v1/admin/multi-quotes
- Projects & instances: /tenant/v1/admin/projects; /tenant/v1/admin/instances

Parameters & prerequisites (infra)
- region: region code (required for region-scoped queries)
- project_id: string project identifier (not numeric id)
- Omit optional fields when not set (avoid null/empty keys)

---

## 8) Cloud accounts

- Admin: GET `/admin/v1/cloud-accounts?provider={key}&tenant_id={uuid?}` returns paginated cloud accounts with `cloud_account_id`, `metadata`, and `credentials_count`.
- Tenant: GET `/tenant/v1/admin/cloud-accounts?provider={key}` respects the acting tenant scope (includes descendants when `include_subtenants` is true).
- Responses include: `id`, `name`, `provider_key`, `region`, `metadata`, `cloud_account_id`, and `credentials_count`. Use `cloud_account_id` when linking dashboard views to backend resources.
- New auth flows now expose `cloud_account_id` in payloads (e.g., project auth context, instance console) so re-use that identifier instead of recomputing account info client-side.
