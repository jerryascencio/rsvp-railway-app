import nodemailer from "nodemailer";
import type { Guest, RsvpResponse, Settings, Totals } from "@shared/schema";
import { EVENT } from "@shared/schema";

// Public site URL used in the "Update your RSVP" link on the guest confirmation.
const SITE_URL = process.env.PUBLIC_SITE_URL || "https://www.leahaespinoza.com";

type Lang = "en" | "es";

// ---------- Localized strings for the guest confirmation email ----------
const L = {
  en: {
    eventDetailsTitle: "Event Details",
    quinceanera: `${EVENT.honoree}'s Quinceañera`,
    massLabel: "Mass",
    receptionLabel: "Reception",
    thankYouEyebrow: "Thank You",
    thankYouHeading: `Thank you for RSVPing to Leah&rsquo;s Quincea&ntilde;era!`,
    hiGreeting: (name: string) => `Hi ${name}, we've recorded your response.`,
    yourResponse: "Your Response",
    attending: "Attending",
    notAttending: "Not attending",
    person: "person",
    people: "people",
    closingComing: "We can't wait to celebrate with you!",
    closingNotComing: "We'll miss you \u2014 thank you for letting us know.",
    mistakePrefix: "Made a mistake?",
    updateLink: "Update your RSVP",
    subject: "Your RSVP for Leah's Quincea\u00f1era",
    thankYouText: `Thank you for RSVPing to Leah's Quinceanera!`,
    yourResponseText: "Your response:",
  },
  es: {
    eventDetailsTitle: "Detalles del Evento",
    quinceanera: `Los XV años de ${EVENT.honoree}`,
    massLabel: "Misa",
    receptionLabel: "Recepción",
    thankYouEyebrow: "Gracias",
    thankYouHeading: `¡Gracias por confirmar su asistencia a los XV años de Leah!`,
    hiGreeting: (name: string) => `Hola ${name}, hemos registrado su respuesta.`,
    yourResponse: "Su Respuesta",
    attending: "Asistir\u00e1n",
    notAttending: "No asistir\u00e1n",
    person: "persona",
    people: "personas",
    closingComing: "\u00a1No podemos esperar para celebrar con ustedes!",
    closingNotComing: "Los extra\u00f1aremos \u2014 gracias por avisarnos.",
    mistakePrefix: "\u00bfSe equivoc\u00f3?",
    updateLink: "Actualice su RSVP",
    subject: "Su confirmaci\u00f3n para los XV a\u00f1os de Leah",
    thankYouText: `\u00a1Gracias por confirmar su asistencia a los XV a\u00f1os de Leah!`,
    yourResponseText: "Su respuesta:",
  },
} as const;

function eventDetailsTextFor(lang: Lang): string {
  const s = L[lang];
  return [
    "",
    `— ${s.eventDetailsTitle} —`,
    s.quinceanera,
    EVENT.dateLong,
    "",
    `${s.massLabel}: ${EVENT.massTime}`,
    `${EVENT.massVenue}`,
    `${EVENT.massAddress}`,
    "",
    `${s.receptionLabel}: ${EVENT.receptionTime}`,
    `${EVENT.receptionVenue}`,
    `${EVENT.receptionAddress}`,
  ].join("\n");
}

function eventDetailsHtmlFor(lang: Lang): string {
  const s = L[lang];
  return `
  <div style="margin-top:28px;padding-top:20px;border-top:1px solid #E4CDBE;font-family:Georgia,serif;color:#4A3B34;">
    <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#B08968;margin-bottom:10px;">${s.eventDetailsTitle}</div>
    <div style="font-size:17px;color:#B86478;margin-bottom:2px;">${s.quinceanera}</div>
    <div style="font-size:14px;margin-bottom:16px;">${EVENT.dateLong}</div>
    <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#B08968;">${s.massLabel} &middot; ${EVENT.massTime}</div>
    <div style="font-size:14px;">${EVENT.massVenue}<br/>${EVENT.massAddress}</div>
    <div style="height:14px"></div>
    <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#B08968;">${s.receptionLabel} &middot; ${EVENT.receptionTime}</div>
    <div style="font-size:14px;">${EVENT.receptionVenue}<br/>${EVENT.receptionAddress}</div>
  </div>`;
}

// English versions used by the internal report email (always English for the host).
const eventDetailsText = eventDetailsTextFor("en");
const eventDetailsHtml = eventDetailsHtmlFor("en");

// Guest confirmation emails set includeDetails=true so Mass & Reception show
// in the main body. The host status email passes "" for detailsHtml.
function wrap(inner: string, detailsHtml: string = eventDetailsHtml) {
  return `<div style="background:#FBF2EA;padding:28px;">
    <div style="max-width:560px;margin:0 auto;background:#FFFDFB;border:1px solid #E9D6C7;border-radius:10px;padding:28px;font-family:Georgia,serif;color:#4A3B34;line-height:1.6;">
      ${inner}
      ${detailsHtml}
    </div>
  </div>`;
}

// Version of wrap that places the event details BEFORE the closing content,
// so Gmail's "trimmed" collapse doesn't hide the Mass & Reception info under
// the fold. Used only by the guest confirmation email.
function wrapWithDetailsFirst(details: string, footer: string) {
  return `<div style="background:#FBF2EA;padding:28px;">
    <div style="max-width:560px;margin:0 auto;background:#FFFDFB;border:1px solid #E9D6C7;border-radius:10px;padding:28px;font-family:Georgia,serif;color:#4A3B34;line-height:1.6;">
      ${details}
      ${footer}
    </div>
  </div>`;
}

function transport(s: Settings) {
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: s.smtpUser, pass: s.smtpPass },
  });
}

function plural(n: number, lang: Lang = "en") {
  const s = L[lang];
  return n === 1 ? s.person : s.people;
}

export async function sendRsvpEmails(opts: {
  settings: Settings;
  guest: Guest;
  response: RsvpResponse;
  totals: Totals;
  language?: Lang;
}): Promise<{ reportSent: boolean; guestSent: boolean; error?: string }> {
  const { settings, guest, response, totals } = opts;
  const lang: Lang = opts.language === "es" ? "es" : "en";
  const s = L[lang];
  const result = { reportSent: false, guestSent: false, error: undefined as string | undefined };

  if (!settings || !settings.smtpUser || !settings.smtpPass) {
    console.warn(
      "[mailer] SMTP is not configured — skipping RSVP notification emails. RSVP was still saved.",
    );
    return result;
  }

  const tx = transport(settings);
  const name = guest.fullName || `${guest.firstName} ${guest.lastName}`.trim();

  // --- Email 1: Stef's report (concise, no event details) ---
  const reportText = [
    `${name} just RSVPed — ${response.attendees} attending, ${response.declinedCount} not attending from their party of ${guest.invites}.`,
    "",
    "Running totals:",
    `• Confirmed attending: ${totals.totalHeadcount} people`,
    `• Not attending: ${totals.totalDeclined} people`,
    `• Still pending: ${totals.totalPendingHouseholds} households (${totals.totalPending} seats)`,
    response.note ? `\nNote from guest: ${response.note}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  // Inner report body — no event details footer.
  const reportInner = `
    <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#B08968;">RSVP Update</div>
    <h1 style="font-size:20px;color:#B86478;margin:8px 0 16px;">${name} just RSVPed</h1>
    <p style="margin:0 0 16px;">
      <strong>${response.attendees} attending</strong>, ${response.declinedCount} not attending
      from their party of ${guest.invites}.
    </p>
    <div style="background:#FBF2EA;border:1px solid #EEDDD0;border-radius:8px;padding:14px 18px;">
      <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#B08968;margin-bottom:8px;">Running Totals</div>
      <div>Confirmed attending: <strong>${totals.totalHeadcount}</strong> people</div>
      <div>Not attending: <strong>${totals.totalDeclined}</strong> people</div>
      <div>Still pending: <strong>${totals.totalPendingHouseholds}</strong> households (${totals.totalPending} seats)</div>
    </div>
    ${response.note ? `<p style="margin:16px 0 0;font-style:italic;color:#6B584E;">“${response.note}”</p>` : ""}
  `;
  // Pass empty details HTML so the host email is a clean, focused update.
  const reportHtml = wrap(reportInner, "");

  try {
    await tx.sendMail({
      from: `"Leah's Quinceanera RSVP" <${settings.smtpUser}>`,
      to: settings.notifyEmail || settings.smtpUser,
      subject: "RSVP update for Leah's Quinceañera",
      text: reportText,
      html: reportHtml,
    });
    result.reportSent = true;
  } catch (err: any) {
    console.warn("[mailer] failed to send report email:", err?.message || err);
    result.error = String(err?.message || err);
  }

  // --- Email 2: guest confirmation (localized) ---
  const to = response.guestEmail;
  if (to) {
    const coming = response.attendees > 0;
    const closing = coming ? s.closingComing : s.closingNotComing;
    const guestText = [
      s.thankYouText,
      "",
      s.yourResponseText,
      `• ${s.attending}: ${response.attendees}`,
      `• ${s.notAttending}: ${response.declinedCount}`,
      eventDetailsTextFor(lang),
      "",
      closing,
      "",
      `${s.mistakePrefix} ${s.updateLink}: ${SITE_URL}`,
    ].join("\n");

    // Structure: intro + response → event details (Mass & Reception) → closing +
    // "Update your RSVP" link. Details go BEFORE the closing so Gmail's
    // auto-collapse doesn't hide them below the "trimmed content" fold.
    const introBlock = `
      <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#B08968;">${s.thankYouEyebrow}</div>
      <h1 style="font-size:22px;color:#B86478;margin:8px 0 14px;">${s.thankYouHeading}</h1>
      <p style="margin:0 0 14px;">${s.hiGreeting(guest.firstName)}</p>
      <div style="background:#FBF2EA;border:1px solid #EEDDD0;border-radius:8px;padding:14px 18px;">
        <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#B08968;margin-bottom:8px;">${s.yourResponse}</div>
        <div>${s.attending}: <strong>${response.attendees}</strong> ${plural(response.attendees, lang)}</div>
        <div>${s.notAttending}: <strong>${response.declinedCount}</strong></div>
      </div>
    `;
    const closingBlock = `
      <p style="margin:22px 0 0;font-size:16px;color:#B86478;">${closing}</p>
      <p style="margin:14px 0 0;font-size:14px;color:#6B584E;text-align:center;">
        ${s.mistakePrefix}
        <a href="${SITE_URL}" style="color:#B86478;font-weight:600;text-decoration:underline;">${s.updateLink}</a>
      </p>
    `;
    const guestHtml = wrapWithDetailsFirst(
      introBlock + eventDetailsHtmlFor(lang),
      closingBlock,
    );

    try {
      await tx.sendMail({
        from: `"leah.a.espin" <${settings.smtpUser}>`,
        to,
        subject: s.subject,
        text: guestText,
        html: guestHtml,
      });
      result.guestSent = true;
    } catch (err: any) {
      console.warn("[mailer] failed to send guest confirmation:", err?.message || err);
      result.error = result.error || String(err?.message || err);
    }
  }

  return result;
}

export async function sendTestEmail(settings: Settings, to: string) {
  if (!settings.smtpUser || !settings.smtpPass) {
    throw new Error("SMTP is not configured yet.");
  }
  const tx = transport(settings);
  await tx.sendMail({
    from: `"Leah's Quinceanera RSVP" <${settings.smtpUser}>`,
    to,
    subject: "Test email — Leah's Quinceañera RSVP",
    text: `Your email settings are working.${eventDetailsText}`,
    html: wrap(
      `<h1 style="font-size:20px;color:#B86478;margin:0 0 12px;">Your email settings are working</h1>
       <p style="margin:0;">This is a test message from the RSVP site.</p>`,
    ),
  });
}
