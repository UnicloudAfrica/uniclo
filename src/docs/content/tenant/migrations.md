---
title: Migrations
subtitle: Migrations help you move workloads from one environment to another. Think of it as hiring professional movers to transfer your office to a new building -- everything gets packed up, shipped, and set up in the new location.
prev: { label: DNS Zones, href: /dashboard/docs/dns }
next: { label: Infrastructure Agent, href: /dashboard/docs/agent }
---

:::mermaid{caption="The migration process"}
graph LR
A[Source Environment] --> B[Discovery & Planning]
B --> C[Data Replication]
C --> D[Testing]
D --> E[Cutover]
E --> F[Running in New Location]
:::

:::step{number=1 icon=Truck title="View Migrations" navigation="Sidebar > Disaster Recovery > Migrations"}
The migrations page shows all your migration jobs. Each one displays the source, destination, current status, and progress percentage. You can track every migration from start to finish.
:::

:::screenshot{caption="Your Migrations list page"}
:::

:::step{number=2 icon=Plus title="Start a New Migration" navigation="Sidebar > Disaster Recovery > Migrations > New"}
Click "New" to begin a migration. Select the source workload you want to move and the target destination. The wizard walks you through configuration, network mapping, and scheduling.
:::

:::step{number=3 icon=RefreshCw title="Monitor Progress"}
Once a migration is running, the details page shows real-time progress -- how much data has been copied, estimated time remaining, and any issues that need your attention. You will also receive notifications at key milestones.
:::

:::screenshot{caption="Your Migration progress details"}
:::

:::callout{type=info}
Test your migration before doing the final cutover. Most migrations support a test mode that lets you verify everything works in the new environment without affecting the original.
:::
