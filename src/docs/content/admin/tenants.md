---
title: Tenants & Partners
subtitle: Learn how to create, review, and manage the organisations (tenants) that use your platform to offer cloud services.
prev: { label: Getting Started, href: /admin-dashboard/docs/getting-started }
next: { label: Clients, href: /admin-dashboard/docs/clients }
---

:::callout{type=info title="What are tenants?"}
Think of tenants as **franchise owners**. You own the big brand (the platform), and each tenant runs their own branch of it. They sign up, get approved, and then start selling cloud services to their own clients using your infrastructure. You can see all of them, control who gets in, and help them when they need it.
:::

:::step{number=1 icon=Building2 title="View the partners list" navigation="Sidebar > Customer Management > Partners"}
The partners list shows every organisation that has signed up (or been created by you) on the platform. You will see their name, status, and when they joined.

- Click **Customer Management** in the sidebar.
- Select **Partners**.
- Browse the table or use the search bar to find a specific tenant.

:::screenshot{caption="The partners list table with name, status, and date columns."}
:::
:::

:::step{number=2 icon=PlusCircle title="Create a new tenant" navigation="Sidebar > Customer Management > Partners > Create"}
Sometimes you need to create a tenant on their behalf -- for example, during a sales demo or when onboarding a large enterprise manually.

1. On the partners list page, click the **Create** button.
2. Fill in the organisation name, contact email, and any other required fields.
3. Choose the initial plan or leave it as default.
4. Click **Submit**.

:::callout{type=tip}
The new tenant will receive a welcome email with instructions on how to set up their own dashboard. You can always edit their details later.
:::

:::screenshot{caption="The create tenant form with organisation details."}
:::
:::

:::step{number=3 icon=Eye title="Review tenant details" navigation="Sidebar > Customer Management > Partners > Click a tenant"}
Click on any tenant row to open their detail page. Here you can see everything about them -- their profile, subscription, clients, usage stats, and more.

- **Overview tab** -- Basic info, status, and contact details.
- **Clients tab** -- All the end-users under this tenant.
- **Billing tab** -- Payment history and wallet balance.
- **Settings tab** -- Tenant-specific configuration.

:::screenshot{caption="Tenant detail page showing the overview tab."}
:::
:::

:::step{number=4 icon=ClipboardCheck title="Onboarding review process" navigation="Sidebar > Customer Management > Onboarding"}
When a new tenant signs up on their own, they go through an onboarding process. As an admin, you review their application before they can start using the platform. Think of it like reviewing a job application.

1. Go to **Customer Management > Onboarding**.
2. You will see a queue of pending applications.
3. Click on an application to review the details.

:::screenshot{caption="The onboarding review queue with pending applications."}
:::
:::

:::step{number=5 icon=CheckCircle2 title="Approve or reject a tenant"}
After reviewing a tenant application, you can approve or reject it.

- **Approve** -- The tenant gets access to the platform and can start setting up their services.
- **Reject** -- The tenant is notified that their application was not accepted. You can include a reason.

:::callout{type=warning title="Be careful with rejections"}
Once you reject a tenant, they will need to re-apply. Make sure to double-check the details and include a clear reason so they know what to fix.
:::

:::screenshot{caption="Approve and reject buttons on the tenant review page."}
:::
:::

:::step{number=6 icon=XCircle title="Onboarding flow diagram"}
Here is the full journey a tenant goes through from sign-up to being active on the platform:

:::mermaid{caption="Tenant onboarding lifecycle"}
graph TD
A[Tenant signs up] --> B[Fills onboarding form]
B --> C[Application submitted]
C --> D[Admin reviews application]
D --> E{Approved?}
E -- Yes --> F[Tenant gets access]
F --> G[Tenant sets up dashboard]
G --> H[Tenant invites clients]
E -- No --> I[Tenant notified of rejection]
I --> J[Tenant can re-apply]
:::
:::
