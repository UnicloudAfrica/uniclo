---
title: Migrations
subtitle: Move workloads between regions or infrastructure. Think of migrations as moving your office from one building to another — everything needs to be packed, transported, and set up in the new location.
prev: { label: Serverless DR, href: /admin-dashboard/docs/serverless-dr }
next: { label: Destinations, href: /admin-dashboard/docs/destinations }
---

:::step{number=1 icon=Truck title="View All Migrations" navigation="Sidebar > Disaster Recovery > Migrations"}
The migrations page lists all workload migrations on your platform. Each migration shows the source, destination, progress, and current status. You can track everything from a single view.
:::

:::screenshot{caption="Your Migrations list"}
:::

:::step{number=2 icon=Plus title="Create a Migration" navigation="Sidebar > Disaster Recovery > Migrations > Create"}
Click create to start a new migration. Select the workload to move, choose the target region, and configure any settings. The platform handles the heavy lifting of copying data and recreating resources in the new location.
:::

:::step{number=3 icon=Activity title="Monitor Migration Progress" navigation="Click any migration in the list"}
Click on a migration to see detailed progress — how much data has been transferred, estimated time remaining, and any issues encountered. Migrations can take time depending on the amount of data being moved.
:::

:::callout{type=tip}
Plan migrations during low-traffic periods to minimize impact on your users. Always verify that everything works correctly in the new location before decommissioning the old one.
:::
