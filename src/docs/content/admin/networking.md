---
title: Networking
subtitle: Manage the entire network infrastructure of your platform. Think of networking as building the roads, walls, and gates that connect and protect all your servers.
prev: { label: Compute, href: /admin-dashboard/docs/compute }
next: { label: Storage, href: /admin-dashboard/docs/storage }
---

:::mermaid{caption="How VPC components work together"}
graph TD
VPC[VPC - Your Private Building] --> SUB1[Public Subnet]
VPC --> SUB2[Private Subnet]
SUB1 --> IGW[Internet Gateway]
SUB2 --> NAT[NAT Gateway]
NAT --> IGW
IGW --> INTERNET[Internet]
SUB1 --> SG1[Security Group]
SUB2 --> SG2[Security Group]
SG1 --> INST1[Instance]
SG2 --> INST2[Instance]
:::

:::step{number=1 icon=Network title="VPCs" navigation="Sidebar > Networking > VPCs"}
A VPC (Virtual Private Cloud) is like your own private building on the internet. Everything inside it is isolated and protected from the outside world. Each project typically has its own VPC.
:::

:::screenshot{caption="Your VPCs list"}
:::

:::step{number=2 icon=Grid3x3 title="Subnets" navigation="Sidebar > Networking > Subnets"}
Subnets are rooms inside your building. Public subnets have windows facing the street (accessible from the internet), while private subnets are interior rooms (only accessible from inside).
:::

:::step{number=3 icon=Shield title="Security Groups" navigation="Sidebar > Networking > Security Groups"}
Security groups are like bouncers at each door. They decide who is allowed in (inbound rules) and who is allowed out (outbound rules). You can set rules based on IP addresses, ports, and protocols.
:::

:::step{number=4 icon=Globe2 title="Elastic IPs" navigation="Sidebar > Networking > Elastic IPs"}
An Elastic IP is a permanent public address — like a phone number that never changes. You can attach it to any instance, and even move it between instances.
:::

:::step{number=5 icon=Router title="NAT Gateways" navigation="Sidebar > Networking > NAT Gateways"}
NAT gateways let servers in private subnets access the internet (to download updates, for example) without being directly reachable from the outside. Think of it as a one-way mailbox.
:::

:::step{number=6 icon=Waypoints title="Route Tables" navigation="Sidebar > Networking > Route Tables"}
Route tables are like road signs telling network traffic where to go. Each subnet has a route table that decides how packets reach their destination.
:::

:::step{number=7 icon=Lock title="Network ACLs" navigation="Sidebar > Networking > Network ACLs"}
Network ACLs are an extra security layer around subnets — like a fence around a neighborhood, in addition to the locks on each door (security groups).
:::

:::step{number=8 icon=Link2 title="VPC Peering" navigation="Sidebar > Networking > VPC Peering"}
VPC peering lets two VPCs talk to each other privately — like building a bridge between two buildings.
:::

:::step{number=9 icon=Scale title="Load Balancers" navigation="Sidebar > Networking > Load Balancers"}
Load balancers distribute incoming traffic across multiple servers — like a receptionist sending visitors to whichever desk is least busy.
:::

:::step{number=10 icon=ArrowRightLeft title="DNS Management" navigation="Sidebar > Networking > DNS"}
DNS turns domain names (like example.com) into IP addresses. Manage your DNS zones and records here — the internet's phone book.
:::

:::callout{type=info}
All networking resources are scoped to specific projects and regions. Make sure you are looking at the right region when managing network infrastructure.
:::
