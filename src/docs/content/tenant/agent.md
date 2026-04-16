---
title: Infrastructure Agent
subtitle: The infrastructure agent is a small piece of software you install on servers to connect them to the management platform. Think of it as a walkie-talkie that lets your servers report back to headquarters.
prev: { label: Migrations, href: /dashboard/docs/migrations }
next: { label: Onboarding, href: /dashboard/docs/onboarding }
---

:::step{number=1 icon=Bot title="What the Agent Does" navigation="Sidebar > Infrastructure Agent"}
The agent runs quietly on your servers and handles things like monitoring, updates, and remote management. Once installed, you can see server health, run commands, and collect logs -- all from the dashboard.
:::

:::screenshot{caption="Your Infrastructure Agent overview page"}
:::

:::step{number=2 icon=Download title="Install the Agent"}
From the agent page, copy the installation command for your operating system (Linux, Windows, etc.). Run it on the server you want to manage. The agent registers itself automatically and appears in your dashboard within a few minutes.
:::

:::step{number=3 icon=Activity title="Monitor Agent Status"}
Each connected server shows an agent status: online, offline, or needs update. If an agent goes offline, it usually means the server is down or lost its network connection. Check the server directly to investigate.
:::

:::screenshot{caption="Your Agent status indicators"}
:::

:::callout{type=tip}
Keep your agents up to date. When a new version is available, you will see an update prompt on the agent page. Updates usually take less than a minute and do not interrupt your running services.
:::
