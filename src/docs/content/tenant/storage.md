---
title: Storage
subtitle: Store and manage files in the cloud. Think of object storage as a giant, infinitely expandable filing cabinet that you can access from anywhere.
prev: { label: Networking, href: /dashboard/docs/networking }
next: { label: Databases, href: /dashboard/docs/databases }
---

:::step{number=1 icon=HardDrive title="Object Storage Overview" navigation="Sidebar > Infrastructure > Silo Storage"}
Object storage lets you store files (documents, images, backups, anything) in the cloud. Files are organized into "buckets" -- think of buckets as drawers in your filing cabinet.
:::

:::screenshot{caption="Your Object Storage accounts"}
:::

:::step{number=2 icon=FolderPlus title="Create a Bucket" navigation="Silo Storage > Create"}
Click "Create" to make a new bucket. Give it a name and choose the region where the data will be stored. Once created, you can start uploading files immediately.
:::

:::step{number=3 icon=Upload title="Manage Files" navigation="Click on any bucket"}
Inside a bucket, you can upload files, create folders, download files, and delete things you no longer need. The file browser works like the file explorer on your computer.
:::

:::callout{type=tip}
Object storage is great for backups, media files, and static website assets. It is designed to store large amounts of data at a low cost.
:::

:::step{number=4 icon=Camera title="Snapshots" navigation="Sidebar > Networking > Snapshots"}
Snapshots are point-in-time copies of a server's disk. If you accidentally delete something or need to go back to an earlier state, you can restore from a snapshot.
:::

:::step{number=5 icon=Image title="Images" navigation="Sidebar > Networking > Images"}
Images are complete server blueprints -- the operating system and all installed software. Use them as templates to create new servers that are identical to existing ones.
:::
