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
- In the UI, filter projects by `project.default_region || project.region === selectedRegion`.
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
