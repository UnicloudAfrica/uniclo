---
title: Infrastructure Agent
subtitle: The infrastructure agent is a small helper tool that runs on your servers. It monitors how they are doing and helps you manage them -- like having a security camera and a remote control for each server.
prev: { label: Migrations, href: /client-dashboard/docs/migrations }
next: { label: Pricing Calculator, href: /client-dashboard/docs/pricing-calculator }
---

:::step{number=1 icon=Bot title="What is the Agent?" navigation="Sidebar > Infrastructure Agent"}
The agent is a lightweight program you install on your server. Once it is running, it sends information back to your dashboard -- things like how much memory is being used, whether the disk is getting full, and if the server is healthy. Think of it as a fitness tracker for your server.
:::

:::screenshot{caption="Infrastructure Agent overview"}
:::

:::step{number=2 icon=Download title="Install the Agent" navigation="Sidebar > Infrastructure Agent > Install"}
Installing the agent is simple. The dashboard gives you a one-line command to copy and paste into your server's terminal. Run it, and the agent starts working automatically. It only takes a minute.
:::

:::callout{type=tip}
Install the agent on every server you want to monitor. It uses very little resources -- you will not notice it running. But the information it provides can save you from problems before they happen, like getting an alert when your disk is almost full.
:::

:::step{number=3 icon=Activity title="View Agent Data" navigation="Sidebar > Infrastructure Agent"}
Once installed, the agent sends live data to your dashboard. You can see CPU usage, memory, disk space, and network activity all in one place. If something looks unusual, you will spot it right away instead of waiting for things to break.
:::

:::screenshot{caption="Agent monitoring dashboard"}
:::
