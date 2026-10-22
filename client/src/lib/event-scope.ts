/** Which event the current page is talking to. Read by the API client. */

export type SiteMode = "legacy" | "custom" | "platform";

let eventSlug: string | null = null;
let siteMode: SiteMode = "platform";
let legacyCopy = true;

export function setSiteContext(opts: { slug: string | null; mode: SiteMode; legacyCopy?: boolean }) {
  eventSlug = opts.slug;
  siteMode = opts.mode;
  if (opts.legacyCopy !== undefined) legacyCopy = opts.legacyCopy;
}

export function getEventSlug() {
  return eventSlug;
}

export function getSiteMode(): SiteMode {
  return siteMode;
}

export function setLegacyCopy(value: boolean) {
  legacyCopy = value;
}

export function isLegacyCopy() {
  return legacyCopy;
}

/** Path of the public invitation for the event currently in context. */
export function invitationPath() {
  if (siteMode !== "platform" || !eventSlug) return "/";
  return `/e/${eventSlug}`;
}

export function adminPath() {
  if (siteMode !== "platform" || !eventSlug) return "/admin";
  return `/e/${eventSlug}/admin`;
}

/** Text-message link. Leah's original wording stays exact. */
export function publicLinkLabel() {
  if (legacyCopy) return "www.LeahAEspinoza.com";
  if (siteMode === "custom" || !eventSlug) return window.location.host;
  return `${window.location.host}/e/${eventSlug}`;
}

export function isLegacyHostname(host = window.location.hostname) {
  return /(^|\.)leahaespinoza\.com$/i.test(host);
}
