---
title: Networking
subtitle: Networking connects and protects your servers. Think of it as building roads, walls, and gates for your cloud city.
prev: { label: Compute, href: /dashboard/docs/compute }
next: { label: Storage, href: /dashboard/docs/storage }
---

:::mermaid{caption="How networking components fit together"}
graph TD
VPC[VPC - Your Private Space] --> PUB[Public Subnet]
VPC --> PRIV[Private Subnet]
PUB --> IGW[Internet Gateway]
PRIV --> NAT[NAT Gateway]
NAT --> IGW
PUB --> SG[Security Group]
SG --> INST[Your Servers]
:::

:::step{number=1 icon=Network title="VPCs" navigation="Sidebar > Networking > VPCs"}
A VPC is your own private space on the internet -- like a gated community. Everything inside is isolated from the outside world. Each project usually gets its own VPC.
:::

:::step{number=2 icon=Grid3x3 title="Subnets" navigation="Sidebar > Networking > Subnets"}
Subnets divide your VPC into sections. Public subnets can be reached from the internet. Private subnets are hidden away -- only accessible from inside your VPC.
:::

:::screenshot{caption="Your Subnets management page"}
:::

:::step{number=3 icon=Shield title="Security Groups" navigation="Sidebar > Networking > Security Groups"}
Security groups are your firewall rules -- they decide what traffic is allowed in and out of your servers. For example, you might allow web traffic on port 80 but block everything else.
:::

:::step{number=4 icon=Globe2 title="Elastic IPs" navigation="Sidebar > Networking > Elastic IPs"}
A permanent public IP address that you can attach to any server. Unlike regular IPs, this one stays the same even if you stop and restart the server.
:::

:::step{number=5 icon=Router title="NAT Gateways" navigation="Sidebar > Networking > NAT Gateways"}
NAT gateways let servers in private subnets access the internet (for updates, etc.) without being directly reachable from outside. One-way communication out.
:::

:::step{number=6 icon=Waypoints title="Route Tables" navigation="Sidebar > Networking > Route Tables"}
Route tables are road signs for network traffic -- they tell data packets where to go.
:::

:::step{number=7 icon=Lock title="Network ACLs" navigation="Sidebar > Networking > Network ACLs"}
An extra security layer around entire subnets (in addition to security groups on individual servers).
:::

:::step{number=8 icon=Link2 title="VPC Peering" navigation="Sidebar > Networking > VPC Peering"}
Connect two VPCs so they can communicate privately, like building a tunnel between two buildings.
:::

:::step{number=9 icon=Scale title="Load Balancers" navigation="Sidebar > Networking > Load Balancers"}
Distribute incoming traffic across multiple servers. If one server is busy, traffic goes to another.
:::

:::step{number=10 icon=ArrowRightLeft title="DNS Management" navigation="Sidebar > Networking > DNS"}
Manage domain names and their records. DNS turns human-friendly names (like example.com) into IP addresses that computers understand.
:::

:::callout{type=info}
Most networking resources are created automatically when you create a project. You usually only need to customize them for advanced setups.
:::
