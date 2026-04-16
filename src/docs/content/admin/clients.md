---
title: Clients
subtitle: Learn how to view and manage the end-users (clients) across every tenant on the platform.
prev: { label: Tenants & Partners, href: /admin-dashboard/docs/tenants }
next: { label: Regions, href: /admin-dashboard/docs/regions }
---

:::callout{type=info title="What are clients?"}
If tenants are franchise owners, then **clients are the customers who walk into the shop**. Each client belongs to a specific tenant and uses the cloud services that tenant provides. As a platform admin, you can see every client across every tenant -- like having a bird's-eye view of all the shops at once.
:::

:::step{number=1 icon=Users title="View all clients" navigation="Sidebar > Customer Management > Clients"}
The clients page gives you a complete list of every end-user on the platform, regardless of which tenant they belong to.

1. Click **Customer Management** in the sidebar.
2. Select **Clients**.
3. Use the search bar or filters to narrow down the list by tenant, status, or name.

:::callout{type=tip}
You can filter by tenant to see only the clients that belong to a specific organisation. This is handy when troubleshooting an issue for a particular tenant.
:::

:::screenshot{caption="The clients list showing all end-users across tenants."}
:::
:::

:::step{number=2 icon=PlusCircle title="Create a client" navigation="Sidebar > Customer Management > Clients > Create"}
You can create a client directly from the admin dashboard. This is useful when you need to set up an account for someone manually.

1. On the clients page, click **Create**.
2. Choose which tenant this client will belong to.
3. Enter the client's name, email, and any other required information.
4. Click **Submit** to create the account.

:::callout{type=warning}
Make sure you select the correct tenant. A client can only belong to one tenant, and moving them later requires extra steps.
:::

:::screenshot{caption="The create client form with tenant selection and user details."}
:::
:::

:::step{number=3 icon=Eye title="View client details" navigation="Sidebar > Customer Management > Clients > Click a client"}
Click on any client row to see their full profile. This includes their contact information, the tenant they belong to, their resource usage, and billing history.

- **Profile** -- Name, email, status, and creation date.
- **Resources** -- What instances, storage, and networks they are using.
- **Billing** -- Payment history and current balance.

:::screenshot{caption="Client detail page with profile, resources, and billing tabs."}
:::
:::

:::step{number=4 icon=Link2 title="Understanding the client-tenant relationship"}
Every client is linked to exactly one tenant. The tenant manages the client day-to-day, but as a platform admin you can step in at any time. Here is how the hierarchy works:

:::mermaid{caption="Platform hierarchy: Admin > Tenants > Clients"}
graph TD
A[Platform Admin -- You] --> B[Tenant A]
A --> C[Tenant B]
B --> D[Client 1]
B --> E[Client 2]
C --> F[Client 3]
C --> G[Client 4]
C --> H[Client 5]
:::

:::callout{type=info}
You have visibility over all levels of this hierarchy. Tenants can only see their own clients, and clients can only see their own resources.
:::
:::
