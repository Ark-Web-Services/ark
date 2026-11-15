# Lead capture operations

Apply `db/migrations/0001_leads.sql` to each fresh D1 database before enabling inquiries. This migration defines the initial lead schema, including request fingerprints and the leased outbox. Configure `business.config.ts` with `enabled`, `name`, `email`, `services`, and `inquiries: { enabled, endpoint, successMessage, turnstileSiteKey }`. A service option with id `other` is accepted for write-in inquiries.

Set `DB`, `ADMIN_API_TOKEN`, `TURNSTILE_SECRET_KEY`, `EMAIL_API_KEY`, `EMAIL_FROM`, and `LEAD_NOTIFICATION_EMAIL` as Worker bindings/secrets. Deployed non-loopback environments also require `LEAD_RATE_LIMIT_SALT` and Cloudflare's `CF-Connecting-IP`; intake returns 503 if either is missing. The salt is combined with each IP before SHA-256 hashing. Raw IP addresses are never stored. Rate rows older than two hours are deleted in bounded batches by the outbox runner. Local Turnstile bypass works only when `LEADS_ALLOW_UNVERIFIED_LOCAL=true`, `ENVIRONMENT` is not `production`, and the request host is localhost.

The public `POST /api/inquiries` accepts JSON or URL-encoded fields: `name` (120 chars), `email` (254), optional `phone` (40), `eventDate` (future YYYY-MM-DD), `location` (200), `guestCount` (1–100000), `budget` (80), `service` (100), `message` (4000), `consent=true` (JSON) or a checked HTML value (`yes`, `true`, or `on`), optional `source` and UTM values (120 each), and `cf-turnstile-response`. Other consent representations are rejected. Each field is rejected when it exceeds its limit; values are not silently truncated. Requests over 20 KB are rejected. Include an `idempotency-key` header or `idempotencyKey` field for safe client retries. A key is bound to the normalized payload: replaying it with different inquiry data returns 409. The honeypot field `website` is silently acknowledged when populated. The service allows five submissions per hashed client IP per minute.

Regular browser form posts that request `text/html` receive a safe HTML success/error page with a link back to contact and a mail link. JSON callers receive JSON results. Both response modes require an exact same-origin `Origin` header.

Admin endpoints require `Authorization: Bearer $ADMIN_API_TOKEN`. List leads and per-status counts with `GET /api/admin/leads?limit=50&offset=0`; optional `status` filters the list. Update a lead with `PATCH /api/admin/leads` and JSON `{"id":"...","status":"contacted"}`. Allowed statuses are `new`, `contacted`, `consultation`, `booked`, and `closed`. Advancing a lead from `new` cancels its pending owner reminder; the immediate owner notification and customer acknowledgment remain intact.

Call `POST /api/admin/follow-ups` from a protected scheduled Worker/Cron runner using the same bearer token. Each call claims at most 20 jobs with a one-minute lease, so concurrent invocations cannot claim a job twice. The queue contains an immediate owner notification, a customer acknowledgment, an owner reminder due 24 hours later, and an optional webhook job. Reminders are canceled when a lead advances from `new`. Delivery requests time out after ten seconds. Resend requests and webhook calls use stable outbox IDs for idempotency. Webhooks use `LEAD_WEBHOOK_URL` and `LEAD_WEBHOOK_SECRET`; the URL must be credential-free HTTPS. Requests include `x-lead-signature: sha256=<hex HMAC-SHA256>` over the exact JSON body.

Failed jobs retry with exponential backoff, capped at one day, for at most eight attempts; exhausted jobs become `dead`. Missing email/webhook configuration and provider failures remain visible in `lead_outbox.last_error`. Inspect dead jobs and correct the configuration/provider issue, then set `status='pending', attempts=0, due_at=<current ISO timestamp>` to retry. A delivery is marked sent only after a successful provider response. Jobs are stored atomically with the lead before intake returns success.

```sh
curl -X POST https://example.com/api/inquiries \
  -H 'origin: https://example.com' -H 'content-type: application/json' -H 'idempotency-key: website-form-12345678' \
  -d '{"name":"Avery Jones","email":"avery@example.com","service":"other","message":"Please share availability.","consent":true,"cf-turnstile-response":"TOKEN"}'

curl -H "Authorization: Bearer $ADMIN_API_TOKEN" https://example.com/api/admin/leads
curl -X POST -H "Authorization: Bearer $ADMIN_API_TOKEN" https://example.com/api/admin/follow-ups
```

Run the offline focused tests with `node --import tsx --test tests/leads.test.ts`. They use fake D1 statements and stubbed fetch; no real external requests are made. This workflow handles inquiry intake and follow-up only; it is not a general CRM or a marketing/nurture system.

Operator CLI: `npm run leads -- list`, `npm run leads -- status <id> contacted`, or `npm run leads -- deliver`. Set `ADMIN_API_TOKEN` and optionally `LEAD_SITE_URL` in the local operator environment; do not share terminal output containing inquiry details. The Drone `lead-follow-ups` pipeline calls the bounded delivery endpoint every five minutes after setup registers its cron. Supply the same admin token separately to the site's runtime.

Choose a retention period with each client. An operator can delete a requested lead from D1 with a parameterized `DELETE FROM leads WHERE id = ?`; the outbox rows cascade with it. Never place inquiry details in public source files or analytics events.
