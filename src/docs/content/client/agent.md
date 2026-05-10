---
title: Orbit Automation
subtitle: View the automatic rules and pending decisions that protect your infrastructure — your tenant administrator manages the rules; you can see what's running.
prev: { label: Migrations, href: /client-dashboard/docs/migrations }
next: { label: Pricing Calculator, href: /client-dashboard/docs/pricing-calculator }
---

:::step{number=1 icon=Bot title="What Automation Does" navigation="Sidebar > Resilience > Automation"}
Orbit Automation watches your replication, backup, and disaster-recovery services. When something needs attention — a backup falls behind, a disk is filling up, a region looks unhealthy — it can take action automatically or wait for someone to approve. Think of it as a quiet co-pilot for your infrastructure.
:::

:::screenshot{caption="The Automation page showing active rules and recent decisions"}
:::

:::step{number=2 icon=Activity title="Rules and Decisions"}
**Rules** are the conditions and actions your tenant administrator has set up — for example, "if a backup is more than 24 hours late, retry it." **Decisions** are what happens when a rule fires — a record of every action the system proposed or took. As a client you can see both, but only your tenant admin can change them.
:::

:::callout{type=tip}
If you see a Decision marked "Pending Approval" that you think should run sooner, contact your tenant administrator. They can approve it or change the rule's approval mode.
:::
