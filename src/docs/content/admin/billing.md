---
title: Billing & Finance
subtitle: Track all the money flowing through your platform — payments coming in, payouts going out, and everything in between.
prev: { label: Pricing & Products, href: /admin-dashboard/docs/pricing }
next: { label: Compute, href: /admin-dashboard/docs/compute }
---

:::mermaid{caption="The billing lifecycle — from usage to payout"}
graph LR
A[Client Uses Service] --> B[Usage Tracked]
B --> C[Invoice Generated]
C --> D[Client Pays]
D --> E[Payment Recorded]
E --> F[Settlement]
F --> G[Tenant Payout]
:::

:::step{number=1 icon=CreditCard title="Payment Transactions" navigation="Sidebar > Billing & Pricing > Payment"}
This page shows every payment made on the platform. You can see who paid, how much, when, and the payment status (successful, pending, or failed). Click on any transaction to see the full details. Think of it as your cash register history.
:::

:::screenshot{caption="Your Payment transactions list"}
:::

:::step{number=2 icon=Wallet title="Wallet Management" navigation="Sidebar > Billing & Pricing > Wallet"}
The wallet system lets users prepay for services — like loading a gift card. You can see wallet balances, top-up history, and manage billing modes (prepaid vs. postpaid).
:::

:::step{number=3 icon=ArrowRightLeft title="Settlements" navigation="Sidebar > Billing & Pricing > Settlements"}
Settlements are the process of reconciling what tenants owe you vs. what they have earned. Think of it like balancing the books at the end of the month.
:::

:::step{number=4 icon=Receipt title="Payouts" navigation="Sidebar > Billing & Pricing > Payouts"}
Payouts are money going out to your tenants. When tenants earn revenue from their clients, you pay them their share. This page tracks all those outgoing payments.
:::

:::step{number=5 icon=Percent title="Tax Configuration" navigation="Sidebar > Billing & Pricing > Tax Configuration"}
Set up tax rates for different countries. When invoices are generated, the correct tax is automatically applied based on the customer's location. It is like setting up the sales tax rules for your store.
:::

:::screenshot{caption="Your Tax configuration page"}
:::

:::step{number=6 icon=FileText title="Generate Invoice" navigation="Sidebar > Billing & Pricing > Generate Invoice"}
Need to create a manual invoice? This tool lets you build one from scratch — pick the client, add line items, set the amount, and generate a professional invoice.
:::

:::callout{type=info}
Most invoices are generated automatically based on usage. The manual invoice tool is for special cases like custom services or one-time charges.
:::

## Resize Billing & Proration

:::step{number=7 icon=ArrowUpDown title="Resize Billing" navigation="Triggered when a client resizes a resource"}
When a client resizes an instance or database (upgrading to more CPU, RAM, or storage), the billing system automatically calculates the prorated cost -- the difference between what they are currently paying and the new price, adjusted for the remaining billing period.

The resize billing flow works like this:

1. Client requests a resize
2. System calculates the prorated amount
3. Client reviews and confirms the charge
4. Payment is processed
5. Resize is executed

This ensures clients are never overcharged or undercharged when changing plans mid-cycle.
:::

:::mermaid{caption="Resize billing flow"}
graph TD
A[Client requests resize] --> B[Calculate prorated cost]
B --> C[Show preview to client]
C --> D{Client confirms?}
D -->|Yes| E[Process payment]
E --> F[Execute resize]
D -->|No| G[No charge -- resize cancelled]
:::

:::callout{type=warning title="Managed Database Resize"}
Managed database resize billing is in place, but the confirm step is intentionally blocked until the runtime resize executor is implemented. This safety guard prevents charging clients for a resize that cannot yet be executed. Instance resize billing is fully operational.
:::
