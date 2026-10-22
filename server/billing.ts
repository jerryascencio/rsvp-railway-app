import Stripe from "stripe";
import type { Order } from "@shared/schema";
import { storage } from "./storage";
import { planLabel, planPriceCents, normalizePlan, type EventPackage } from "@shared/platform";

let client: Stripe | null | undefined;

export function stripeClient(): Stripe | null {
  if (client !== undefined) return client;
  const key = (process.env.STRIPE_SECRET_KEY || "").trim();
  client = key ? new Stripe(key) : null;
  return client;
}

export function stripeConfigured(): boolean {
  return !!stripeClient();
}

function priceData(name: string, unitAmount: number) {
  return {
    quantity: 1,
    price_data: {
      currency: "usd",
      unit_amount: unitAmount,
      product_data: { name },
    },
  };
}

export function checkoutLineItems(order: Order, honoree: string) {
  const who = honoree || "your celebration";
  const plan = normalizePlan(order.package);
  const label = planLabel(plan);
  if (order.kind === "upgrade") {
    return [priceData(`Upgrade to ${label} — ${who}`, order.amountCents)];
  }
  if (plan === "full_custom") {
    const price = (process.env.STRIPE_PRICE_CUSTOM || "").trim();
    if (price) return [{ quantity: 1, price }];
    return [priceData(`Full custom invitation — ${who}`, planPriceCents("full_custom"))];
  }
  if (plan === "plus") {
    const price = (process.env.STRIPE_PRICE_PLUS || "").trim();
    if (price) return [{ quantity: 1, price }];
    return [priceData(`${label} invitation — ${who}`, planPriceCents("plus"))];
  }
  const basicPrice = (process.env.STRIPE_PRICE_BASIC || "").trim();
  if (basicPrice) return [{ quantity: 1, price: basicPrice }];
  return [priceData(`RSVP website — ${who}`, planPriceCents("basic"))];
}

/** Idempotent. Safe from both the webhook and the success-page confirm. */
export function markOrderPaid(orderId: string, sessionId?: string | null): Order | undefined {
  const order = storage.getOrder(orderId);
  if (!order) return undefined;
  const sid = sessionId || order.stripeSessionId || null;
  if (order.status !== "paid") {
    storage.updateOrder(order.id, {
      status: "paid",
      paidAt: Date.now(),
      stripeSessionId: sid,
    });
  } else if (sid && sid !== order.stripeSessionId) {
    storage.updateOrder(order.id, { stripeSessionId: sid });
  }
  const event = storage.getEvent(order.eventId);
  if (event && order.status !== "paid") {
    const target = normalizePlan(order.package);
    const upgrading = !!event.paid && order.kind === "upgrade";
    storage.updateEvent(event.id, {
      paid: 1,
      package: target,
      customDomain: target === "basic" ? event.customDomain : 1,
      desiredDomain: order.desiredDomain || event.desiredDomain,
      stripeSessionId: sid,
      amountCents: upgrading ? event.amountCents + order.amountCents : order.amountCents,
      customNotes: order.notes || event.customNotes,
    });
  }
  return storage.getOrder(order.id);
}

export function markPaidFromSession(session: {
  id?: string | null;
  client_reference_id?: string | null;
  metadata?: { orderId?: string } | null;
  payment_status?: string | null;
  status?: string | null;
}): Order | undefined {
  const paid = session.payment_status === "paid" || session.status === "complete";
  if (!paid) return undefined;
  const orderId = session.client_reference_id || session.metadata?.orderId || "";
  if (orderId) return markOrderPaid(orderId, session.id || null);
  if (session.id) {
    const order = storage.getOrderBySession(session.id);
    if (order) return markOrderPaid(order.id, session.id);
  }
  return undefined;
}

export function packageLabel(pkg: EventPackage): string {
  return planLabel(normalizePlan(pkg));
}
