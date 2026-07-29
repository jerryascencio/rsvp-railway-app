# Leah Adalynn Espinoza's Quinceañera — RSVP App

A fullstack RSVP website for the Quinceañera of Leah Adalynn Espinoza (Friday, September 18, 2026). Guests visit the public page, type their name, phone, or email into a single search box, find their invitation, and split their party into "attending" and "not attending" headcounts. Every submission is saved to SQLite and triggers up to two emails through Gmail: a running-totals report to the family's organizer and a warm confirmation to the guest (only when they provide an email). The host dashboard at `/#/admin` is password protected and provides live totals, a full guest table with inline editing, CSV import/export, and email settings.

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

## Known limitations

- **Admin sessions are memory-only in the browser.** The server sets an httpOnly cookie *and* returns a bearer token; the client keeps the token in React state because the app was also tested inside a sandboxed cross-origin iframe where cookies get dropped. On a normal Railway domain the cookie works, but a hard refresh may still ask you to sign in again. Just sign in again.
- **SQLite, single instance.** Do not scale the service beyond one replica — each replica would get its own database file.
- **Gmail sending limits.** A regular Gmail account allows roughly 500 messages/day, which is far above what this event needs.
- **No email retries.** If Gmail rejects a message the RSVP is still saved and the failure is logged; the guest sees a normal confirmation screen.
- **No spam protection on the public search.** Anyone with the link can look up a guest name and submit an RSVP for them. The dashboard can correct any response, and every submission overwrites cleanly by guest.
- **Ephemeral disk by default** — see the Persistence section above.
