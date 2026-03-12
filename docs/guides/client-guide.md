# UniCloud Africa -- Client User Guide

This guide is for end-user clients who use the UniCloud Africa platform (or a tenant's white-labelled platform) to manage cloud infrastructure.

---

## Table of Contents

1. [Signing Up](#1-signing-up)
2. [Signing In](#2-signing-in)
3. [Dashboard Overview](#3-dashboard-overview)
4. [Projects](#4-projects)
5. [Launching an Instance](#5-launching-an-instance)
6. [Managing Instances](#6-managing-instances)
7. [VPC and Networking](#7-vpc-and-networking)
8. [Object Storage](#8-object-storage)
9. [Billing and Wallet](#9-billing-and-wallet)
10. [Getting Support](#10-getting-support)
11. [Account Settings](#11-account-settings)

---

## 1. Signing Up

### Registration

1. Navigate to `/sign-up` on your provider's domain (e.g. `yourprovider.unicloudafrica.com/sign-up`).
2. Fill in your details:
   - Full name
   - Email address
   - Password (choose a strong password)
3. Click **Sign Up**.

### Email Verification

1. Check your email for a verification OTP (one-time password).
2. You will be redirected to the verification page (`/verify-mail`).
3. Enter the OTP code from your email.
4. Click **Verify**.
5. Upon successful verification, your account is activated and you can sign in.

If you did not receive the OTP, click the **Resend OTP** button to request a new code.

---

## 2. Signing In

1. Navigate to `/sign-in` on your provider's domain.
2. Enter your email address and password.
3. Click **Sign In**.
4. If two-factor authentication (2FA) is enabled on your account, you will be prompted to enter your verification code.
5. You are redirected to the client dashboard at `/client-dashboard`.

### Forgot Password

1. Click the **Forgot Password** link on the sign-in page.
2. You will be taken to `/forgot-password`.
3. Enter your email address and click **Submit**.
4. Check your email for a password reset OTP.
5. Navigate to `/reset-password`, enter the OTP and your new password.
6. Your password is now updated. Sign in with your new credentials.

---

## 3. Dashboard Overview

**Path**: `/client-dashboard`

The client dashboard is your central hub for managing all cloud resources. The sidebar provides navigation to:

- **Dashboard** -- Overview with resource summaries and quick-start actions
- **Projects** -- Organise your resources into projects
- **Instances** -- Manage compute instances
- **Object Storage** -- Manage storage buckets and files
- **Infrastructure** -- VPC, networking, security, and DNS
- **Billing** -- View charges, payments, and wallet balance
- **Support** -- Get help from your provider
- **Account Settings** -- Manage your profile and security

The dashboard page shows key metrics at a glance:

- Number of active instances
- Total storage usage
- Recent activity
- Quick-launch buttons

---

## 4. Projects

**Path**: `/client-dashboard/projects`

Projects are organisational containers that group related resources (instances, storage, networks) together.

### Viewing Projects

The projects page lists all your projects with their name, region, instance count, and creation date.

### Creating a Project

1. Navigate to `/client-dashboard/projects/create`.
2. Enter a project name and description.
3. Select the target region for the project.
4. Click **Create**.

### Project Details

Click on a project to navigate to `/client-dashboard/projects/details` where you can view:

- All instances within the project
- Network resources (VPCs, subnets)
- Storage accounts
- Resource usage summary

---

## 5. Launching an Instance

**Path**: `/client-dashboard/instances/provision`

The instance provisioning wizard walks you through launching a new virtual machine step by step.

### Step 1: Select Region and Project

- Choose the cloud region where your instance will run.
- Select an existing project or create a new one to contain the instance.

### Step 2: Choose an Operating System

- Browse available templates (e.g. Ubuntu 22.04, CentOS 9, Windows Server 2022, Debian 12).
- Templates can be viewed at `/client-dashboard/templates`.
- Select the OS that fits your workload.

### Step 3: Configure Resources

Choose the size of your instance:

- **vCPU** -- Number of virtual CPU cores
- **RAM** -- Memory allocation (GB)
- **Root Disk** -- Storage size and type (SSD/HDD)

Pre-configured instance types may be available for common workloads (small, medium, large, etc.).

### Step 4: Networking

- **VPC** -- Select an existing VPC or create a new one (your isolated virtual network).
- **Subnet** -- Choose a subnet within the VPC.
- **Security Group** -- Select firewall rules to apply (controls inbound/outbound traffic).
- **Elastic IP** -- Optionally assign a static public IP address.

### Step 5: SSH Key Pair

- Select an existing SSH key pair for secure remote access.
- Or create a new key pair -- the private key will be provided for download. Keep this file safe; it cannot be retrieved again.
- Key pairs are managed at `/client-dashboard/infrastructure/key-pairs`.

### Step 6: Review and Launch

- Review the full configuration and estimated cost.
- Click **Launch Instance**.
- The instance begins provisioning. You can track its status on the instances page.

You can also create instances from `/client-dashboard/instances/create` or use the quick launch at `/client-dashboard/launch`.

---

## 6. Managing Instances

**Path**: `/client-dashboard/instances`

### Instance List

View all your instances with their:

- Name and ID
- Status (running, stopped, provisioning, terminated)
- Region
- IP address (private and public)
- Resource specs (vCPU, RAM)
- Uptime

### Instance Details

Click on any instance to view detailed information at `/client-dashboard/instances/details`:

- **Overview** -- Status, uptime, creation date
- **Resources** -- vCPU, RAM, disk allocation
- **Networking** -- Private IP, public IP, VPC, subnet, security groups
- **Console** -- Access the instance console directly in the browser

### Instance Actions

From the instance detail page, you can perform the following actions:

| Action | Description |
|--------|-------------|
| **Start** | Boot a stopped instance. The instance resumes with its previous configuration. |
| **Stop** | Gracefully shut down a running instance. The instance retains its data and can be started again. Charges for compute may stop, but storage charges continue. |
| **Reboot** | Restart the instance. Equivalent to shutting down and immediately starting again. |
| **Console** | Open a browser-based console connection (VNC) to the instance for direct access without SSH. |
| **Terminate** | Permanently delete the instance and its root disk. This action cannot be undone. |

---

## 7. VPC and Networking

Your cloud resources run inside Virtual Private Clouds (VPCs). All networking resources are managed under `/client-dashboard/infrastructure/`.

### Key Concepts

- **VPC**: An isolated virtual network. All instances must run inside a VPC.
- **Subnet**: A segment of a VPC's IP range. Instances are assigned to subnets.
- **Security Group**: A virtual firewall that controls inbound and outbound traffic to instances.
- **Elastic IP**: A static public IP address that can be attached to instances.
- **Key Pair**: An SSH public/private key pair used for secure instance access.

### Networking Resources

| Resource | Path | Description |
|----------|------|-------------|
| Key Pairs | `/client-dashboard/infrastructure/key-pairs` | SSH keys for instance access |
| Subnets | `/client-dashboard/infrastructure/subnets` | Network segments within your VPCs |
| Security Groups | `/client-dashboard/infrastructure/security-groups` | Firewall rule groups |
| Security Group Rules | `/client-dashboard/infrastructure/security-group-rules` | Individual firewall rules |
| Elastic IPs | `/client-dashboard/infrastructure/elastic-ips` | Static public IP addresses |
| NAT Gateways | `/client-dashboard/infrastructure/nat-gateways` | Outbound internet access for private subnets |
| Route Tables | `/client-dashboard/infrastructure/route-tables` | Network routing rules |
| Network ACLs | `/client-dashboard/infrastructure/network-acls` | Subnet-level access controls |
| VPC Peering | `/client-dashboard/infrastructure/vpc-peering` | Connect two VPCs together |
| Network Interfaces | `/client-dashboard/infrastructure/network-interfaces` | Virtual NICs |
| DNS Management | `/client-dashboard/infrastructure/dns` | Domain name configuration |
| Snapshots | `/client-dashboard/infrastructure/snapshots` | Point-in-time disk backups |
| Images | `/client-dashboard/infrastructure/images` | Custom machine images |
| Auto Scaling | `/client-dashboard/infrastructure/autoscaling` | Automatic instance scaling |

### Common Networking Tasks

**Allow SSH access to an instance:**
1. Go to Security Groups.
2. Select (or create) a security group.
3. Add an inbound rule: Protocol TCP, Port 22, Source 0.0.0.0/0 (or your IP for better security).

**Assign a public IP:**
1. Go to Elastic IPs.
2. Allocate a new elastic IP.
3. Associate it with your instance.

**Create a snapshot (backup):**
1. Go to Snapshots.
2. Click Create Snapshot.
3. Select the volume to back up.
4. The snapshot can later be used to restore or create new volumes.

---

## 8. Object Storage

**Path**: `/client-dashboard/object-storage`

Object storage provides S3-compatible storage for files, backups, media, and static assets.

### Viewing Storage Accounts

The object storage page lists your storage accounts with usage statistics.

### Purchasing Storage

Navigate to `/client-dashboard/object-storage/purchase` to purchase a new storage allocation. Select the storage tier and capacity you need.

### Creating a Storage Account

Navigate to `/client-dashboard/object-storage/create` to create a new storage account within your purchased allocation.

### Managing Storage

Navigate to `/client-dashboard/object-storage/:accountId` to manage a specific storage account:

- **Buckets**: Create and manage storage buckets (containers for your files).
- **Objects**: Upload, download, and delete files within buckets.
- **Access**: Configure bucket policies and access permissions.
- **Usage**: Monitor storage consumption and bandwidth usage.

---

## 9. Billing and Wallet

### Billing Overview

**Path**: `/client-dashboard/billing`

The billing page shows:

- Current balance and outstanding charges
- Active subscriptions and their costs
- Payment method management
- Billing cycle information

### Payment History

**Path**: `/client-dashboard/orders-payments`

View all past transactions including:

- Payments made
- Invoice details
- Payment methods used
- Transaction dates and amounts

### Pricing Calculator

**Path**: `/client-dashboard/pricing-calculator`

Use the calculator to estimate costs before provisioning resources. Configure different combinations of:

- Instance types and quantities
- Storage volumes
- Network resources (elastic IPs, load balancers)
- Object storage capacity

The calculator shows a monthly cost estimate based on your provider's pricing.

### Payment Methods

From the billing page, you can:

- Add a new payment method (card via Paystack integration)
- Set a default payment method
- Remove saved payment methods

### Wallet Top-Up

If your provider uses a wallet/prepaid model:

1. Navigate to the billing page.
2. Click **Top Up** or **Add Funds**.
3. Enter the amount.
4. Complete the payment via your saved payment method or a new card.
5. Your wallet balance updates immediately.

---

## 10. Getting Support

**Path**: `/client-dashboard/support`

### Viewing Tickets

The support page lists all your support tickets with their:

- Subject
- Status (open, in-progress, resolved, closed)
- Priority
- Last updated date

### Creating a Ticket

1. Click **New Ticket** on the support page.
2. Enter a subject that summarises your issue.
3. Select a priority level.
4. Describe your issue in detail in the message body.
5. Click **Submit**.

### Ticket Details

Click on a ticket to navigate to `/client-dashboard/support/:id` where you can:

- View the full conversation history
- Post follow-up messages
- See status updates
- View any attached files or screenshots

### Tips for Effective Support Requests

- Include the instance ID or resource name related to your issue.
- Describe what you expected to happen vs. what actually happened.
- Include any error messages you received.
- Mention the region and project where the issue occurred.

---

## 11. Account Settings

**Path**: `/client-dashboard/account-settings`

### Profile Settings

Update your personal information:

- Name
- Email address
- Profile picture / avatar

### Password Change

1. Enter your current password.
2. Enter and confirm your new password.
3. Click **Update Password**.

### Two-Factor Authentication (2FA)

For enhanced account security:

**Enabling 2FA:**
1. Navigate to account settings.
2. Find the Two-Factor Authentication section.
3. Click **Enable 2FA**.
4. Scan the QR code with your authenticator app (e.g. Google Authenticator, Authy).
5. Enter the verification code from your authenticator app.
6. 2FA is now active. You will need to enter a code from your authenticator app each time you sign in.

**Disabling 2FA:**
1. Navigate to account settings.
2. Click **Disable 2FA**.
3. Enter a current verification code from your authenticator app to confirm.
4. 2FA is removed from your account.

---

## Quick Reference -- Client Routes

| Action | Path |
|--------|------|
| Sign up | `/sign-up` |
| Sign in | `/sign-in` |
| Verify email | `/verify-mail` |
| Forgot password | `/forgot-password` |
| Reset password | `/reset-password` |
| Dashboard | `/client-dashboard` |
| Projects | `/client-dashboard/projects` |
| Create Project | `/client-dashboard/projects/create` |
| Project Details | `/client-dashboard/projects/details` |
| Instances | `/client-dashboard/instances` |
| Instance Details | `/client-dashboard/instances/details` |
| Create Instance | `/client-dashboard/instances/create` |
| Provision Instance | `/client-dashboard/instances/provision` |
| Quick Launch | `/client-dashboard/launch` |
| Templates | `/client-dashboard/templates` |
| Object Storage | `/client-dashboard/object-storage` |
| Purchase Storage | `/client-dashboard/object-storage/purchase` |
| Create Storage | `/client-dashboard/object-storage/create` |
| Storage Detail | `/client-dashboard/object-storage/:accountId` |
| Key Pairs | `/client-dashboard/infrastructure/key-pairs` |
| Subnets | `/client-dashboard/infrastructure/subnets` |
| Security Groups | `/client-dashboard/infrastructure/security-groups` |
| Elastic IPs | `/client-dashboard/infrastructure/elastic-ips` |
| NAT Gateways | `/client-dashboard/infrastructure/nat-gateways` |
| Route Tables | `/client-dashboard/infrastructure/route-tables` |
| Network ACLs | `/client-dashboard/infrastructure/network-acls` |
| VPC Peering | `/client-dashboard/infrastructure/vpc-peering` |
| Network Interfaces | `/client-dashboard/infrastructure/network-interfaces` |
| DNS Management | `/client-dashboard/infrastructure/dns` |
| Snapshots | `/client-dashboard/infrastructure/snapshots` |
| Images | `/client-dashboard/infrastructure/images` |
| Auto Scaling | `/client-dashboard/infrastructure/autoscaling` |
| Pricing Calculator | `/client-dashboard/pricing-calculator` |
| Billing | `/client-dashboard/billing` |
| Orders and Payments | `/client-dashboard/orders-payments` |
| Support | `/client-dashboard/support` |
| Ticket Detail | `/client-dashboard/support/:id` |
| Account Settings | `/client-dashboard/account-settings` |
