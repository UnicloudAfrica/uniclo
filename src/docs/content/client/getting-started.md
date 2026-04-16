---
title: Getting Started
subtitle: Your very first steps -- from zero to running your own cloud server.
prev: { label: Home, href: /client-dashboard/docs }
next: { label: Compute & Instances, href: /client-dashboard/docs/compute }
---

:::callout{type=info title="No experience needed!"}
This guide assumes you have never used a cloud platform before. We will walk through every single click together. Think of this like setting up a new phone -- it might look complicated at first, but once you do it once, it all makes sense.
:::

:::mermaid{caption="Your journey from sign-in to running your first server"}
graph LR
A[Sign In] --> B[Verify Email]
B --> C[Explore Dashboard]
C --> D[Create Project]
D --> E[Launch Instance]
style A fill:#288DD1,color:#fff
style B fill:#288DD1,color:#fff
style C fill:#288DD1,color:#fff
style D fill:#288DD1,color:#fff
style E fill:#288DD1,color:#fff
:::

## Signing In

Signing in is just like logging into your email or social media account. You need two things: your email address and your password. If your organization gave you an account, they should have sent you these details.

:::step{number=1 icon=LogIn title="Go to the login page"}
Open your web browser (Chrome, Firefox, Safari -- any will work) and go to the address your organization provided. You will see a login screen with two boxes: one for your email and one for your password.
:::

:::step{number=2 icon=MousePointerClick title="Enter your credentials and click Sign In"}
Type your email address in the first box and your password in the second box. Then click the **Sign In** button. If you forgot your password, click the **Forgot Password** link and follow the instructions to reset it.
:::

:::screenshot{caption="The login screen where you enter your email and password"}
:::

:::callout{type=tip title="Don't worry!"}
If you type your password wrong, nothing bad happens. You can try again. After several failed attempts the system may ask you to wait a moment before trying again -- this is just to keep your account safe.
:::

## Verifying Your Email

After signing in for the first time, you may be asked to verify your email. This is like confirming your mailing address -- it proves that you really own that email account and helps keep your account secure.

:::step{number=1 icon=MailCheck title="Check your inbox"}
Open your email (Gmail, Outlook, etc.) and look for a message from the platform. It will contain a verification link or a short code.
:::

:::step{number=2 icon=CheckCircle title="Click the link or enter the code"}
Click the link in the email, or go back to the dashboard and type in the code. Once verified, you are all set!
:::

:::callout{type=info title="Can't find the email?"}
Check your spam or junk folder. Sometimes verification emails end up there. If you still cannot find it, click the **Resend** button on the verification page.
:::

## Your First Look at the Dashboard

Welcome! You are now inside your cloud dashboard. Think of this as the cockpit of an airplane -- it might look like a lot of buttons, but you only need a few to get started. Let us take a quick tour.

:::step{number=1 icon=LayoutDashboard title="The main dashboard" navigation="Dashboard (the page you land on after login)"}
This is your home base. You will see a summary of everything you have: how many servers are running, how much storage you are using, and any recent activity. Right now it might look empty -- and that is perfectly fine! We are about to fill it up.
:::

:::step{number=2 icon=Eye title="The sidebar (left menu)"}
On the left side of the screen, you will see a menu with different sections like **Infrastructure**, **Billing**, and **Support**. This is how you navigate around. Think of it like the table of contents in a book -- click any item to jump to that section.
:::

:::screenshot{caption="Your dashboard home page -- your cloud command center"}
:::

:::callout{type=tip title="You can't break anything!"}
Feel free to click around and explore. Just looking at pages will never cost you anything or change your settings. The only time something happens is when you click a button that says **Create**, **Launch**, or **Delete**.
:::

## Creating Your First Project

A **project** is like a folder on your computer. It keeps your servers, networks, and storage organized. Before you can launch anything, you need at least one project. Think of it as renting an apartment -- the project is the apartment, and everything you put inside it is your furniture.

:::step{number=1 icon=FolderPlus title="Go to Projects" navigation="Sidebar > Infrastructure > Projects"}
In the left sidebar, click on **Infrastructure** and then **Projects**. You will see a page listing all your projects (it will be empty right now).
:::

:::step{number=2 icon=MousePointerClick title="Click Create Project"}
Click the **Create Project** button. A form will appear asking you for a name and an optional description. Pick any name you like -- for example, "My First Project" or "Test Project". Then click **Create**.
:::

:::screenshot{caption="The create project form -- just give it a name and you're done!"}
:::

:::callout{type=tip title="Naming tip"}
You can rename your project later, so do not overthink the name. Something simple like "Development" or "My Website" works great.
:::

## Launching Your First Instance

An **instance** (also called a server) is your own personal computer in the cloud. It is just like the computer sitting on your desk, except it lives in a secure data center and you access it over the internet. Launching one is like ordering a brand new computer that is ready to use in seconds!

:::step{number=1 icon=Rocket title="Open the provisioning wizard" navigation="Sidebar > Infrastructure > Instances > Provision Instance"}
Navigate to **Instances** in the sidebar and click **Provision Instance**. A step-by-step wizard will open to guide you through the process.
:::

:::step{number=2 icon=MousePointerClick title="Choose your project"}
Select the project you just created from the dropdown. This tells the system which "folder" to put your new server in.
:::

:::step{number=3 icon=MousePointerClick title="Pick a template"}
Choose an operating system template (like Ubuntu or Windows). If you are not sure, Ubuntu is a great choice for beginners -- it is free and widely used.
:::

:::step{number=4 icon=MousePointerClick title="Select a size"}
Pick how powerful you want your server to be. Smaller sizes cost less and are perfect for learning. You can always upgrade later.
:::

:::step{number=5 icon=CheckCircle title="Review and launch"}
Double-check your choices on the review screen. You will see the estimated cost. When you are happy, click **Launch**. Your server will be ready in just a few moments!
:::

:::screenshot{caption="The provisioning wizard walks you through each step"}
:::

:::callout{type=tip title="Congratulations!"}
You just launched your very first cloud server! You can now see it in your instances list. From there you can start it, stop it, restart it, or connect to it. Take a moment to celebrate -- you are officially a cloud user!
:::

## What's Next?

Now that you have your first server up and running, here are some great next steps:

- Learn more about **managing your instances** in the Compute guide
- Set up **networking** to control who can access your server
- Explore **storage** options to save files and backups
- Check the **billing** section to understand your costs
