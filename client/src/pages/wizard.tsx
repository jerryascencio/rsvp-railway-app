import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { api, setAuthToken } from "@/lib/api";
import { setSiteContext } from "@/lib/event-scope";
import { slugify } from "@shared/platform";

type Kind = "quinceanera" | "wedding" | "baptism" | "sweet16" | "other";

type Draft = {
  email: string;
  password: string;
  template: "quince" | "wedding";
  honoree: string;
  partnerName: string;
  eventKind: Kind;
  familyLine: string;
  slug: string;
  dateIso: string;
  ceremonyTime: string;
  ceremonyVenue: string;
  ceremonyAddress: string;
  receptionTime: string;
  receptionVenue: string;
  receptionAddress: string;
  rsvpClosesOn: string;
  dressCode: string;
  dressCodeEs: string;
  giftText: string;
  giftTextEs: string;
  aboutText: string;
  aboutTextEs: string;
  photoUploadUrl: string;
  hotelName: string;
  hotelAddress: string;
  package: "basic" | "full_custom";
  customDomain: boolean;
  desiredDomain: string;
  notes: string;
};

function initialDraft(): Draft {
  const q = new URLSearchParams(window.location.search);
  const pkg = q.get("package") === "full_custom" ? "full_custom" : "basic";
  return {
    email: "",
    password: "",
    template: "quince",
    honoree: "",
    partnerName: "",
    eventKind: "quinceanera",
    familyLine: "",
    slug: "",
    dateIso: "",
    ceremonyTime: "",
    ceremonyVenue: "",
    ceremonyAddress: "",
    receptionTime: "",
    receptionVenue: "",
    receptionAddress: "",
    rsvpClosesOn: "",
    dressCode: "",
    dressCodeEs: "",
    giftText: "",
    giftTextEs: "",
    aboutText: "",
    aboutTextEs: "",
    photoUploadUrl: "",
    hotelName: "",
    hotelAddress: "",
    package: pkg,
    customDomain: q.get("domain") === "1",
    desiredDomain: "",
    notes: "",
  };
}

const input =
  "w-full rounded-md border border-[hsl(28_25%_78%)] bg-white px-3 py-3 text-base outline-none focus:border-[hsl(346_37%_50%)]";

export default function Wizard() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const price = useMemo(() => {
    if (draft.package === "full_custom") return 250;
    return 100 + (draft.customDomain ? 25 : 0);
  }, [draft.package, draft.customDomain]);

  function next() {
    setError(null);
    if (step === 0) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) return setError("Enter a valid email.");
      if (draft.password.length < 8) return setError("Use at least 8 characters.");
    }
    if (step === 2) {
      if (draft.honoree.trim().length < 2) return setError("Who is this celebration for?");
      if (!draft.dateIso) return setError("Choose the date.");
    }
    if (step === 3 && draft.package === "full_custom" && draft.notes.trim().length < 8) {
      return setError("Add a note about the custom design.");
    }
    if (step === 3 && draft.customDomain && draft.package === "basic" && !draft.desiredDomain.trim()) {
      return setError("What domain should we buy?");
    }
    setStep((s) => Math.min(4, s + 1));
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const slug = slugify(draft.slug || draft.honoree);
      const res = await api<{
        token: string;
        event: { slug: string };
      }>("POST", "/api/signup", {
        ...draft,
        slug,
        hotels: draft.hotelName
          ? [{ name: draft.hotelName, address: draft.hotelAddress, note: "" }]
          : [],
        schedule: [
          draft.ceremonyTime || draft.ceremonyVenue
            ? { time: draft.ceremonyTime, title: draft.template === "wedding" ? "Ceremony" : "Mass", detail: draft.ceremonyVenue }
            : null,
          draft.receptionTime || draft.receptionVenue
            ? { time: draft.receptionTime, title: "Reception", detail: draft.receptionVenue }
            : null,
        ].filter(Boolean),
        customDomain: draft.package === "basic" && draft.customDomain,
      });
      setSiteContext({ slug: res.event.slug, mode: "platform", legacyCopy: false });
      setAuthToken(res.token);
      const checkout = await api<{ checkoutUrl?: string; paid?: boolean }>("POST", "/api/billing/checkout", {});
      if (checkout.checkoutUrl) {
        window.location.href = checkout.checkoutUrl;
        return;
      }
      navigate(`/e/${res.event.slug}/admin`);
    } catch (err: any) {
      setError(err?.message || "Could not create the event.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(28_60%_97%)] px-4 py-8 text-[hsl(19_17%_22%)]" data-testid="page-wizard">
      <div className="mx-auto w-full max-w-lg">
        <Link href="/" className="font-script text-3xl text-[hsl(346_37%_48%)]">
          Invitation
        </Link>
        <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[hsl(28_31%_42%)]">
          Step {step + 1} of 5
        </p>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-[hsl(28_30%_88%)]">
          <div className="h-full bg-[hsl(346_37%_52%)]" style={{ width: `${((step + 1) / 5) * 100}%` }} />
        </div>

        <div className="mt-6 rounded-2xl border border-[hsl(27_30%_86%)] bg-white p-5 shadow-sm sm:p-7">
          {step === 0 && (
            <div className="space-y-4">
              <h1 className="font-display text-3xl">Your host login</h1>
              <p className="text-sm text-[hsl(19_12%_40%)]">This email opens the dashboard for your event.</p>
              <label className="block text-sm">
                Email
                <input className={`${input} mt-1`} type="email" value={draft.email} onChange={(e) => set({ email: e.target.value })} data-testid="input-wizard-email" />
              </label>
              <label className="block text-sm">
                Password
                <input className={`${input} mt-1`} type="password" value={draft.password} onChange={(e) => set({ password: e.target.value })} data-testid="input-wizard-password" />
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <h1 className="font-display text-3xl">Choose a template</h1>
              <TemplatePick
                active={draft.template === "quince"}
                title="Quinceañera"
                detail="Floral, script, rose and cream."
                onClick={() => set({ template: "quince", eventKind: draft.eventKind === "wedding" ? "quinceanera" : draft.eventKind })}
              />
              <TemplatePick
                active={draft.template === "wedding"}
                title="Wedding"
                detail="Ivory, ink, and a gold rule."
                onClick={() => set({ template: "wedding", eventKind: "wedding" })}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h1 className="font-display text-3xl">The celebration</h1>
              <label className="block text-sm">
                Honoree
                <input className={`${input} mt-1`} value={draft.honoree} onChange={(e) => set({ honoree: e.target.value, slug: draft.slug || slugify(e.target.value) })} data-testid="input-wizard-honoree" />
              </label>
              <label className="block text-sm">
                Partner or second name <span className="text-[hsl(19_10%_55%)]">(optional)</span>
                <input className={`${input} mt-1`} value={draft.partnerName} onChange={(e) => set({ partnerName: e.target.value })} />
              </label>
              <label className="block text-sm">
                Occasion
                <select className={`${input} mt-1`} value={draft.eventKind} onChange={(e) => set({ eventKind: e.target.value as Kind })}>
                  <option value="quinceanera">Quinceañera</option>
                  <option value="wedding">Wedding</option>
                  <option value="baptism">Baptism</option>
                  <option value="sweet16">Sweet 16</option>
                  <option value="other">Other celebration</option>
                </select>
              </label>
              <label className="block text-sm">
                Family line
                <input className={`${input} mt-1`} placeholder="The Garcia family" value={draft.familyLine} onChange={(e) => set({ familyLine: e.target.value })} />
              </label>
              <label className="block text-sm">
                Date
                <input className={`${input} mt-1`} type="date" value={draft.dateIso} onChange={(e) => set({ dateIso: e.target.value })} data-testid="input-wizard-date" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">Ceremony time<input className={`${input} mt-1`} placeholder="2:30 PM" value={draft.ceremonyTime} onChange={(e) => set({ ceremonyTime: e.target.value })} /></label>
                <label className="block text-sm">Reception time<input className={`${input} mt-1`} placeholder="5:00 PM" value={draft.receptionTime} onChange={(e) => set({ receptionTime: e.target.value })} /></label>
              </div>
              <label className="block text-sm">Ceremony venue<input className={`${input} mt-1`} value={draft.ceremonyVenue} onChange={(e) => set({ ceremonyVenue: e.target.value })} /></label>
              <label className="block text-sm">Ceremony address<input className={`${input} mt-1`} value={draft.ceremonyAddress} onChange={(e) => set({ ceremonyAddress: e.target.value })} /></label>
              <label className="block text-sm">Reception venue<input className={`${input} mt-1`} value={draft.receptionVenue} onChange={(e) => set({ receptionVenue: e.target.value })} /></label>
              <label className="block text-sm">Reception address<input className={`${input} mt-1`} value={draft.receptionAddress} onChange={(e) => set({ receptionAddress: e.target.value })} /></label>
              <label className="block text-sm">
                RSVPs close on <span className="text-[hsl(19_10%_55%)]">(optional)</span>
                <input className={`${input} mt-1`} type="date" value={draft.rsvpClosesOn} onChange={(e) => set({ rsvpClosesOn: e.target.value })} />
              </label>
              <label className="block text-sm">Dress code<input className={`${input} mt-1`} value={draft.dressCode} onChange={(e) => set({ dressCode: e.target.value })} /></label>
              <label className="block text-sm">Dress code in Spanish<input className={`${input} mt-1`} value={draft.dressCodeEs} onChange={(e) => set({ dressCodeEs: e.target.value })} /></label>
              <label className="block text-sm">A few words about the day<input className={`${input} mt-1`} value={draft.aboutText} onChange={(e) => set({ aboutText: e.target.value })} /></label>
              <label className="block text-sm">Esas palabras en español<input className={`${input} mt-1`} value={draft.aboutTextEs} onChange={(e) => set({ aboutTextEs: e.target.value })} /></label>
              <label className="block text-sm">Gift note<input className={`${input} mt-1`} value={draft.giftText} onChange={(e) => set({ giftText: e.target.value })} /></label>
              <label className="block text-sm">Nota de regalos en español<input className={`${input} mt-1`} value={draft.giftTextEs} onChange={(e) => set({ giftTextEs: e.target.value })} /></label>
              <label className="block text-sm">Photo upload link<input className={`${input} mt-1`} placeholder="https://" value={draft.photoUploadUrl} onChange={(e) => set({ photoUploadUrl: e.target.value })} /></label>
              <label className="block text-sm">Hotel name <span className="text-[hsl(19_10%_55%)]">(optional)</span><input className={`${input} mt-1`} value={draft.hotelName} onChange={(e) => set({ hotelName: e.target.value })} /></label>
              <label className="block text-sm">Hotel address<input className={`${input} mt-1`} value={draft.hotelAddress} onChange={(e) => set({ hotelAddress: e.target.value })} /></label>
              <label className="block text-sm">
                Site link
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm text-[hsl(19_10%_46%)]">/e/</span>
                  <input className={input} value={draft.slug} onChange={(e) => set({ slug: slugify(e.target.value) })} data-testid="input-wizard-slug" />
                </div>
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h1 className="font-display text-3xl">Package</h1>
              <PackagePick
                active={draft.package === "basic" && !draft.customDomain}
                title="Basic · $100"
                detail="Template site, dashboard, guest list, bilingual page."
                onClick={() => set({ package: "basic", customDomain: false })}
              />
              <PackagePick
                active={draft.package === "basic" && draft.customDomain}
                title="Basic + domain · $125"
                detail="We buy the domain for a year and connect it for you."
                onClick={() => set({ package: "basic", customDomain: true })}
              />
              <PackagePick
                active={draft.package === "full_custom"}
                title="Full custom · $250"
                detail="We design it by hand. Tell us what you want."
                onClick={() => set({ package: "full_custom", customDomain: false })}
              />
              {(draft.customDomain || draft.package === "full_custom") && (
                <label className="block text-sm">
                  Desired domain
                  <input className={`${input} mt-1`} placeholder="mariaandluis.com" value={draft.desiredDomain} onChange={(e) => set({ desiredDomain: e.target.value })} data-testid="input-wizard-domain" />
                </label>
              )}
              {draft.package === "full_custom" && (
                <label className="block text-sm">
                  Notes for the designer
                  <textarea className={`${input} mt-1`} rows={4} value={draft.notes} onChange={(e) => set({ notes: e.target.value })} data-testid="input-wizard-notes" />
                </label>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3" data-testid="wizard-review">
              <h1 className="font-display text-3xl">Review</h1>
              <p className="font-display text-2xl text-[hsl(346_33%_42%)]">{draft.honoree}</p>
              <p className="text-sm">{draft.dateIso} · {draft.template === "wedding" ? "Wedding" : "Quinceañera"} template</p>
              <p className="text-sm">/e/{slugify(draft.slug || draft.honoree)}</p>
              <p className="text-sm">Due today: ${price}. You can preview before publishing.</p>
              {draft.package === "full_custom" && (
                <p className="text-sm italic">We'll follow up on the custom design. The template site is yours to use in the meantime.</p>
              )}
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-md bg-[hsl(2_55%_48%/.08)] px-3 py-2 text-sm text-[hsl(2_55%_36%)]" data-testid="text-wizard-error">
              {error}
            </p>
          )}

          <div className="mt-6 flex gap-2">
            {step > 0 && (
              <button type="button" className="rounded-full border px-4 py-2.5 text-sm" onClick={() => setStep((s) => s - 1)}>
                Back
              </button>
            )}
            {step < 4 ? (
              <button type="button" className="flex-1 rounded-full bg-[hsl(346_37%_48%)] px-4 py-2.5 text-sm text-white" onClick={next} data-testid="button-wizard-next">
                Continue
              </button>
            ) : (
              <button type="button" className="flex-1 rounded-full bg-[hsl(346_37%_48%)] px-4 py-2.5 text-sm text-white disabled:opacity-60" disabled={busy} onClick={submit} data-testid="button-wizard-pay">
                {busy ? "Starting checkout…" : `Continue to payment · $${price}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplatePick({
  active,
  title,
  detail,
  onClick,
}: {
  active: boolean;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border px-4 py-4 text-left ${active ? "border-[hsl(346_37%_48%)] bg-[hsl(346_40%_97%)]" : "border-[hsl(27_25%_86%)]"}`}
      data-testid={`button-template-${title.toLowerCase()}`}
    >
      <div className="font-display text-2xl">{title}</div>
      <div className="text-sm text-[hsl(19_12%_40%)]">{detail}</div>
    </button>
  );
}

function PackagePick({
  active,
  title,
  detail,
  onClick,
}: {
  active: boolean;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border px-4 py-4 text-left ${active ? "border-[hsl(346_37%_48%)] bg-[hsl(346_40%_97%)]" : "border-[hsl(27_25%_86%)]"}`}
    >
      <div className="font-medium">{title}</div>
      <div className="text-sm text-[hsl(19_12%_40%)]">{detail}</div>
    </button>
  );
}
