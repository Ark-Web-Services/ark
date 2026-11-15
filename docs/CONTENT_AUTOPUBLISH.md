# Bounded weekly content publishing

The Ark `weekly-content` Drone pipeline handles one queued article and one
queued lead page per run. It starts each output as a draft, records independent
fact-check/review receipts, and scopes promotion to the exact new paths and
hashes recorded for that Drone build. Existing drafts are never discovered or
promoted by scanning the content directories.

Before and after promotion, the pipeline runs content preflight, type checks,
the test suite, and an Astro build. It commits and pushes only the candidate
pages, their receipts, queue records, and the run manifest. The push must
succeed to Git `master`; the default Drone pipeline then rebuilds and deploys
the published content to the Cloudflare Pages production branch named `main`.
These are separate Git and Pages branch settings. Failed provider,
fact-check, scope, review, validation,
build, branch, or push gates stop the run before durable publication.

The pipeline uses the subscription-backed Codex CLI and has per-run call
limits. Paid API providers remain disabled. Article briefs are manually
researched queue entries; the job does not claim to measure search demand.
Each writer process is limited to six model requests, for at most twelve
requests across the two weekly writers.

## Activate after repository access is ready

Use the authenticated Drone CLI after verifying the correct Gitea repo mapping.
The repo must permit CI pushes to Gitea `master`. Configure a repository-scoped GitHub deploy key with write access to this Ark repository only as Drone secret `GITHUB_PUBLICATION_SSH_KEY`. The pipeline pins GitHub’s official Ed25519 host key and verifies that both GitHub and Gitea remain at the reviewed base before each normal push. Do not copy local SSH private keys or another project's Cloudflare credentials into this repo. If GitHub advances between preflight and push, the run fails without force; if GitHub succeeds but Gitea fails, reconcile the two refs with a reviewed fast-forward before retrying.

Drone starts from a detached commit SHA; the job reattaches that exact commit
to the configured Git branch before writing. This follows [Drone's documented
clone behavior](https://docs.drone.io/user-guide/pipeline/cloning/).

Required existing Drone secret names:

- `AGENT_CLI_HOST`
- `AGENT_CLI_SSH_KEY`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `GITHUB_PUBLICATION_SSH_KEY` (repository-scoped write deploy key for the Ark GitHub repository)

Register the six-field UTC cron only after the repo and push path are verified:

```sh
R='<owner>/<ark-repository>'
drone repo info "$R"
drone cron add "$R" weekly-content '0 0 6 * * 1' --branch master
drone cron info "$R" weekly-content
drone cron exec "$R" weekly-content
```

Verify the recorded expression and next-run time in Drone. The source file
alone does not activate or authenticate a cron.
