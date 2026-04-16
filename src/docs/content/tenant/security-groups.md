---
title: Security Groups
subtitle: Security groups are firewall rules that control which traffic can reach your servers. Think of them as bouncers at the door -- they check every visitor and only let in the ones on the guest list.
prev: { label: Key Pairs, href: /dashboard/docs/key-pairs }
next: { label: Load Balancers, href: /dashboard/docs/load-balancers }
---

:::step{number=1 icon=Shield title="View Your Security Groups" navigation="Sidebar > Networking > Security Groups"}
The security groups page lists all your firewall rule sets. Each group has a name, description, and a count of how many rules it contains. Servers can be assigned to one or more security groups.
:::

:::screenshot{caption="Your Security Groups list page"}
:::

:::step{number=2 icon=Plus title="Create a Security Group" navigation="Sidebar > Networking > Security Groups > New"}
Click "New" to create a fresh security group. Give it a clear name (like "web-servers" or "database-access") and a short description so your team knows what it is for.
:::

:::step{number=3 icon=ListChecks title="Add Inbound and Outbound Rules"}
Once your security group is created, add rules to define what traffic is allowed:

- **Inbound rules** -- Control what can come in. For example, allow HTTP traffic on port 80 so people can visit a website.
- **Outbound rules** -- Control what can go out. By default, servers can usually reach the internet, but you can restrict this if needed.

Each rule specifies a protocol (TCP, UDP, ICMP), port range, and source or destination.
:::

:::screenshot{caption="Your Security Group rules editor"}
:::

:::callout{type=tip}
Start strict and open up only what you need. It is much safer to add rules one at a time than to allow everything and try to lock it down later. The bouncers should have a short guest list, not a long one.
:::

:::step{number=4 icon=Link title="Assign to Instances"}
Attach a security group to one or more instances from the instance details page or during instance creation. A single instance can use multiple security groups -- the rules from all of them combine together.
:::
