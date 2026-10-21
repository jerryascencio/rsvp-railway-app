import type { Request } from "express";
import type { EventRecord } from "@shared/schema";
import { storage } from "./storage";
import {
  parseJsonList,
  normalizeTemplate,
  rsvpIsClosed,
  type FaqItem,
  type HotelStop,
  type PartyMember,
  type PublicEvent,
  type ScheduleStop,
} from "@shared/platform";
import path from "node:path";

export function requestHost(req: Request): string {
  const xf = req.headers["x-forwarded-host"];
  const raw = (Array.isArray(xf) ? xf[0] : xf) || req.headers.host || "";
  return String(raw).split(",")[0].trim().split(":")[0].toLowerCase();
}

export function legacyHostSet(): Set<string> {
  return new Set(
    (process.env.LEGACY_ROOT_HOSTS || "www.leahaespinoza.com,leahaespinoza.com")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function eventSlugHeader(req: Request): string {
  const raw = req.headers["x-event-slug"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return String(value || "").trim().toLowerCase();
}

/**
 * Which event an API call is about.
 * An explicit slug header wins so `/e/<slug>` works even on a legacy hostname.
 * Otherwise the Host header (custom domain or Leah's domain) decides.
 */
export function resolveRequestEvent(req: Request): EventRecord | null {
  const slug = eventSlugHeader(req);
  if (slug) {
    const bySlug = storage.getEventBySlug(slug);
    if (bySlug) return bySlug;
  }
  const host = requestHost(req);
  const byHost = storage.getEventByHostname(host);
  if (byHost) return byHost;
  if (legacyHostSet().has(host)) return storage.getLegacyEvent() || null;
  return null;
}

export type SiteMode = "legacy" | "custom" | "platform";

export function resolveSite(req: Request): { mode: SiteMode; slug: string | null } {
  const host = requestHost(req);
  const byHost = storage.getEventByHostname(host);
  if (byHost?.isLegacyRoot) return { mode: "legacy", slug: byHost.slug };
  if (byHost) return { mode: "custom", slug: byHost.slug };
  if (legacyHostSet().has(host)) {
    const leah = storage.getLegacyEvent();
    return { mode: "legacy", slug: leah?.slug || "leah" };
  }
  return { mode: "platform", slug: null };
}

function httpsUrl(raw: string | null | undefined): string {
  const value = String(raw || "").trim();
  return /^https:\/\/\S+$/i.test(value) ? value : "";
}

/** Uploaded files live under /uploads. Bundled sample art is served from /demos. */
export function publicPhotoUrl(eventId: string, filename: string): string {
  if (/^\/demos\/[a-z0-9-]+\.svg$/.test(filename)) return filename;
  return `/uploads/${eventId}/${filename}`;
}

export function uploadRoot(): string {
  if (process.env.UPLOAD_DIR) return process.env.UPLOAD_DIR;
  const dbPath = process.env.DATABASE_PATH || "./data.db";
  return path.resolve(path.dirname(dbPath), "uploads");
}

export function toPublicEvent(event: EventRecord): PublicEvent {
  const photos = parseJsonList<{ id: string; filename: string; caption?: string; captionEs?: string }>(event.photosJson);
  return {
    id: event.id,
    slug: event.slug,
    template: normalizeTemplate(event.template),
    status: event.status === "active" ? "active" : "draft",
    paid: !!event.paid,
    isLegacyRoot: !!event.isLegacyRoot,
    isDemo: !!event.isDemo,
    package: event.package === "full_custom" ? "full_custom" : "basic",
    honoree: event.honoree,
    partnerName: event.partnerName,
    eventKind: event.eventKind,
    familyLine: event.familyLine,
    familyLineEs: event.familyLineEs || "",
    title: event.title,
    dateIso: event.dateIso,
    dateLong: event.dateLong,
    dateLongEs: event.dateLongEs,
    dayName: event.dayName,
    dayNameEs: event.dayNameEs,
    day: event.day,
    year: event.year,
    ceremonyLabel: event.ceremonyLabel,
    ceremonyLabelEs: event.ceremonyLabelEs,
    ceremonyTime: event.ceremonyTime,
    ceremonyVenue: event.ceremonyVenue,
    ceremonyAddress: event.ceremonyAddress,
    ceremonyMapUrl: httpsUrl(event.ceremonyMapUrl),
    receptionTime: event.receptionTime,
    receptionVenue: event.receptionVenue,
    receptionAddress: event.receptionAddress,
    receptionMapUrl: httpsUrl(event.receptionMapUrl),
    parkingText: event.parkingText || "",
    parkingTextEs: event.parkingTextEs || "",
    hostNote: event.hostNote || "",
    hostNoteEs: event.hostNoteEs || "",
    contactEmail: event.contactEmail || "",
    contactPhone: event.contactPhone || "",
    contactNote: event.contactNote || "",
    contactNoteEs: event.contactNoteEs || "",
    mealPrompt: event.mealPrompt || "",
    mealPromptEs: event.mealPromptEs || "",
    rsvpByLabel: event.rsvpByLabel,
    rsvpByLabelEs: event.rsvpByLabelEs,
    rsvpClosesOn: event.rsvpClosesOn || "",
    rsvpClosed: rsvpIsClosed(event.rsvpClosesOn),
    photoUploadUrl: event.photoUploadUrl,
    dressCode: event.dressCode,
    dressCodeEs: event.dressCodeEs,
    giftText: event.giftText,
    giftTextEs: event.giftTextEs,
    aboutText: event.aboutText,
    aboutTextEs: event.aboutTextEs,
    hotels: parseJsonList<HotelStop>(event.hotelsJson).filter((h) => h && (h.name || h.address)),
    schedule: parseJsonList<ScheduleStop>(event.scheduleJson).filter((s) => s && (s.time || s.title)),
    photos: photos
      .filter((p) => p && p.filename)
      .map((p) => ({
        id: p.id,
        url: publicPhotoUrl(event.id, p.filename),
        caption: p.caption || "",
        captionEs: p.captionEs || "",
      })),
    faqs: parseJsonList<FaqItem>(event.faqsJson).filter((item) => item && (item.q || item.a)).slice(0, 8),
    party: parseJsonList<PartyMember>(event.partyJson).filter((item) => item && item.name).slice(0, 16),
    desiredDomain: event.desiredDomain || "",
    customDomain: !!event.customDomain,
  };
}

export function clientIp(req: Request): string {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.trim()) return xf.split(",")[0].trim();
  return req.ip || "unknown";
}

const buckets = new Map<string, { n: number; reset: number }>();

/** Returns true when the request is allowed. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > 8000) buckets.clear();
  const b = buckets.get(key);
  if (!b || now > b.reset) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    return true;
  }
  if (b.n >= limit) return false;
  b.n += 1;
  return true;
}

export function searchLimit(): number {
  const n = Number(process.env.SEARCH_RATE_LIMIT || 30);
  return Number.isFinite(n) && n > 0 ? n : 30;
}

export function publicBase(req: Request): string {
  const configured = (process.env.PUBLIC_PLATFORM_URL || "").trim().replace(/\/$/, "");
  if (configured) return configured;
  const proto = String(req.headers["x-forwarded-proto"] || "http").split(",")[0].trim();
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "localhost");
  return `${proto}://${host.split(",")[0].trim()}`;
}

export function eventPublicUrl(req: Request, event: EventRecord): string {
  if (event.isLegacyRoot) return process.env.PUBLIC_SITE_URL || "https://www.leahaespinoza.com";
  const host = requestHost(req);
  if (event.hostnames.split(",").map((s) => s.trim().toLowerCase()).includes(host)) {
    return publicBase(req);
  }
  return `${publicBase(req)}/e/${event.slug}`;
}
