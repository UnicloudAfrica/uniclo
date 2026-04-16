---
title: Security Groups
subtitle: Manage firewall rules that control traffic to and from your instances. Security groups are like bouncers at the door — they decide who gets in and who stays out.
prev: { label: VPCs, href: /admin-dashboard/docs/vpcs }
next: { label: Load Balancers, href: /admin-dashboard/docs/load-balancers }
---

:::step{number=1 icon=Shield title="View All Security Groups" navigation="Sidebar > Networking > Security Groups"}
The security groups page lists all firewall rule sets on your platform. Each security group contains inbound rules (who can come in) and outbound rules (who can go out). They are attached to instances to control network access — like assigning a bouncer to each door.
:::

:::screenshot{caption="Your Security Groups list"}
:::

:::step{number=2 icon=Plus title="Create a Security Group" navigation="Sidebar > Networking > Security Groups > Create"}
Click create to set up a new security group. Give it a name, select the VPC it belongs to, and start adding rules. Each rule specifies a protocol (TCP, UDP), a port range, and which IP addresses are allowed.
:::

:::step{number=3 icon=ListChecks title="Manage Inbound & Outbound Rules" navigation="Click any security group > Rules tab"}
Click on a security group to view and edit its rules. Inbound rules control incoming traffic (for example, allowing SSH on port 22 or HTTP on port 80). Outbound rules control what traffic the instance can send out.
:::

:::step{number=4 icon=Link title="Attach to Instances" navigation="Click any security group > Instances tab"}
A security group does nothing until it is attached to an instance. You can attach the same security group to multiple instances — like having the same bouncer rules at every door in your building.
:::

:::callout{type=info}
Security groups are stateful — if you allow inbound traffic on a port, the response traffic is automatically allowed out. You do not need to create a separate outbound rule for responses.
:::
