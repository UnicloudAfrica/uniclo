---
title: Regions
subtitle: Learn how to set up and manage the geographic regions where your cloud infrastructure lives.
prev: { label: Clients, href: /admin-dashboard/docs/clients }
next: { label: Onboarding, href: /admin-dashboard/docs/onboarding }
---

:::callout{type=info title="What are regions?"}
Imagine your platform is a company with **offices in different cities**. Each office (region) has its own equipment and staff. Clients choose which office to use based on where they are located -- the closer the office, the faster things run. Regions let you spread your infrastructure across the world so everyone gets a great experience.
:::

:::step{number=1 icon=Globe title="View the regions list" navigation="Sidebar > Infrastructure > Regions"}
The regions page shows every region you have configured on the platform. Each row displays the region name, location, status, and how many availability zones it contains.

1. Click **Infrastructure** in the sidebar.
2. Select **Regions**.
3. Browse the list or search by name or location.

:::screenshot{caption="The regions list showing names, locations, and zone counts."}
:::
:::

:::step{number=2 icon=PlusCircle title="Create a new region" navigation="Sidebar > Infrastructure > Regions > Create"}
When you want to expand your platform to a new geographic area, you create a new region. This tells the system where new resources can be deployed.

1. Click the **Create** button on the regions page.
2. Enter the region name (for example, "US East" or "EU West").
3. Provide the geographic location details.
4. Configure any provider-specific settings if prompted.
5. Click **Submit** to create the region.

:::callout{type=tip}
Use clear, descriptive names for your regions. Your tenants and their clients will see these names when choosing where to deploy their resources.
:::

:::screenshot{caption="The create region form with name and location fields."}
:::
:::

:::step{number=3 icon=CheckCircle2 title="Manage region approvals" navigation="Sidebar > Infrastructure > Regions > Pending"}
Some regions may require approval before they become active -- especially if they are added by a tenant or partner. You can review and approve pending regions from the same page.

1. Look for regions with a **Pending** status badge.
2. Click on the region to review its details.
3. Click **Approve** to activate or **Reject** to decline.

:::callout{type=warning}
Approving a region means tenants can start deploying resources there. Make sure the underlying infrastructure is ready before you approve.
:::

:::screenshot{caption="A pending region detail page with approve and reject buttons."}
:::
:::

:::step{number=4 icon=Layers title="Configure availability zones" navigation="Sidebar > Infrastructure > Regions > Click region > Zones tab"}
Each region can have one or more **availability zones**. Think of these as separate rooms inside the same office building. If one room has a power outage, the others keep running. This gives your clients better reliability.

1. Open a region's detail page by clicking on it.
2. Go to the **Zones** tab.
3. Click **Add Zone** to create a new availability zone.
4. Give the zone a name and configure its settings.
5. Click **Save**.

:::mermaid{caption="Regions contain one or more availability zones"}
graph TD
A[Platform] --> B[Region: US East]
A --> C[Region: EU West]
B --> D[Zone A]
B --> E[Zone B]
C --> F[Zone A]
C --> G[Zone B]
C --> H[Zone C]
:::

:::screenshot{caption="Availability zones tab inside a region detail page."}
:::
:::
