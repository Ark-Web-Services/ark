---
title: "Suspect a Hacked WordPress Site? A First-Response Checklist"
description: "What to document and preserve when a WordPress site may be compromised, plus practical guidance on backups, access, cleanup, and follow-up."
date: "2026-11-14"
author: "Ark Web Services Editorial Team"
category: "wordpress-recovery"
targetKeyword: "hacked WordPress site"
tags: [WordPress, security, incident response]
keyTakeaways:
  - "Record symptoms, timing, recent changes, and the hosting environment before cleanup."
  - "Preserve a backup or snapshot even if you suspect it contains malicious files."
  - "Cleanup should include finding the cause, updating software, and securing accounts—not only removing visible spam."
faq:
  - question: "Should I delete suspicious files immediately?"
    answer: "First document what you see and preserve a snapshot or backup. Unplanned deletion can remove evidence or break the site while leaving the entry point unresolved."
  - question: "Is restoring a backup enough after a hack?"
    answer: "Not necessarily. The compromise may have existed before the backup or may involve compromised credentials or hosting. Investigate how access occurred and secure the site after recovery."
atomicAnswer: "For a suspected WordPress compromise, document the symptoms and timeline, preserve a backup or snapshot, involve the host when needed, and treat cleanup, credential changes, updates, and root-cause review as part of recovery."
pillarSlug: "/wordpress-recovery/"
relatedSlugs: ["wordpress-site-down-first-checks", "wordpress-backup-restore-basics", "wordpress-update-stuck-maintenance-mode"]
---

Unexpected redirects, unfamiliar administrator accounts, injected links, browser warnings, or files you do not recognize can raise concern that a WordPress site has been compromised. Those symptoms deserve prompt attention, but panic-driven deletion can make recovery harder. Preserve what you can, document the evidence, and involve the hosting provider or a qualified incident responder when the issue is beyond your access or experience.

## Record what you observe

WordPress recommends documenting the incident as an early action. Note what you saw, when you first noticed it, the time zone, and any actions taken since. Save screenshots, error messages, affected page addresses, and examples of suspicious redirects or content. List recent plugin or theme installations, updates, code changes, and changes to hosting or domain settings.

Also record the hosting environment and who has administrative access. This information can help someone investigating the issue compare the symptoms with server activity and decide whether other services may be affected. Avoid posting credentials, private user data, or sensitive logs in a public support forum.

## Preserve a snapshot before cleanup

Make a backup or hosting snapshot before attempting removal, even if you suspect it contains malicious files. WordPress’s hacked-site guidance recommends creating a backup as part of the response. The snapshot can preserve evidence and provide a fallback if the cleanup damages the working site. Ask your host about its backup policy and how to preserve logs if needed.

Do not assume that the newest available backup is clean. If the attacker had access earlier, the compromise could be present in older copies. A restore may recover site availability, but without understanding how access was gained, the weakness could remain.

## Coordinate access and containment

Contact the hosting provider if the server may be affected, you need logs, or you cannot safely access the files. Depending on the symptoms, a professional may recommend limiting public access while investigating. Avoid making broad configuration changes without understanding their effects on the site and its data.

Review administrator accounts and access methods. WordPress guidance includes updating secret keys and changing passwords after cleanup. Coordinate credential changes carefully so legitimate administrators and integrations are not accidentally locked out. Use unique passwords and check whether the same credentials were used for other services.

## Treat cleanup as investigation, not just deletion

Malicious content may not be limited to the obvious page visitors see. WordPress points to possible areas to inspect, including core files, themes, plugins, and `.htaccess`. It also advises using the appropriate version when replacing WordPress files and warns against assuming that a simple dashboard reinstall will remove every added file. These are technical operations; if you are not comfortable with file access, ask a professional to handle them.

After cleanup, update WordPress, themes, and plugins to supported versions, then change passwords again as appropriate. Review how the attacker gained access: a vulnerable component, exposed credential, compromised host account, or another path. Close the underlying gap where possible. If the entry point is unknown, the same compromise may recur.

## Verify the recovery

Check the public site and administrative area after cleanup. Review important pages, forms, purchases, and account flows. Ask the host whether security alerts or unusual processes remain. Search for unexpected admin accounts and ensure known users still need their access. If browsers or search results displayed warnings, follow the relevant review or security process after the site is clean.

Keep a record of the recovery steps, dates, and software versions. Plan regular backups and a routine for updates and access review. WordPress’s maintenance guidance treats backups as part of ongoing site care; a crisis is a poor time to discover that backups are missing or cannot be restored.


## Related resources

Explore the [topic hub](/wordpress-recovery/) and these related guides:

- [Wordpress Site Down First Checks](/posts/wordpress-site-down-first-checks/)
- [Wordpress Backup Restore Basics](/posts/wordpress-backup-restore-basics/)
- [Wordpress Update Stuck Maintenance Mode](/posts/wordpress-update-stuck-maintenance-mode/)

Official WordPress documentation covers this workflow in its [troubleshooting guidance](https://wordpress.org/documentation/article/faq-troubleshooting/) and related support articles.
### Sources

- [WordPress FAQ: My site was hacked](https://wordpress.org/documentation/article/faq-my-site-was-hacked/)
- [WordPress site maintenance](https://wordpress.org/documentation/article/wordpress-site-maintenance/)
- [WordPress updating guide](https://wordpress.org/documentation/article/updating-wordpress/)
