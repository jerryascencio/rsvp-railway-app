import { useEffect, useState } from "react";
import { Link } from "wouter";
import { api, restoreAuthToken } from "@/lib/api";
import { setSiteContext } from "@/lib/event-scope";

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
    <div className="flex min-h-screen items-center justify-center bg-[hsl(28_60%_97%)] px-5" data-testid="page-checkout-success">
      <div className="w-full max-w-md rounded-2xl border border-[hsl(27_30%_86%)] bg-white p-8 text-center">
        <p className="font-script text-5xl text-[hsl(346_37%_48%)]">Thank you</p>
        <p className="mt-4 text-sm leading-relaxed" data-testid="text-checkout-message">{message}</p>
        {ready && slug && (
          <Link
            href={`/e/${slug}/admin`}
            className="mt-6 inline-flex rounded-full bg-[hsl(346_37%_48%)] px-5 py-3 text-[12px] uppercase tracking-[0.16em] text-white"
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
  );
}

export function CheckoutCancel() {
  const slug = new URLSearchParams(window.location.search).get("slug") || "";
  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(28_60%_97%)] px-5" data-testid="page-checkout-cancel">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center">
        <h1 className="font-display text-3xl">Checkout canceled</h1>
        <p className="mt-3 text-sm">Your draft is saved. You can pay whenever you're ready.</p>
        {slug && (
          <Link href={`/e/${slug}/admin`} className="mt-6 inline-flex text-sm underline">
            Back to the dashboard
          </Link>
        )}
      </div>
    </div>
  );
}
