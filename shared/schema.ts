import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const guests = sqliteTable("guests", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull().default(""),
  fullName: text("full_name").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email"),
  invites: integer("invites").notNull().default(1),
});

export const responses = sqliteTable("responses", {
  id: text("id").primaryKey(),
  guestId: text("guest_id").notNull(),
  attending: text("attending").notNull(), // 'yes' | 'no'
  attendees: integer("attendees").notNull().default(0),
  declinedCount: integer("declined_count").notNull().default(0),
  guestEmail: text("guest_email"),
  note: text("note"),
  updatedAt: integer("updated_at").notNull(),
});

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

export type Guest = typeof guests.$inferSelect;
export type InsertGuest = typeof guests.$inferInsert;
export type RsvpResponse = typeof responses.$inferSelect;
export type InsertResponse = typeof responses.$inferInsert;
export type Admin = typeof admins.$inferSelect;
export type Settings = typeof settings.$inferSelect;

/** Guest joined with its response, as returned by the API. */
export type GuestWithResponse = Guest & {
  response: RsvpResponse | null;
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
