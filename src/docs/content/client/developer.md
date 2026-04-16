---
title: Developer Tools
subtitle: Developer tools let you connect your own applications to the platform. Use API keys to control things with code, set up webhooks to get notified when things happen, and monitor your usage -- all from one place.
prev: { label: Pricing Calculator, href: /client-dashboard/docs/pricing-calculator }
next: { label: Billing, href: /client-dashboard/docs/billing }
---

:::step{number=1 icon=KeyRound title="API Keys" navigation="Sidebar > Developer > API Keys"}
An API key is like a password that lets your code talk to the platform. Instead of clicking buttons in the dashboard, your applications can create servers, manage storage, and do everything else automatically. Generate a key, add it to your code, and you are ready to go.
:::

:::screenshot{caption="Your API Keys page"}
:::

:::callout{type=warning}
Keep your API keys secret -- treat them like passwords. Never put them in public code repositories or share them in chat messages. If a key is compromised, revoke it immediately and create a new one.
:::

:::step{number=2 icon=Webhook title="Webhooks" navigation="Sidebar > Developer > Webhooks"}
Webhooks are like setting up a doorbell -- when something happens (a server finishes deploying, a backup completes, an alert triggers), the platform sends a message to a URL you choose. Your application receives these notifications and can react automatically.
:::

:::step{number=3 icon=BarChart3 title="Usage Monitoring" navigation="Sidebar > Developer > Usage"}
Track how much of the API you are using. See how many requests your applications are making, spot unusual spikes, and make sure you are staying within your limits. Think of it as a speedometer for your API activity.
:::

:::screenshot{caption="API usage monitoring dashboard"}
:::
