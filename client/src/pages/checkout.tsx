import { useEffect, useState } from "react";
import { Link } from "wouter";
import { api, restoreAuthToken } from "@/lib/api";
import { setSiteContext } from "@/lib/event-scope";
import { BrandShell, Wordmark } from "@/components/brand-shell";

export function CheckoutSuccess() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("order") || "";
  const sessionId = params.get("session_id") || "";
  const mock = params.get("mock") === "1";
  const [message, setMessage] = useState("Confirming your payment…");
  const [slug, setSlug] = useState(params.get("slug") || "");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api<{ paid: boolean; slug?: string; mock?: boolean }>("POST", "/api/billing/confirm", {
      orderId,
      sessionId: sessionId && !sessionId.includes("CHECKOUT_SESSION") ? sessionId : "",
    })
      .then((res) => {
        if (res.slug) {
          setSlug(res.slug);
          setSiteContext({ slug: res.slug, mode: "platform", legacyCopy: false });
          restoreAuthToken();
        }
        setMessage(
          res.mock || mock
            ? "Stripe keys aren't configured, so this order was marked paid in test mode."
            : "Payment received. Your invitation is ready to preview and publish.",
        );
        setReady(true);
      })
      .catch((err: any) => {
        setMessage(err?.message || "We couldn't confirm the payment yet.");
      });
  }, [orderId, sessionId, mock]);

  return (
    <BrandShell>
    <div className="flex min-h-screen items-center justify-center px-5" data-testid="page-checkout-success">
      <div className="w-full max-w-md rounded-2xl border border-[#d7dee7] bg-white p-8 text-center">
        <Wordmark />
        <p className="brand-display mt-6 text-4xl">Thank you</p>
        <p className="mt-4 text-sm leading-relaxed" data-testid="text-checkout-message">{message}</p>
        {ready && slug && (
          <Link
            href={`/e/${slug}/admin`}
            className="brand-btn mt-6"
            data-testid="link-dashboard"
            onClick={() => {
              setSiteContext({ slug, mode: "platform", legacyCopy: false });
              restoreAuthToken();
            }}
          >
            Open your dashboard
          </Link>
        )}
      </div>
    </div>
    </BrandShell>
  );
}

export function CheckoutCancel() {
  const slug = new URLSearchParams(window.location.search).get("slug") || "";
  return (
    <BrandShell>
    <div className="flex min-h-screen items-center justify-center px-5" data-testid="page-checkout-cancel">
      <div className="w-full max-w-md rounded-2xl border border-[#d7dee7] bg-white p-8 text-center">
        <h1 className="brand-display text-3xl">Checkout canceled</h1>
        <p className="mt-3 text-sm">Your draft is saved. You can pay whenever you're ready.</p>
        {slug && (
          <Link href={`/e/${slug}/admin`} className="mt-6 inline-flex text-sm underline">
            Back to the dashboard
          </Link>
        )}
      </div>
    </div>
    </BrandShell>
  );
}
