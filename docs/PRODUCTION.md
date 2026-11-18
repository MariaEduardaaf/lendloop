# What I would change to run this in production

The local setup favors a reviewer who wants everything running in ten minutes. These are the
changes I would make before real neighbors used it, most important first.

## Reliability of the automation

- **An outbox with reconciliation.** Today an event exists only as a scheduled action until n8n
  reports its result, and both Convex (actions run at most once) and n8n (it acknowledges before
  sending) can drop it in a crash. Convex should write each event to an outbox table in the same
  mutation that changes the loan, and a periodic job should resend or alert on events that have no
  result after a few minutes.
- **Retry failed e-mails over a longer window.** Three quick tries cover a blip, not an outage.
  A queue with backoff over hours, or a mail provider that queues for you, covers the rest.
- **n8n in queue mode.** Postgres instead of SQLite, Redis, separate webhook and worker processes,
  so a restart does not lose in-flight runs and webhooks keep answering during deploys.
- **Alert on failures.** The error workflow should also page or post to a channel. Add a heartbeat
  for the daily reminder so a schedule that stops running is noticed.
- **Deploy workflows from source control in CI**, not by importing on container start.

## Secrets and access

- **A secrets manager** (AWS Secrets Manager or similar) instead of env files, with rotation. To
  rotate without downtime the receivers would accept both the current and the previous secret for
  a short window. The code accepts one secret today.
- **Stop exposing the environment to n8n nodes.** Move the HMAC secrets to n8n credentials or
  external secrets and turn `N8N_BLOCK_ENV_ACCESS_IN_NODE` back on.
- **n8n behind TLS and SSO**, not reachable from the internet except for the webhook path. Restrict
  the webhook by source address where possible and rate limit it.
- **Rate limits** on the Convex HTTP endpoints and on the mutations a user can spam (requests, listings).

## Identity and roles

- Clerk production instance, verified e-mail required, MFA required for admins.
- Roles managed in one place with an approval step and an audit trail that names the operator.
  Today a role change from the CLI is logged without an actor.
- A reduced JWT template: the app reads only the first name and the e-mail.

## Privacy and data

- **Keep less in n8n.** Save execution data only for failed runs and prune it quickly. Successful
  runs hold first names and e-mail addresses.
- **Retention rules** for automation events, workflow errors and the audit log.
- **Account deletion and export**, including what happens to open loans.
- **Notification preferences** and an unsubscribe path. Real sending domain with SPF, DKIM and
  DMARC, plus bounce handling.

## Product and code

- Time zones per neighborhood instead of UTC dates.
- Pagination and search instead of capped lists.
- End-to-end browser tests for the main flows, and CI running lint, typecheck, tests and build.
- Error monitoring and structured logs that never contain personal data.
- Pinned image digests, dependency scanning, automated updates.
- Backups and a tested restore for Convex data and the n8n database.
