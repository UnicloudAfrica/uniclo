---
title: Billing & Revenue
subtitle: This is where you track your money -- how much your clients are paying, what your revenue looks like, and how to set your own prices. Think of this as the financial dashboard for your cloud business.
prev: { label: Databases, href: /dashboard/docs/databases }
next: { label: Regions, href: /dashboard/docs/regions }
---

:::mermaid{caption="How billing works from usage to your payout"}
graph LR
A[Client Uses Services] --> B[Usage Tracked]
B --> C[Invoice Generated]
C --> D[Client Pays]
D --> E[Revenue Recorded]
E --> F[Your Payout]
:::

:::step{number=1 icon=TrendingUp title="Revenue Dashboard" navigation="Sidebar > Billing & Revenue > Revenue"}
See how your business is doing at a glance. Total revenue, payment trends, and breakdowns by client. This is your financial overview -- the big picture of your earnings.
:::

:::screenshot{caption="Your Revenue dashboard"}
:::

:::step{number=2 icon=DollarSign title="Pricing Overrides" navigation="Sidebar > Billing & Revenue > Price Settings"}
Set your own prices! The platform gives you base prices, but you can override them to set custom pricing for your clients. Want to charge more for premium support or offer discounts? Do it here.
:::

:::screenshot{caption="Your Pricing Overrides page"}
:::

:::callout{type=tip}
Your pricing overrides apply to all your clients by default. The difference between your cost and your selling price is your profit margin.
:::

:::step{number=3 icon=Calculator title="Pricing Calculator" navigation="Sidebar > Billing & Revenue > Pricing Calculator"}
Quickly calculate how much a specific setup will cost. Great for quoting clients before they commit.
:::

:::step{number=4 icon=FileText title="Generate Invoice" navigation="Sidebar > Billing & Revenue > Generate Invoice"}
Create manual invoices for custom charges or special services.
:::

:::step{number=5 icon=CreditCard title="Payment History" navigation="Sidebar > Billing & Revenue > Payment History"}
See every payment your clients have made -- amounts, dates, statuses, and payment methods.
:::

:::step{number=6 icon=Percent title="Tax Configuration" navigation="Sidebar > Billing & Revenue > Tax Configuration"}
Set up tax rates for different countries so invoices automatically include the correct tax.
:::

:::step{number=7 icon=Receipt title="Discounts" navigation="Sidebar > Billing & Revenue > Discounts"}
Create and manage discount rules for your clients. Offer percentage or fixed-amount discounts.
:::

:::step{number=8 icon=Banknote title="Payouts" navigation="Sidebar > Billing & Revenue > Payouts"}
Track the money coming to you from the platform. This shows your earnings and payout schedule.
:::

:::step{number=9 icon=Settings title="Billing Settings" navigation="Sidebar > Billing & Revenue > Billing Settings"}
Configure how billing works for your account -- payment methods, billing cycles, and notification preferences.
:::

## Resize & Proration

:::step{number=10 icon=ArrowUpDown title="How Resize Billing Works"}
When your clients upgrade or downgrade a resource (like changing an instance to a bigger size), the billing system automatically prorates the cost. This means clients only pay the difference for the time remaining in their current billing cycle -- not the full new price.

For example, if a client upgrades halfway through the month, they pay half the price difference for the remaining half-month. Fair and transparent.
:::

:::callout{type=info title="Database Resize Coming Soon"}
Database resize billing logic is ready, but the actual resize execution is still being built. Your clients will not be charged for a database resize until it can be fully carried out.
:::
