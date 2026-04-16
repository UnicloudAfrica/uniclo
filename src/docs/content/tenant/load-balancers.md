---
title: Load Balancers
subtitle: Load balancers distribute incoming traffic across multiple servers so no single server gets overwhelmed. Think of them as a traffic cop directing cars down different lanes to keep everything moving smoothly.
prev: { label: Security Groups, href: /dashboard/docs/security-groups }
next: { label: DNS Zones, href: /dashboard/docs/dns }
---

:::mermaid{caption="How a load balancer distributes traffic"}
graph LR
U[Users] --> LB[Load Balancer]
LB --> S1[Server 1]
LB --> S2[Server 2]
LB --> S3[Server 3]
:::

:::step{number=1 icon=Scale title="View Your Load Balancers" navigation="Sidebar > Networking > Load Balancers"}
The load balancers page lists all the load balancers you have created. Each one shows its name, status, the number of servers behind it, and its public IP address.
:::

:::screenshot{caption="Your Load Balancers list page"}
:::

:::step{number=2 icon=Plus title="Create a Load Balancer" navigation="Sidebar > Networking > Load Balancers > New"}
Click "New" to create a load balancer. Give it a name, choose the protocol (HTTP, HTTPS, or TCP), and set the port it should listen on. Then add the servers you want traffic sent to.
:::

:::step{number=3 icon=HeartPulse title="Health Checks"}
Load balancers regularly ping your servers to make sure they are still responding. If a server stops responding, traffic is automatically redirected to the healthy ones. You can configure how often checks happen and what counts as a failure.
:::

:::screenshot{caption="Your Health check settings"}
:::

:::callout{type=info}
A load balancer only helps if you have more than one server behind it. For high availability, run at least two servers in different availability zones.
:::
