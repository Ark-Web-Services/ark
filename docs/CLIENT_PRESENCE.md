# Client presence handoff

Run `npm run client:presence` to create `client/presence/presence.json` and `presence.md`. The files are editable planning materials generated from `business.config.ts`. Use `--out <directory>` to choose another destination.

The output starts in draft status. The config currently contains instructional sample details, so its listings and social ideas are not publishable. Replace those values with facts approved by the business owner first. Verify the name, contact email, location and service areas, service names and descriptions, website, and social links against owner-provided records. The generator flags whether the config appears ready, but it cannot establish that a fact is true.

The profile handoff covers Google Business Profile, The Knot/WeddingPro, Zola, Eventective, Style Me Pretty, and PartySlate. For each profile, a human must confirm account access, collect approved assets and permissions, check the current public URL and profile fields, review facts, publish manually, and verify the resulting listing. Some directories may require a qualifying business account or have changed their profile offering; check the current provider site before relying on it.

The four-week Instagram and TikTok queue is a set of editable hooks, caption outlines, shot lists, and calls to action based on configured service names. Every item explicitly requires real project footage supplied by a person with appropriate client, venue, and vendor permissions. The generator does not invent weddings, testimonials, client names, outcomes, or project imagery. Edit each draft and attach the actual approved media before considering it ready.

To explicitly approve an edited queue item after owner review, run:

```sh
npm run client:presence -- --approve instagram-week-1-wedding-planning --source "Owner reviewed copy and media permissions on 2026-10-23"
```

Approval is stored in the JSON queue with the time, review source, content hash, and a snapshot. Treat JSON as the approval record; Markdown is a working handoff and does not mirror later approval changes. Approval is a record of a human review; it does not verify external truth or publish anything. If the item content later changes, reapproval detects and clears the stale approval. Regenerating with `--force` replaces both packet files with fresh drafts and clears prior approvals. Without `--force`, the command refuses to overwrite existing files so manual edits are protected.

This tool has no profile integrations, account logins, messaging, publication, or video production. Account access and all external delivery remain separate manual work.
