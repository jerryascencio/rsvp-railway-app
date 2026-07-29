import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "node:http";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { storage } from "./storage";
import { sendRsvpEmails, sendTestEmail } from "./mailer";
import { normalizePhone } from "@shared/schema";

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

    let attendees = Number(req.body?.attendees);
    let declinedCount = Number(req.body?.declinedCount);
    if (!Number.isFinite(attendees) || attendees < 0) attendees = 0;
    attendees = Math.min(Math.round(attendees), guest.invites);
    if (!Number.isFinite(declinedCount) || declinedCount < 0)
      declinedCount = guest.invites - attendees;
    declinedCount = Math.min(Math.round(declinedCount), guest.invites);
    if (attendees + declinedCount !== guest.invites) {
      declinedCount = guest.invites - attendees;
    }

    const guestEmail = req.body?.guestEmail ? String(req.body.guestEmail).trim() : null;
    const attending: "yes" | "no" = attendees > 0 ? "yes" : "no";

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
    res.json({ guests: storage.guestsWithResponses(), totals: storage.totals() });
  });

  app.post("/api/admin/guests", requireAdmin, (req, res) => {
    const { firstName, lastName, phone, email, invites } = req.body || {};
    if (!firstName || !String(firstName).trim())
      return res.status(400).json({ message: "First name is required." });
    const guest = storage.createGuest({
      firstName: String(firstName),
      lastName: String(lastName || ""),
      phone: String(phone || ""),
      email: email ? String(email) : null,
      invites: Number(invites) || 1,
    });
    res.json({ guest });
  });

  app.patch("/api/admin/guests/:id", requireAdmin, (req, res) => {
    const guest = storage.updateGuest(String(req.params.id), {
      firstName: req.body?.firstName,
      lastName: req.body?.lastName,
      phone: req.body?.phone,
      email: req.body?.email,
      invites: req.body?.invites,
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

  app.post("/api/admin/guests/import", requireAdmin, (req, res) => {
    const csv = String(req.body?.csv || "");
    if (!csv.trim()) return res.status(400).json({ message: "CSV content is empty." });
    const rows = parseCsv(csv);
    if (rows.length === 0) return res.status(400).json({ message: "No rows found." });

    let header = rows[0].map((h) => h.trim().toLowerCase().replace(/[\s_-]/g, ""));
    const known = ["firstname", "lastname", "phone", "email", "invites"];
    const hasHeader = header.some((h) => known.includes(h));
    const idx = (name: string) => {
      const i = header.indexOf(name);
      return i;
    };
    const cols = hasHeader
      ? {
          firstName: idx("firstname"),
          lastName: idx("lastname"),
          phone: idx("phone"),
          email: idx("email"),
          invites: idx("invites"),
        }
      : { firstName: 0, lastName: 1, phone: 2, email: 3, invites: 4 };

    const body = hasHeader ? rows.slice(1) : rows;
    let added = 0,
      updated = 0,
      skipped = 0;
    const existing = storage.allGuests();

    for (const r of body) {
      const get = (i: number) => (i >= 0 && i < r.length ? r[i].trim() : "");
      const firstName = get(cols.firstName);
      const lastName = get(cols.lastName);
      const phone = get(cols.phone);
      const email = get(cols.email);
      const invitesRaw = get(cols.invites);
      const invites = Math.max(1, parseInt(invitesRaw || "1", 10) || 1);
      if (!firstName && !lastName) {
        skipped++;
        continue;
      }
      const digits = normalizePhone(phone);
      let match = digits
        ? existing.find((g) => normalizePhone(g.phone) && normalizePhone(g.phone) === digits)
        : undefined;
      if (!match) {
        match = existing.find(
          (g) =>
            g.firstName.toLowerCase() === firstName.toLowerCase() &&
            (g.lastName || "").toLowerCase() === lastName.toLowerCase(),
        );
      }
      if (match) {
        const u = storage.updateGuest(match.id, {
          firstName,
          lastName,
          phone: phone || match.phone,
          email: email || match.email,
          invites,
        });
        if (u) {
          Object.assign(match, u);
          updated++;
        }
      } else {
        const created = storage.createGuest({
          firstName,
          lastName,
          phone,
          email: email || null,
          invites,
        });
        existing.push(created);
        added++;
      }
    }
    res.json({ added, updated, skipped, totals: storage.totals() });
  });

  app.get("/api/admin/guests/export", requireAdmin, (_req, res) => {
    const rows = storage.guestsWithResponses();
    const header = [
      "firstName",
      "lastName",
      "phone",
      "email",
      "invites",
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
          g.firstName,
          g.lastName,
          g.phone,
          g.email || "",
          g.invites,
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
