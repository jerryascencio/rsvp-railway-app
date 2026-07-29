import { guests, responses, admins, settings } from "@shared/schema";
import type {
  Guest,
  InsertGuest,
  RsvpResponse,
  Admin,
  Settings,
  GuestWithResponse,
  Totals,
} from "@shared/schema";
import { normalizePhone } from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import { randomUUID, randomBytes } from "node:crypto";

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
  phone TEXT NOT NULL DEFAULT '',
  email TEXT,
  invites INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY,
  guest_id TEXT NOT NULL,
  attending TEXT NOT NULL,
  attendees INTEGER NOT NULL DEFAULT 0,
  declined_count INTEGER NOT NULL DEFAULT 0,
  guest_email TEXT,
  note TEXT,
  updated_at INTEGER NOT NULL
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
  allGuests(): Guest[] {
    return db.select().from(guests).all();
  }

  getGuest(id: string): Guest | undefined {
    return db.select().from(guests).where(eq(guests.id, id)).get();
  }

  createGuest(g: Omit<InsertGuest, "id" | "fullName"> & { id?: string }): Guest {
    const first = (g.firstName || "").trim();
    const last = (g.lastName || "").trim();
    return db
      .insert(guests)
      .values({
        id: g.id || randomUUID(),
        firstName: first,
        lastName: last,
        fullName: `${first} ${last}`.trim(),
        phone: (g.phone || "").trim(),
        email: g.email ? g.email.trim() : null,
        invites: Math.max(1, Number(g.invites) || 1),
      })
      .returning()
      .get();
  }

  updateGuest(id: string, patch: Partial<Guest>): Guest | undefined {
    const existing = this.getGuest(id);
    if (!existing) return undefined;
    const firstName = patch.firstName !== undefined ? patch.firstName.trim() : existing.firstName;
    const lastName = patch.lastName !== undefined ? (patch.lastName || "").trim() : existing.lastName;
    return db
      .update(guests)
      .set({
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`.trim(),
        phone: patch.phone !== undefined ? (patch.phone || "").trim() : existing.phone,
        email: patch.email !== undefined ? (patch.email || null) : existing.email,
        invites:
          patch.invites !== undefined
            ? Math.max(1, Number(patch.invites) || 1)
            : existing.invites,
      })
      .where(eq(guests.id, id))
      .returning()
      .get();
  }

  deleteGuest(id: string) {
    db.delete(responses).where(eq(responses.guestId, id)).run();
    db.delete(guests).where(eq(guests.id, id)).run();
  }

  /** Single-field fuzzy search across name / phone / email. */
  searchGuests(q: string): Guest[] {
    const needle = (q || "").trim().toLowerCase();
    if (!needle) return [];
    const digits = needle.replace(/\D/g, "");
    return this.allGuests().filter((g) => {
      const phone = normalizePhone(g.phone);
      if (digits.length >= 3 && phone && phone.includes(digits)) return true;
      if (g.email && g.email.toLowerCase().includes(needle)) return true;
      if (g.firstName && g.firstName.toLowerCase().includes(needle)) return true;
      if (g.lastName && g.lastName.toLowerCase().includes(needle)) return true;
      const full = `${g.firstName} ${g.lastName}`.trim().toLowerCase();
      if (full.includes(needle)) return true;
      return false;
    });
  }

  // ---------- responses ----------
  allResponses(): RsvpResponse[] {
    return db.select().from(responses).all();
  }

  getResponseByGuest(guestId: string): RsvpResponse | undefined {
    return db.select().from(responses).where(eq(responses.guestId, guestId)).get();
  }

  upsertResponse(input: {
    guestId: string;
    attending: "yes" | "no";
    attendees: number;
    declinedCount: number;
    guestEmail?: string | null;
    note?: string | null;
  }): RsvpResponse {
    const existing = this.getResponseByGuest(input.guestId);
    const values = {
      guestId: input.guestId,
      attending: input.attending,
      attendees: input.attendees,
      declinedCount: input.declinedCount,
      guestEmail: input.guestEmail || null,
      note: input.note || null,
      updatedAt: Date.now(),
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
  guestsWithResponses(): GuestWithResponse[] {
    const rs = this.allResponses();
    const byGuest = new Map(rs.map((r) => [r.guestId, r]));
    return this.allGuests()
      .map((g) => ({ ...g, response: byGuest.get(g.id) || null }))
      .sort((a, b) =>
        (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName),
      );
  }

  totals(): Totals {
    const rows = this.guestsWithResponses();
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
        totalDeclined += Math.max(0, g.invites - g.response.attendees);
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
}

export const storage = new Storage();
