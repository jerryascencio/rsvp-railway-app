# Leah Adalynn Espinoza's Quinceañera — RSVP App

A fullstack RSVP website for the Quinceañera of Leah Adalynn Espinoza (Friday, September 18, 2026).

> **Multi-event platform (phase 1)** lives on a feature branch and must be deployed as a **separate Railway service**. `main` keeps auto-deploying the live Leah site. See [Platform deployment](#platform-deployment-separate-railway-service) below. Do not point `www.leahaespinoza.com` at the platform service. Guests visit the public page, type their name, phone, or email into a single search box, find their invitation, and split their party into "attending" and "not attending" headcounts. Every submission is saved to SQLite and triggers up to two emails through Gmail: a running-totals report to the family's organizer and a warm confirmation to the guest (only when they provide an email). The host dashboard at `/#/admin` is password protected and provides live totals, a full guest table with inline editing, CSV import/export, and email settings.

Stack: Express 5 + Vite + React 18 + Tailwind CSS 3 + shadcn/ui + Drizzle ORM (better-sqlite3) + nodemailer.

---

## Event details (baked into the page and the emails)

- **Date:** Friday, September 18, 2026
- **Mass:** 2:30 PM — Guardian Angel Church, 12307 Terra Bella St, Pacoima, CA 91331
- **Reception:** 5:00 PM — Platinum Banquet Hall, 8704 Van Nuys Blvd, Panorama City, CA 91402
- **RSVP deadline:** August 18, 2026

---

## Environment variables

There are **no required** environment variables. Everything sensitive (Gmail sender, Gmail app password, notify email, admin login) is configured once through the `/#/admin` setup screen and stored in the database.

| Variable        | Required | Default    | Purpose                                                                                            |
| --------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------- |
| `PORT`          | no       | `5000`     | Port the server listens on. Railway injects this automatically — do not hardcode it.                |
| `DATABASE_PATH` | no       | `./data.db`| Path to the SQLite file. Point this at a Railway volume for durable storage (e.g. `/data/data.db`). |
| `SESSION_SECRET`| no       | auto       | HMAC secret for admin session tokens. If unset, a random secret is generated and stored in the DB.  |
| `NODE_ENV`      | no       | —          | `production` makes the server serve the built client from `dist/public`. `npm start` sets this.      |

See `.env.example`.

---

## Local development

```bash
npm install
npm run dev          # Express + Vite on http://localhost:5000
```

- Public invitation + RSVP flow: <http://localhost:5000/#/>
- Host dashboard: <http://localhost:5000/#/admin>

Production build and run:

```bash
npm run build        # tsx script/build.ts -> dist/public (client) + dist/index.cjs (server)
npm start            # NODE_ENV=production node dist/index.cjs
```

---

## Railway deployment

1. Push this project to a GitHub repository (the included `.gitignore` keeps `node_modules`, `dist`, `.env`, and `data.db` out).
2. In Railway: **New Project → Deploy from GitHub repo** and pick the repo.
3. Railway auto-detects Node via Nixpacks. `railway.json` already pins the behavior:
   - build command: `npm run build`
   - start command: `npm start`
   - healthcheck path: `/api/health`
   A `Procfile` (`web: npm start`) is included as a fallback.
4. Do **not** set `PORT` yourself — Railway injects it and the server reads `process.env.PORT`.
5. Under **Settings → Networking**, generate a public domain. Share that domain with guests.
6. Open `https://<your-domain>/#/admin` and complete the first-run setup (below).

### Persistence (important)

The app stores everything in a single SQLite file. Railway containers have an **ephemeral filesystem** — the file survives normal restarts of a running container but is lost whenever the container is recreated (a new deploy, a config change, a platform migration). For a three-week RSVP window that is usually acceptable, but the safe setup is a volume:

1. Railway → your service → **Variables/Volumes → Add Volume**, mount path `/data`.
2. Add the variable `DATABASE_PATH=/data/data.db`.
3. Redeploy. Guest lists and RSVPs now survive redeploys.

Also set `SESSION_SECRET` to a long random string if you want admin sessions to survive a database reset.

Back up at any time with the **Download CSV** button in the dashboard.

---

## First-run setup

Visit `/#/admin`. Because no admin account exists yet, the setup form appears. Enter:

| Field                  | Suggested value                                  |
| ---------------------- | ------------------------------------------------ |
| Admin email            | `jerry@jerryateam.com` (pre-filled)              |
| Admin password         | Choose one — minimum 6 characters                |
| Gmail sender address   | `leah.a.espin@gmail.com` (pre-filled)            |
| Gmail app password     | 16-character app password (see below)            |
| Send RSVP reports to   | `stef.espin@gmail.com` (pre-filled)              |

Submitting creates the admin account, saves the email settings, and signs you in. From then on `/#/admin` shows a normal sign-in form. Everything is editable later under **Settings**, including the admin password, and there is a **Send test email** button to verify Gmail works.

### Getting a Gmail app password

1. The sending Gmail account must have 2-Step Verification enabled.
2. Go to <https://myaccount.google.com/apppasswords>.
3. Create an app password (name it "Quinceañera RSVP"). Google shows 16 characters like `abcd efgh ijkl mnop`.
4. Paste it into the **Gmail app password** field. Spaces are fine. Your normal Gmail password will not work.

If the app password is missing or wrong, RSVPs still save — the server logs a warning and skips the emails.

---

## Guest CSV format

A header row is recommended (column order is then flexible and extra columns are ignored). Without a header, columns are read positionally as `firstName, lastName, phone, email, invites`:

```csv
firstName,lastName,phone,email,invites
Maria,Lopez,(818) 555-0142,maria.lopez@example.com,4
Ricardo,Espinoza,818-555-0199,,6
Gloria,Espinoza,8185550177,gloria.e@example.com,2
Hector,Ramirez,,hector@example.com,3
```

- `phone` accepts any format — dashes, spaces, parentheses. It is normalized to digits for matching.
- `email` may be blank.
- `invites` is the party size (how many seats that household may fill). Blank or invalid becomes `1`.
- Upload upserts: rows match an existing guest by normalized phone first, then by `firstName + lastName`. The dashboard reports "Added X, updated Y, skipped Z".
- **Download CSV** exports `firstName,lastName,phone,email,invites,additionalNames,attending,attendees,declinedCount,pendingSeats,guestEmail,note,updatedAt` (`additionalNames` is a `; `-separated list).

### Optional additional household members

Any row may also name the other people invited in that household, so a guest can
find the invitation by their own name. Add up to nine pairs of optional columns:

```csv
firstName,lastName,phone,email,invites,additional1_first,additional1_last,additional2_first,additional2_last
Adrian,Ascencio,8185551234,adrian@example.com,3,Stefanie,Ascencio,Marco,Ascencio
```

- Supported through `additional9_first` / `additional9_last` (party size 10).
- Header matching is case-insensitive and ignores spaces, underscores and hyphens, so `additional1_first`, `additional1First` and `additional1-first` are all accepted.
- A pair is imported only when both the first and last name are non-blank; otherwise it is skipped silently.
- On re-upload, a row without additional columns leaves the existing extra names untouched.

---

## How the RSVP math works

- **Confirmed attending** = sum of `attendees` across all responses.
- **Not attending** = sum of `invites - attendees` for every household that has responded (covers both full declines and partial ones).
- **Pending** = all seats belonging to households with no response, plus the household count.
- A response with `attendees = 0` is stored as `attending = 'no'`; anything above 0 is `attending = 'yes'` with `declinedCount` recording the unused seats.

---

## Project layout

```
client/            React app (public invitation page + admin dashboard)
  public/          Floral corner art, tiara ornament, favicon
  src/pages/       home.tsx (public flow), admin.tsx (dashboard)
  src/components/  ornaments.tsx (tiara, dividers, floral frame, venue blocks)
  src/lib/api.ts   fetch wrapper with bearer-token auth
server/            Express API
  routes.ts        Public + admin endpoints, auth, CSV import/export
  storage.ts       Drizzle/SQLite data access + totals
  mailer.ts        nodemailer Gmail templates
shared/schema.ts   Drizzle tables, shared types, event constants
script/build.ts    Vite client build + esbuild server bundle
```

---

## Platform deployment (separate Railway service)

Phase 1 turns this app into a small RSVP service other families can buy, without changing Leah's live site.

- **Basic** — $100. An Elegant, Fiesta, or Minimal template for any celebration, bilingual copy, guest CSV import, photos, and a host dashboard.
- **Custom domain** — +$25 on Basic. The order stores the domain they want. Jerry connects it later by saving the live hostname in Studio (`/super`).
- **Full custom** — $250. The order stores their notes. Fulfillment is manual. They can still publish the template site.
- Unpaid events stay a private preview. Publishing requires a paid order.
- RSVPs can be closed on a date. The public form is replaced and `POST /api/rsvp` rejects new replies.
- Guest search is rate-limited (default 30 lookups per minute per IP per event).

Leah's existing database migrates on boot into an event with slug `leah`. The migration only adds tables and columns and backfills `event_id`. It does not drop or rewrite the original tables. On `www.leahaespinoza.com` the site still renders at `/` and the admin stays at `/#/admin`. Other events are at `/e/<slug>`.

A platform database (one with no legacy root event) seeds six published sample sites: `demo-elegant`, `demo-fiesta`, `demo-minimal`, `demo-garden`, `demo-noche`, and `demo-confetti`. They are marked `is_demo`, paid so guests can open them, and stored with a $0 amount. Studio totals skip them. RSVPs on a sample are saved and not emailed. Each boot refreshes the sample copy so an existing volume picks up new sections. It does not add a second guest list, and it does not run when a legacy root event is already present.

### New environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | for real checkout | Secret key for the Stripe account **RSVP Sites by Mission** (test mode until launch). Not the CRM account. If empty, checkout is a clearly labeled local mock that marks the order paid. Jerry will paste the keys in later. |
| `STRIPE_WEBHOOK_SECRET` | for real checkout | Signing secret for `POST /api/stripe/webhook` (`checkout.session.completed`). |
| `STRIPE_PUBLISHABLE_KEY` | no | Exposed to the browser via `/api/billing/config`. Hosted Checkout does not require it. |
| `STRIPE_PRICE_BASIC` | no | Price id for the $100 package. If empty, Checkout uses inline `price_data`. |
| `STRIPE_PRICE_DOMAIN` | no | Price id for the $25 domain add-on. |
| `STRIPE_PRICE_CUSTOM` | no | Price id for the $250 full-custom package. |
| `PUBLIC_PLATFORM_URL` | no | Origin used in Checkout return URLs, e.g. `https://rsvp.example.com`. If empty, the request host is used. **Do not set this to Leah's domain.** |
| `SUPER_ADMIN_EMAIL` | for Studio | Creates Jerry's `/super` login on first boot. |
| `SUPER_ADMIN_PASSWORD` | for Studio | At least 8 characters. Changing it later does not rotate an existing password. |
| `LEGACY_ROOT_HOSTS` | no | Hosts that serve the original event at `/`. Default `www.leahaespinoza.com,leahaespinoza.com`. Leave unset on the new service. |
| `SEARCH_RATE_LIMIT` | no | Searches per IP per event per minute. Default 30. |
| `UPLOAD_DIR` | no | Photo directory. Default is `uploads` next to the SQLite file (`/data/uploads` on Railway). |

Gmail for each new event is still entered in that event's dashboard (Settings), not in env vars. Leah's sender stays in the original settings row.

### Railway

Use a **new service and a new volume**. Do not attach Leah's `/data` volume and do not change the service that deploys `main`.

1. In Railway, create a new project or a new service in a project that does **not** auto-deploy `main` to `leahaespinoza.com`.
2. Connect the repo and set the deploy branch to this platform branch (not `main`) until you are ready to cut over. `main` must keep deploying the current Leah service unchanged.
3. Nixpacks, Node 20.19 or newer (Vite 7 will not build on 20.18), `npm run build`, and `npm start` are already configured. Keep the service at **one replica** (SQLite).
4. Add a volume mounted at `/data` and set `DATABASE_PATH=/data/data.db`. This is a new empty file. It must not be Leah's database.
5. Set `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, and the **RSVP Sites by Mission** Stripe test keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and optionally `STRIPE_PUBLISHABLE_KEY` plus price ids). Point that account's webhook at `https://<platform-domain>/api/stripe/webhook` for `checkout.session.completed`. Until the keys are in the service, checkout uses the local mock path.
6. Generate a **new** public domain. Do not add `leahaespinoza.com` or `www` to this service.
7. Open `/`, create a test event, pay in Stripe test mode (or use the mock path if keys are absent), publish, import a CSV, and submit an RSVP.
8. Studio is at `/super`. To serve an event on a custom hostname later: add the domain in Railway networking, set DNS, then save that hostname on the event in Studio. The app will serve that event at `/` for that host.

`/api/health` stays the healthcheck. Photos live on the same volume as the database.

Local check against a copy of a legacy database:

```bash
# build a throwaway db with the old single-event schema, then:
DATABASE_PATH=/tmp/leah-copy.db PORT=5055 npm run dev
curl -s -H 'Host: www.leahaespinoza.com' http://127.0.0.1:5055/api/site
```

`mode` should be `legacy`, and guest search on that host should return the migrated households. `http://127.0.0.1:5055/` without that Host header is the marketing site. Leah's page on this machine is also at `/e/leah`.

---

## Known limitations

- **Admin sessions are memory-only in the browser.** The server sets an httpOnly cookie *and* returns a bearer token; the client keeps the token in React state because the app was also tested inside a sandboxed cross-origin iframe where cookies get dropped. On a normal Railway domain the cookie works, but a hard refresh may still ask you to sign in again. Just sign in again.
- **SQLite, single instance.** Do not scale the service beyond one replica — each replica would get its own database file.
- **Gmail sending limits.** A regular Gmail account allows roughly 500 messages/day, which is far above what this event needs.
- **No email retries.** If Gmail rejects a message the RSVP is still saved and the failure is logged; the guest sees a normal confirmation screen.
- **No spam protection on the public search.** Anyone with the link can look up a guest name and submit an RSVP for them. The dashboard can correct any response, and every submission overwrites cleanly by guest.
- **Ephemeral disk by default** — see the Persistence section above.

<!-- deploy nudge 1785346125 -->
