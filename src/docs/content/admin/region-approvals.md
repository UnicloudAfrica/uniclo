---
title: Region Approvals
subtitle: Approve or reject tenant requests to access new regions. When a tenant wants to deploy infrastructure in a new region, their request comes here for your review.
prev: { label: Wallet & Settlements, href: /admin-dashboard/docs/wallet }
next: { label: Onboarding Settings, href: /admin-dashboard/docs/onboarding-settings }
---

:::step{number=1 icon=MapPin title="View Region Requests" navigation="Sidebar > Regional > Region Approvals"}
The region approvals page shows all pending requests from tenants who want access to new regions. Each request shows the tenant name, the requested region, and when it was submitted. You can approve or reject each request from this view.
:::

:::screenshot{caption="Your Region Approvals queue"}
:::

:::step{number=2 icon=CheckCircle title="Approve a Request" navigation="Sidebar > Regional > Region Approvals > Select request"}
Click on a pending request to review it. If everything looks good, approve it and the tenant will immediately gain access to deploy resources in that region. The tenant is notified of the approval.
:::

:::step{number=3 icon=XCircle title="Reject a Request" navigation="Sidebar > Regional > Region Approvals > Select request"}
If a request does not meet your criteria, reject it with a reason. The tenant will see the rejection and your explanation, and they can resubmit with updated information if needed.
:::

:::callout{type=info}
Region access controls help you manage where tenants can deploy infrastructure. This is useful for compliance, capacity planning, and ensuring tenants only use regions that are fully set up and ready.
:::
