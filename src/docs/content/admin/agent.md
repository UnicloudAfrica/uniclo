---
title: Orbit Automation
subtitle: Define rules that watch your infrastructure and propose actions — failover, backup, retention, scaling — with optional human approval before they run.
prev: { label: Destinations, href: /admin-dashboard/docs/destinations }
next: { label: Provider Discovery, href: /admin-dashboard/docs/provider-discovery }
---

:::step{number=1 icon=Bot title="What Automation Does" navigation="Sidebar > Resilience > Automation"}
Orbit Automation is a rules engine that runs alongside replication, backup, and DR. Each rule has a condition and an action; when the condition fires, the engine generates a Decision. Decisions can run automatically, wait for a human to approve, or escalate to on-call. As an admin you manage rules across the platform — for tenants who can't see or change their own.
:::

:::screenshot{caption="The Automation page — Rules tab on the left, Decisions tab on the right"}
:::

:::step{number=2 icon=Settings title="Action Types"}
Each rule picks one of: **propose failover**, **trigger backup**, **enforce retention**, **scale storage**, **propose kernel remediation**, **run DR drill**, **pause replication**. Conditions can combine arbitrary signals from the metrics layer using AND / OR predicates.
:::

:::step{number=3 icon=CheckSquare title="Approval Modes & Cooldowns"}
Rules choose **auto** (run immediately), **manual** (wait for approval), or **escalate** (page on-call). Cooldowns prevent the same rule from firing repeatedly during one root-cause event. Decisions carry severity (`critical` / `high` / `medium` / `low` / `info`) so on-call can prioritize.
:::

:::screenshot{caption="Approving or rejecting a pending Decision"}
:::

:::callout{type=tip}
Audit Decisions monthly. The Decisions tab is a complete record of what the system has been doing on its own — both for incident review and for tuning rule conditions that fire too aggressively.
:::
