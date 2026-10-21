import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { api, setAuthToken } from "@/lib/api";
import { setSiteContext } from "@/lib/event-scope";
import { slugify } from "@shared/platform";
import { useLanguage } from "@/lib/language";
import { BrandShell, LanguageToggle, Wordmark } from "@/components/brand-shell";

type Kind = "wedding" | "quinceanera" | "birthday" | "babyshower" | "anniversary" | "graduation" | "party" | "baptism" | "sweet16" | "other";
type StarterTemplate = "elegant" | "fiesta" | "minimal" | "garden" | "noche" | "confetti";
const STARTER_TEMPLATES: StarterTemplate[] = ["elegant", "fiesta", "minimal", "garden", "noche", "confetti"];

type Draft = {
  email: string;
  password: string;
  template: StarterTemplate;
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
  const requested = q.get("template");
  const template: StarterTemplate = STARTER_TEMPLATES.includes(requested as StarterTemplate) ? (requested as StarterTemplate) : "elegant";
  return {
    email: "",
    password: "",
    template,
    honoree: "",
    partnerName: "",
    eventKind: "party",
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

const input = "brand-input mt-1";

export default function Wizard() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const es = language === "es";
  const tr = (en: string, esText: string) => (es ? esText : en);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [slugTouched, setSlugTouched] = useState(false);
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
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) return setError(tr("Enter a valid email.", "Escriba un correo válido."));
      if (draft.password.length < 8) return setError(tr("Use at least 8 characters.", "Use al menos 8 caracteres."));
    }
    if (step === 2) {
      if (draft.honoree.trim().length < 2) return setError(tr("Who is this celebration for?", "¿Para quién es la celebración?"));
      if (!draft.dateIso) return setError(tr("Choose the date.", "Elija la fecha."));
    }
    if (step === 3 && draft.package === "full_custom" && draft.notes.trim().length < 8) {
      return setError(tr("Add a note about the custom design.", "Agregue una nota sobre el diseño."));
    }
    if (step === 3 && draft.customDomain && draft.package === "basic" && !draft.desiredDomain.trim()) {
      return setError(tr("What domain should we buy?", "¿Qué dominio compramos?"));
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
            ? { time: draft.ceremonyTime, title: draft.eventKind === "quinceanera" ? "Mass" : "Ceremony", detail: draft.ceremonyVenue }
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
      setError(err?.message || tr("Could not create the event.", "No se pudo crear el evento."));
    } finally {
      setBusy(false);
    }
  }

  const templateNames: Record<StarterTemplate, string> = {
    elegant: tr("Elegant", "Elegante"),
    fiesta: "Fiesta",
    minimal: "Minimal",
    garden: tr("Garden", "Jardín"),
    noche: "Noche",
    confetti: "Confetti",
  };
  const templateName = templateNames[draft.template];

  return (
    <BrandShell>
    <div className="px-4 py-8" data-testid="page-wizard">
      <div className="mx-auto w-full max-w-lg">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" aria-label="Home">
            <Wordmark compact />
          </Link>
          <LanguageToggle />
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#526072]">
          {tr(`Step ${step + 1} of 5`, `Paso ${step + 1} de 5`)}
        </p>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#d7dee7]">
          <div className="h-full bg-[#e23d2b]" style={{ width: `${((step + 1) / 5) * 100}%` }} />
        </div>

        <div className="mt-6 rounded-2xl border border-[#d7dee7] bg-white p-5 shadow-sm sm:p-7">
          {step === 0 && (
            <div className="space-y-4">
              <h1 className="brand-display text-3xl">{tr("Your host login", "Su acceso de anfitrión")}</h1>
              <p className="text-sm text-[#526072]">{tr("This email opens the dashboard for your event.", "Este correo abre el tablero de su evento.")}</p>
              <label className="block text-sm">
                {tr("Email", "Correo")}
                <input className={`${input} mt-1`} type="email" value={draft.email} onChange={(e) => set({ email: e.target.value })} data-testid="input-wizard-email" />
              </label>
              <label className="block text-sm">
                {tr("Password", "Contraseña")}
                <input className={`${input} mt-1`} type="password" value={draft.password} onChange={(e) => set({ password: e.target.value })} data-testid="input-wizard-password" />
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <h1 className="brand-display text-3xl">{tr("Choose a template", "Elija una plantilla")}</h1>
              <TemplatePick
                id="elegant"
                active={draft.template === "elegant"}
                title={tr("Elegant", "Elegante")}
                detail={tr("Warm paper, quiet type, room for a long name.", "Papel cálido, tipo sereno, espacio para un nombre largo.")}
                onClick={() => set({ template: "elegant" })}
              />
              <TemplatePick
                id="fiesta"
                active={draft.template === "fiesta"}
                title="Fiesta"
                detail={tr("Coral, marigold, and teal. Color without the clutter.", "Coral, amarillo y verde. Color sin recargar.")}
                onClick={() => set({ template: "fiesta" })}
              />
              <TemplatePick
                id="minimal"
                active={draft.template === "minimal"}
                title="Minimal"
                detail={tr("Black, white, and the facts of the day.", "Negro, blanco y los datos del día.")}
                onClick={() => set({ template: "minimal" })}
              />
              <TemplatePick
                id="garden"
                active={draft.template === "garden"}
                title={tr("Garden", "Jardín")}
                detail={tr("Soft greens and blush, for a wedding or shower.", "Verdes suaves y rosa, para una boda o un shower.")}
                onClick={() => set({ template: "garden" })}
              />
              <TemplatePick
                id="noche"
                active={draft.template === "noche"}
                title="Noche"
                detail={tr("Black and gold, for a milestone birthday.", "Negro y dorado, para un cumpleaños importante.")}
                onClick={() => set({ template: "noche" })}
              />
              <TemplatePick
                id="confetti"
                active={draft.template === "confetti"}
                title="Confetti"
                detail={tr("Bright and playful, for a kids' party.", "Brillante y juguetón, para una fiesta infantil.")}
                onClick={() => set({ template: "confetti" })}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h1 className="brand-display text-3xl">{tr("The celebration", "La celebración")}</h1>
              <label className="block text-sm">
                {tr("Honoree", "Homenajeado")}
                <input
                  className={`${input} mt-1`}
                  value={draft.honoree}
                  onChange={(e) => {
                    const honoree = e.target.value;
                    set(slugTouched ? { honoree } : { honoree, slug: slugify(honoree) });
                  }}
                  data-testid="input-wizard-honoree"
                />
              </label>
              <label className="block text-sm">
                {tr("Partner or second name", "Pareja o segundo nombre")} <span className="text-[#526072]">({tr("optional", "opcional")})</span>
                <input className={`${input} mt-1`} value={draft.partnerName} onChange={(e) => set({ partnerName: e.target.value })} />
              </label>
              <label className="block text-sm">
                {tr("Occasion", "Ocasión")}
                <select className={`${input} mt-1`} value={draft.eventKind} onChange={(e) => set({ eventKind: e.target.value as Kind })}>
                  <option value="wedding">{tr("Wedding", "Boda")}</option>
                  <option value="quinceanera">Quinceañera</option>
                  <option value="birthday">{tr("Birthday", "Cumpleaños")}</option>
                  <option value="babyshower">Baby shower</option>
                  <option value="anniversary">{tr("Anniversary", "Aniversario")}</option>
                  <option value="graduation">{tr("Graduation", "Graduación")}</option>
                  <option value="party">{tr("Party", "Fiesta")}</option>
                  <option value="baptism">{tr("Baptism", "Bautizo")}</option>
                  <option value="sweet16">Sweet 16</option>
                  <option value="other">{tr("Other celebration", "Otra celebración")}</option>
                </select>
              </label>
              <label className="block text-sm">
                {tr("Family line", "Familia")}
                <input className={`${input} mt-1`} placeholder="The Garcia family" value={draft.familyLine} onChange={(e) => set({ familyLine: e.target.value })} />
              </label>
              <label className="block text-sm">
                {tr("Date", "Fecha")}
                <input className={`${input} mt-1`} type="date" value={draft.dateIso} onChange={(e) => set({ dateIso: e.target.value })} data-testid="input-wizard-date" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">{tr("Ceremony time", "Hora de la ceremonia")}<input className={`${input} mt-1`} placeholder="2:30 PM" value={draft.ceremonyTime} onChange={(e) => set({ ceremonyTime: e.target.value })} /></label>
                <label className="block text-sm">{tr("Reception time", "Hora de la recepción")}<input className={`${input} mt-1`} placeholder="5:00 PM" value={draft.receptionTime} onChange={(e) => set({ receptionTime: e.target.value })} /></label>
              </div>
              <label className="block text-sm">{tr("Ceremony venue", "Lugar de la ceremonia")}<input className={`${input} mt-1`} value={draft.ceremonyVenue} onChange={(e) => set({ ceremonyVenue: e.target.value })} /></label>
              <label className="block text-sm">{tr("Ceremony address", "Dirección de la ceremonia")}<input className={`${input} mt-1`} value={draft.ceremonyAddress} onChange={(e) => set({ ceremonyAddress: e.target.value })} /></label>
              <label className="block text-sm">{tr("Reception venue", "Lugar de la recepción")}<input className={`${input} mt-1`} value={draft.receptionVenue} onChange={(e) => set({ receptionVenue: e.target.value })} /></label>
              <label className="block text-sm">{tr("Reception address", "Dirección de la recepción")}<input className={`${input} mt-1`} value={draft.receptionAddress} onChange={(e) => set({ receptionAddress: e.target.value })} /></label>
              <label className="block text-sm">
                {tr("RSVPs close on", "Las confirmaciones cierran el")} <span className="text-[#526072]">({tr("optional", "opcional")})</span>
                <input className={`${input} mt-1`} type="date" value={draft.rsvpClosesOn} onChange={(e) => set({ rsvpClosesOn: e.target.value })} />
              </label>
              <label className="block text-sm">{tr("Dress code", "Vestimenta")}<input className={`${input} mt-1`} value={draft.dressCode} onChange={(e) => set({ dressCode: e.target.value })} /></label>
              <label className="block text-sm">{tr("Dress code in Spanish", "Vestimenta en español")}<input className={`${input} mt-1`} value={draft.dressCodeEs} onChange={(e) => set({ dressCodeEs: e.target.value })} /></label>
              <label className="block text-sm">{tr("A few words about the day", "Unas palabras sobre el día")}<input className={`${input} mt-1`} value={draft.aboutText} onChange={(e) => set({ aboutText: e.target.value })} /></label>
              <label className="block text-sm">{tr("Those words in Spanish", "Esas palabras en español")}<input className={`${input} mt-1`} value={draft.aboutTextEs} onChange={(e) => set({ aboutTextEs: e.target.value })} /></label>
              <label className="block text-sm">{tr("Gift note", "Nota de regalos")}<input className={`${input} mt-1`} value={draft.giftText} onChange={(e) => set({ giftText: e.target.value })} /></label>
              <label className="block text-sm">{tr("Gift note in Spanish", "Nota de regalos en español")}<input className={`${input} mt-1`} value={draft.giftTextEs} onChange={(e) => set({ giftTextEs: e.target.value })} /></label>
              <label className="block text-sm">{tr("Photo upload link", "Enlace para fotos")}<input className={`${input} mt-1`} placeholder="https://" value={draft.photoUploadUrl} onChange={(e) => set({ photoUploadUrl: e.target.value })} /></label>
              <label className="block text-sm">{tr("Hotel name", "Nombre del hotel")} <span className="text-[#526072]">({tr("optional", "opcional")})</span><input className={`${input} mt-1`} value={draft.hotelName} onChange={(e) => set({ hotelName: e.target.value })} /></label>
              <label className="block text-sm">{tr("Hotel address", "Dirección del hotel")}<input className={`${input} mt-1`} value={draft.hotelAddress} onChange={(e) => set({ hotelAddress: e.target.value })} /></label>
              <label className="block text-sm">
                {tr("Site link", "Enlace del sitio")}
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm text-[hsl(19_10%_46%)]">/e/</span>
                  <input
                    className={input}
                    value={draft.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      set({ slug: slugify(e.target.value) });
                    }}
                    data-testid="input-wizard-slug"
                  />
                </div>
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h1 className="brand-display text-3xl">{tr("Package", "Paquete")}</h1>
              <PackagePick
                active={draft.package === "basic" && !draft.customDomain}
                title={tr("Basic · $100", "Básico · $100")}
                detail={tr("Template site, dashboard, guest list, bilingual page.", "Sitio con plantilla, tablero, lista y página bilingüe.")}
                onClick={() => set({ package: "basic", customDomain: false })}
              />
              <PackagePick
                active={draft.package === "basic" && draft.customDomain}
                title={tr("Basic + domain · $125", "Básico + dominio · $125")}
                detail={tr("We buy the domain for a year and connect it for you.", "Compramos el dominio por un año y lo conectamos.")}
                onClick={() => set({ package: "basic", customDomain: true })}
              />
              <PackagePick
                active={draft.package === "full_custom"}
                title={tr("Full custom · $250", "Diseño a medida · $250")}
                detail={tr("We design it by hand. Tell us what you want.", "Lo diseñamos a mano. Cuéntenos qué desea.")}
                onClick={() => set({ package: "full_custom", customDomain: false })}
              />
              {(draft.customDomain || draft.package === "full_custom") && (
                <label className="block text-sm">
                  {tr("Desired domain", "Dominio deseado")}
                  <input className={`${input} mt-1`} placeholder="mariaandluis.com" value={draft.desiredDomain} onChange={(e) => set({ desiredDomain: e.target.value })} data-testid="input-wizard-domain" />
                </label>
              )}
              {draft.package === "full_custom" && (
                <label className="block text-sm">
                  {tr("Notes for the designer", "Notas para el diseñador")}
                  <textarea className={`${input} mt-1`} rows={4} value={draft.notes} onChange={(e) => set({ notes: e.target.value })} data-testid="input-wizard-notes" />
                </label>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3" data-testid="wizard-review">
              <h1 className="brand-display text-3xl">{tr("Review", "Revisión")}</h1>
              <p className="brand-display text-2xl">{draft.honoree}</p>
              <p className="text-sm">{draft.dateIso} · {templateName}</p>
              <p className="text-sm">/e/{slugify(draft.slug || draft.honoree)}</p>
              <p className="text-sm">{tr(`Due today: $${price}. You can preview before publishing.`, `Hoy: $${price}. Puede previsualizar antes de publicar.`)}</p>
              {draft.package === "full_custom" && (
                <p className="text-sm">{tr("We'll follow up on the custom design. The template site is yours to use in the meantime.", "Le escribimos sobre el diseño a medida. Mientras tanto puede usar la plantilla.")}</p>
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
              <button type="button" className="rounded-full border border-[#d7dee7] px-4 py-2.5 text-sm" onClick={() => setStep((s) => s - 1)}>
                {tr("Back", "Atrás")}
              </button>
            )}
            {step < 4 ? (
              <button type="button" className="brand-btn flex-1" onClick={next} data-testid="button-wizard-next">
                {tr("Continue", "Continuar")}
              </button>
            ) : (
              <button type="button" className="brand-btn flex-1 disabled:opacity-60" disabled={busy} onClick={submit} data-testid="button-wizard-pay">
                {busy ? tr("Starting checkout…", "Abriendo el pago…") : tr(`Continue to payment · $${price}`, `Continuar al pago · $${price}`)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </BrandShell>
  );
}

function TemplatePick({
  id,
  active,
  title,
  detail,
  onClick,
}: {
  id: string;
  active: boolean;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border px-4 py-4 text-left ${active ? "border-[#142033] bg-[#f3f5f8]" : "border-[#d7dee7]"}`}
      data-testid={`button-template-${id}`}
    >
      <div className="brand-display text-2xl">{title}</div>
      <div className="text-sm text-[#526072]">{detail}</div>
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
      className={`w-full rounded-xl border px-4 py-4 text-left ${active ? "border-[#142033] bg-[#f3f5f8]" : "border-[#d7dee7]"}`}
    >
      <div className="font-medium">{title}</div>
      <div className="text-sm text-[#526072]">{detail}</div>
    </button>
  );
}
