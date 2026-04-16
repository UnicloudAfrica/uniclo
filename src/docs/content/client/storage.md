---
title: Storage
subtitle: Store your files safely in the cloud. Think of it as a giant, infinitely expandable filing cabinet that you can access from anywhere in the world, at any time.
prev: { label: Networking, href: /client-dashboard/docs/networking }
next: { label: Databases, href: /client-dashboard/docs/databases }
---

:::step{number=1 icon=HardDrive title="What is Object Storage?" navigation="Sidebar > Infrastructure > Silo Storage"}
Object storage is a place to keep files -- documents, images, videos, backups, anything. Your files are organized into "buckets" (think of them as big folders or drawers).
:::

:::screenshot{caption="Your Object Storage page"}
:::

:::step{number=2 icon=FolderPlus title="Create a Bucket" navigation="Silo Storage > Create"}
A bucket is like a drawer in your filing cabinet. Give it a name that describes what you will store in it (like "website-images" or "backups"). Choose the region closest to you for the fastest access.
:::

:::step{number=3 icon=Upload title="Upload and Manage Files" navigation="Click on any bucket"}
Inside your bucket, you can upload files, create sub-folders, download files, and delete what you no longer need. It works just like the file browser on your computer.
:::

:::callout{type=tip}
Object storage is billed based on how much data you store and how much you transfer. To keep costs down, regularly clean up files you no longer need.
:::

:::step{number=4 icon=Camera title="Snapshots" navigation="Sidebar > Networking > Snapshots"}
A snapshot is a photograph of your server's disk at a specific moment. If something goes wrong later, you can restore from the snapshot and go back in time. It is like saving your game before a boss fight.
:::

:::screenshot{caption="Your Snapshots page"}
:::

:::step{number=5 icon=Image title="Images" navigation="Sidebar > Networking > Images"}
An image is a complete copy of a server -- the operating system and everything installed on it. You can use images to create new servers that are identical copies. Like using a cookie cutter to make the same shape every time.
:::

:::callout{type=info}
Snapshots save your data. Images save your entire server setup. Use snapshots for regular backups and images when you want to duplicate a server.
:::
