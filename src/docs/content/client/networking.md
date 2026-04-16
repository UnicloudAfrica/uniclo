---
title: Networking
subtitle: Networking is how your servers connect to each other and to the internet. Do not worry if this sounds complicated -- we will explain everything using simple everyday examples.
prev: { label: Compute, href: /client-dashboard/docs/compute }
next: { label: Storage, href: /client-dashboard/docs/storage }
---

:::mermaid{caption="How your network is organized"}
graph TD
VPC[VPC - Your Private Space] --> PUB[Public Subnet - Front Yard]
VPC --> PRIV[Private Subnet - Back Yard]
PUB --> GW[Internet Gateway - Front Door]
PRIV --> NAT[NAT Gateway - Back Door]
GW --> NET[The Internet]
NAT --> GW
PUB --> SG[Security Group - Bouncer]
SG --> SRV[Your Server]
:::

:::callout{type=info}
Most networking is set up automatically when you create a project. You usually do not need to change anything unless you have specific requirements. This guide is here so you understand what each piece does.
:::

:::step{number=1 icon=Network title="VPCs (Virtual Private Clouds)" navigation="Sidebar > Networking > VPCs"}
A VPC is your own private space on the internet -- imagine a gated community. Everything inside is protected from the outside world. Your servers live inside your VPC.
:::

:::step{number=2 icon=Grid3x3 title="Subnets" navigation="Sidebar > Networking > Subnets"}
Subnets are neighborhoods within your gated community. **Public subnets** are like houses facing the street -- visitors (internet traffic) can reach them. **Private subnets** are interior houses -- only residents (other servers) can reach them.
:::

:::screenshot{caption="Your Subnets page"}
:::

:::step{number=3 icon=Shield title="Security Groups" navigation="Sidebar > Networking > Security Groups"}
Security groups are the bouncers at each door. They check every visitor: "Are you on the guest list?" You set the rules -- for example, "allow web traffic from anywhere" or "only allow SSH from my office IP."
:::

:::step{number=4 icon=Globe2 title="Elastic IPs" navigation="Sidebar > Networking > Elastic IPs"}
An Elastic IP is like getting a permanent phone number. Normal IP addresses can change, but an Elastic IP stays the same forever. Useful when other people need to always reach your server at the same address.
:::

:::step{number=5 icon=Router title="NAT Gateways" navigation="Sidebar > Networking > NAT Gateways"}
A NAT gateway is like a P.O. Box -- your private servers can send mail out (access the internet for updates), but nobody can send mail in (reach them directly). One-way communication for safety.
:::

:::step{number=6 icon=Waypoints title="Route Tables" navigation="Sidebar > Networking > Route Tables"}
Route tables are road signs for your network traffic. They tell data packets: "To reach the internet, go through the gateway. To reach another subnet, go this way."
:::

:::step{number=7 icon=Lock title="Network ACLs" navigation="Sidebar > Networking > Network ACLs"}
An extra gate around each neighborhood (subnet), in addition to the bouncers (security groups) at each door. Most people do not need to change these.
:::

:::step{number=8 icon=Link2 title="VPC Peering" navigation="Sidebar > Networking > VPC Peering"}
Building a private bridge between two VPCs so they can talk to each other without going through the public internet. Like connecting two office buildings with a skybridge.
:::

:::step{number=9 icon=ArrowRightLeft title="DNS" navigation="Sidebar > Networking > DNS"}
DNS is the phone book of the internet. It turns names people can remember (like myapp.com) into numbers computers understand (like 192.168.1.1). Manage your domain records here.
:::

:::step{number=10 icon=Scale title="Load Balancers" navigation="Sidebar > Networking > Load Balancers"}
A load balancer is like a receptionist at a busy office -- when a visitor arrives, the receptionist sends them to whichever desk is least busy. This spreads traffic evenly across your servers.
:::
