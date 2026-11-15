---
title: "WordPress Site Down? Safe First Checks"
description: "A calm first-response checklist for a WordPress site that will not load, with ways to record symptoms and reduce the risk of making recovery harder."
date: "2026-11-14"
author: "Ark Web Services Editorial Team"
category: "wordpress-recovery"
targetKeyword: "WordPress site down"
tags: [WordPress, troubleshooting, recovery]
keyTakeaways:
  - "Record the exact symptom, time, and recent changes before troubleshooting."
  - "Check whether the issue affects one device, one page, or the whole site."
  - "Avoid repeated updates or cleanup until you understand the failure and have a safe recovery point."
faq:
  - question: "Should I keep refreshing a WordPress site that is down?"
    answer: "A small number of checks can help confirm the symptom, but repeated refreshing will not repair a server, plugin, or code problem. Record what you see and check from another connection or device."
  - question: "Should I update plugins while the site is broken?"
    answer: "Usually not as a first step. Document recent changes and confirm a restorable backup before changing site files or software."
atomicAnswer: "When a WordPress site is down, capture the exact error and time, check whether the outage is site-wide, note recent changes, and confirm a usable backup before making changes."
pillarSlug: "/wordpress-recovery/"
relatedSlugs: ["wordpress-recovery-mode-guide", "wordpress-plugin-conflict-checklist", "wordpress-update-stuck-maintenance-mode"]
---

A site outage creates pressure to try several fixes quickly. That can make it harder to learn what happened, especially when more than one person is changing settings or files. Start by gathering a reliable picture of the problem. The goal of first response is to narrow the cause and protect recovery options, not to guess at a fix.

## Describe the symptom precisely

Write down the page address, the time you first noticed the problem, and what happens when you visit. “The site is broken” is not specific enough to guide troubleshooting. Is the browser showing a server error, a blank page, a security warning, an unexpected redirect, or a WordPress message? Does the home page fail while the login page works? Can you access the site on a phone using cellular data?

Capture a screenshot and copy the full error text. If a customer reported it, ask what page they visited and what they were trying to do. A checkout failure, for example, has a different impact from an unavailable image. Note the time zone as well as the local time so a host can compare your report with server logs.

## Check the scope without changing the site

Try the affected page in a private browser window and on a second device or network. This can help separate a local browser or connection issue from a site-wide problem. Check a few distinct URLs: the home page, a page that normally works, and the WordPress login page. Do not repeatedly submit forms or place test orders on a live store without a plan; duplicate actions can create real records or payments.

If only one section fails, record the working and failing URLs. If the whole domain is unavailable, note whether the browser reports a connection or certificate problem, or whether it receives a web page with an error code. These observations do not prove the cause, but they give a developer or hosting provider more useful starting information.

## Make a short change timeline

List anything that changed shortly before the outage: a WordPress, theme, or plugin update; a new plugin; a code edit; a domain or DNS change; a hosting change; or a content import. Include who made the change and approximately when. WordPress’s troubleshooting guidance uses recent changes and error details to help isolate problems. A timeline also helps avoid undoing an unrelated change.

Do not assume that the most recent event caused the failure. Treat it as a lead to investigate. If you have access to the hosting control panel, check for a provider outage notice or resource alert, but avoid deleting files or changing server settings simply because they look unfamiliar.

## Protect a recovery point

Before a repair that changes files or data, find out whether a recent backup exists and what it contains. A website restoration may need both files and the database; a backup that cannot be restored is not much protection. Confirm the backup date, where it is stored, and whether it predates the suspected failure. WordPress documentation recommends regular backups as part of site maintenance and describes restoring from a backup as a recovery option.

If the site may have been compromised, do not overwrite evidence or casually restore an old backup before recording the symptoms. A compromised site may need a careful incident response. WordPress’s hacked-site guidance recommends documenting what you observe and preserving a backup before cleanup work.

## When to bring in help

Ask your host to investigate when the domain cannot connect, server resources are exhausted, or you need access to logs and backups. Ask a WordPress specialist when the failure followed an update, a plugin or theme is involved, the site shows signs of compromise, or the repair would require code or database changes. Share the exact error, timeline, affected URLs, and what you have already tried.

Keep one person responsible for coordinating changes. If a second person begins troubleshooting, make sure they know what has already been changed. This avoids conflicting edits and makes it easier to reverse a step if it makes the problem worse.

## A useful first-response checklist

1. Record the time, time zone, URL, and full message.
2. Check the page from another device or network.
3. Compare the home page, a known working page, and the login page.
4. List recent site, hosting, or domain changes.
5. Confirm the backup date and whether both files and database are included.
6. Pause risky changes until there is a clear next step.

The right repair depends on the symptoms and hosting setup. A disciplined first response reduces guesswork and gives whoever handles the repair a better chance of finding the cause.


## Related resources

Explore the [topic hub](/wordpress-recovery/) and these related guides:

- [Wordpress Recovery Mode Guide](/posts/wordpress-recovery-mode-guide/)
- [Wordpress Plugin Conflict Checklist](/posts/wordpress-plugin-conflict-checklist/)
- [Wordpress Update Stuck Maintenance Mode](/posts/wordpress-update-stuck-maintenance-mode/)

Official WordPress documentation covers this workflow in its [troubleshooting guidance](https://wordpress.org/documentation/article/faq-troubleshooting/) and related support articles.
### Sources

- [WordPress FAQ: Troubleshooting](https://wordpress.org/documentation/article/faq-troubleshooting/)
- [WordPress site maintenance](https://wordpress.org/documentation/article/wordpress-site-maintenance/)
- [WordPress FAQ: My site was hacked](https://wordpress.org/documentation/article/faq-my-site-was-hacked/)
