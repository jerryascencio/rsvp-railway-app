import type { Express, Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import type { EventRecord, Order } from "@shared/schema";
import { storage } from "./storage";
import {
  describeDate,
  describePlan,
  isValidSlug,
  normalizePlan,
  normalizeTemplate,
  planPriceCents,
  slugify,
  titleForKind,
  type EventPackage,
  type HotelStop,
  type ScheduleStop,
} from "@shared/platform";
import {
  clientIp,
  eventPublicUrl,
  publicBase,
  rateLimit,
  requestHost,
  resolveRequestEvent,
  resolveSite,
  searchLimit,
  toPublicEvent,
  uploadRoot,
  legacyHostSet,
} from "./tenancy";
import {
  currentSession,
  ensureSuperAdmin,
  isEventMember,
  makeSessionToken,
  requireAdmin,
  requireSuper,
  sessionEmail,
  setSessionCookie,
  eventFromReq,
} from "./auth";
import {
  checkoutLineItems,
  markOrderPaid,
  markPaidFromSession,
  stripeClient,
  stripeConfigured,
} from "./billing";

function cleanText(v: unknown, max = 500): string {
  return String(v ?? "").trim().slice(0, max);
}

function cleanDomain(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .split(":")[0]
    .replace(/\s+/g, "");
}

function asHotels(v: unknown): HotelStop[] {
  if (!Array.isArray(v)) return [];
  return v
    .slice(0, 8)
    .map((h) => ({
      name: cleanText((h as any)?.name, 120),
      address: cleanText((h as any)?.address, 200),
      note: cleanText((h as any)?.note, 400),
      noteEs: cleanText((h as any)?.noteEs, 400),
    }))
    .filter((h) => h.name || h.address);
}

function asSchedule(v: unknown): ScheduleStop[] {
  if (!Array.isArray(v)) return [];
  return v
    .slice(0, 16)
    .map((s) => ({
      time: cleanText((s as any)?.time, 40),
      title: cleanText((s as any)?.title, 120),
      titleEs: cleanText((s as any)?.titleEs, 120),
      detail: cleanText((s as any)?.detail, 240),
      detailEs: cleanText((s as any)?.detailEs, 240),
    }))
    .filter((s) => s.time || s.title);
}

function asFaqs(v: unknown) {
  if (!Array.isArray(v)) return [];
  return v
    .slice(0, 8)
    .map((item) => ({
      q: cleanText((item as any)?.q, 200),
      a: cleanText((item as any)?.a, 600),
      qEs: cleanText((item as any)?.qEs, 200),
      aEs: cleanText((item as any)?.aEs, 600),
    }))
    .filter((item) => item.q || item.a || item.qEs || item.aEs);
}

function asParty(v: unknown) {
  if (!Array.isArray(v)) return [];
  return v
    .slice(0, 16)
    .map((item) => ({
      role: cleanText((item as any)?.role, 80),
      roleEs: cleanText((item as any)?.roleEs, 80),
      name: cleanText((item as any)?.name, 120),
    }))
    .filter((item) => item.name);
}

function memberEvent(req: Request): EventRecord | null {
  const session = currentSession(req);
  const resolved = resolveRequestEvent(req);
  if (resolved && isEventMember(session, resolved.id)) return resolved;
  if (session && session.role !== "super") return storage.getEvent(session.eventId) || null;
  return null;
}

export function registerPlatformRoutes(app: Express) {
  ensureSuperAdmin();

  app.get("/api/site", (req, res) => {
    const site = resolveSite(req);
    const event = site.slug ? storage.getEventBySlug(site.slug) : null;
    res.json({
      mode: site.mode,
      slug: event?.slug || null,
      legacyHost: legacyHostSet().has(requestHost(req)),
      stripeMock: !stripeConfigured(),
      event: event ? { slug: event.slug, honoree: event.honoree, isLegacyRoot: !!event.isLegacyRoot } : null,
    });
  });

  app.get("/api/billing/config", (_req, res) => {
    res.json({
      mock: !stripeConfigured(),
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
      prices: { basic: 100, domain: 25, fullCustom: 250 },
    });
  });

  app.get("/uploads/:eventId/:filename", (req, res) => {
    const eventId = String(req.params.eventId || "");
    const filename = String(req.params.filename || "");
    if (!/^[\w-]+$/.test(eventId) || !/^[\w.-]+$/.test(filename) || filename.includes("..")) {
      return res.status(400).end();
    }
    const root = path.resolve(uploadRoot());
    const file = path.resolve(root, eventId, filename);
    if (!file.startsWith(root + path.sep)) return res.status(400).end();
    if (!fs.existsSync(file)) return res.status(404).end();
    res.sendFile(file);
  });

  app.get("/api/public/event", (req, res) => {
    const event = resolveRequestEvent(req);
    if (!event) return res.status(404).json({ message: "Event not found." });
    const session = currentSession(req);
    const host = isEventMember(session, event.id);
    const live = event.status === "active" && (!!event.paid || !!event.isLegacyRoot);
    if (!live && !host) {
      return res.json({
        unpublished: true,
        preview: false,
        honoree: event.honoree,
        slug: event.slug,
      });
    }
    res.json({
      unpublished: !live,
      preview: !live && host,
      event: toPublicEvent(event),
    });
  });

  app.post("/api/signup", (req, res) => {
    if (!rateLimit(`signup:${clientIp(req)}`, 8, 60 * 60_000)) {
      return res.status(429).json({ message: "Too many signups from this network. Please try again later." });
    }
    const email = cleanText(req.body?.email, 160).toLowerCase();
    const password = String(req.body?.password || "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Enter a valid email." });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Use a password of at least 8 characters." });
    }
    const pkg: EventPackage = normalizePlan(req.body?.package);
    const template = normalizeTemplate(req.body?.template);
    const includesDomain = pkg !== "basic";
    const desiredDomain = includesDomain ? cleanDomain(cleanText(req.body?.desiredDomain, 120)) : "";
    if (desiredDomain && !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(desiredDomain)) {
      return res.status(400).json({ message: "That domain doesn't look right. Example: mariaandluis.com" });
    }
    const honoree = cleanText(req.body?.honoree, 120);
    if (honoree.length < 2) return res.status(400).json({ message: "Who is the celebration for?" });
    const dateIso = cleanText(req.body?.dateIso, 10);
    const described = describeDate(dateIso);
    if (!described) return res.status(400).json({ message: "Choose the event date." });
    let slug = slugify(cleanText(req.body?.slug, 40) || honoree);
    if (!isValidSlug(slug)) {
      return res.status(400).json({ message: "Pick a link using letters, numbers, and dashes (at least 3 characters)." });
    }
    if (storage.getEventBySlug(slug)) {
      return res.status(409).json({ message: "That link is taken. Try another." });
    }
    const kind = cleanText(req.body?.eventKind, 40) || "party";
    const titles = titleForKind(kind);
    const notes = cleanText(req.body?.notes, 4000);
    if (pkg === "full_custom" && notes.length < 8) {
      return res.status(400).json({ message: "Tell us what you want designed. A sentence or two is enough." });
    }
    const now = Date.now();
    const amount = planPriceCents(pkg);
    const event = storage.createEvent({
      id: randomUUID(),
      slug,
      isLegacyRoot: 0,
      status: "draft",
      package: pkg,
      template,
      paid: 0,
      honoree,
      partnerName: cleanText(req.body?.partnerName, 120),
      eventKind: kind,
      familyLine: cleanText(req.body?.familyLine, 160),
      title: titles.en,
      dateIso,
      dateLong: described.dateLong,
      dateLongEs: described.dateLongEs,
      dayName: described.dayName,
      dayNameEs: described.dayNameEs,
      day: described.day,
      year: described.year,
      ceremonyLabel: cleanText(req.body?.ceremonyLabel, 40) || (kind === "quinceanera" ? "Mass" : "Ceremony"),
      ceremonyLabelEs: cleanText(req.body?.ceremonyLabelEs, 40) || (kind === "quinceanera" ? "Misa" : "Ceremonia"),
      ceremonyTime: cleanText(req.body?.ceremonyTime, 40),
      ceremonyVenue: cleanText(req.body?.ceremonyVenue, 160),
      ceremonyAddress: cleanText(req.body?.ceremonyAddress, 200),
      receptionTime: cleanText(req.body?.receptionTime, 40),
      receptionVenue: cleanText(req.body?.receptionVenue, 160),
      receptionAddress: cleanText(req.body?.receptionAddress, 200),
      rsvpByLabel: cleanText(req.body?.rsvpByLabel, 80),
      rsvpByLabelEs: cleanText(req.body?.rsvpByLabelEs, 80),
      rsvpClosesOn: /^\d{4}-\d{2}-\d{2}$/.test(cleanText(req.body?.rsvpClosesOn, 10))
        ? cleanText(req.body?.rsvpClosesOn, 10)
        : "",
      photoUploadUrl: cleanText(req.body?.photoUploadUrl, 400),
      dressCode: cleanText(req.body?.dressCode, 500),
      dressCodeEs: cleanText(req.body?.dressCodeEs, 500),
      giftText: cleanText(req.body?.giftText, 800),
      giftTextEs: cleanText(req.body?.giftTextEs, 800),
      aboutText: cleanText(req.body?.aboutText, 1200),
      aboutTextEs: cleanText(req.body?.aboutTextEs, 1200),
      hotelsJson: JSON.stringify(asHotels(req.body?.hotels)),
      scheduleJson: JSON.stringify(asSchedule(req.body?.schedule)),
      photosJson: "[]",
      hostnames: "",
      desiredDomain,
      customDomain: includesDomain ? 1 : 0,
      customNotes: notes,
      smtpUser: "",
      smtpPass: "",
      notifyEmail: email,
      stripeSessionId: null,
      amountCents: amount,
      createdAt: now,
      updatedAt: now,
    });
    const host = storage.createHost(event.id, email, bcrypt.hashSync(password, 10));
    const order = storage.createOrder({
      id: randomUUID(),
      eventId: event.id,
      package: pkg,
      kind: "purchase",
      customDomain: includesDomain ? 1 : 0,
      desiredDomain,
      notes,
      amountCents: amount,
      currency: "usd",
      status: "pending",
      stripeSessionId: null,
      createdAt: now,
      paidAt: null,
    });
    const token = makeSessionToken({ role: "host", hostId: host.id, eventId: event.id });
    setSessionCookie(res, token);
    res.json({
      ok: true,
      token,
      adminEmail: host.email,
      event: { id: event.id, slug: event.slug, honoree: event.honoree },
      order: { id: order.id, amountCents: amount, mock: !stripeConfigured(), package: pkg },
    });
  });

  async function startCheckout(req: Request, res: Response, event: EventRecord, order: Order, email: string | undefined) {
    const base = publicBase(req);
    const success = `${base}/checkout/success?order=${order.id}&session_id={CHECKOUT_SESSION_ID}`;
    const cancel = `${base}/checkout/cancel?order=${order.id}&slug=${event.slug}`;
    const stripe = stripeClient();
    if (!stripe) {
      return res.json({
        mock: true,
        checkoutUrl: `${base}/checkout/success?mock=1&order=${order.id}&slug=${event.slug}`,
        orderId: order.id,
        amountCents: order.amountCents,
        package: order.package,
      });
    }
    try {
      const checkout = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: email || undefined,
        client_reference_id: order.id,
        metadata: { orderId: order.id, eventId: event.id, kind: order.kind },
        line_items: checkoutLineItems(order, event.honoree) as any,
        success_url: success,
        cancel_url: cancel,
      });
      storage.updateOrder(order.id, { stripeSessionId: checkout.id });
      storage.updateEvent(event.id, { stripeSessionId: checkout.id });
      res.json({ mock: false, checkoutUrl: checkout.url, orderId: order.id, amountCents: order.amountCents, package: order.package });
    } catch (err: any) {
      console.warn("[stripe] checkout failed:", err?.message || err);
      res.status(502).json({ message: "Stripe couldn't start checkout. Check the API keys and try again." });
    }
  }

  app.post("/api/billing/checkout", async (req, res) => {
    const event = memberEvent(req);
    const session = currentSession(req);
    if (!event || !session || session.role === "super") {
      return res.status(401).json({ message: "Sign in to continue to checkout." });
    }
    if (event.isLegacyRoot) return res.status(400).json({ message: "This event is already set up." });
    if (event.paid) {
      return res.json({ paid: true, slug: event.slug });
    }
    let order = storage.latestOrder(event.id);
    if (!order || order.status === "paid") {
      const plan = normalizePlan(event.package);
      const now = Date.now();
      order = storage.createOrder({
        id: randomUUID(),
        eventId: event.id,
        package: plan,
        kind: "purchase",
        customDomain: plan === "basic" ? 0 : 1,
        desiredDomain: event.desiredDomain,
        notes: event.customNotes,
        amountCents: event.amountCents || planPriceCents(plan),
        currency: "usd",
        status: "pending",
        stripeSessionId: null,
        createdAt: now,
        paidAt: null,
      });
    }
    await startCheckout(req, res, event, order, sessionEmail(session));
  });

  app.post("/api/billing/upgrade", async (req, res) => {
    const event = memberEvent(req);
    const session = currentSession(req);
    if (!event || !session || session.role === "super") {
      return res.status(401).json({ message: "Sign in to continue to checkout." });
    }
    if (event.isLegacyRoot || event.isDemo) {
      return res.status(400).json({ message: "This site already includes every feature." });
    }
    const target = normalizePlan(req.body?.package);
    const quote = describePlan(event).upgrades.find((row) => row.plan === target);
    if (!quote || quote.amountCents <= 0) {
      return res.status(400).json({ message: "Choose a higher plan." });
    }
    const desiredDomain = cleanDomain(cleanText(req.body?.desiredDomain, 120)) || event.desiredDomain;
    if (desiredDomain && !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(desiredDomain)) {
      return res.status(400).json({ message: "That domain doesn't look right. Example: mariaandluis.com" });
    }
    const now = Date.now();
    if (!event.paid) {
      storage.updateEvent(event.id, {
        package: target,
        customDomain: target === "basic" ? 0 : 1,
        desiredDomain,
        amountCents: quote.amountCents,
      });
      const pending = storage.latestOrder(event.id);
      const order = pending && pending.status !== "paid"
        ? storage.updateOrder(pending.id, {
            package: target,
            kind: "purchase",
            customDomain: target === "basic" ? 0 : 1,
            desiredDomain,
            amountCents: quote.amountCents,
          })
        : storage.createOrder({
            id: randomUUID(),
            eventId: event.id,
            package: target,
            kind: "purchase",
            customDomain: target === "basic" ? 0 : 1,
            desiredDomain,
            notes: event.customNotes,
            amountCents: quote.amountCents,
            currency: "usd",
            status: "pending",
            stripeSessionId: null,
            createdAt: now,
            paidAt: null,
          });
      const fresh = storage.getEvent(event.id) || event;
      return startCheckout(req, res, fresh, order, sessionEmail(session));
    }
    const order = storage.createOrder({
      id: randomUUID(),
      eventId: event.id,
      package: target,
      kind: "upgrade",
      customDomain: 1,
      desiredDomain,
      notes: event.customNotes,
      amountCents: quote.amountCents,
      currency: "usd",
      status: "pending",
      stripeSessionId: null,
      createdAt: now,
      paidAt: null,
    });
    await startCheckout(req, res, event, order, sessionEmail(session));
  });

  app.post("/api/billing/confirm", async (req, res) => {
    const orderId = cleanText(req.body?.orderId, 80);
    const sessionId = cleanText(req.body?.sessionId, 120);
    const stripe = stripeClient();
    if (stripe && sessionId && sessionId !== "{CHECKOUT_SESSION_ID}") {
      try {
        const remote = await stripe.checkout.sessions.retrieve(sessionId);
        const marked = markPaidFromSession(remote);
        if (!marked) return res.status(402).json({ paid: false, message: "Payment is not complete yet." });
        const event = storage.getEvent(marked.eventId);
        return res.json({ paid: true, mock: false, orderId: marked.id, slug: event?.slug || "" });
      } catch (err: any) {
        console.warn("[stripe] confirm failed:", err?.message || err);
        return res.status(400).json({ message: "Couldn't verify that Checkout session." });
      }
    }
    if (stripe) return res.status(400).json({ message: "Missing Checkout session." });
    const order = orderId ? storage.getOrder(orderId) : undefined;
    if (!order) return res.status(404).json({ message: "Order not found." });
    const marked = markOrderPaid(order.id, null);
    const event = marked ? storage.getEvent(marked.eventId) : undefined;
    res.json({ paid: true, mock: true, orderId: order.id, slug: event?.slug || "" });
  });

  app.post("/api/stripe/webhook", async (req, res) => {
    const stripe = stripeClient();
    const secret = (process.env.STRIPE_WEBHOOK_SECRET || "").trim();
    if (!stripe || !secret) {
      return res.status(503).json({ message: "Stripe webhook is not configured." });
    }
    const signature = req.headers["stripe-signature"];
    let event: any;
    try {
      event = stripe.webhooks.constructEvent((req as any).rawBody, signature as string, secret);
    } catch (err: any) {
      return res.status(400).json({ message: `Webhook signature failed: ${err?.message || "invalid"}` });
    }
    if (event.type === "checkout.session.completed") {
      markPaidFromSession(event.data.object);
    }
    res.json({ received: true });
  });

  app.post("/api/admin/publish", requireAdmin, (req, res) => {
    const event = eventFromReq(req);
    if (event.isLegacyRoot) return res.json({ ok: true, status: "active" });
    if (!event.paid) {
      return res.status(402).json({ message: "Payment is required before publishing." });
    }
    const updated = storage.updateEvent(event.id, { status: "active" });
    res.json({ ok: true, status: updated.status, event: toPublicEvent(updated) });
  });

  app.post("/api/admin/unpublish", requireAdmin, (req, res) => {
    const event = eventFromReq(req);
    if (event.isLegacyRoot) {
      return res.status(400).json({ message: "The original event stays published." });
    }
    const updated = storage.updateEvent(event.id, { status: "draft" });
    res.json({ ok: true, status: updated.status });
  });

  app.get("/api/admin/event", requireAdmin, (req, res) => {
    const event = eventFromReq(req);
    res.json({ event: toPublicEvent(event), publicUrl: eventPublicUrl(req, event) });
  });

  app.patch("/api/admin/event", requireAdmin, (req, res) => {
    const event = eventFromReq(req);
    if (event.isLegacyRoot) {
      return res.status(400).json({ message: "This invitation's design is fixed. You can still close RSVPs from Settings." });
    }
    const patch: Partial<EventRecord> = {};
    const textFields: (keyof EventRecord)[] = [
      "honoree",
      "partnerName",
      "familyLine",
      "familyLineEs",
      "ceremonyLabel",
      "ceremonyLabelEs",
      "ceremonyTime",
      "ceremonyVenue",
      "ceremonyAddress",
      "ceremonyMapUrl",
      "receptionTime",
      "receptionVenue",
      "receptionAddress",
      "receptionMapUrl",
      "rsvpByLabel",
      "rsvpByLabelEs",
      "photoUploadUrl",
      "dressCode",
      "dressCodeEs",
      "giftText",
      "giftTextEs",
      "aboutText",
      "aboutTextEs",
      "parkingText",
      "parkingTextEs",
      "hostNote",
      "hostNoteEs",
      "contactEmail",
      "contactPhone",
      "contactNote",
      "contactNoteEs",
      "mealPrompt",
      "mealPromptEs",
    ];
    for (const key of textFields) {
      if (req.body?.[key] !== undefined) (patch as any)[key] = cleanText(req.body[key], 2000);
    }
    if (req.body?.dateIso) {
      const described = describeDate(cleanText(req.body.dateIso, 10));
      if (!described) return res.status(400).json({ message: "That date isn't valid." });
      patch.dateIso = cleanText(req.body.dateIso, 10);
      Object.assign(patch, described);
    }
    if (req.body?.template !== undefined) {
      patch.template = normalizeTemplate(req.body.template);
    }
    if (req.body?.eventKind) {
      const kind = cleanText(req.body.eventKind, 40);
      patch.eventKind = kind;
      patch.title = titleForKind(kind).en;
    }
    if (req.body?.hotels) patch.hotelsJson = JSON.stringify(asHotels(req.body.hotels));
    if (req.body?.schedule) patch.scheduleJson = JSON.stringify(asSchedule(req.body.schedule));
    if (req.body?.faqs) patch.faqsJson = JSON.stringify(asFaqs(req.body.faqs));
    if (req.body?.party) patch.partyJson = JSON.stringify(asParty(req.body.party));
    if (req.body?.slug && req.body.slug !== event.slug) {
      const slug = slugify(cleanText(req.body.slug, 40));
      if (!isValidSlug(slug)) return res.status(400).json({ message: "That link isn't valid." });
      if (storage.getEventBySlug(slug)) return res.status(409).json({ message: "That link is taken." });
      patch.slug = slug;
    }
    const updated = storage.updateEvent(event.id, patch);
    res.json({ event: toPublicEvent(updated) });
  });

  app.post("/api/admin/photos", requireAdmin, (req, res) => {
    const event = eventFromReq(req);
    if (event.isLegacyRoot) {
      return res.status(400).json({ message: "Photos for the original invitation are part of its design." });
    }
    const dataBase64 = String(req.body?.dataBase64 || "");
    if (!dataBase64) return res.status(400).json({ message: "Missing photo." });
    const buf = Buffer.from(dataBase64, "base64");
    if (!buf.length || buf.length > 2_000_000) {
      return res.status(400).json({ message: "Each photo must be under 2MB." });
    }
    const photos = JSON.parse(event.photosJson || "[]") as { id: string; filename: string; caption: string }[];
    if (!Array.isArray(photos)) return res.status(400).json({ message: "Photo list is unreadable." });
    if (photos.length >= 12) return res.status(400).json({ message: "You can add up to 12 photos." });
    const original = String(req.body?.filename || "photo.jpg").toLowerCase();
    const ext = original.match(/\.(png|jpe?g|webp|gif)$/)?.[1]?.replace("jpeg", "jpg") || "jpg";
    const id = randomUUID();
    const filename = `${id}.${ext === "jpeg" ? "jpg" : ext}`;
    const dir = path.join(uploadRoot(), event.id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), buf);
    photos.push({ id, filename, caption: cleanText(req.body?.caption, 160) });
    const updated = storage.updateEvent(event.id, { photosJson: JSON.stringify(photos) });
    res.json({ event: toPublicEvent(updated) });
  });

  app.delete("/api/admin/photos/:photoId", requireAdmin, (req, res) => {
    const event = eventFromReq(req);
    const photos = JSON.parse(event.photosJson || "[]") as { id: string; filename: string; caption: string }[];
    const next = photos.filter((p) => p.id !== req.params.photoId);
    const removed = photos.find((p) => p.id === req.params.photoId);
    if (removed) {
      const file = path.join(uploadRoot(), event.id, removed.filename);
      fs.rmSync(file, { force: true });
    }
    const updated = storage.updateEvent(event.id, { photosJson: JSON.stringify(next) });
    res.json({ event: toPublicEvent(updated) });
  });

  app.post("/api/super/login", (req, res) => {
    const email = cleanText(req.body?.email, 160);
    const password = String(req.body?.password || "");
    const admin = storage.getSuperByEmail(email);
    if (!admin || !bcrypt.compareSync(password, admin.passwordHash)) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }
    const token = makeSessionToken({ role: "super", superId: admin.id });
    setSessionCookie(res, token);
    res.json({ ok: true, token, email: admin.email });
  });

  app.get("/api/super/events", requireSuper, (_req, res) => {
    const rows = storage.listEvents().map((event) => {
      const totals = storage.totals(event.id);
      const host = storage.hostsForEvent(event.id)[0];
      return {
        id: event.id,
        slug: event.slug,
        honoree: event.honoree,
        title: event.title,
        template: event.template,
        package: event.package,
        paid: !!event.paid,
        status: event.status,
        amountCents: event.amountCents,
        customDomain: !!event.customDomain,
        desiredDomain: event.desiredDomain,
        hostnames: event.hostnames,
        customNotes: event.customNotes,
        createdAt: event.createdAt,
        isLegacyRoot: !!event.isLegacyRoot,
        isDemo: !!event.isDemo,
        hostEmail: host?.email || "",
        households: totals.totalHouseholds,
        invited: totals.totalInvited,
      };
    });
    const billable = rows.filter((row) => !row.isDemo);
    const paidRows = billable.filter((row) => row.paid || row.isLegacyRoot);
    // Legacy admin email lives on the settings row, not event_hosts.
    const settings = storage.getSettings();
    for (const row of rows) {
      if (row.isLegacyRoot && !row.hostEmail) row.hostEmail = settings.adminEmail || "";
    }
    res.json({
      events: rows,
      totals: {
        events: billable.length,
        revenueCents: paidRows.reduce((sum, row) => sum + row.amountCents, 0),
        invited: billable.reduce((sum, row) => sum + row.invited, 0),
      },
    });
  });

  app.patch("/api/super/events/:id", requireSuper, (req, res) => {
    const event = storage.getEvent(String(req.params.id));
    if (!event) return res.status(404).json({ message: "Event not found." });
    const patch: Partial<EventRecord> = {};
    if (req.body?.hostnames !== undefined) {
      const hosts = String(req.body.hostnames)
        .split(",")
        .map((s) => cleanDomain(s))
        .filter(Boolean);
      patch.hostnames = Array.from(new Set(hosts)).join(",");
    }
    if (req.body?.customNotes !== undefined) patch.customNotes = cleanText(req.body.customNotes, 4000);
    const updated = storage.updateEvent(event.id, patch);
    res.json({
      event: {
        id: updated.id,
        hostnames: updated.hostnames,
        customNotes: updated.customNotes,
      },
    });
  });
}
