import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loader2, Minus, Plus, Search } from "lucide-react";
import { api } from "@/lib/api";
import { adminPath } from "@/lib/event-scope";
import { normalizeTemplate, type PublicEvent } from "@shared/platform";
import "@/brand.css";
import Home from "@/pages/home";
import { useBrandFonts } from "@/components/brand-shell";

type Match = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  partyName?: string;
  invites: number;
  existing: { attendees: number; declinedCount: number; meal?: string } | null;
};

export default function EventSite({ slug }: { slug: string }) {
  useBrandFonts();
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(false);
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [lang, setLang] = useState<"en" | "es">("en");

  useEffect(() => {
    let cancelled = false;
    api<{ unpublished?: boolean; preview?: boolean; event?: PublicEvent; honoree?: string }>(
      "GET",
      "/api/public/event",
    )
      .then((data) => {
        if (cancelled) return;
        setPreview(!!data.preview);
        setEvent(data.event || null);
      })
      .catch(() => {
        if (!cancelled) setEvent(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(28_60%_97%)]">
        <Loader2 className="h-6 w-6 animate-spin text-[hsl(346_37%_50%)]" />
      </div>
    );
  }

  if (event?.isLegacyRoot) return <Home />;

  if (!event) {
    return (
      <div className="brand-site flex min-h-screen flex-col items-center justify-center px-6 text-center" data-testid="page-unpublished">
        <p className="brand-display text-4xl">Invitation</p>
        <p className="mt-4 max-w-sm text-lg">This invitation isn't published yet.</p>
      </div>
    );
  }

  const es = lang === "es";
  const pick = (en: string, esText: string) => (es && esText.trim() ? esText : en);
  const theme = normalizeTemplate(event.template);
  const wedding = theme !== "quince";

  return (
    <div
      className={
        wedding
          ? `invite-theme-${theme} min-h-screen`
          : "invite-page relative min-h-screen overflow-hidden text-foreground"
      }
      data-testid="page-event"
    >
      {!wedding && (
        <>
          <img src="/floral-tl.png" alt="" className="pointer-events-none absolute left-0 top-0 w-[40%] max-w-[300px]" />
          <img src="/floral-tr.png" alt="" className="pointer-events-none absolute right-0 top-0 w-[40%] max-w-[300px]" />
        </>
      )}
      <div className="relative z-10 mx-auto w-full max-w-2xl px-5 py-10 sm:py-16">
        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={() => setLang((l) => (l === "en" ? "es" : "en"))}
            className="invite-lang rounded-full border border-black/10 bg-white/80 px-3 py-1 text-[11px] uppercase tracking-[0.16em]"
            data-testid="button-event-language"
          >
            {lang === "en" ? "Español" : "English"}
          </button>
        </div>

        {preview && (
          <p className="mb-6 rounded-full bg-amber-50 px-4 py-2 text-center text-sm text-amber-900" data-testid="banner-preview">
            Preview — guests can't see this until you publish.
          </p>
        )}
        {event.isDemo && (
          <p className="mb-6 rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-center text-sm" data-testid="banner-demo">
            {pick(
              "Sample site. You can try the RSVP. Replies stay on this demo and no email is sent.",
              "Sitio de muestra. Puede probar la confirmación. Las respuestas se quedan aquí y no se envía ningún correo.",
            )}
          </p>
        )}

        <header className="text-center" data-testid="section-event-hero">
          {event.photos[0] && (
            <img
              src={event.photos[0].url}
              alt=""
              className="mb-8 aspect-[16/9] w-full rounded-3xl object-cover"
              data-testid="img-event-hero"
            />
          )}
          {wedding ? (
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#8a7350]">
              {inviteLine(event.eventKind, es)}
            </p>
          ) : (
            <p className="label-caps">{pick("You are invited", "Están invitados")}</p>
          )}
          <p className={`mt-4 text-sm italic ${wedding ? "font-serif" : "font-display"}`}>
            {pick(event.familyLine, event.familyLineEs) || pick("to celebrate", "a celebrar")}
          </p>
          <h1
            className={
              wedding
                ? "mt-3 font-serif text-5xl font-light tracking-wide sm:text-6xl"
                : "font-script mt-2 text-[3.4rem] leading-[1.05] text-[hsl(346_37%_50%)] sm:text-7xl"
            }
            data-testid="text-honoree"
          >
            {event.honoree}
            {event.partnerName ? ` & ${event.partnerName}` : ""}
          </h1>
          <p className={`mt-2 ${wedding ? "text-xs uppercase tracking-[0.28em] text-[#8a7350]" : "font-display italic text-[hsl(28_31%_42%)]"}`}>
            {pick(event.title, TITLE_ES[event.title] || "")}
          </p>
          {wedding && <div className="mx-auto mt-6 h-px w-24 bg-[#8a7350]" />}
          <p className={`mt-6 ${wedding ? "font-serif text-xl" : "font-display text-lg italic"}`} data-testid="text-event-date">
            {pick(event.dateLong, event.dateLongEs)}
          </p>
          <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <Venue
              wedding={wedding}
              label={pick(event.ceremonyLabel, event.ceremonyLabelEs)}
              time={event.ceremonyTime}
              name={event.ceremonyVenue}
              address={event.ceremonyAddress}
              mapUrl={event.ceremonyMapUrl}
              mapLabel={pick("Map", "Mapa")}
            />
            <Venue
              wedding={wedding}
              label={pick("Reception", "Recepción")}
              time={event.receptionTime}
              name={event.receptionVenue}
              address={event.receptionAddress}
              mapUrl={event.receptionMapUrl}
              mapLabel={pick("Map", "Mapa")}
            />
          </div>
        </header>

        {event.rsvpClosed ? (
          <section className="mt-10 rounded-2xl border border-black/10 bg-white/90 px-6 py-8 text-center" data-testid="card-rsvp-closed">
            <h2 className={wedding ? "font-serif text-3xl" : "font-script text-4xl text-[hsl(346_37%_50%)]"}>
              {pick("RSVPs are closed", "Las confirmaciones están cerradas")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed">
              {pick(
                `Responses closed on ${event.rsvpClosesOn}. Please contact the hosts if you need to make a change.`,
                `Las respuestas se cerraron el ${event.rsvpClosesOn}. Comuníquese con los anfitriones si necesita un cambio.`,
              )}
            </p>
          </section>
        ) : (
          <RsvpCard wedding={wedding} es={es} mealPrompt={pick(event.mealPrompt, event.mealPromptEs)} />
        )}

        {(event.rsvpByLabel || event.rsvpClosesOn) && (
          <p className="mt-4 text-center text-sm" data-testid="text-rsvp-deadline">
            {pick("Please reply by", "Responda antes del")}{" "}
            {pick(event.rsvpByLabel, event.rsvpByLabelEs) || event.rsvpClosesOn}
          </p>
        )}

        {(event.aboutText || event.aboutTextEs) && (
          <Section wedding={wedding} title={pick("Welcome", "Bienvenida")} testId="section-story">
            {pick(event.aboutText, event.aboutTextEs)}
          </Section>
        )}
        {(event.hostNote || event.hostNoteEs) && (
          <Section wedding={wedding} title={pick("From the hosts", "De los anfitriones")} testId="section-hosts">
            {pick(event.hostNote, event.hostNoteEs)}
          </Section>
        )}
        {event.schedule.length > 0 && (
          <Section wedding={wedding} title={pick("The day", "El día")} testId="section-schedule">
            <ul className="space-y-3 text-left">
              {event.schedule.map((item, i) => (
                <li key={i}>
                  <span className="text-[11px] uppercase tracking-[0.16em] opacity-70">{item.time}</span>
                  <div>{pick(item.title, item.titleEs || "")}</div>
                  {(item.detail || item.detailEs) && <div className="text-sm opacity-70">{pick(item.detail || "", item.detailEs || "")}</div>}
                </li>
              ))}
            </ul>
          </Section>
        )}
        {(event.dressCode || event.dressCodeEs) && (
          <Section wedding={wedding} title={pick("Dress code", "Vestimenta")} testId="section-dress">
            {pick(event.dressCode, event.dressCodeEs)}
          </Section>
        )}
        {(event.parkingText || event.parkingTextEs) && (
          <Section wedding={wedding} title={pick("Parking and directions", "Estacionamiento y cómo llegar")} testId="section-parking">
            {pick(event.parkingText, event.parkingTextEs)}
          </Section>
        )}
        {event.party.length > 0 && (
          <Section wedding={wedding} title={partyTitle(event.eventKind, es)} testId="section-party">
            <ul className="space-y-3 text-left">
              {event.party.map((person, i) => (
                <li key={i}>
                  <div className="text-[11px] uppercase tracking-[0.16em] opacity-70">{pick(person.role, person.roleEs || "")}</div>
                  <div>{person.name}</div>
                </li>
              ))}
            </ul>
          </Section>
        )}
        {event.hotels.length > 0 && (
          <Section wedding={wedding} title={pick("Where to stay", "Dónde hospedarse")} testId="section-stay">
            <ul className="space-y-3 text-left">
              {event.hotels.map((h, i) => (
                <li key={i}>
                  <div>{h.name}</div>
                  <div className="text-sm opacity-70">{h.address}</div>
                  {(h.note || h.noteEs) && <div className="text-sm">{pick(h.note, h.noteEs || "")}</div>}
                </li>
              ))}
            </ul>
          </Section>
        )}
        {(event.giftText || event.giftTextEs) && (
          <Section wedding={wedding} title={pick("Gifts", "Regalos")} testId="section-gifts">
            {pick(event.giftText, event.giftTextEs)}
          </Section>
        )}
        {event.faqs.length > 0 && (
          <Section wedding={wedding} title={pick("Questions", "Preguntas")} testId="section-faq">
            <div className="space-y-4 text-left">
              {event.faqs.map((item, i) => (
                <div key={i}>
                  <div className="font-medium">{pick(item.q, item.qEs || "")}</div>
                  <div className="mt-1 opacity-80">{pick(item.a, item.aEs || "")}</div>
                </div>
              ))}
            </div>
          </Section>
        )}
        {event.photoUploadUrl && (
          <Section wedding={wedding} title={pick("Share a photo", "Comparta una foto")}>
            <a className="underline" href={event.photoUploadUrl}>
              {event.photoUploadUrl}
            </a>
          </Section>
        )}
        {event.photos.length > 1 && (
          <section className="mt-8" data-testid="section-gallery">
            <h2 className={`mb-3 text-center ${wedding ? "font-serif text-2xl" : "font-script text-4xl"}`}>
              {pick("Gallery", "Galería")}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {event.photos.slice(1).map((p) => (
                <figure key={p.id} className="invite-card overflow-hidden rounded-xl">
                  <img src={p.url} alt={pick(p.caption, p.captionEs || "")} className="aspect-square w-full object-cover" />
                  {(p.caption || p.captionEs) && (
                    <figcaption className="px-2 py-2 text-center text-xs">{pick(p.caption, p.captionEs || "")}</figcaption>
                  )}
                </figure>
              ))}
            </div>
          </section>
        )}
        {(event.contactEmail || event.contactPhone || event.contactNote || event.contactNoteEs) && (
          <Section wedding={wedding} title={pick("Contact", "Contacto")} testId="section-contact">
            {pick(event.contactNote, event.contactNoteEs)}
            <div className="mt-3 space-y-1">
              {event.contactEmail && (
                <a className="block underline" href={`mailto:${event.contactEmail}`}>{event.contactEmail}</a>
              )}
              {event.contactPhone && (
                <a className="block underline" href={`tel:${event.contactPhone.replace(/[^\d+]/g, "")}`}>{event.contactPhone}</a>
              )}
            </div>
          </Section>
        )}

        <footer className="mt-14 text-center text-sm">
          <Link href={adminPath()} className="text-[11px] uppercase tracking-[0.16em] opacity-60" data-testid="link-event-admin">
            {pick("Host login", "Entrada del anfitrión")}
          </Link>
        </footer>
      </div>
    </div>
  );
}

const TITLE_ES: Record<string, string> = {
  Wedding: "Boda",
  Quinceañera: "Quinceañera",
  "Baby shower": "Baby shower",
  "40th birthday": "Cumpleaños 40",
  "7th birthday": "Cumpleaños 7",
  Birthday: "Cumpleaños",
  Anniversary: "Aniversario",
  Graduation: "Graduación",
  Party: "Fiesta",
};

function inviteLine(kind: string, es: boolean): string {
  if (kind === "wedding") return es ? "Junto con sus familias" : "Together with their families";
  if (kind === "babyshower") return es ? "Acompáñenos" : "Please join us";
  if (kind === "graduation") return es ? "Acompáñenos a celebrar" : "Come celebrate";
  if (kind === "birthday") return es ? "Celebre con nosotros" : "Celebrate with us";
  return es ? "Están invitados" : "You are invited";
}

function partyTitle(kind: string, es: boolean): string {
  if (kind === "quinceanera") return es ? "Corte y padrinos" : "Court and padrinos";
  if (kind === "wedding") return es ? "Cortejo" : "Wedding party";
  return es ? "Quienes acompañan" : "With them";
}

function Venue({
  wedding,
  label,
  time,
  name,
  address,
  mapUrl,
  mapLabel,
}: {
  wedding: boolean;
  label: string;
  time: string;
  name: string;
  address: string;
  mapUrl?: string;
  mapLabel?: string;
}) {
  if (!name && !time) return null;
  return (
    <div className={wedding ? "invite-card px-4 py-4" : "ivory-card rounded-xl px-4 py-4"}>
      <div className="invite-kicker text-[11px] uppercase tracking-[0.16em]">
        {label}
        {time ? ` · ${time}` : ""}
      </div>
      <div className="mt-1">{name}</div>
      <div className="text-sm opacity-70">{address}</div>
      {mapUrl && (
        <a className="mt-2 inline-block text-sm underline" href={mapUrl} target="_blank" rel="noreferrer">
          {mapLabel || "Map"}
        </a>
      )}
    </div>
  );
}

function Section({
  wedding,
  title,
  children,
  testId,
}: {
  wedding: boolean;
  title: string;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <section className={`mt-8 px-6 py-7 text-center ${wedding ? "invite-card" : "ivory-card rounded-xl"}`} data-testid={testId}>
      <h2 className={wedding ? "font-serif text-2xl" : "font-script text-4xl text-[hsl(346_37%_50%)]"}>{title}</h2>
      <div className="mt-3 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

function RsvpCard({ wedding, es, mealPrompt }: { wedding: boolean; es: boolean; mealPrompt: string }) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [searched, setSearched] = useState(false);
  const [guest, setGuest] = useState<Match | null>(null);
  const [attending, setAttending] = useState(0);
  const [declined, setDeclined] = useState(0);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [meal, setMeal] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const t = (en: string, sp: string) => (es ? sp : en);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setGuest(null);
    try {
      const data = await api<{ matches: Match[] }>("GET", `/api/guests?q=${encodeURIComponent(query.trim())}`);
      setMatches(data.matches);
      setSearched(true);
    } catch (err: any) {
      setError(err?.message || t("Something went wrong.", "Algo salió mal."));
    } finally {
      setBusy(false);
    }
  }

  function choose(m: Match) {
    setGuest(m);
    const a = m.existing ? m.existing.attendees : m.invites;
    setAttending(a);
    setDeclined(m.existing ? m.existing.declinedCount : m.invites - a);
    setMeal(m.existing?.meal || "");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!guest || attending + declined !== guest.invites) return;
    setBusy(true);
    setError(null);
    try {
      await api("POST", "/api/rsvp", {
        guestId: guest.id,
        attendees: attending,
        declinedCount: declined,
        guestEmail: email.trim() || null,
        note: note.trim() || null,
        meal: meal.trim() || "",
        language: es ? "es" : "en",
      });
      setDone(guest.firstName || guest.partyName || "");
    } catch (err: any) {
      setError(err?.message || t("We couldn't save that.", "No pudimos guardarlo."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`mt-10 px-5 py-7 ${wedding ? "invite-card" : "ivory-card rounded-xl"}`} data-testid="card-search">
      {done ? (
        <div className="text-center" data-testid="section-confirmation">
          <h2 className={wedding ? "font-serif text-4xl" : "font-script text-5xl text-[hsl(346_37%_50%)]"}>
            {t("Thank you", "Gracias")}
          </h2>
          <p className="mt-2">{t(`We saved your reply, ${done}.`, `Guardamos su respuesta, ${done}.`)}</p>
        </div>
      ) : (
        <>
          <h2 className={`text-center ${wedding ? "font-serif text-3xl" : "font-script text-4xl text-[hsl(346_37%_50%)]"}`}>
            {t("Find your invitation", "Encuentre su invitación")}
          </h2>
          <form onSubmit={search} className="mt-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
              <input
                className="w-full rounded-md border border-black/10 bg-white py-3 pl-10 pr-3"
                placeholder={t("Name, phone, or email", "Nombre, teléfono o correo")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                data-testid="input-search"
              />
            </div>
            <button type="submit" className={`w-full rounded-full py-3 text-[12px] uppercase tracking-[0.16em] text-white disabled:opacity-50 ${wedding ? "invite-btn" : "bg-[hsl(346_30%_28%)]"}`} disabled={busy || !query.trim()} data-testid="button-search">
              {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : t("Find my invitation", "Buscar")}
            </button>
          </form>
          {error && <p className="mt-3 text-center text-sm text-red-700" data-testid="text-error">{error}</p>}
          {searched && matches.length === 0 && (
            <p className="mt-4 text-center text-sm italic" data-testid="text-no-matches">
              {t("We couldn't find that name.", "No encontramos ese nombre.")}
            </p>
          )}
          {searched && !guest && (
            <ul className="mt-4 space-y-2">
              {matches.map((m) => (
                <li key={m.id}>
                  <button type="button" className="w-full rounded-lg border border-black/10 px-3 py-3 text-left" onClick={() => choose(m)} data-testid={`button-match-${m.id}`}>
                    <div>{m.partyName || m.fullName}</div>
                    <div className="text-xs opacity-60">
                      {t("Party of", "Grupo de")} {m.invites}
                      {m.existing ? t(" · already replied", " · ya respondió") : ""}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {guest && (
            <form onSubmit={submit} className="mt-5 space-y-4" data-testid="form-rsvp">
              <Stepper label={t("Attending", "Asistirán")} value={attending} max={guest.invites} onChange={(v) => { setAttending(v); setDeclined(guest.invites - v); }} testId="attending" />
              <Stepper label={t("Not attending", "No asistirán")} value={declined} max={guest.invites} onChange={setDeclined} testId="declined" />
              <input className="w-full rounded-md border border-black/10 px-3 py-3" placeholder={t("Email for a confirmation (optional)", "Correo para confirmación (opcional)")} value={email} onChange={(e) => setEmail(e.target.value)} data-testid="input-guest-email" />
              {mealPrompt && (
                <label className="block text-left text-sm">
                  {mealPrompt}
                  <input className="mt-1 w-full rounded-md border border-black/10 px-3 py-3" value={meal} onChange={(e) => setMeal(e.target.value)} data-testid="input-meal" />
                </label>
              )}
              <textarea className="w-full rounded-md border border-black/10 px-3 py-3" rows={3} placeholder={t("A note", "Un mensaje")} value={note} onChange={(e) => setNote(e.target.value)} data-testid="input-note" />
              <button type="submit" className={`w-full rounded-full py-3 text-[12px] uppercase tracking-[0.16em] text-white disabled:opacity-50 ${wedding ? "invite-btn" : "bg-[hsl(346_37%_46%)]"}`} disabled={busy || attending + declined !== guest.invites} data-testid="button-submit-rsvp">
                {t("Send my RSVP", "Enviar")}
              </button>
            </form>
          )}
        </>
      )}
    </section>
  );
}

function Stepper({
  label,
  value,
  max,
  onChange,
  testId,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (n: number) => void;
  testId: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full border" onClick={() => onChange(Math.max(0, value - 1))} data-testid={`button-${testId}-minus`}>
          <Minus className="h-4 w-4" />
        </button>
        <output className="w-8 text-center text-xl" data-testid={`text-${testId}-value`}>{value}</output>
        <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full border" onClick={() => onChange(Math.min(max, value + 1))} data-testid={`button-${testId}-plus`}>
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
