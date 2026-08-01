import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "node:http";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { storage } from "./storage";
import { sendRsvpEmails, sendTestEmail } from "./mailer";
import { normalizePhone, additionalNamesSchema } from "@shared/schema";
import type { AdditionalName } from "@shared/schema";

/** Max number of extra household members supported (party size 10). */
const MAX_ADDITIONAL = 9;

/**
 * Parse a free-form "Full names" cell into an ordered list of people.
 * Handles Jerry's real-world patterns:
 *   - "," / "&" / " y " separators
 *   - "x2" / "x 2" suffix meaning "one more of the same"
 *   - "??" / "???" placeholders — skipped
 *   - Nickname quotes stripped (e.g. Jose "Conception" Concho → Jose Concho)
 */
function splitFullNames(raw: string): AdditionalName[] {
  if (!raw) return [];
  // Normalize quotes and separators.
  let s = raw
    .replace(/[“”„‟"]/g, '"')
    .replace(/[‘’]/g, "'")
    // Nicknames like Jose "Conception" Concho → Jose Concho
    .replace(/"[^"]*"/g, " ")
    .replace(/\s+y\s+/gi, ", ")
    .replace(/\s*&\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
  // Split on commas.
  const parts = s.split(/\s*,\s*/).map((p) => p.trim()).filter(Boolean);
  const out: AdditionalName[] = [];
  for (const p of parts) {
    // "x2" or "x 2" suffix duplicates the previous person.
    const dupMatch = p.match(/^(.*?)\s*x\s*2\s*$/i);
    if (dupMatch) {
      const namePart = dupMatch[1].trim();
      if (namePart && namePart !== p) {
        // Named + dup: "Osiris Rodriguez x 2" → Osiris Rodriguez + Osiris Rodriguez
        const person = toPerson(namePart);
        if (person) {
          out.push(person);
          out.push({ ...person });
        }
      } else if (out.length > 0) {
        // Bare "x2" → duplicate previous entry.
        out.push({ ...out[out.length - 1] });
      }
      continue;
    }
    // Skip "??" placeholders (2+ question marks with maybe nothing else).
    if (/^\??\?+$/.test(p)) continue;
    // Handle mixed like "Marco An>???" — strip trailing ??? and >.
    const cleaned = p.replace(/[>?]+$/g, "").trim();
    if (!cleaned || /^\??\?+$/.test(cleaned)) continue;
    const person = toPerson(cleaned);
    if (person) out.push(person);
  }
  return out.slice(0, MAX_ADDITIONAL + 1); // primary + up to MAX extras
}

/** Split a single "First [Middle] Last" chunk into firstName + lastName. */
function toPerson(chunk: string): AdditionalName | null {
  const tokens = chunk.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;
  if (tokens.length === 1) return { firstName: tokens[0], lastName: "" };
  const firstName = tokens[0];
  const lastName = tokens.slice(1).join(" ");
  return { firstName, lastName };
}

/** Coerce an untrusted request body value into a clean AdditionalName[]. */
function readAdditionalNames(v: unknown): AdditionalName[] | undefined {
  if (v === undefined) return undefined;
  if (v === null) return [];
  const raw = Array.isArray(v) ? v : [];
  const normalized = raw.map((n: any) => ({
    firstName: String(n?.firstName ?? "").trim(),
    lastName: String(n?.lastName ?? "").trim(),
  }));
  const parsed = additionalNamesSchema.safeParse(normalized);
  if (!parsed.success) return [];
  return parsed.data
    .filter((n) => n.firstName || n.lastName)
    .slice(0, MAX_ADDITIONAL);
}

const SESSION_DAYS = 14;
const COOKIE = "qc_session";

function sessionSecret() {
  return process.env.SESSION_SECRET || storage.getSettings().sessionSecret;
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function makeToken(adminId: string): string {
  const secret = sessionSecret();
  const expiresAt = Date.now() + SESSION_DAYS * 86400_000;
  const payload = Buffer.from(JSON.stringify({ adminId, expiresAt })).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

function readToken(token: string | undefined): { adminId: string } | null {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  const secret = sessionSecret();
  const expected = sign(payload, secret);
  try {
    if (
      sig.length !== expected.length ||
      !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    )
      return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.adminId || !data.expiresAt || data.expiresAt < Date.now()) return null;
    if (!storage.getAdmin(data.adminId)) return null;
    return { adminId: data.adminId };
  } catch {
    return null;
  }
}

function currentAdmin(req: Request): { adminId: string } | null {
  const header = req.headers.authorization;
  const bearer = header && header.startsWith("Bearer ") ? header.slice(7) : undefined;
  return readToken(bearer) || readToken((req as any).cookies?.[COOKIE]);
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const session = currentAdmin(req);
  if (!session) return res.status(401).json({ message: "Not authorized" });
  (req as any).adminId = session.adminId;
  next();
}

/** Minimal CSV parser handling quoted fields. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

function csvEscape(v: unknown) {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.use(cookieParser());
  storage.getSettings(); // ensure settings row + session secret exist

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, setupComplete: storage.adminCount() > 0 });
  });

  // ---------------- public ----------------
  app.get("/api/event", (_req, res) => {
    const s = storage.getSettings();
    res.json({ setupComplete: !!s.setupComplete, adminExists: storage.adminCount() > 0 });
  });

  app.get("/api/guests", (req, res) => {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ matches: [] });
    const matches = storage.searchGuests(q).map((g) => {
      const r = storage.getResponseByGuest(g.id);
      return {
        id: g.id,
        firstName: g.firstName,
        lastName: g.lastName,
        fullName: g.fullName || `${g.firstName} ${g.lastName}`.trim(),
        invites: g.invites,
        email: g.email,
        additionalNames: g.additionalNames,
        existing: r
          ? { attendees: r.attendees, declinedCount: r.declinedCount, note: r.note, guestEmail: r.guestEmail }
          : null,
      };
    });
    res.json({ matches });
  });

  app.post("/api/rsvp", async (req, res) => {
    const { guestId, note } = req.body || {};
    const guest = guestId ? storage.getGuest(String(guestId)) : undefined;
    if (!guest) return res.status(404).json({ message: "Guest not found" });

    // Guest can optionally type in names when the host didn't record any.
    // Parse them first — they may shrink the "expected total" below invites.
    const parsedTypedNames = readAdditionalNames(req.body?.additionalNames) || [];
    const storedNames = (guest.additionalNames || []).filter(
      (n) => n.firstName || n.lastName,
    );
    // Named list total = 1 (primary) + count of extras. Fall back to invites.
    const namedTotal =
      storedNames.length > 0
        ? 1 + storedNames.length
        : parsedTypedNames.length > 0
          ? 1 + parsedTypedNames.length
          : null;
    const expectedTotal = namedTotal ?? guest.invites;

    let attendees = Number(req.body?.attendees);
    let declinedCount = Number(req.body?.declinedCount);
    if (!Number.isFinite(attendees) || attendees < 0) attendees = 0;
    attendees = Math.min(Math.round(attendees), expectedTotal);
    if (!Number.isFinite(declinedCount) || declinedCount < 0)
      declinedCount = expectedTotal - attendees;
    declinedCount = Math.min(Math.round(declinedCount), expectedTotal);
    if (attendees + declinedCount !== expectedTotal) {
      declinedCount = expectedTotal - attendees;
    }

    // If the guest typed names AND the host had none stored, persist them on
    // the guest record so the admin dashboard and future emails show them.
    if (storedNames.length === 0 && parsedTypedNames.length > 0) {
      try {
        storage.updateGuest(guest.id, { additionalNames: parsedTypedNames });
        guest.additionalNames = parsedTypedNames;
      } catch (err: any) {
        console.warn("[rsvp] failed to save typed additionalNames:", err?.message || err);
      }
    }

    const guestEmail = req.body?.guestEmail ? String(req.body.guestEmail).trim() : null;
    const attending: "yes" | "no" = attendees > 0 ? "yes" : "no";
    const language: "en" | "es" = req.body?.language === "es" ? "es" : "en";

    const response = storage.upsertResponse({
      guestId: guest.id,
      attending,
      attendees,
      declinedCount,
      guestEmail,
      note: note ? String(note).trim() : null,
    });

    const totals = storage.totals();
    let email = { reportSent: false, guestSent: false } as any;
    try {
      email = await sendRsvpEmails({
        settings: storage.getSettings(),
        guest,
        response,
        totals,
        language,
      });
    } catch (err: any) {
      console.warn("[rsvp] email step failed but RSVP saved:", err?.message || err);
    }

    res.json({
      ok: true,
      response,
      guest: { firstName: guest.firstName, fullName: guest.fullName, invites: guest.invites },
      totals,
      email,
    });
  });

  // ---------------- auth ----------------
  app.get("/api/auth/status", (req, res) => {
    const s = storage.getSettings();
    const session = currentAdmin(req);
    res.json({
      needsSetup: storage.adminCount() === 0,
      authenticated: !!session,
      adminEmail: session ? storage.getAdmin(session.adminId)?.email : undefined,
      defaults: {
        adminEmail: s.adminEmail || "jerry@jerryateam.com",
        smtpUser: s.smtpUser || "leah.a.espin@gmail.com",
        notifyEmail: s.notifyEmail || "stef.espin@gmail.com",
      },
    });
  });

  app.post("/api/auth/setup", (req, res) => {
    if (storage.adminCount() > 0)
      return res.status(400).json({ message: "Setup has already been completed." });
    const { adminEmail, password, smtpUser, smtpPass, notifyEmail } = req.body || {};
    if (!adminEmail || !password || String(password).length < 6)
      return res
        .status(400)
        .json({ message: "Admin email and a password of at least 6 characters are required." });
    const admin = storage.createAdmin(
      String(adminEmail),
      bcrypt.hashSync(String(password), 10),
    );
    storage.updateSettings({
      adminEmail: String(adminEmail).trim().toLowerCase(),
      smtpUser: String(smtpUser || "").trim(),
      smtpPass: String(smtpPass || "").trim(),
      notifyEmail: String(notifyEmail || "stef.espin@gmail.com").trim(),
      setupComplete: 1,
      sessionSecret: storage.getSettings().sessionSecret || randomBytes(32).toString("hex"),
    });
    const token = makeToken(admin.id);
    res.cookie(COOKIE, token, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: SESSION_DAYS * 86400_000,
    });
    res.json({ ok: true, token, adminEmail: admin.email });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body || {};
    const admin = storage.getAdminByEmail(String(email || ""));
    if (!admin || !bcrypt.compareSync(String(password || ""), admin.passwordHash))
      return res.status(401).json({ message: "Incorrect email or password." });
    const token = makeToken(admin.id);
    res.cookie(COOKIE, token, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: SESSION_DAYS * 86400_000,
    });
    res.json({ ok: true, token, adminEmail: admin.email });
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie(COOKIE);
    res.json({ ok: true });
  });

  // ---------------- admin ----------------
  app.get("/api/admin/overview", requireAdmin, (_req, res) => {
    res.json({ totals: storage.totals() });
  });

  app.get("/api/admin/guests", requireAdmin, (_req, res) => {
    // Attach per-guest message-history summary so the admin UI can show
    // "3 sent · last 2d ago" chips without a second request per row.
    const counts = storage.messageCounts();
    const list = storage.guestsWithResponses().map((g) => ({
      ...g,
      messageCount: counts[g.id]?.count ?? 0,
      lastMessagedAt: counts[g.id]?.lastSentAt ?? null,
    }));
    res.json({ guests: list, totals: storage.totals() });
  });

  /** Log that an iMessage draft was opened for a guest. Called by the admin
   *  Hit em up flow each time she taps "Send" and the sms: URL is opened. */
  app.post("/api/admin/messages/log", requireAdmin, (req, res) => {
    const { guestId, phone, body } = req.body || {};
    if (!guestId || !phone || !body) {
      return res.status(400).json({ message: "guestId, phone, body required." });
    }
    const guest = storage.getGuest(String(guestId));
    if (!guest) return res.status(404).json({ message: "Guest not found." });
    const log = storage.logMessage(String(guestId), String(phone), String(body));
    res.json({ log });
  });

  /** Optional: list all logs for one guest (for a future "history" view). */
  app.get("/api/admin/messages/:guestId", requireAdmin, (req, res) => {
    res.json({ logs: storage.messagesForGuest(String(req.params.guestId)) });
  });

  app.post("/api/admin/guests", requireAdmin, (req, res) => {
    const { firstName, lastName, partyName, phone, email, invites } = req.body || {};
    const first = firstName ? String(firstName).trim() : "";
    const party = partyName ? String(partyName).trim() : "";
    // Allow rows with only a party label (e.g. imported "Marty & Jerry & Mama Luz").
    if (!first && !party)
      return res.status(400).json({ message: "First name or party name is required." });
    const guest = storage.createGuest({
      firstName: first,
      lastName: String(lastName || ""),
      partyName: party,
      phone: String(phone || ""),
      email: email ? String(email) : null,
      invites: Number(invites) || 1,
      additionalNames: readAdditionalNames(req.body?.additionalNames) ?? [],
    });
    res.json({ guest });
  });

  app.patch("/api/admin/guests/:id", requireAdmin, (req, res) => {
    const guest = storage.updateGuest(String(req.params.id), {
      firstName: req.body?.firstName,
      lastName: req.body?.lastName,
      partyName: req.body?.partyName,
      phone: req.body?.phone,
      email: req.body?.email,
      invites: req.body?.invites,
      additionalNames: readAdditionalNames(req.body?.additionalNames),
    });
    if (!guest) return res.status(404).json({ message: "Guest not found" });

    // response fields (optional)
    if (req.body?.clearResponse) {
      storage.deleteResponse(guest.id);
    } else if (req.body?.attendees !== undefined && req.body?.attendees !== null && req.body?.attendees !== "") {
      let attendees = Math.max(0, Math.min(guest.invites, Math.round(Number(req.body.attendees) || 0)));
      let declined = req.body?.declinedCount === undefined || req.body?.declinedCount === null || req.body?.declinedCount === ""
        ? guest.invites - attendees
        : Math.max(0, Math.min(guest.invites, Math.round(Number(req.body.declinedCount) || 0)));
      if (attendees + declined !== guest.invites) declined = guest.invites - attendees;
      storage.upsertResponse({
        guestId: guest.id,
        attending: attendees > 0 ? "yes" : "no",
        attendees,
        declinedCount: declined,
        guestEmail: req.body?.guestEmail ?? storage.getResponseByGuest(guest.id)?.guestEmail ?? null,
        note: req.body?.note ?? storage.getResponseByGuest(guest.id)?.note ?? null,
      });
    }
    res.json({ guest: storage.guestsWithResponses().find((g) => g.id === guest.id) });
  });

  app.delete("/api/admin/guests/:id", requireAdmin, (req, res) => {
    storage.deleteGuest(String(req.params.id));
    res.json({ ok: true });
  });

  // Nuke every guest + response. Used by "Delete all guests" in the admin UI
  // when Jerry needs to re-import a canonical CSV from scratch. Body must
  // include { confirm: "DELETE_ALL_GUESTS" } so accidental calls fail loud.
  app.post("/api/admin/guests/reset", requireAdmin, (req, res) => {
    if (req.body?.confirm !== "DELETE_ALL_GUESTS") {
      return res.status(400).json({ message: "Missing confirm token." });
    }
    const all = storage.allGuests();
    for (const g of all) storage.deleteGuest(g.id);
    res.json({ ok: true, deleted: all.length });
  });

  app.post("/api/admin/guests/import", requireAdmin, (req, res) => {
    const csv = String(req.body?.csv || "");
    if (!csv.trim()) return res.status(400).json({ message: "CSV content is empty." });
    const rows = parseCsv(csv);
    if (rows.length === 0) return res.status(400).json({ message: "No rows found." });

    let header = rows[0].map((h) => h.trim().toLowerCase().replace(/[\s_#\-\.]/g, ""));
    const known = [
      "firstname", "lastname", "phone", "phonenumber", "phonenumbers", "email",
      "invites", "totalinvites", "nameofparty", "partyname", "fullnames",
      "ofadults", "adults", "ofkids", "kids",
      "namefortext", "textname",
    ];
    const hasHeader =
      header.some((h) => known.includes(h)) ||
      header.some((h) => /^additional\d(first|last)$/.test(h));
    // Find the first header cell matching any of a list of aliases.
    const idxOf = (...aliases: string[]) => {
      for (const a of aliases) {
        const i = header.indexOf(a);
        if (i >= 0) return i;
      }
      return -1;
    };
    const idx = (name: string) => idxOf(name);
    const cols = hasHeader
      ? {
          firstName: idx("firstname"),
          lastName: idx("lastname"),
          phone: idxOf("phone", "phonenumber", "phonenumbers"),
          email: idx("email"),
          invites: idxOf("invites", "totalinvites"),
          partyName: idxOf("nameofparty", "partyname"),
          fullNames: idxOf("fullnames", "fullname"),
          adults: idxOf("ofadults", "adults"),
          kids: idxOf("ofkids", "kids"),
          nameForText: idxOf("namefortext", "textname"),
        }
      : {
          firstName: 0, lastName: 1, phone: 2, email: 3, invites: 4,
          partyName: -1, fullNames: -1, adults: -1, kids: -1, nameForText: -1,
        };

    // Optional additional-household-member columns: additional1_first / additional1_last
    // ... up to additional9_*. Header comparison already strips spaces, underscores
    // and hyphens and lowercases, so snake_case, camelCase and hyphenated all work.
    const additionalCols: { first: number; last: number }[] = [];
    for (let n = 1; n <= MAX_ADDITIONAL; n++) {
      additionalCols.push({
        first: hasHeader ? idx(`additional${n}first`) : -1,
        last: hasHeader ? idx(`additional${n}last`) : -1,
      });
    }

    const body = hasHeader ? rows.slice(1) : rows;
    let added = 0,
      updated = 0,
      skipped = 0;
    const existing = storage.allGuests();

    for (const r of body) {
      const get = (i: number) => (i >= 0 && i < r.length ? r[i].trim() : "");
      let firstName = get(cols.firstName);
      let lastName = get(cols.lastName);
      const phone = get(cols.phone);
      const email = get(cols.email);
      const partyName = get(cols.partyName);
      const nameForText = get(cols.nameForText);
      const fullNamesRaw = get(cols.fullNames);
      // Extra CSV columns we now persist so message-template placeholders work
      // for every field Jerry's spreadsheet has.
      const languageRaw = get(idxOf("language"));
      const invitationSentRaw = get(idxOf("invitationsent"));
      const invitesRaw = get(cols.invites);
      const adultsRaw = get(cols.adults);
      const kidsRaw = get(cols.kids);

      // Trust the human's explicit `Total Invites` column when it's a positive
      // number — don't inflate it. This matters because the source spreadsheet
      // sometimes has stray text in `Full names` that would otherwise parse as
      // extra people (e.g. "Tio Gordo" row has 4 names but Total=1).
      // Fall back to Adults+Kids only if Total is blank, and to parsed names
      // only if neither Total nor Adults+Kids give a count.
      const explicitInvites = parseInt(invitesRaw || "", 10);
      const sumInvites = (parseInt(adultsRaw || "0", 10) || 0) + (parseInt(kidsRaw || "0", 10) || 0);
      const parsedCount = fullNamesRaw ? splitFullNames(fullNamesRaw).length : 0;
      let invitesGuess = 0;
      if (Number.isFinite(explicitInvites) && explicitInvites > 0) {
        invitesGuess = explicitInvites;
      } else if (sumInvites > 0) {
        invitesGuess = sumInvites;
      } else if (parsedCount > 0) {
        invitesGuess = parsedCount;
      }
      // Skip zero-invite rows outright — Jerry uses 0/blank invites as a signal
      // that the party isn't invited (Crystal & Mikey, Jackie & BF, Maria/
      // boyfriend). Don't inflate them to 1 seat.
      if (invitesGuess <= 0) {
        skipped++;
        continue;
      }
      const invites = invitesGuess;

      // Parse free-form "Full names" field into primary + extras. Handles the
      // patterns Jerry uses: "," / "&" / " y " separators, "x2" suffix meaning
      // "this person's plus-one", and "??" placeholders for unknown names.
      const additionalNames: AdditionalName[] = [];
      if (fullNamesRaw && (!firstName || !lastName)) {
        const people = splitFullNames(fullNamesRaw);
        if (people.length > 0) {
          if (!firstName) firstName = people[0].firstName;
          if (!lastName) lastName = people[0].lastName;
          for (const p of people.slice(1)) additionalNames.push(p);
        }
      }

      // Structured additionalN_first/last columns still take precedence when present.
      for (const pair of additionalCols) {
        const aFirst = get(pair.first);
        const aLast = get(pair.last);
        if (aFirst && aLast) additionalNames.push({ firstName: aFirst, lastName: aLast });
      }

      // If we still have no name at all but do have a party label, treat the
      // party label as the guest's display name so Jerry can find them.
      // firstName stays blank; partyName is stored separately and shown in the UI.
      // Only truly-empty rows (no party label, no name, no phone) are skipped.
      if (!firstName && !lastName && !partyName && !phone) {
        skipped++;
        continue;
      }
      // A row like "TOTALS,,262,16,278" would leak in as a party — guard against
      // the literal totals summary row.
      if (partyName && /^totals?$/i.test(partyName)) {
        skipped++;
        continue;
      }
      if (!firstName && !lastName && !partyName) {
        // A row with only a phone number — unusual, but keep it as an anon party.
        firstName = "(unnamed)";
      }
      const digits = normalizePhone(phone);
      let match = digits
        ? existing.find((g) => normalizePhone(g.phone) && normalizePhone(g.phone) === digits)
        : undefined;
      if (!match && partyName.trim()) {
        match = existing.find(
          (g) =>
            (g.partyName || "").trim().toLowerCase() ===
            partyName.trim().toLowerCase(),
        );
      }
      // Only match on firstName+lastName when BOTH are non-empty. Otherwise every
      // row with a blank Full names cell would collide with every other blank-name
      // row in the DB (they'd all "match" each other with firstName=""), which
      // caused the first re-import to collapse 118 rows into 44 households.
      if (!match && firstName.trim() && lastName.trim()) {
        match = existing.find(
          (g) =>
            g.firstName.trim().toLowerCase() === firstName.trim().toLowerCase() &&
            (g.lastName || "").trim().toLowerCase() === lastName.trim().toLowerCase(),
        );
      }
      if (match) {
        const u = storage.updateGuest(match.id, {
          firstName,
          lastName,
          partyName: partyName || match.partyName,
          nameForText: nameForText || match.nameForText,
          adults: parseInt(adultsRaw || "", 10) || match.adults,
          kids: parseInt(kidsRaw || "", 10) || match.kids,
          language: languageRaw || match.language,
          invitationSent: invitationSentRaw || match.invitationSent,
          phone: phone || match.phone,
          email: email || match.email,
          invites,
          additionalNames: additionalNames.length ? additionalNames : match.additionalNames,
        } as any);
        if (u) {
          Object.assign(match, u);
          updated++;
        }
      } else {
        const created = storage.createGuest({
          firstName,
          lastName,
          partyName,
          nameForText,
          adults: parseInt(adultsRaw || "", 10) || 0,
          kids: parseInt(kidsRaw || "", 10) || 0,
          language: languageRaw,
          invitationSent: invitationSentRaw,
          phone,
          email: email || null,
          invites,
          additionalNames,
        } as any);
        existing.push(created);
        added++;
      }
    }
    res.json({ added, updated, skipped, totals: storage.totals() });
  });

  app.get("/api/admin/guests/export", requireAdmin, (_req, res) => {
    const rows = storage.guestsWithResponses();
    const header = [
      "partyName",
      "firstName",
      "lastName",
      "phone",
      "email",
      "invites",
      "additionalNames",
      "attending",
      "attendees",
      "declinedCount",
      "pendingSeats",
      "guestEmail",
      "note",
      "updatedAt",
    ];
    const lines = [header.join(",")];
    for (const g of rows) {
      const r = g.response;
      lines.push(
        [
          g.partyName || "",
          g.firstName,
          g.lastName,
          g.phone,
          g.email || "",
          g.invites,
          g.additionalNames.map((n) => `${n.firstName} ${n.lastName}`.trim()).join("; "),
          r ? r.attending : "pending",
          r ? r.attendees : "",
          r ? r.declinedCount : "",
          r ? 0 : g.invites,
          r?.guestEmail || "",
          r?.note || "",
          r ? new Date(r.updatedAt).toISOString() : "",
        ]
          .map(csvEscape)
          .join(","),
      );
    }
    const csv = lines.join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="leah-quinceanera-rsvps.csv"');
    res.send(csv);
  });

  app.get("/api/admin/settings", requireAdmin, (_req, res) => {
    const s = storage.getSettings();
    res.json({
      settings: {
        smtpUser: s.smtpUser,
        smtpPassSet: !!s.smtpPass,
        notifyEmail: s.notifyEmail,
        adminEmail: s.adminEmail,
      },
    });
  });

  app.patch("/api/admin/settings", requireAdmin, (req, res) => {
    const patch: Record<string, unknown> = {};
    if (req.body?.smtpUser !== undefined) patch.smtpUser = String(req.body.smtpUser).trim();
    if (req.body?.smtpPass) patch.smtpPass = String(req.body.smtpPass).trim();
    if (req.body?.notifyEmail !== undefined)
      patch.notifyEmail = String(req.body.notifyEmail).trim();
    const s = storage.updateSettings(patch);
    if (req.body?.newPassword) {
      if (String(req.body.newPassword).length < 6)
        return res.status(400).json({ message: "Password must be at least 6 characters." });
      storage.updateAdminPassword(
        (req as any).adminId,
        bcrypt.hashSync(String(req.body.newPassword), 10),
      );
    }
    res.json({
      settings: {
        smtpUser: s.smtpUser,
        smtpPassSet: !!s.smtpPass,
        notifyEmail: s.notifyEmail,
        adminEmail: s.adminEmail,
      },
    });
  });

  app.post("/api/admin/settings/test-email", requireAdmin, async (req, res) => {
    const s = storage.getSettings();
    const to = String(req.body?.to || s.notifyEmail || s.smtpUser);
    try {
      await sendTestEmail(s, to);
      res.json({ ok: true, to });
    } catch (err: any) {
      res.status(400).json({ message: err?.message || "Failed to send test email." });
    }
  });

  return httpServer;
}
