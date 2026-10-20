/** Shared pricing, RSVP-close rule, and public event shape. */

export const PRICE_CENTS = {
  basic: 10_000,
  domain: 2_500,
  fullCustom: 25_000,
} as const;

export const LEAH_EVENT_ID = "leah";

export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "e",
  "super",
  "start",
  "login",
  "signup",
  "checkout",
  "uploads",
  "assets",
  "dashboard",
  "health",
  "src",
]);

export type EventPackage = "basic" | "full_custom";
export type EventTemplate = "quince" | "wedding";

export type HotelStop = { name: string; address: string; note: string };
export type ScheduleStop = { time: string; title: string; titleEs?: string; detail?: string };
export type EventPhoto = { id: string; url: string; caption: string };

export type PublicEvent = {
  id: string;
  slug: string;
  template: EventTemplate;
  status: "draft" | "active";
  paid: boolean;
  isLegacyRoot: boolean;
  package: EventPackage;
  honoree: string;
  partnerName: string;
  eventKind: string;
  familyLine: string;
  title: string;
  dateIso: string;
  dateLong: string;
  dateLongEs: string;
  dayName: string;
  dayNameEs: string;
  day: string;
  year: string;
  ceremonyLabel: string;
  ceremonyLabelEs: string;
  ceremonyTime: string;
  ceremonyVenue: string;
  ceremonyAddress: string;
  receptionTime: string;
  receptionVenue: string;
  receptionAddress: string;
  rsvpByLabel: string;
  rsvpByLabelEs: string;
  rsvpClosesOn: string;
  rsvpClosed: boolean;
  photoUploadUrl: string;
  dressCode: string;
  dressCodeEs: string;
  giftText: string;
  giftTextEs: string;
  aboutText: string;
  aboutTextEs: string;
  hotels: HotelStop[];
  schedule: ScheduleStop[];
  photos: EventPhoto[];
  desiredDomain: string;
  customDomain: boolean;
};

export function orderAmountCents(pkg: EventPackage, customDomain: boolean): number {
  if (pkg === "full_custom") return PRICE_CENTS.fullCustom;
  return PRICE_CENTS.basic + (customDomain ? PRICE_CENTS.domain : 0);
}

/** RSVPs stay open through `closesOn` (YYYY-MM-DD) in Pacific time, and close the next day. */
export function rsvpIsClosed(closesOn: string | null | undefined, now = new Date()): boolean {
  const d = (closesOn || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
  }).format(now);
  return today > d;
}

export function parseJsonList<T>(raw: string | null | undefined): T[] {
  if (!raw || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 3 && slug.length <= 40 && !RESERVED_SLUGS.has(slug);
}

const KIND_TITLE: Record<string, { en: string; es: string }> = {
  quinceanera: { en: "Quinceañera", es: "Quinceañera" },
  wedding: { en: "Wedding", es: "Boda" },
  baptism: { en: "Baptism", es: "Bautizo" },
  sweet16: { en: "Sweet 16", es: "Sweet 16" },
  other: { en: "Celebration", es: "Celebración" },
};

export function titleForKind(kind: string): { en: string; es: string } {
  return KIND_TITLE[kind] || KIND_TITLE.other;
}

/** Long date + calendar bits from a YYYY-MM-DD, computed in UTC noon so the day doesn't shift. */
export function describeDate(iso: string): {
  dateLong: string;
  dateLongEs: string;
  dayName: string;
  dayNameEs: string;
  day: string;
  year: string;
} | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  if (Number.isNaN(dt.getTime())) return null;
  const dateLong = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(dt);
  const dateLongEs = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(dt);
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(dt);
  const weekdayEs = new Intl.DateTimeFormat("es-MX", { weekday: "long", timeZone: "UTC" }).format(dt);
  const month = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(dt);
  const monthEs = new Intl.DateTimeFormat("es-MX", { month: "short", timeZone: "UTC" }).format(dt);
  return {
    dateLong,
    dateLongEs,
    dayName: `${weekday}, ${month}`.toUpperCase(),
    dayNameEs: `${weekdayEs}, ${monthEs}`.toUpperCase(),
    day: String(d),
    year: String(y),
  };
}
