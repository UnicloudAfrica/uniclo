---
title: Load Balancers
subtitle: Distribute incoming traffic across multiple servers so no single server gets overwhelmed. Think of a load balancer as a receptionist directing visitors to whichever desk is least busy.
prev: { label: Security Groups, href: /admin-dashboard/docs/security-groups }
next: { label: DNS Zones, href: /admin-dashboard/docs/dns }
---

:::step{number=1 icon=Scale title="View All Load Balancers" navigation="Sidebar > Networking > Load Balancers"}
The load balancers page shows all load balancers across your platform. Each one distributes traffic to a group of backend servers. You can see the name, status, type, and how many targets are attached.
:::

:::screenshot{caption="Your Load Balancers list"}
:::

:::step{number=2 icon=Plus title="Create a Load Balancer" navigation="Sidebar > Networking > Load Balancers > Create"}
Click create to set up a new load balancer. Choose the VPC, select the subnets, configure listeners (which ports to listen on), and define the target group (which instances should receive traffic).
:::

:::step{number=3 icon=HeartPulse title="Health Checks" navigation="Click any load balancer > Health Checks"}
Load balancers regularly check if backend servers are healthy. If a server stops responding, the load balancer automatically stops sending traffic to it. You can configure the health check path, interval, and thresholds.
:::

:::step{number=4 icon=Target title="Target Groups" navigation="Click any load balancer > Target Groups"}
Target groups define which instances receive traffic from the load balancer. You can add or remove instances from a target group at any time — like adding or removing desks from the receptionist's list.
:::

:::callout{type=tip}
Always configure health checks when setting up a load balancer. Without them, traffic may be sent to unhealthy servers, causing errors for your users.
:::
