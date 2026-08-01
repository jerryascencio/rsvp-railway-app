import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const guests = sqliteTable("guests", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  /** How Leah refers to them when texting (e.g. "Concho & Maria", "Marty").
   *  Falls back to partyName or firstName when blank. */
  nameForText: text("name_for_text").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  fullName: text("full_name").notNull().default(""),
  /**
   * Free-form "Name of party" label, e.g. "Concho & Maria" or
   * "Marty & Jerry & Mama Luz". Shown on the admin list and used by search
   * even when firstName/lastName are still blank.
   */
  partyName: text("party_name").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email"),
  invites: integer("invites").notNull().default(1),
  /** Adults and kids counts from the source spreadsheet (for reference / templates). */
  adults: integer("adults").notNull().default(0),
  kids: integer("kids").notNull().default(0),
  /** "English" / "Spanish" / "" — from the Language column. */
  language: text("language").notNull().default(""),
  /** Free-form status column from the spreadsheet (e.g. "Pending Silvia's confirmation"). */
  invitationSent: text("invitation_sent").notNull().default(""),
  /** JSON-encoded Array<{firstName,lastName}>. SQLite has no array type. */
  additionalNames: text("additional_names"),
  /** Unix ms of last write to this row via storage.createGuest/updateGuest.
   *  Nullable so pre-existing rows don't need backfill. */
  updatedAt: integer("updated_at"),
});

/** One extra household member. */
export const additionalNameSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
});
export const additionalNamesSchema = additionalNameSchema.array();
export type AdditionalName = z.infer<typeof additionalNameSchema>;

/** Insert schema for guests: additionalNames accepted as a real array. */
export const insertGuestSchema = createInsertSchema(guests)
  .omit({ id: true, fullName: true, additionalNames: true })
  .extend({
    additionalNames: additionalNamesSchema.optional(),
    partyName: z.string().optional(),
    nameForText: z.string().optional(),
    adults: z.number().optional(),
    kids: z.number().optional(),
    language: z.string().optional(),
    invitationSent: z.string().optional(),
  });
export type InsertGuestInput = z.infer<typeof insertGuestSchema>;

/** Parse the raw JSON text column into a typed array. Never throws. */
export function parseAdditionalNames(raw: string | null | undefined): AdditionalName[] {
  if (!raw || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    const result = additionalNamesSchema.safeParse(parsed);
    if (!result.success) return [];
    return result.data
      .map((n) => ({ firstName: (n.firstName || "").trim(), lastName: (n.lastName || "").trim() }))
      .filter((n) => n.firstName || n.lastName);
  } catch {
    return [];
  }
}

/** Serialize a typed array back to the JSON text column (null when empty). */
export function serializeAdditionalNames(
  list: AdditionalName[] | null | undefined,
): string | null {
  if (!list || list.length === 0) return null;
  const clean = list
    .map((n) => ({
      firstName: (n?.firstName || "").trim(),
      lastName: (n?.lastName || "").trim(),
    }))
    .filter((n) => n.firstName || n.lastName);
  return clean.length ? JSON.stringify(clean) : null;
}

export const responses = sqliteTable("responses", {
  id: text("id").primaryKey(),
  guestId: text("guest_id").notNull(),
  attending: text("attending").notNull(), // 'yes' | 'no'
  attendees: integer("attendees").notNull().default(0),
  declinedCount: integer("declined_count").notNull().default(0),
  guestEmail: text("guest_email"),
  note: text("note"),
  /** Optional per-attendee names captured on the public RSVP form so we
   *  can print accurate place cards. Stored separately from the household's
   *  primary + additional names — those stay untouched. JSON array of
   *  strings, length matches `attendees`. Nullable when the guest skipped
   *  the optional section. */
  placeCardNames: text("place_card_names"),
  updatedAt: integer("updated_at").notNull(),
});

/** One row per iMessage link generated for a guest. We can't confirm iOS
 *  actually delivered the message — this is a log of intent to send. */
export const messageLogs = sqliteTable("message_logs", {
  id: text("id").primaryKey(),
  guestId: text("guest_id").notNull(),
  phone: text("phone").notNull(),
  body: text("body").notNull(),
  sentAt: integer("sent_at").notNull(),
});
export type MessageLog = typeof messageLogs.$inferSelect;

export const admins = sqliteTable("admins", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
});

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey(),
  smtpUser: text("smtp_user").notNull().default(""),
  smtpPass: text("smtp_pass").notNull().default(""),
  notifyEmail: text("notify_email").notNull().default("stef.espin@gmail.com"),
  adminEmail: text("admin_email").notNull().default(""),
  sessionSecret: text("session_secret").notNull().default(""),
  setupComplete: integer("setup_complete").notNull().default(0),
});

/** Raw database row — additionalNames is JSON text. */
export type GuestRow = typeof guests.$inferSelect;
/** App-facing guest — additionalNames is a parsed array. */
export type Guest = Omit<GuestRow, "additionalNames"> & {
  additionalNames: AdditionalName[];
};
export type InsertGuest = Omit<typeof guests.$inferInsert, "additionalNames"> & {
  additionalNames?: AdditionalName[];
};
export type RsvpResponse = typeof responses.$inferSelect;
export type InsertResponse = typeof responses.$inferInsert;
export type Admin = typeof admins.$inferSelect;
export type Settings = typeof settings.$inferSelect;

/** Guest joined with its response, as returned by the API. */
export type GuestWithResponse = Guest & {
  response: RsvpResponse | null;
  /** Total iMessage sends recorded via Hit em up (0 if never messaged). */
  messageCount?: number;
  /** Unix ms of last message we opened for this guest, or null. */
  lastMessagedAt?: number | null;
  /** Unix ms of the most recent activity on this party — max of guest edit,
   *  response update, or last message sent. Null when no activity yet. */
  lastActivityAt?: number | null;
};

export type Totals = {
  totalInvited: number;
  totalHeadcount: number;
  totalDeclined: number;
  totalPending: number;
  totalPendingHouseholds: number;
  totalHouseholds: number;
  respondedHouseholds: number;
  responseRate: number;
};

export function normalizePhone(v: string | null | undefined): string {
  return (v || "").replace(/\D/g, "");
}

export const EVENT = {
  honoree: "Leah Adalynn Espinoza",
  dateLong: "Friday, September 18, 2026",
  dayName: "FRIDAY, SEP",
  day: "18",
  year: "2026",
  massTime: "2:30 PM",
  massVenue: "Guardian Angel Church",
  massAddress: "12307 Terra Bella St, Pacoima, CA 91331",
  receptionTime: "5:00 PM",
  receptionVenue: "Platinum Banquet Hall",
  receptionAddress: "8704 Van Nuys Blvd, Panorama City, CA 91402",
  rsvpBy: "August 18, 2026",
};
