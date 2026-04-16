---
title: Security Groups
subtitle: Security groups are firewall rules that control who can access your servers. Think of them as bouncers at the door -- they decide who gets in and who stays out.
prev: { label: Key Pairs, href: /client-dashboard/docs/key-pairs }
next: { label: Migrations, href: /client-dashboard/docs/migrations }
---

:::mermaid{caption="How security groups protect your server"}
graph LR
A[Incoming Traffic] --> B[Security Group Rules]
B -->|Allowed| C[Your Server]
B -->|Blocked| D[Rejected]
:::

:::step{number=1 icon=Shield title="What are Security Groups?" navigation="Sidebar > Networking > Security Groups"}
Every server has at least one security group attached to it. The security group contains a list of rules that say things like "allow web traffic from anyone" or "only allow SSH connections from my office." If a connection does not match any rule, it gets turned away at the door.
:::

:::screenshot{caption="Your Security Groups page"}
:::

:::step{number=2 icon=Plus title="Create Rules" navigation="Sidebar > Networking > Security Groups > Select a Group"}
Each rule has a few parts:

- **Direction** -- Is this for traffic coming in (inbound) or going out (outbound)?
- **Protocol** -- What type of traffic? (TCP, UDP, etc.)
- **Port** -- Which door number? (80 for websites, 443 for secure websites, 22 for SSH)
- **Source** -- Who is allowed? (A specific IP address, or everyone)
  :::

:::callout{type=tip}
Start strict and open up only what you need. It is like locking all the doors in your house first, then only unlocking the ones you actually use. A good starting point is to allow SSH (port 22) only from your own IP address.
:::

:::step{number=3 icon=Layers title="Assign to Servers" navigation="Sidebar > Networking > Security Groups"}
You can attach the same security group to multiple servers. For example, if you have five web servers that all need the same rules, create one "Web Server" security group and attach it to all five. Change the rules once, and all five servers update instantly.
:::

:::screenshot{caption="Assigning a security group to a server"}
:::
