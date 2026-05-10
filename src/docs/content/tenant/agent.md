---
title: Orbit Automation
subtitle: Define rules that watch your infrastructure and propose actions — failover, backup, retention, scaling — with optional human approval before they run.
prev: { label: Migrations, href: /dashboard/docs/migrations }
next: { label: Onboarding, href: /dashboard/docs/onboarding }
---

:::step{number=1 icon=Bot title="What Automation Does" navigation="Sidebar > Resilience > Automation"}
Orbit Automation is a rules engine that runs alongside your replication, backup, and DR services. Each rule has a condition (e.g. "RPO breached for 5 minutes," "snapshot retention older than 30 days") and an action (e.g. "propose failover," "trigger backup," "scale storage"). When a condition fires, the engine generates a Decision. Decisions can run automatically, wait for a human to approve, or escalate to on-call.
:::

:::screenshot{caption="The Automation page — Rules tab on the left, Decisions tab on the right"}
:::

:::step{number=2 icon=Settings title="Action Types Available"}
Every rule chooses one of these actions:

- **Propose failover** — when RPO/RTO is breached, propose cutover to the DR target
- **Trigger backup** — fire an out-of-cycle backup
- **Enforce retention** — delete or archive past the retention boundary
- **Scale storage** — grow a volume before it fills
- **Propose kernel remediation** — patch a vulnerable kernel on a managed host
- **Run DR drill** — kick off an unannounced DR drill
- **Pause replication** — halt replication during a known noisy window
  :::

:::step{number=3 icon=CheckSquare title="Approval Modes"}
Each rule sets its own approval mode:

- **Auto** — the action runs immediately when the rule fires
- **Manual** — a Decision is created and waits for a human to approve or reject
- **Escalate** — pages on-call instead of waiting silently

Use Auto for low-risk routine actions (e.g. enforce retention). Use Manual or Escalate for anything that touches production traffic (e.g. propose failover).
:::

:::screenshot{caption="A pending Decision waiting for approval, with reasoning and severity"}
:::

:::callout{type=tip}
Start with Manual approval mode for every new rule. Once you've watched it fire correctly a few times in real conditions, switch to Auto. Cooldowns prevent the same rule from firing repeatedly when a single root-cause event lingers.
:::
