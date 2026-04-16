---
title: Migrations
subtitle: Migrations let you move your workloads from one place to another. Think of it as hiring a moving company -- they carefully pack everything up and set it all up in the new location for you.
prev: { label: Security Groups, href: /client-dashboard/docs/security-groups }
next: { label: Infrastructure Agent, href: /client-dashboard/docs/agent }
---

:::mermaid{caption="The migration process"}
graph LR
A[Your Current Setup] --> B[Start Migration]
B --> C[Data Copying...]
C --> D[Verification]
D --> E[New Location Ready!]
:::

:::step{number=1 icon=ArrowLeftRight title="What are Migrations?" navigation="Sidebar > Disaster Recovery > Migrations"}
A migration moves your servers, data, and settings from one environment to another. Maybe you are moving from on-premise hardware to the cloud, or moving between regions. The migration tool handles the heavy lifting so you do not have to do it manually.
:::

:::screenshot{caption="Your Migrations dashboard"}
:::

:::step{number=2 icon=ClipboardList title="Plan Your Migration" navigation="Sidebar > Disaster Recovery > Migrations > Create"}
Before you start, the wizard helps you pick what to move and where to move it. You will choose your source (where things are now) and your destination (where you want them to go). The system checks everything is compatible before it begins.
:::

:::callout{type=info}
Migrations can take time depending on how much data you have. A small server might move in minutes, but a large database could take hours. You can keep using your current setup while the migration runs in the background.
:::

:::step{number=3 icon=CheckCircle title="Monitor and Complete" navigation="Sidebar > Disaster Recovery > Migrations"}
Once a migration starts, you can watch its progress from the dashboard. The status shows you how far along it is and alerts you if anything needs attention. When it finishes, verify everything looks good in the new location before switching over.
:::

:::screenshot{caption="Migration progress tracking"}
:::
