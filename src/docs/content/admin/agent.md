---
title: Infrastructure Agent
subtitle: Manage the cloud management agent that runs on your virtual machines. The agent handles monitoring, automation, and communication between your instances and the platform.
prev: { label: Destinations, href: /admin-dashboard/docs/destinations }
next: { label: Provider Discovery, href: /admin-dashboard/docs/provider-discovery }
---

:::step{number=1 icon=Bot title="View Agent Status" navigation="Sidebar > Infrastructure Agent"}
The infrastructure agent page shows the status of agents installed across your platform's instances. Each agent reports its version, health, and last check-in time. Think of agents as small helpers living inside each server, keeping the platform informed about what is happening.
:::

:::screenshot{caption="Your Infrastructure Agent overview"}
:::

:::step{number=2 icon=Activity title="Monitoring via Agent" navigation="Sidebar > Infrastructure Agent"}
Agents collect metrics from the instances they run on — CPU usage, memory, disk space, and network activity. This data powers the monitoring dashboards and alerts. Without the agent, the platform has limited visibility into what is happening inside an instance.
:::

:::step{number=3 icon=RefreshCw title="Agent Updates" navigation="Sidebar > Infrastructure Agent"}
When a new agent version is available, you can push updates to all instances or select specific ones. Keeping agents up to date ensures you get the latest monitoring capabilities and security fixes.
:::

:::callout{type=tip}
If an instance's agent shows as offline, it usually means the instance is stopped or there is a network issue. Check the instance status first before troubleshooting the agent.
:::
