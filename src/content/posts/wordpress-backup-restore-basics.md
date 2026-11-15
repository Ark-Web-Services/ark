---
title: "WordPress Backups: What to Save and How to Plan a Restore"
description: "A practical guide to WordPress backups, what a restore may involve, and the questions to answer before relying on a backup during recovery."
date: "2026-11-14"
author: "Ark Web Services Editorial Team"
category: "wordpress-recovery"
targetKeyword: "WordPress backup and restore"
tags: [WordPress, backups, maintenance]
keyTakeaways:
  - "Plan backups of both WordPress files and the database."
  - "Keep copies outside the same hosting account when possible and know who can restore them."
  - "Match backup timing to how often the site changes and the data that could be lost."
faq:
  - question: "Does a WordPress backup include everything?"
    answer: "It depends on the backup tool and configuration. Confirm whether the files and database are included, where copies are stored, and whether the backup can be restored."
  - question: "When should I back up WordPress?"
    answer: "WordPress documentation recommends making backups part of regular maintenance and before significant changes such as updates or migrations. How frequently to back up depends on the site's content and transactions."
atomicAnswer: "A useful WordPress recovery plan backs up both site files and the database on a schedule suited to how often the site changes, stores copies safely, and documents how to restore and verify them."
pillarSlug: "/wordpress-recovery/"
relatedSlugs: ["wordpress-site-down-first-checks", "wordpress-update-stuck-maintenance-mode", "wordpress-care-maintenance-checklist"]
---

A backup is useful only if it contains the information you need and can be restored when the site is under pressure. WordPress includes files such as themes, plugins, and media, along with a database that holds posts, settings, users, and other site content. A recovery plan should account for both, and it should explain how you will restore and verify the site.

## Decide what you need to protect

Make an inventory of the site’s moving parts: WordPress core, themes, plugins, uploaded media, database, custom code, and external services. The exact backup method varies by host and plugin, so check what each system includes. A database-only copy may not contain uploaded images or theme files. A files-only copy may omit posts, form submissions, settings, or orders.

If the site depends on services outside WordPress, such as a payment processor, email marketing system, or booking tool, find out how that service protects its own data. A WordPress backup may not include those external records.

## Set a schedule that fits site activity

The right frequency depends on how often the site changes and how much recent data you could afford to lose. A brochure site with infrequent edits has different needs from a store receiving orders every hour. Define the acceptable recovery point in plain terms: how much content or transaction history would be tolerable to recreate?

WordPress’s maintenance guidance recommends making backups a regular practice and backing up before changes such as updates, migrations, or significant content edits. Consider automated scheduled copies plus a deliberate backup before high-impact work. Confirm that scheduled jobs actually run and alert someone if they fail.

## Store copies with recovery in mind

Keep copies in a place that remains available if the website account itself becomes inaccessible. If every backup is stored in the same compromised or failed hosting environment, it may not help after an account-level incident. Ask your host where backups are stored, how long they are retained, and whether you can download or export them.

Record who can restore a backup, what credentials or approvals are needed, and how to contact the provider outside business hours if availability matters. Keep sensitive credentials secure and limit access to people who need it.

## Test the restore process

Do not wait for an outage to discover whether a backup is usable. If possible, restore a copy to a staging environment and check that pages, media, logins, and important forms work. A restoration can involve database and file versions that need to match. Ask the host or developer to explain what is included and what must be done after restore.

Before restoring an older snapshot to a live site, consider the data created since that snapshot. Orders, memberships, submissions, or appointments could be lost. A restore is not simply a visual reset; it can replace business records. Coordinate with the site owner and affected systems first.

## Backups and incident response

If you suspect a security compromise, preserve a snapshot before cleaning files, even if it may contain unwanted code. The snapshot can help an investigator understand what happened and provide a fallback. However, restoring an old copy alone may not remove the underlying cause. WordPress’s hacked-site guidance recommends documentation and investigation alongside recovery.

Keep a short log with backup dates, storage locations, what each copy contains, and any restore test. Review it whenever the hosting setup or backup tool changes. A plan that is current and understood is more dependable than a collection of files no one can identify.

## A backup review checklist

- Are both files and database included?
- How recent is the newest copy, and how often are copies made?
- Are copies accessible if the hosting account is unavailable?
- Who can restore them, and how do they request it?
- What customer or transaction data would an older restore replace?
- Has a restore been checked in a safe environment?


## Related resources

Explore the [topic hub](/wordpress-recovery/) and these related guides:

- [Wordpress Site Down First Checks](/posts/wordpress-site-down-first-checks/)
- [Wordpress Update Stuck Maintenance Mode](/posts/wordpress-update-stuck-maintenance-mode/)
- [Wordpress Care Maintenance Checklist](/posts/wordpress-care-maintenance-checklist/)

Official WordPress documentation covers this workflow in its [troubleshooting guidance](https://wordpress.org/documentation/article/faq-troubleshooting/) and related support articles.
### Sources

- [WordPress site maintenance](https://wordpress.org/documentation/article/wordpress-site-maintenance/)
- [How to back up your site](https://learn.wordpress.org/lesson/how-to-backup-your-site/)
- [WordPress FAQ: My site was hacked](https://wordpress.org/documentation/article/faq-my-site-was-hacked/)
