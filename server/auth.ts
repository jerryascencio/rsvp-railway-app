import type { Request, Response, NextFunction } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { resolveRequestEvent } from "./tenancy";
import type { EventRecord } from "@shared/schema";

export const SESSION_DAYS = 14;
export const COOKIE = "qc_session";

export type Session =
  | { role: "legacy"; adminId: string; eventId: string }
  | { role: "host"; hostId: string; eventId: string }
  | { role: "super"; superId: string };

function sessionSecret() {
  return process.env.SESSION_SECRET || storage.getSettings().sessionSecret;
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function makeSessionToken(session: Session): string {
  const secret = sessionSecret();
  const expiresAt = Date.now() + SESSION_DAYS * 86400_000;
  const payload = Buffer.from(JSON.stringify({ ...session, expiresAt })).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function readSession(token: string | undefined): Session | null {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  const secret = sessionSecret();
  const expected = sign(payload, secret);
  try {
    if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return null;
    }
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.expiresAt || data.expiresAt < Date.now()) return null;

    // Tokens issued before multi-event: { adminId, expiresAt }.
    if (data.adminId && !data.role) {
      if (!storage.getAdmin(data.adminId)) return null;
      const leah = storage.getLegacyEvent();
      if (!leah) return null;
      return { role: "legacy", adminId: data.adminId, eventId: leah.id };
    }
    if (data.role === "legacy") {
      if (!data.adminId || !storage.getAdmin(data.adminId)) return null;
      return { role: "legacy", adminId: data.adminId, eventId: data.eventId };
    }
    if (data.role === "host") {
      const host = storage.getHost(data.hostId);
      if (!host || host.eventId !== data.eventId) return null;
      return { role: "host", hostId: host.id, eventId: host.eventId };
    }
    if (data.role === "super") {
      if (!storage.getSuper(data.superId)) return null;
      return { role: "super", superId: data.superId };
    }
    return null;
  } catch {
    return null;
  }
}

export function currentSession(req: Request): Session | null {
  const header = req.headers.authorization;
  const bearer = header && header.startsWith("Bearer ") ? header.slice(7) : undefined;
  return readSession(bearer) || readSession((req as any).cookies?.[COOKIE]);
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    maxAge: SESSION_DAYS * 86400_000,
  });
}

export function sessionEmail(session: Session): string | undefined {
  if (session.role === "legacy") return storage.getAdmin(session.adminId)?.email;
  if (session.role === "host") return storage.getHost(session.hostId)?.email;
  return storage.getSuper(session.superId)?.email;
}

export function isEventMember(session: Session | null, eventId: string): boolean {
  return !!session && session.role !== "super" && session.eventId === eventId;
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const event = resolveRequestEvent(req);
  if (!event) return res.status(404).json({ message: "Event not found." });
  const session = currentSession(req);
  if (!isEventMember(session, event.id)) {
    return res.status(401).json({ message: "Not authorized" });
  }
  (req as any).auth = session;
  (req as any).event = event;
  (req as any).adminId = session!.role === "legacy" ? (session as any).adminId : (session as any).hostId;
  next();
}

export function eventFromReq(req: Request): EventRecord {
  return (req as any).event as EventRecord;
}

export function authFromReq(req: Request): Session {
  return (req as any).auth as Session;
}

export function requireSuper(req: Request, res: Response, next: NextFunction) {
  const session = currentSession(req);
  if (!session || session.role !== "super") {
    return res.status(401).json({ message: "Not authorized" });
  }
  (req as any).auth = session;
  next();
}

/** Create the super-admin row from env the first time those vars are set. */
export function ensureSuperAdmin() {
  const email = (process.env.SUPER_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD || "";
  if (!email || password.length < 8) return;
  if (storage.getSuperByEmail(email)) return;
  storage.createSuper(email, bcrypt.hashSync(password, 10));
  console.log("[auth] super admin created from SUPER_ADMIN_EMAIL");
}
