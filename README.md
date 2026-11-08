# INTGETION Contacts Service

Candidate contacts for INTGETION JOB LIST: email, phone (E.164), Telegram, LinkedIn and website links, and a few extra fields. Per D16 this is the only place contact data is read or written; everyone else asks this service.

Runs as its own HTTP process with its own table and migration. It calls no other service. Developed separately; the platform is not wired to it yet.

## Run

```bash
npm install
cp .env.example .env   # fill in values
npm run migrate        # candidate_contacts only
npm run dev            # http://localhost:4040
```

Checks: `npm run typecheck`, `npm test`. Integration tests run only when `DATABASE_URL` is set (and need `DATABASE_MIGRATION_URL`).

## How callers talk to it

Every request except `GET /health` needs `Authorization: Bearer <CONTACTS_SERVICE_TOKEN>`. Own routes need `x-user-id` (the platform signs the person in). Answers are `cache-control: no-store`. Errors are `{ "error": { "code", "message", "details?" } }`.

Contact data is personal data: callers decide who may see whose contacts (for example, an employer only after a reveal). This service does not decide that.

## API

| Method | Path | Who | What |
|---|---|---|---|
| GET | `/health` | — | `{ ok }` |
| GET | `/v1/me/contacts` | person | own contacts, 404 if none |
| PUT | `/v1/me/contacts` | person | save; 404 without a candidate profile |
| GET | `/v1/contacts/:id` | module | contacts of a candidate (reveal, data export, admin) |
| GET | `/v1/contacts/:id/email` | module | `{ email }` |
| DELETE | `/v1/contacts/:id` | module | `{ deleted }` (account deletion) |

## Data

Table owned by contacts: `candidate_contacts` (one row per candidate, `email` is citext, format checks in the database too). Migration `migrations/0005_candidate_contacts.sql`, applied by `npm run migrate`, tracked in `contacts_schema_migrations`. Safe to run again on a live database (checked against a non-superuser table owner).

Needs from the platform: `users`, `candidate_profiles(user_id)`, helpers `public.set_updated_at` and `public.enable_rls_deny_all`, roles `app_rw`, `anon`, `authenticated`. CI creates stand-ins from `test/sql/platform-stub.sql`.

In-process use can pass a transaction to `saveContacts` (the platform saves contacts and profile completeness together).

## Packages inside

- `.` — service functions and `contactsInput`
- `./server` — `createApp()` HTTP handler

Depends on `@intgetion/kit` (v0.2.0) by git tag.
