---
title: Instance Templates
subtitle: Templates are pre-configured blueprints for virtual servers. Instead of picking every setting from scratch each time, just select a template and launch. Think of them as recipe cards for your favorite server setups.
prev: { label: Leads, href: /dashboard/docs/leads }
next: { label: Key Pairs, href: /dashboard/docs/key-pairs }
---

:::step{number=1 icon=LayoutTemplate title="Browse Templates" navigation="Sidebar > Infrastructure > Templates"}
The templates page lists all available server blueprints. Each template shows the operating system, CPU, memory, and disk size it includes. Browse through them to find one that matches your needs.
:::

:::screenshot{caption="Your Templates list page"}
:::

:::step{number=2 icon=Plus title="Create a Custom Template" navigation="Sidebar > Infrastructure > Templates > New"}
Click "New" to build your own template. Choose the operating system, set the CPU and memory, configure the disk size, and save it. Next time you or your clients need the same setup, just pick this template instead of configuring everything again.
:::

:::step{number=3 icon=Rocket title="Launch an Instance from a Template"}
From any template, click "Launch" to spin up a new server with those exact settings. You will still be able to adjust a few things before confirming, but most of the work is already done for you.
:::

:::screenshot{caption="Your Launch from template dialog"}
:::

:::callout{type=info}
Templates do not create a server until you launch one. They are just saved configurations -- you can have as many templates as you want without using any resources.
:::
