import nodemailer from "nodemailer";
import type { Guest, RsvpResponse, Settings, Totals } from "@shared/schema";
import { EVENT } from "@shared/schema";

// Public site URL used in the "Update your RSVP" link on the guest confirmation.
const SITE_URL = process.env.PUBLIC_SITE_URL || "https://www.leahaespinoza.com";

const eventDetailsText = [
  "",
  "— Event Details —",
  `${EVENT.honoree}'s Quinceanera`,
  EVENT.dateLong,
  "",
  `Mass: ${EVENT.massTime}`,
  `${EVENT.massVenue}`,
  `${EVENT.massAddress}`,
  "",
  `Reception: ${EVENT.receptionTime}`,
  `${EVENT.receptionVenue}`,
  `${EVENT.receptionAddress}`,
].join("\n");

const eventDetailsHtml = `
  <div style="margin-top:28px;padding-top:20px;border-top:1px solid #E4CDBE;font-family:Georgia,serif;color:#4A3B34;">
    <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#B08968;margin-bottom:10px;">Event Details</div>
    <div style="font-size:17px;color:#B86478;margin-bottom:2px;">${EVENT.honoree}&rsquo;s Quincea&ntilde;era</div>
    <div style="font-size:14px;margin-bottom:16px;">${EVENT.dateLong}</div>
    <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#B08968;">Mass &middot; ${EVENT.massTime}</div>
    <div style="font-size:14px;">${EVENT.massVenue}<br/>${EVENT.massAddress}</div>
    <div style="height:14px"></div>
    <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#B08968;">Reception &middot; ${EVENT.receptionTime}</div>
    <div style="font-size:14px;">${EVENT.receptionVenue}<br/>${EVENT.receptionAddress}</div>
  </div>`;

function wrap(inner: string) {
  return `<div style="background:#FBF2EA;padding:28px;">
    <div style="max-width:560px;margin:0 auto;background:#FFFDFB;border:1px solid #E9D6C7;border-radius:10px;padding:28px;font-family:Georgia,serif;color:#4A3B34;line-height:1.6;">
      ${inner}
      ${eventDetailsHtml}
    </div>
  </div>`;
}

function transport(s: Settings) {
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: s.smtpUser, pass: s.smtpPass },
  });
}

function plural(n: number) {
  return n === 1 ? "person" : "people";
}

export async function sendRsvpEmails(opts: {
  settings: Settings;
  guest: Guest;
  response: RsvpResponse;
  totals: Totals;
}): Promise<{ reportSent: boolean; guestSent: boolean; error?: string }> {
  const { settings, guest, response, totals } = opts;
  const result = { reportSent: false, guestSent: false, error: undefined as string | undefined };

  if (!settings || !settings.smtpUser || !settings.smtpPass) {
    console.warn(
      "[mailer] SMTP is not configured — skipping RSVP notification emails. RSVP was still saved.",
    );
    return result;
  }

  const tx = transport(settings);
  const name = guest.fullName || `${guest.firstName} ${guest.lastName}`.trim();

  // --- Email 1: Stef's report ---
  const reportText = [
    `${name} just RSVPed — ${response.attendees} attending, ${response.declinedCount} not attending from their party of ${guest.invites}.`,
    "",
    "Running totals:",
    `• Confirmed attending: ${totals.totalHeadcount} people`,
    `• Not attending: ${totals.totalDeclined} people`,
    `• Still pending: ${totals.totalPendingHouseholds} households (${totals.totalPending} seats)`,
    response.note ? `\nNote from guest: ${response.note}` : "",
    eventDetailsText,
  ].join("\n");

  const reportHtml = wrap(`
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
  `);

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

  // --- Email 2: guest confirmation ---
  const to = response.guestEmail;
  if (to) {
    const coming = response.attendees > 0;
    const closing = coming
      ? "We can't wait to celebrate with you!"
      : "We'll miss you — thank you for letting us know.";
    const guestText = [
      `Thank you for RSVPing to Leah's Quinceanera!`,
      "",
      "Your response:",
      `• Attending: ${response.attendees}`,
      `• Not attending: ${response.declinedCount}`,
      "",
      closing,
      "",
      `Made a mistake? Update your RSVP: ${SITE_URL}`,
      eventDetailsText,
    ].join("\n");

    const guestHtml = wrap(`
      <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#B08968;">Thank You</div>
      <h1 style="font-size:22px;color:#B86478;margin:8px 0 14px;">Thank you for RSVPing to Leah&rsquo;s Quincea&ntilde;era!</h1>
      <p style="margin:0 0 14px;">Hi ${guest.firstName}, we've recorded your response.</p>
      <div style="background:#FBF2EA;border:1px solid #EEDDD0;border-radius:8px;padding:14px 18px;">
        <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#B08968;margin-bottom:8px;">Your Response</div>
        <div>Attending: <strong>${response.attendees}</strong> ${plural(response.attendees)}</div>
        <div>Not attending: <strong>${response.declinedCount}</strong></div>
      </div>
      <p style="margin:16px 0 0;font-size:16px;color:#B86478;">${closing}</p>
      <p style="margin:22px 0 0;font-size:14px;color:#6B584E;text-align:center;">
        Made a mistake?
        <a href="${SITE_URL}" style="color:#B86478;font-weight:600;text-decoration:underline;">Update your RSVP</a>
      </p>
    `);

    try {
      await tx.sendMail({
        from: `"leah.a.espin" <${settings.smtpUser}>`,
        to,
        subject: "Your RSVP for Leah's Quinceañera",
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
