---
title: Serverless DR
subtitle: Manage serverless disaster recovery for your platform. Serverless DR keeps your applications ready to failover without running standby servers — saving costs until you actually need them.
prev: { label: Replication Policies, href: /admin-dashboard/docs/replication }
next: { label: Migrations, href: /admin-dashboard/docs/migrations }
---

:::step{number=1 icon=ShieldCheck title="View Serverless DR" navigation="Sidebar > Disaster Recovery > Serverless DR"}
The serverless DR page shows all disaster recovery configurations. Each entry defines a protected workload and its recovery target. Unlike traditional DR, serverless DR does not keep standby servers running — it spins them up only when a failover is triggered.
:::

:::screenshot{caption="Your Serverless DR configurations"}
:::

:::step{number=2 icon=FlaskConical title="Run DR Drills" navigation="Sidebar > Disaster Recovery > Serverless DR > Drill"}
DR drills let you test your disaster recovery plan without affecting production. A drill simulates a failover to verify that everything works correctly. Run drills regularly so you are confident your recovery plan will work when it matters.
:::

:::step{number=3 icon=ArrowRightLeft title="Trigger Failover" navigation="Sidebar > Disaster Recovery > Serverless DR > Failover"}
When a real disaster strikes, trigger a failover to switch operations to the recovery site. The platform spins up the necessary resources at the recovery location and redirects traffic automatically.
:::

:::callout{type=info}
Serverless DR is cost-effective because you only pay for recovery resources when they are actually running — during drills or real failovers. There is no idle standby cost.
:::
