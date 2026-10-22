/** Shared pricing, RSVP-close rule, and public event shape. */

/** Product name for the marketing site. Change it here only. */
export const BRAND_NAME = "RSVP Sites by Mission";

export const PRICE_CENTS = {
  basic: 2_500,
  plus: 10_000,
  fullCustom: 25_000,
} as const;

/** Middle plan name. Change these two strings to rename it everywhere it appears. */
export const PLAN_PLUS_NAME = { en: "Plus", es: "Plus" } as const;

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

export type EventPackage = "basic" | "plus" | "full_custom";

export function normalizePlan(raw: unknown): EventPackage {
  if (raw === "plus" || raw === "full_custom") return raw;
  return "basic";
}

export function planPriceCents(plan: EventPackage): number {
  if (plan === "full_custom") return PRICE_CENTS.fullCustom;
  if (plan === "plus") return PRICE_CENTS.plus;
  return PRICE_CENTS.basic;
}

export function planLabel(plan: EventPackage, lang: "en" | "es" = "en"): string {
  if (plan === "full_custom") return lang === "es" ? "Diseño a medida" : "Full custom";
  if (plan === "plus") return PLAN_PLUS_NAME[lang];
  return lang === "es" ? "Básico" : "Basic";
}

type PlanSource = {
  package?: string | null;
  isLegacyRoot?: number | boolean | null;
  isDemo?: number | boolean | null;
  customDomain?: number | boolean | null;
  paid?: number | boolean | null;
};

/** Leah and the sample sites include every feature. An older Basic order that already bought a domain is treated as Plus. */
export function effectivePlan(event: PlanSource): EventPackage {
  if (event.isLegacyRoot || event.isDemo) return "full_custom";
  const plan = normalizePlan(event.package);
  if (plan === "basic" && event.customDomain) return "plus";
  return plan;
}

export type PlanFeature = "textBlast" | "emailBlast" | "customDomain";

export function planAllows(event: PlanSource, _feature: PlanFeature): boolean {
  return effectivePlan(event) !== "basic";
}

export function upgradeDifferenceCents(from: EventPackage, to: EventPackage): number {
  return Math.max(0, planPriceCents(to) - planPriceCents(from));
}

export function describePlan(event: PlanSource) {
  const plan = effectivePlan(event);
  const paid = !!event.paid || !!event.isLegacyRoot;
  const locked = !!event.isLegacyRoot || !!event.isDemo;
  const targets: EventPackage[] = locked
    ? []
    : plan === "basic"
      ? ["plus", "full_custom"]
      : plan === "plus"
        ? ["full_custom"]
        : [];
  return {
    plan,
    name: planLabel(plan),
    textBlast: plan !== "basic",
    emailBlast: plan !== "basic",
    customDomain: plan !== "basic",
    upgrades: targets.map((target) => ({
      plan: target,
      name: planLabel(target),
      amountCents: paid ? upgradeDifferenceCents(plan, target) : planPriceCents(target),
    })),
  };
}

export function upgradeRequired(feature: "textBlast" | "emailBlast") {
  const name = PLAN_PLUS_NAME.en;
  const message =
    feature === "textBlast"
      ? `Hit em up is included with ${name}. Upgrade to text every guest.`
      : `Email everyone is included with ${name}. Upgrade to email every guest.`;
  return { code: "upgrade_required" as const, feature, message, upgradeTo: "plus" as const };
}
export const EVENT_TEMPLATES = ["elegant", "fiesta", "minimal", "garden", "noche", "confetti", "quince", "wedding"] as const;
export type EventTemplate = (typeof EVENT_TEMPLATES)[number];

export function normalizeTemplate(raw: unknown): EventTemplate {
  const value = String(raw || "");
  return (EVENT_TEMPLATES as readonly string[]).includes(value) ? (value as EventTemplate) : "elegant";
}

export type HotelStop = { name: string; address: string; note: string; noteEs?: string };
export type ScheduleStop = { time: string; title: string; titleEs?: string; detail?: string; detailEs?: string };
export type EventPhoto = { id: string; url: string; caption: string; captionEs?: string };
export type FaqItem = { q: string; a: string; qEs?: string; aEs?: string };
export type PartyMember = { role: string; roleEs?: string; name: string };

export type PublicEvent = {
  id: string;
  slug: string;
  template: EventTemplate;
  status: "draft" | "active";
  paid: boolean;
  isLegacyRoot: boolean;
  /** Sample site seeded for the template gallery. RSVPs are stored and not emailed. */
  isDemo: boolean;
  package: EventPackage;
  honoree: string;
  partnerName: string;
  eventKind: string;
  familyLine: string;
  familyLineEs: string;
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
  ceremonyMapUrl: string;
  receptionTime: string;
  receptionVenue: string;
  receptionAddress: string;
  receptionMapUrl: string;
  parkingText: string;
  parkingTextEs: string;
  hostNote: string;
  hostNoteEs: string;
  contactEmail: string;
  contactPhone: string;
  contactNote: string;
  contactNoteEs: string;
  mealPrompt: string;
  mealPromptEs: string;
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
  faqs: FaqItem[];
  party: PartyMember[];
  desiredDomain: string;
  customDomain: boolean;
};

export function orderAmountCents(pkg: EventPackage): number {
  return planPriceCents(normalizePlan(pkg));
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
  birthday: { en: "Birthday", es: "Cumpleaños" },
  babyshower: { en: "Baby shower", es: "Baby shower" },
  anniversary: { en: "Anniversary", es: "Aniversario" },
  graduation: { en: "Graduation", es: "Graduación" },
  party: { en: "Party", es: "Fiesta" },
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
