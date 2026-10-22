import { guests, responses, admins, settings, messageLogs, emailLogs, events, eventHosts, orders, superAdmins } from "@shared/schema";
import type {
  MessageLog,
  EmailLog,
  Guest,
  GuestRow,
  InsertGuest,
  RsvpResponse,
  Admin,
  Settings,
  GuestWithResponse,
  Totals,
  EventRecord,
  EventHost,
  Order,
  SuperAdmin,
} from "@shared/schema";
import {
  normalizePhone,
  parseAdditionalNames,
  serializeAdditionalNames,
  EVENT,
} from "@shared/schema";
import { LEAH_EVENT_ID } from "@shared/platform";
import { seedDemoEvents } from "./demo-seed";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import { randomUUID, randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const dbPath = process.env.DATABASE_PATH || "./data.db";
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

// --- bootstrap tables (no migration tooling needed) ---
sqlite.exec(`
CREATE TABLE IF NOT EXISTS guests (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL DEFAULT '',
  full_name TEXT NOT NULL DEFAULT '',
  party_name TEXT NOT NULL DEFAULT '',
  name_for_text TEXT NOT NULL DEFAULT '',
  adults INTEGER NOT NULL DEFAULT 0,
  kids INTEGER NOT NULL DEFAULT 0,
  language TEXT NOT NULL DEFAULT '',
  invitation_sent TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT,
  invites INTEGER NOT NULL DEFAULT 1,
  additional_names TEXT,
  updated_at INTEGER,
  event_id TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY,
  guest_id TEXT NOT NULL,
  attending TEXT NOT NULL,
  attendees INTEGER NOT NULL DEFAULT 0,
  declined_count INTEGER NOT NULL DEFAULT 0,
  guest_email TEXT,
  note TEXT,
  place_card_names TEXT,
  updated_at INTEGER NOT NULL,
  event_id TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY,
  smtp_user TEXT NOT NULL DEFAULT '',
  smtp_pass TEXT NOT NULL DEFAULT '',
  notify_email TEXT NOT NULL DEFAULT 'stef.espin@gmail.com',
  admin_email TEXT NOT NULL DEFAULT '',
  session_secret TEXT NOT NULL DEFAULT '',
  setup_complete INTEGER NOT NULL DEFAULT 0
);
`);

// --- lightweight additive migrations for databases created by older versions ---
// Railway (and any existing deployment) already has a `guests` table, so the
// CREATE TABLE IF NOT EXISTS above is a no-op there. Add new columns here.
for (const stmt of [
  `ALTER TABLE guests ADD COLUMN additional_names TEXT`,
  `ALTER TABLE guests ADD COLUMN party_name TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE guests ADD COLUMN name_for_text TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE guests ADD COLUMN adults INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE guests ADD COLUMN kids INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE guests ADD COLUMN language TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE guests ADD COLUMN invitation_sent TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE guests ADD COLUMN updated_at INTEGER`,
  `ALTER TABLE responses ADD COLUMN place_card_names TEXT`,
  `CREATE TABLE IF NOT EXISTS message_logs (
    id TEXT PRIMARY KEY,
    guest_id TEXT NOT NULL,
    phone TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_message_logs_guest ON message_logs (guest_id)`,
  `ALTER TABLE guests ADD COLUMN event_id TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE responses ADD COLUMN event_id TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE message_logs ADD COLUMN event_id TEXT NOT NULL DEFAULT ''`,
  `CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    is_legacy_root INTEGER NOT NULL DEFAULT 0,
    is_demo INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft',
    package TEXT NOT NULL DEFAULT 'basic',
    template TEXT NOT NULL DEFAULT 'quince',
    paid INTEGER NOT NULL DEFAULT 0,
    honoree TEXT NOT NULL DEFAULT '',
    partner_name TEXT NOT NULL DEFAULT '',
    event_kind TEXT NOT NULL DEFAULT 'quinceanera',
    family_line TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL DEFAULT '',
    date_iso TEXT NOT NULL DEFAULT '',
    date_long TEXT NOT NULL DEFAULT '',
    date_long_es TEXT NOT NULL DEFAULT '',
    day_name TEXT NOT NULL DEFAULT '',
    day_name_es TEXT NOT NULL DEFAULT '',
    day TEXT NOT NULL DEFAULT '',
    year TEXT NOT NULL DEFAULT '',
    ceremony_label TEXT NOT NULL DEFAULT 'Mass',
    ceremony_label_es TEXT NOT NULL DEFAULT 'Misa',
    ceremony_time TEXT NOT NULL DEFAULT '',
    ceremony_venue TEXT NOT NULL DEFAULT '',
    ceremony_address TEXT NOT NULL DEFAULT '',
    reception_time TEXT NOT NULL DEFAULT '',
    reception_venue TEXT NOT NULL DEFAULT '',
    reception_address TEXT NOT NULL DEFAULT '',
    rsvp_by_label TEXT NOT NULL DEFAULT '',
    rsvp_by_label_es TEXT NOT NULL DEFAULT '',
    rsvp_closes_on TEXT NOT NULL DEFAULT '',
    photo_upload_url TEXT NOT NULL DEFAULT '',
    dress_code TEXT NOT NULL DEFAULT '',
    dress_code_es TEXT NOT NULL DEFAULT '',
    gift_text TEXT NOT NULL DEFAULT '',
    gift_text_es TEXT NOT NULL DEFAULT '',
    about_text TEXT NOT NULL DEFAULT '',
    about_text_es TEXT NOT NULL DEFAULT '',
    hotels_json TEXT NOT NULL DEFAULT '[]',
    schedule_json TEXT NOT NULL DEFAULT '[]',
    photos_json TEXT NOT NULL DEFAULT '[]',
    hostnames TEXT NOT NULL DEFAULT '',
    desired_domain TEXT NOT NULL DEFAULT '',
    custom_domain INTEGER NOT NULL DEFAULT 0,
    custom_notes TEXT NOT NULL DEFAULT '',
    smtp_user TEXT NOT NULL DEFAULT '',
    smtp_pass TEXT NOT NULL DEFAULT '',
    notify_email TEXT NOT NULL DEFAULT '',
    stripe_session_id TEXT,
    amount_cents INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS event_hosts (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    package TEXT NOT NULL,
    custom_domain INTEGER NOT NULL DEFAULT 0,
    desired_domain TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL DEFAULT 'pending',
    stripe_session_id TEXT,
    created_at INTEGER NOT NULL,
    paid_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS super_admins (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  )`,
  `ALTER TABLE events ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE events ADD COLUMN family_line_es TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE events ADD COLUMN ceremony_map_url TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE events ADD COLUMN reception_map_url TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE events ADD COLUMN parking_text TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE events ADD COLUMN parking_text_es TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE events ADD COLUMN host_note TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE events ADD COLUMN host_note_es TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE events ADD COLUMN contact_email TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE events ADD COLUMN contact_phone TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE events ADD COLUMN contact_note TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE events ADD COLUMN contact_note_es TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE events ADD COLUMN meal_prompt TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE events ADD COLUMN meal_prompt_es TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE events ADD COLUMN faqs_json TEXT NOT NULL DEFAULT '[]'`,
  `ALTER TABLE events ADD COLUMN party_json TEXT NOT NULL DEFAULT '[]'`,
  `ALTER TABLE responses ADD COLUMN meal TEXT NOT NULL DEFAULT ''`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_events_slug ON events (slug)`,
  `CREATE INDEX IF NOT EXISTS idx_guests_event ON guests (event_id)`,
  `CREATE INDEX IF NOT EXISTS idx_responses_event ON responses (event_id)`,
  `CREATE INDEX IF NOT EXISTS idx_message_logs_event ON message_logs (event_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_event_hosts_event_email ON event_hosts (event_id, email)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_event ON orders (event_id)`,
  `ALTER TABLE orders ADD COLUMN kind TEXT NOT NULL DEFAULT 'purchase'`,
  `CREATE TABLE IF NOT EXISTS email_logs (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL DEFAULT '',
    guest_id TEXT NOT NULL DEFAULT '',
    blast_id TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    subject TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'sent',
    error TEXT NOT NULL DEFAULT '',
    sent_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_email_logs_event ON email_logs (event_id, sent_at)`,
]) {
  try {
    sqlite.exec(stmt);
  } catch (err: any) {
    const msg = String(err?.message || "");
    // "duplicate column name: ..." means the migration already ran. Anything
    // else we log but never crash the boot on.
    if (!/duplicate column name/i.test(msg)) {
      console.warn("[db] migration skipped:", msg);
    }
  }
}

try {
  // The old Basic + $25 domain add-on is the Plus plan now. Paid totals stay as recorded.
  sqlite.prepare(
    `UPDATE events SET package = 'plus' WHERE package = 'basic' AND custom_domain = 1 AND is_demo = 0 AND is_legacy_root = 0`,
  ).run();
  sqlite.prepare(
    `UPDATE events SET amount_cents = 10000 WHERE package = 'plus' AND paid = 0 AND is_demo = 0 AND amount_cents = 12500`,
  ).run();
  sqlite.prepare(
    `UPDATE orders SET package = 'plus', amount_cents = 10000 WHERE status = 'pending' AND package = 'basic' AND custom_domain = 1 AND amount_cents = 12500`,
  ).run();
} catch (err: any) {
  console.warn("[db] plan migration skipped:", err?.message || err);
}

/**
 * If this database is the original single-event Leah site, copy it into the
 * `leah` event without rewriting or dropping the old tables. Idempotent:
 * a second boot finds the row and only backfills blank event_id values.
 */
function migrateLegacyEvent() {
  const already = sqlite
    .prepare("SELECT id FROM events WHERE id = ? OR slug = ?")
    .get(LEAH_EVENT_ID, "leah") as { id: string } | undefined;
  const guestCount = (sqlite.prepare("SELECT COUNT(*) AS c FROM guests").get() as { c: number }).c;
  const adminCount = (sqlite.prepare("SELECT COUNT(*) AS c FROM admins").get() as { c: number }).c;
  let settingsRow: { smtp_user?: string; smtp_pass?: string; notify_email?: string; setup_complete?: number } | undefined;
  try {
    settingsRow = sqlite.prepare("SELECT * FROM settings WHERE id = 1").get() as typeof settingsRow;
  } catch {
    settingsRow = undefined;
  }
  // Platform databases already have event rows (real orders, or the sample
  // sites). Their guest lists must not be read as Leah's original file.
  // The legacy file is the one that reaches this point with guests, an
  // admin, or a finished setup, and an empty events table.
  const eventCount = (sqlite.prepare("SELECT COUNT(*) AS c FROM events").get() as { c: number }).c;
  const looksLegacy =
    eventCount === 0 &&
    (guestCount > 0 || adminCount > 0 || Number(settingsRow?.setup_complete) === 1);

  if (!already && looksLegacy) {
    const now = Date.now();
    const hosts = (process.env.LEGACY_ROOT_HOSTS || "www.leahaespinoza.com,leahaespinoza.com")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .join(",");
    sqlite
      .prepare(
        `INSERT INTO events (
          id, slug, is_legacy_root, status, package, template, paid,
          honoree, partner_name, event_kind, family_line, title,
          date_iso, date_long, date_long_es, day_name, day_name_es, day, year,
          ceremony_label, ceremony_label_es, ceremony_time, ceremony_venue, ceremony_address,
          reception_time, reception_venue, reception_address,
          rsvp_by_label, rsvp_by_label_es, rsvp_closes_on,
          photo_upload_url, dress_code, dress_code_es, gift_text, gift_text_es,
          about_text, about_text_es, hotels_json, schedule_json, photos_json,
          hostnames, desired_domain, custom_domain, custom_notes,
          smtp_user, smtp_pass, notify_email, stripe_session_id, amount_cents,
          created_at, updated_at
        ) VALUES (
          ?, 'leah', 1, 'active', 'basic', 'quince', 1,
          ?, '', 'quinceanera', 'Espinoza De Anda Family', 'Quinceañera',
          '2026-09-18', ?, 'Viernes, 18 de septiembre de 2026', 'FRIDAY, SEP', 'VIERNES, SEP', '18', '2026',
          'Mass', 'Misa', ?, ?, ?,
          ?, ?, ?,
          ?, '18 de agosto de 2026', '',
          ?, '', '', '', '',
          '', '', '[]', '[]', '[]',
          ?, '', 0, '',
          ?, ?, ?, NULL, 0,
          ?, ?
        )`,
      )
      .run(
        LEAH_EVENT_ID,
        EVENT.honoree,
        EVENT.dateLong,
        EVENT.massTime,
        EVENT.massVenue,
        EVENT.massAddress,
        EVENT.receptionTime,
        EVENT.receptionVenue,
        EVENT.receptionAddress,
        EVENT.rsvpBy,
        EVENT.photoUploadUrl,
        hosts,
        settingsRow?.smtp_user || "",
        settingsRow?.smtp_pass || "",
        settingsRow?.notify_email || "stef.espin@gmail.com",
        now,
        now,
      );
    console.log(`[db] migrated existing single-event data into event '${LEAH_EVENT_ID}' (${guestCount} guests)`);
  }

  const leah = sqlite
    .prepare("SELECT id FROM events WHERE slug = 'leah' AND is_legacy_root = 1")
    .get() as { id: string } | undefined;
  if (leah) {
    sqlite.prepare("UPDATE guests SET event_id = ? WHERE event_id IS NULL OR event_id = ''").run(leah.id);
    sqlite.prepare("UPDATE responses SET event_id = ? WHERE event_id IS NULL OR event_id = ''").run(leah.id);
    sqlite.prepare("UPDATE message_logs SET event_id = ? WHERE event_id IS NULL OR event_id = ''").run(leah.id);
  }
}

migrateLegacyEvent();

/** Convert a raw row into the app-facing Guest (parsed additionalNames).
 *  Coerces any nullable text fields to empty string so downstream code and
 *  Drizzle writes never trip on a leftover NULL from an older schema row. */
function toGuest(row: GuestRow): Guest;
function toGuest(row: GuestRow | undefined): Guest | undefined;
function toGuest(row: GuestRow | undefined): Guest | undefined {
  if (!row) return undefined;
  const { additionalNames, ...rest } = row as any;
  return {
    ...rest,
    nameForText: rest.nameForText ?? "",
    partyName: rest.partyName ?? "",
    lastName: rest.lastName ?? "",
    fullName: rest.fullName ?? "",
    phone: rest.phone ?? "",
    language: rest.language ?? "",
    invitationSent: rest.invitationSent ?? "",
    adults: rest.adults ?? 0,
    kids: rest.kids ?? 0,
    additionalNames: parseAdditionalNames(additionalNames),
  } as Guest;
}

/** Convert a stored response row — keeps placeCardNames as the JSON string
 *  (matching the schema type) but the same helper returns a parsed list
 *  when a caller needs it. Since RsvpResponse.placeCardNames is typed as
 *  string|null, we leave the stored JSON in place. Callers that want the
 *  parsed list use `parsePlaceCardNames` below. */
function toResponse(row: RsvpResponse): RsvpResponse {
  return row;
}

/** Parse the JSON-encoded place-card names list. Returns [] when unset or
 *  the JSON is malformed — an empty list means "guest skipped this." */
export function parsePlaceCardNames(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((n) => String(n || ""));
    return [];
  } catch {
    return [];
  }
}

export class Storage {
  // ---------- settings ----------
  getSettings(): Settings {
    let row = db.select().from(settings).where(eq(settings.id, 1)).get();
    if (!row) {
      row = db
        .insert(settings)
        .values({
          id: 1,
          smtpUser: "",
          smtpPass: "",
          notifyEmail: "stef.espin@gmail.com",
          adminEmail: "",
          sessionSecret: randomBytes(32).toString("hex"),
          setupComplete: 0,
        })
        .returning()
        .get();
    }
    if (!row.sessionSecret) {
      row = db
        .update(settings)
        .set({ sessionSecret: randomBytes(32).toString("hex") })
        .where(eq(settings.id, 1))
        .returning()
        .get();
    }
    return row;
  }

  updateSettings(patch: Partial<Settings>): Settings {
    this.getSettings();
    return db
      .update(settings)
      .set(patch)
      .where(eq(settings.id, 1))
      .returning()
      .get();
  }

  // ---------- admins ----------
  adminCount(): number {
    return db.select().from(admins).all().length;
  }

  getAdminByEmail(email: string): Admin | undefined {
    return db
      .select()
      .from(admins)
      .all()
      .find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
  }

  getAdmin(id: string): Admin | undefined {
    return db.select().from(admins).where(eq(admins.id, id)).get();
  }

  createAdmin(email: string, passwordHash: string): Admin {
    return db
      .insert(admins)
      .values({ id: randomUUID(), email: email.trim().toLowerCase(), passwordHash })
      .returning()
      .get();
  }

  updateAdminPassword(id: string, passwordHash: string) {
    db.update(admins).set({ passwordHash }).where(eq(admins.id, id)).run();
  }

  // ---------- guests ----------
  allGuests(eventId: string): Guest[] {
    return db
      .select()
      .from(guests)
      .where(eq(guests.eventId, eventId))
      .all()
      .map((r) => toGuest(r));
  }

  getGuest(id: string, eventId?: string): Guest | undefined {
    const guest = toGuest(db.select().from(guests).where(eq(guests.id, id)).get());
    if (!guest) return undefined;
    if (eventId && guest.eventId !== eventId) return undefined;
    return guest;
  }

  createGuest(g: Omit<InsertGuest, "id" | "fullName"> & { id?: string; eventId: string }): Guest {
    const first = (g.firstName || "").trim();
    const last = (g.lastName || "").trim();
    return toGuest(
      db
        .insert(guests)
        .values({
          id: g.id || randomUUID(),
          firstName: first,
          lastName: last,
          fullName: `${first} ${last}`.trim(),
          partyName: (g.partyName || "").trim(),
          nameForText: (g.nameForText || "").trim(),
          adults: Math.max(0, Number((g as any).adults) || 0),
          kids: Math.max(0, Number((g as any).kids) || 0),
          language: ((g as any).language || "").trim(),
          invitationSent: ((g as any).invitationSent || "").trim(),
          phone: (g.phone || "").trim(),
          email: g.email ? g.email.trim() : null,
          invites: Math.max(1, Number(g.invites) || 1),
          additionalNames: serializeAdditionalNames(g.additionalNames),
          updatedAt: Date.now(),
          eventId: g.eventId,
        })
        .returning()
        .get(),
    );
  }

  updateGuest(id: string, patch: Partial<Guest>, eventId?: string): Guest | undefined {
    const existing = this.getGuest(id, eventId);
    if (!existing) return undefined;
    const firstName = patch.firstName !== undefined ? patch.firstName.trim() : existing.firstName;
    const lastName = patch.lastName !== undefined ? (patch.lastName || "").trim() : existing.lastName;
    const additionalNames =
      patch.additionalNames !== undefined
        ? serializeAdditionalNames(patch.additionalNames)
        : serializeAdditionalNames(existing.additionalNames);
    return toGuest(db
      .update(guests)
      .set({
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`.trim(),
        partyName:
          patch.partyName !== undefined ? (patch.partyName || "").trim() : existing.partyName,
        nameForText:
          patch.nameForText !== undefined
            ? (patch.nameForText || "").trim()
            : existing.nameForText,
        adults:
          (patch as any).adults !== undefined
            ? Math.max(0, Number((patch as any).adults) || 0)
            : existing.adults,
        kids:
          (patch as any).kids !== undefined
            ? Math.max(0, Number((patch as any).kids) || 0)
            : existing.kids,
        language:
          (patch as any).language !== undefined
            ? ((patch as any).language || "").trim()
            : existing.language,
        invitationSent:
          (patch as any).invitationSent !== undefined
            ? ((patch as any).invitationSent || "").trim()
            : existing.invitationSent,
        phone: patch.phone !== undefined ? (patch.phone || "").trim() : existing.phone,
        email: patch.email !== undefined ? (patch.email || null) : existing.email,
        invites:
          patch.invites !== undefined
            ? Math.max(1, Number(patch.invites) || 1)
            : existing.invites,
        additionalNames,
        updatedAt: Date.now(),
      })
      .where(eq(guests.id, id))
      .returning()
      .get());
  }

  deleteGuest(id: string, eventId?: string) {
    if (eventId && !this.getGuest(id, eventId)) return;
    db.delete(responses).where(eq(responses.guestId, id)).run();
    db.delete(guests).where(eq(guests.id, id)).run();
  }

  /** Single-field fuzzy search across name / phone / email, scoped to one event. */
  searchGuests(q: string, eventId: string): Guest[] {
    const needle = (q || "").trim().toLowerCase();
    if (!needle) return [];
    const digits = needle.replace(/\D/g, "");
    return this.allGuests(eventId).filter((g) => {
      const phone = normalizePhone(g.phone);
      if (digits.length >= 3 && phone && phone.includes(digits)) return true;
      if (g.email && g.email.toLowerCase().includes(needle)) return true;
      if (g.firstName && g.firstName.toLowerCase().includes(needle)) return true;
      if (g.lastName && g.lastName.toLowerCase().includes(needle)) return true;
      const full = `${g.firstName} ${g.lastName}`.trim().toLowerCase();
      if (full.includes(needle)) return true;
      // Party label (e.g. "Concho & Maria", "Tia ki, Miguel, Gabby") is always searchable.
      if (g.partyName && g.partyName.toLowerCase().includes(needle)) return true;
      // Additional household members: match first, last, or full name.
      // If an additional guest has no last name recorded, fall back to the
      // primary contact's last name (e.g. "Adrian" in the Ascencio household
      // should still match a search for "Ascencio").
      const primaryLast = (g.lastName || "").trim();
      for (const n of g.additionalNames) {
        if (n.firstName && n.firstName.toLowerCase().includes(needle)) return true;
        const effectiveLast = (n.lastName && n.lastName.trim()) || primaryLast;
        if (effectiveLast && effectiveLast.toLowerCase().includes(needle)) return true;
        const nFull = `${n.firstName} ${effectiveLast}`.trim().toLowerCase();
        if (nFull && nFull.includes(needle)) return true;
      }
      return false;
    });
  }

  // ---------- responses ----------
  allResponses(eventId: string): RsvpResponse[] {
    return db.select().from(responses).where(eq(responses.eventId, eventId)).all().map(toResponse);
  }

  getResponseByGuest(guestId: string): RsvpResponse | undefined {
    const row = db.select().from(responses).where(eq(responses.guestId, guestId)).get();
    return row ? toResponse(row) : undefined;
  }

  upsertResponse(input: {
    guestId: string;
    attending: "yes" | "no";
    attendees: number;
    declinedCount: number;
    guestEmail?: string | null;
    note?: string | null;
    placeCardNames?: string[] | null;
    meal?: string | null;
  }): RsvpResponse {
    const existing = this.getResponseByGuest(input.guestId);
    const eventId = this.getGuest(input.guestId)?.eventId || existing?.eventId || "";
    // Trim and drop empty entries. If every name is blank, store null so the
    // admin can still see "guest skipped the place-card section."
    const cleanedNames = input.placeCardNames
      ? input.placeCardNames.map((n) => (n || "").trim())
      : null;
    const anyNonEmpty = cleanedNames?.some((n) => n.length > 0) ?? false;
    const values = {
      guestId: input.guestId,
      attending: input.attending,
      attendees: input.attendees,
      declinedCount: input.declinedCount,
      guestEmail: input.guestEmail || null,
      note: input.note || null,
      placeCardNames:
        cleanedNames && anyNonEmpty ? JSON.stringify(cleanedNames) : null,
      meal: input.meal !== undefined ? (input.meal || "").trim() : existing?.meal || "",
      updatedAt: Date.now(),
      eventId,
    };
    if (existing) {
      return db
        .update(responses)
        .set(values)
        .where(eq(responses.id, existing.id))
        .returning()
        .get();
    }
    return db
      .insert(responses)
      .values({ id: randomUUID(), ...values })
      .returning()
      .get();
  }

  deleteResponse(guestId: string) {
    db.delete(responses).where(eq(responses.guestId, guestId)).run();
  }

  // ---------- aggregate ----------
  guestsWithResponses(eventId: string): GuestWithResponse[] {
    const rs = this.allResponses(eventId);
    const byGuest = new Map(rs.map((r) => [r.guestId, r]));
    return this.allGuests(eventId)
      .map((g) => ({ ...g, response: byGuest.get(g.id) || null }))
      .sort((a, b) =>
        (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName),
      );
  }

  /** Same rows as guestsWithResponses() but without the alphabetical sort.
   *  Used by totals() and other aggregations that don't care about order,
   *  which halves the work of a save round trip. */
  private guestsWithResponsesRaw(eventId: string): GuestWithResponse[] {
    const rs = this.allResponses(eventId);
    const byGuest = new Map(rs.map((r) => [r.guestId, r]));
    return this.allGuests(eventId).map((g) => ({
      ...g,
      response: byGuest.get(g.id) || null,
    }));
  }

  /** Return the enriched row for a single guest, or null if not found.
   *  Cheap — one guest lookup + one response lookup, no full list scan. */
  guestWithResponse(guestId: string, eventId?: string): GuestWithResponse | null {
    const g = this.getGuest(guestId, eventId);
    if (!g) return null;
    return { ...g, response: this.getResponseByGuest(guestId) || null };
  }

  totals(eventId: string): Totals {
    const rows = this.guestsWithResponsesRaw(eventId);
    let totalInvited = 0;
    let totalHeadcount = 0;
    let totalDeclined = 0;
    let totalPending = 0;
    let totalPendingHouseholds = 0;
    let respondedHouseholds = 0;
    for (const g of rows) {
      totalInvited += g.invites;
      if (g.response) {
        respondedHouseholds += 1;
        totalHeadcount += g.response.attendees;
        // Trust the response's declined field — don't infer
        // "invites - attending" (that hides unaccounted seats in
        // partially-answered households).
        totalDeclined += g.response.declinedCount;
        // Any leftover seats in a responded household are still
        // pending, and their household is a pending household for
        // reporting purposes.
        const leftover = Math.max(
          0,
          g.invites - g.response.attendees - g.response.declinedCount,
        );
        if (leftover > 0) {
          totalPending += leftover;
          totalPendingHouseholds += 1;
        }
      } else {
        totalPendingHouseholds += 1;
        totalPending += g.invites;
      }
    }
    const totalHouseholds = rows.length;
    return {
      totalInvited,
      totalHeadcount,
      totalDeclined,
      totalPending,
      totalPendingHouseholds,
      totalHouseholds,
      respondedHouseholds,
      responseRate:
        totalHouseholds === 0
          ? 0
          : Math.round((respondedHouseholds / totalHouseholds) * 100),
    };
  }

  // ---------- message logs ----------

  /** Record that an iMessage draft was opened for this guest.
   *  We can't confirm delivery — this is intent-to-send. */
  logMessage(guestId: string, phone: string, body: string, eventId: string): MessageLog {
    return db
      .insert(messageLogs)
      .values({
        id: randomUUID(),
        guestId,
        phone,
        body,
        sentAt: Date.now(),
        eventId,
      })
      .returning()
      .get();
  }

  /** All logs for one guest, newest first. */
  messagesForGuest(guestId: string): MessageLog[] {
    return db
      .select()
      .from(messageLogs)
      .where(eq(messageLogs.guestId, guestId))
      .all()
      .sort((a, b) => b.sentAt - a.sentAt);
  }

  /** {guestId: {count, lastSentAt}} for every guest that has logs. */
  messageCounts(eventId: string): Record<string, { count: number; lastSentAt: number }> {
    const rows = db.select().from(messageLogs).where(eq(messageLogs.eventId, eventId)).all();
    const out: Record<string, { count: number; lastSentAt: number }> = {};
    for (const r of rows) {
      const cur = out[r.guestId] || { count: 0, lastSentAt: 0 };
      cur.count += 1;
      if (r.sentAt > cur.lastSentAt) cur.lastSentAt = r.sentAt;
      out[r.guestId] = cur;
    }
    return out;
  }

  logEmail(row: {
    eventId: string;
    guestId: string;
    blastId: string;
    email: string;
    subject: string;
    body: string;
    status: string;
    error?: string;
  }): EmailLog {
    return db
      .insert(emailLogs)
      .values({
        id: randomUUID(),
        eventId: row.eventId,
        guestId: row.guestId,
        blastId: row.blastId,
        email: row.email,
        subject: row.subject,
        body: row.body,
        status: row.status,
        error: row.error || "",
        sentAt: Date.now(),
      })
      .returning()
      .get();
  }

  /** How many email-everyone sends this event started since `since` (ms). */
  emailBlastsSince(eventId: string, since: number): number {
    const rows = db.select().from(emailLogs).where(eq(emailLogs.eventId, eventId)).all();
    const ids = new Set(rows.filter((row) => row.sentAt >= since).map((row) => row.blastId));
    return ids.size;
  }

  messageCountForGuest(guestId: string): { count: number; lastSentAt: number | null } {
    const rows = db
      .select()
      .from(messageLogs)
      .where(eq(messageLogs.guestId, guestId))
      .all();
    let count = 0;
    let lastSentAt: number | null = null;
    for (const r of rows) {
      count += 1;
      if (lastSentAt === null || r.sentAt > lastSentAt) lastSentAt = r.sentAt;
    }
    return { count, lastSentAt };
  }

  // ---------- events ----------

  getLegacyEvent(): EventRecord | undefined {
    return db.select().from(events).where(eq(events.isLegacyRoot, 1)).get();
  }

  getEvent(id: string): EventRecord | undefined {
    return db.select().from(events).where(eq(events.id, id)).get();
  }

  getEventBySlug(slug: string): EventRecord | undefined {
    return db.select().from(events).where(eq(events.slug, slug.trim().toLowerCase())).get();
  }

  listEvents(): EventRecord[] {
    return db.select().from(events).all().sort((a, b) => b.createdAt - a.createdAt);
  }

  getEventByHostname(host: string): EventRecord | undefined {
    const h = host.trim().toLowerCase();
    if (!h) return undefined;
    return this.listEvents().find((e) =>
      e.hostnames
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
        .includes(h),
    );
  }

  createEvent(row: typeof events.$inferInsert): EventRecord {
    return db.insert(events).values(row).returning().get();
  }

  updateEvent(id: string, patch: Partial<EventRecord>): EventRecord {
    return db
      .update(events)
      .set({ ...patch, updatedAt: Date.now() })
      .where(eq(events.id, id))
      .returning()
      .get();
  }

  /** Empty legacy event used by the original first-run setup screen. */
  createLegacyShell(): EventRecord {
    const existing = this.getLegacyEvent();
    if (existing) return existing;
    const now = Date.now();
    const hosts = (process.env.LEGACY_ROOT_HOSTS || "www.leahaespinoza.com,leahaespinoza.com")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .join(",");
    return this.createEvent({
      id: LEAH_EVENT_ID,
      slug: "leah",
      isLegacyRoot: 1,
      status: "active",
      package: "basic",
      template: "quince",
      paid: 1,
      honoree: EVENT.honoree,
      partnerName: "",
      eventKind: "quinceanera",
      familyLine: "Espinoza De Anda Family",
      title: "Quinceañera",
      dateIso: "2026-09-18",
      dateLong: EVENT.dateLong,
      dateLongEs: "Viernes, 18 de septiembre de 2026",
      dayName: "FRIDAY, SEP",
      dayNameEs: "VIERNES, SEP",
      day: "18",
      year: "2026",
      ceremonyLabel: "Mass",
      ceremonyLabelEs: "Misa",
      ceremonyTime: EVENT.massTime,
      ceremonyVenue: EVENT.massVenue,
      ceremonyAddress: EVENT.massAddress,
      receptionTime: EVENT.receptionTime,
      receptionVenue: EVENT.receptionVenue,
      receptionAddress: EVENT.receptionAddress,
      rsvpByLabel: EVENT.rsvpBy,
      rsvpByLabelEs: "18 de agosto de 2026",
      rsvpClosesOn: "",
      photoUploadUrl: EVENT.photoUploadUrl,
      dressCode: "",
      dressCodeEs: "",
      giftText: "",
      giftTextEs: "",
      aboutText: "",
      aboutTextEs: "",
      hotelsJson: "[]",
      scheduleJson: "[]",
      photosJson: "[]",
      hostnames: hosts,
      desiredDomain: "",
      customDomain: 0,
      customNotes: "",
      smtpUser: "",
      smtpPass: "",
      notifyEmail: "",
      stripeSessionId: null,
      amountCents: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  // ---------- hosts ----------

  createHost(eventId: string, email: string, passwordHash: string): EventHost {
    return db
      .insert(eventHosts)
      .values({
        id: randomUUID(),
        eventId,
        email: email.trim().toLowerCase(),
        passwordHash,
        createdAt: Date.now(),
      })
      .returning()
      .get();
  }

  getHost(id: string): EventHost | undefined {
    return db.select().from(eventHosts).where(eq(eventHosts.id, id)).get();
  }

  hostsForEvent(eventId: string): EventHost[] {
    return db.select().from(eventHosts).where(eq(eventHosts.eventId, eventId)).all();
  }

  hostsByEmail(email: string): EventHost[] {
    const needle = email.trim().toLowerCase();
    return db.select().from(eventHosts).all().filter((h) => h.email.toLowerCase() === needle);
  }

  updateHostPassword(id: string, passwordHash: string) {
    db.update(eventHosts).set({ passwordHash }).where(eq(eventHosts.id, id)).run();
  }

  // ---------- orders ----------

  createOrder(row: typeof orders.$inferInsert): Order {
    return db.insert(orders).values(row).returning().get();
  }

  getOrder(id: string): Order | undefined {
    return db.select().from(orders).where(eq(orders.id, id)).get();
  }

  getOrderBySession(sessionId: string): Order | undefined {
    return db.select().from(orders).where(eq(orders.stripeSessionId, sessionId)).get();
  }

  latestOrder(eventId: string): Order | undefined {
    return db
      .select()
      .from(orders)
      .where(eq(orders.eventId, eventId))
      .all()
      .sort((a, b) => b.createdAt - a.createdAt)[0];
  }

  updateOrder(id: string, patch: Partial<Order>): Order {
    return db.update(orders).set(patch).where(eq(orders.id, id)).returning().get();
  }

  // ---------- super admins ----------

  getSuper(id: string): SuperAdmin | undefined {
    return db.select().from(superAdmins).where(eq(superAdmins.id, id)).get();
  }

  getSuperByEmail(email: string): SuperAdmin | undefined {
    const needle = email.trim().toLowerCase();
    return db
      .select()
      .from(superAdmins)
      .all()
      .find((s) => s.email.toLowerCase() === needle);
  }

  /**
   * Remove one event and the rows that exist only for it: guests, RSVPs,
   * text and email logs, the host login, and payment orders. Does not touch
   * the global settings row or the Studio login.
   */
  deleteEvent(eventId: string): {
    guests: number;
    responses: number;
    messages: number;
    emails: number;
    hosts: number;
    orders: number;
  } {
    const run = sqlite.transaction(() => {
      const responsesDeleted = sqlite
        .prepare(
          `DELETE FROM responses WHERE event_id = ? OR guest_id IN (SELECT id FROM guests WHERE event_id = ?)`,
        )
        .run(eventId, eventId).changes;
      const messages = sqlite
        .prepare(
          `DELETE FROM message_logs WHERE event_id = ? OR guest_id IN (SELECT id FROM guests WHERE event_id = ?)`,
        )
        .run(eventId, eventId).changes;
      const emails = sqlite.prepare(`DELETE FROM email_logs WHERE event_id = ?`).run(eventId).changes;
      const guestRows = sqlite.prepare(`DELETE FROM guests WHERE event_id = ?`).run(eventId).changes;
      const hosts = sqlite.prepare(`DELETE FROM event_hosts WHERE event_id = ?`).run(eventId).changes;
      const orderRows = sqlite.prepare(`DELETE FROM orders WHERE event_id = ?`).run(eventId).changes;
      sqlite.prepare(`DELETE FROM events WHERE id = ?`).run(eventId);
      return {
        guests: guestRows,
        responses: responsesDeleted,
        messages,
        emails,
        hosts,
        orders: orderRows,
      };
    });
    return run();
  }

  createSuper(email: string, passwordHash: string): SuperAdmin {
    return db
      .insert(superAdmins)
      .values({ id: randomUUID(), email: email.trim().toLowerCase(), passwordHash })
      .returning()
      .get();
  }
}

export const storage = new Storage();

/**
 * One-shot removal of platform test signups. Same guards as Studio delete.
 * A missing row is a no-op. Leah's event and sample sites are never matched.
 */
function removeNamedTestEvent(slug: string) {
  const event = storage.getEventBySlug(slug);
  if (!event || event.isLegacyRoot || event.isDemo || event.id === LEAH_EVENT_ID || event.slug === "leah") return;
  const orders = sqlite
    .prepare(
      `SELECT kind, package, status, amount_cents AS amountCents FROM orders WHERE event_id = ?`,
    )
    .all(event.id);
  console.log(
    "[db] removing test event",
    slug,
    JSON.stringify({ paid: event.paid, package: event.package, amountCents: event.amountCents, orders }),
  );
  const removed = storage.deleteEvent(event.id);
  const dbPath = process.env.DATABASE_PATH || "./data.db";
  const root = process.env.UPLOAD_DIR || path.resolve(path.dirname(dbPath), "uploads");
  fs.rmSync(path.join(root, event.id), { recursive: true, force: true });
  console.log("[db] removed test event", slug, JSON.stringify(removed));
}
removeNamedTestEvent("pricing-check-1792661008976");
removeNamedTestEvent("stripe-test-1792699025");

seedDemoEvents(storage);
