import type { Storage } from "./storage";
import { describeDate } from "@shared/platform";
import { DEMOS, type DemoSpec } from "./demo-content";

/**
 * Sample invitations for the marketing gallery.
 * Runs on a platform database only. Leah's legacy root is left untouched.
 * Each boot refreshes the sample copy so a persisted volume picks up new
 * sections. Guests are inserted only when that sample has none, so a saved
 * RSVP is not wiped.
 */

export function seedDemoEvents(store: Storage) {
  try {
    if (store.getLegacyEvent()) return;
    for (const spec of DEMOS) ensureDemo(store, spec);
  } catch (err: any) {
    console.warn("[db] demo seed skipped:", err?.message || err);
  }
}

function ensureDemo(store: Storage, spec: DemoSpec) {
  const dated = describeDate(spec.dateIso);
  if (!dated) throw new Error(`Bad demo date ${spec.dateIso}`);
  const now = Date.now();
  const fields = {
    isLegacyRoot: 0 as const,
    isDemo: 1 as const,
    status: "active",
    package: "basic" as const,
    template: spec.template,
    paid: 1 as const,
    honoree: spec.honoree,
    partnerName: spec.partnerName,
    eventKind: spec.eventKind,
    familyLine: spec.familyLine,
    familyLineEs: spec.familyLineEs,
    title: spec.title,
    dateIso: spec.dateIso,
    dateLong: dated.dateLong,
    dateLongEs: dated.dateLongEs,
    dayName: dated.dayName,
    dayNameEs: dated.dayNameEs,
    day: dated.day,
    year: dated.year,
    ceremonyLabel: spec.ceremonyLabel,
    ceremonyLabelEs: spec.ceremonyLabelEs,
    ceremonyTime: spec.ceremonyTime,
    ceremonyVenue: spec.ceremonyVenue,
    ceremonyAddress: spec.ceremonyAddress,
    ceremonyMapUrl: spec.ceremonyMapUrl,
    receptionTime: spec.receptionTime,
    receptionVenue: spec.receptionVenue,
    receptionAddress: spec.receptionAddress,
    receptionMapUrl: spec.receptionMapUrl,
    rsvpByLabel: spec.rsvpByLabel,
    rsvpByLabelEs: spec.rsvpByLabelEs,
    rsvpClosesOn: spec.rsvpClosesOn,
    photoUploadUrl: "",
    dressCode: spec.dressCode,
    dressCodeEs: spec.dressCodeEs,
    giftText: spec.giftText,
    giftTextEs: spec.giftTextEs,
    aboutText: spec.aboutText,
    aboutTextEs: spec.aboutTextEs,
    parkingText: spec.parkingText,
    parkingTextEs: spec.parkingTextEs,
    hostNote: spec.hostNote,
    hostNoteEs: spec.hostNoteEs,
    contactEmail: spec.contactEmail,
    contactPhone: spec.contactPhone,
    contactNote: spec.contactNote,
    contactNoteEs: spec.contactNoteEs,
    mealPrompt: spec.mealPrompt,
    mealPromptEs: spec.mealPromptEs,
    hotelsJson: JSON.stringify(spec.hotels),
    scheduleJson: JSON.stringify(spec.schedule),
    photosJson: JSON.stringify(spec.photos),
    faqsJson: JSON.stringify(spec.faqs),
    partyJson: JSON.stringify(spec.party),
    hostnames: "",
    desiredDomain: "",
    customDomain: 0 as const,
    customNotes: "",
    smtpUser: "",
    smtpPass: "",
    notifyEmail: "",
    stripeSessionId: null,
    amountCents: 0,
  };
  let event = store.getEventBySlug(spec.slug);
  if (!event) {
    event = store.createEvent({ id: spec.id, createdAt: now, updatedAt: now, slug: spec.slug, ...fields });
    console.log(`[db] seeded sample event ${spec.slug}`);
  } else {
    event = store.updateEvent(event.id, fields);
    console.log(`[db] refreshed sample event ${spec.slug}`);
  }
  if (store.allGuests(event.id).length > 0) return;
  spec.households.forEach((guest, index) => {
    const n = String(index + 1).padStart(2, "0");
    store.createGuest({
      id: `${spec.slug}-guest-${n}`,
      eventId: event!.id,
      firstName: guest.firstName,
      lastName: guest.lastName,
      partyName: guest.partyName || "",
      phone: `555010${n}`,
      email: `${guest.firstName}.${guest.lastName}@example.com`.toLowerCase(),
      invites: guest.invites,
      additionalNames: guest.additionalNames || [],
      language: index % 2 === 0 ? "English" : "Spanish",
    });
  });
}
