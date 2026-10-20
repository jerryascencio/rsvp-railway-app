import Stripe from "stripe";
import type { Order } from "@shared/schema";
import { storage } from "./storage";
import { PRICE_CENTS, type EventPackage } from "@shared/platform";

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
  if (order.package === "full_custom") {
    const price = (process.env.STRIPE_PRICE_CUSTOM || "").trim();
    if (price) return [{ quantity: 1, price }];
    return [priceData(`Full custom invitation — ${who}`, PRICE_CENTS.fullCustom)];
  }
  const items: ReturnType<typeof priceData>[] = [];
  const basicPrice = (process.env.STRIPE_PRICE_BASIC || "").trim();
  if (basicPrice) items.push({ quantity: 1, price: basicPrice } as any);
  else items.push(priceData(`RSVP website — ${who}`, PRICE_CENTS.basic));
  if (order.customDomain) {
    const domainPrice = (process.env.STRIPE_PRICE_DOMAIN || "").trim();
    if (domainPrice) items.push({ quantity: 1, price: domainPrice } as any);
    else items.push(priceData("Custom domain for one year", PRICE_CENTS.domain));
  }
  return items;
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
  if (event && !event.paid) {
    storage.updateEvent(event.id, {
      paid: 1,
      stripeSessionId: sid,
      amountCents: order.amountCents,
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
  return pkg === "full_custom" ? "Full custom" : "Basic";
}
