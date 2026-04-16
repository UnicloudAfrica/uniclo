---
title: VPCs
subtitle: Manage Virtual Private Clouds across your platform. A VPC is like a private building in a shared complex — everything inside is isolated and protected from the other buildings.
prev: { label: Lattice Databases, href: /admin-dashboard/docs/databases }
next: { label: Security Groups, href: /admin-dashboard/docs/security-groups }
---

:::step{number=1 icon=Network title="View All VPCs" navigation="Sidebar > Networking > VPCs"}
The VPCs page lists every Virtual Private Cloud on your platform. Each VPC is an isolated network environment — like a private building in a shared complex. Resources inside a VPC can talk to each other, but they are separated from resources in other VPCs.
:::

:::screenshot{caption="Your VPCs list"}
:::

:::step{number=2 icon=Plus title="Create a VPC" navigation="Sidebar > Networking > VPCs > Create VPC"}
Click create to set up a new VPC. You will need to choose a project, give the VPC a name, and define a CIDR block. The CIDR block determines how many IP addresses are available inside your VPC — think of it as deciding how many rooms your building will have.
:::

:::step{number=3 icon=Eye title="VPC Details" navigation="Click any VPC in the list"}
Click on a VPC to see its subnets, route tables, and attached resources. This gives you a complete map of the network layout inside that particular building.
:::

:::callout{type=tip}
Plan your CIDR blocks carefully before creating VPCs. Overlapping address ranges can cause problems if you later want to connect two VPCs together using VPC peering.
:::
