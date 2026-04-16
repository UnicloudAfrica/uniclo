---
title: Replication Policies
subtitle: Set up data replication for disaster recovery. Replication keeps a copy of your data in another location so that if something goes wrong, you can recover quickly.
prev: { label: DNS Zones, href: /admin-dashboard/docs/dns }
next: { label: Serverless DR, href: /admin-dashboard/docs/serverless-dr }
---

:::step{number=1 icon=Copy title="View All Replication Policies" navigation="Sidebar > Disaster Recovery > Replication Policies"}
The replication policies page shows all active data replication rules. Each policy defines what data is being replicated, where it is going, and how often. Think of it as setting up automatic backup copies that are always kept up to date.
:::

:::screenshot{caption="Your Replication Policies list"}
:::

:::step{number=2 icon=Plus title="Create a Replication Policy" navigation="Sidebar > Disaster Recovery > Replication Policies > Create"}
Click create to set up a new replication policy. Choose the source (where the data lives now), the destination (where the copy should go), and the replication schedule (how often to sync). The platform handles the rest automatically.
:::

:::step{number=3 icon=Activity title="Monitor Replication Status" navigation="Click any policy in the list"}
Click on a policy to see its current status — is replication running smoothly, is it behind, or has it encountered errors? Monitoring replication ensures your disaster recovery plan is always ready.
:::

:::callout{type=tip}
Test your replication policies regularly. Having a copy of your data is only useful if you can actually restore from it when needed.
:::
