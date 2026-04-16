---
title: Compute & Instances
subtitle: This is where you create and manage your cloud servers. An instance (or server) is like having your own personal computer in the cloud -- except it is always on, always connected, and you can make it as powerful as you need.
prev: { label: Getting Started, href: /client-dashboard/docs/getting-started }
next: { label: Networking, href: /client-dashboard/docs/networking }
---

:::mermaid{caption="Creating a server -- step by step"}
graph LR
A[Pick a Project] --> B[Choose Template or Custom]
B --> C[Select Size]
C --> D[Set Up Network]
D --> E[Review Everything]
E --> F[Pay]
F --> G[Server Deploying...]
G --> H[Your Server is Ready!]
:::

:::step{number=1 icon=FolderKanban title="What are Projects?" navigation="Sidebar > Infrastructure > Projects"}
Projects are like folders on your computer -- they help you organize your servers into groups. For example, you might have a "Website" project for your web servers and a "Database" project for your database servers. Click "Create" to make your first project.
:::

:::screenshot{caption="Your Projects page"}
:::

:::callout{type=tip}
Start with one project. You can always create more later as you grow. Think of a project name that describes what the servers inside it will be used for.
:::

:::step{number=2 icon=Server title="View Your Instances" navigation="Sidebar > Infrastructure > Cube Instances"}
This page shows all your servers. Each one displays its name, whether it is running or stopped, its IP address (like its phone number on the internet), and how much CPU and memory it is using.
:::

:::screenshot{caption="Your Instances list"}
:::

:::step{number=3 icon=Plus title="Create a New Instance" navigation="Sidebar > Infrastructure > Create Instance"}
This is the exciting part -- launching your own server! The wizard walks you through each choice:

- **Project** -- Which folder should this server go in?
- **Operating System** -- What software should it run? (Ubuntu, Windows, etc.)
- **Size** -- How powerful should it be? (More CPUs and RAM = faster)
- **Network** -- How should it connect to the internet?
  :::

:::screenshot{caption="Your Instance creation wizard"}
:::

:::callout{type=info}
Not sure what size to pick? Start small -- you can always upgrade later. It is much easier to grow than to shrink.
:::

:::step{number=4 icon=LayoutTemplate title="Templates" navigation="Sidebar > Infrastructure > Templates"}
Templates are pre-made server setups -- like ordering a combo meal instead of picking every item individually. Pick a template that matches what you need and launch in seconds.
:::

:::step{number=5 icon=Key title="Key Pairs" navigation="Sidebar > Infrastructure > Key Pairs"}
Key pairs are special security keys for connecting to your server. Think of the private key as your house key -- keep it safe and never share it! You will need it every time you log into your server remotely.
:::

:::step{number=6 icon=Play title="Managing Your Server" navigation="Click any instance for details"}
From the instance details page, you can:

- **Start** -- Turn the server on
- **Stop** -- Turn it off (data is saved, you stop paying for compute)
- **Restart** -- Turn it off and back on (fixes many common issues!)
- **Delete** -- Permanently remove the server
  :::

:::callout{type=warning}
Deleting a server is permanent. Make sure you have backed up anything important before deleting. Consider stopping instead of deleting if you might need it later.
:::
