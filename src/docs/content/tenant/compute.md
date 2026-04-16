---
title: Compute & Instances
subtitle: This is the heart of your cloud business -- creating and managing virtual servers (instances) for your clients. Think of each instance as a personal computer that lives in the cloud.
prev: { label: Clients & Leads, href: /dashboard/docs/clients }
next: { label: Networking, href: /dashboard/docs/networking }
---

:::mermaid{caption="The instance creation process"}
graph LR
A[Select Project] --> B[Choose Template or Configure]
B --> C[Pick Size - CPU & RAM]
C --> D[Set Up Network]
D --> E[Review & Confirm]
E --> F[Pay]
F --> G[Server Deploying...]
G --> H[Server Ready!]
:::

:::step{number=1 icon=FolderKanban title="Projects" navigation="Sidebar > Infrastructure > Projects"}
Projects are like folders that group related servers together. For example, a client might have a "Production" project and a "Testing" project. Each project has its own network and security settings. Click "Create" to make a new project.
:::

:::screenshot{caption="Your Projects list"}
:::

:::step{number=2 icon=Server title="View Instances" navigation="Sidebar > Infrastructure > Cube Instances"}
See all the virtual servers running under your account. Each instance shows its name, status (running, stopped, etc.), IP address, and resource usage. Click on any instance for full details.
:::

:::step{number=3 icon=Plus title="Create an Instance" navigation="Sidebar > Infrastructure > Create Instance"}
The creation wizard walks you through every step. First, pick a project. Then choose an operating system (like Ubuntu or Windows). Next, select the server size -- how many CPUs and how much memory. Finally, configure the network settings and confirm your order.
:::

:::screenshot{caption="Your Instance creation wizard"}
:::

:::step{number=4 icon=LayoutTemplate title="Templates" navigation="Sidebar > Infrastructure > Templates"}
Templates save time by bundling common configurations together. Instead of choosing every setting each time, just pick a template. It is like having a recipe card instead of figuring out every ingredient from scratch.
:::

:::step{number=5 icon=Play title="Start, Stop & Restart" navigation="Instance Details > Actions"}
From the instance details page, you can control the server's lifecycle:

- **Start** -- Turn the server on
- **Stop** -- Turn it off (you stop paying for compute, but storage is still billed)
- **Restart** -- Turn it off and back on again
  :::

:::callout{type=tip}
Stopped instances still keep their data and network settings. When you start them again, everything is right where you left it.
:::
