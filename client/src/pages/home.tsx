import { useState } from "react";
import { Link } from "wouter";
import { Minus, Plus, Search, Loader2 } from "lucide-react";
import { EVENT } from "@shared/schema";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/language";
import {
  Tiara,
  Divider,
  SmallFlourish,
  Butterfly,
  DateBlock,
  EventDetails,
} from "@/components/ornaments";
import {
  AboutSection,
  CourtOfHonorSection,
  PadrinosSection,
  Countdown,
  DressCodeSection,
  HotelsSection,
  LanguageToggle,
  ScheduleSection,
  SectionOrnament,
  VenuesSection,
} from "@/components/public-sections";

type Match = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  invites: number;
  email: string | null;
  additionalNames?: { firstName: string; lastName: string }[];
  existing: {
    attendees: number;
    declinedCount: number;
    note: string | null;
    guestEmail: string | null;
  } | null;
};

type Submitted = {
  firstName: string;
  attendees: number;
  declinedCount: number;
  emailed: boolean;
};

/**
 * "The Ascencio party — Adrian, Stefanie, Marco (party of 3)".
 * Returns null when the household has no additional names, so callers can fall
 * back to the original single-name treatment.
 */
function householdLabel(
  m: Match,
  t: (key: string, vars?: Record<string, string | number>) => string,
  opts: { includePartyOf?: boolean } = { includePartyOf: true },
): string | null {
  const extras = (m.additionalNames || []).filter((n) => n.firstName || n.lastName);
  if (extras.length === 0) return null;
  const last = (m.lastName || "").trim();
  const title = last
    ? t("household.theParty", { lastname: last })
    : t("household.possessiveParty", { name: m.firstName });
  const firstNames = [m.firstName, ...extras.map((n) => n.firstName)]
    .map((n) => (n || "").trim())
    .filter(Boolean);
  const list =
    firstNames.length > 4
      ? `${firstNames.slice(0, 3).join(", ")} ${t("household.andOthers", {
          n: firstNames.length - 3,
        })}`
      : firstNames.join(", ");
  const base = `${title} — ${list}`;
  return opts.includePartyOf === false
    ? base
    : `${base} (${t("household.partyOf", { n: m.invites })})`;
}

/* ---------------------------------------------------------------- shell */

function Shell({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  return (
    <div className="invite-page relative min-h-screen overflow-hidden font-sans text-foreground">
      <PageCornerFlorals />
      <LanguageToggle />
      <div className="relative z-10 mx-auto w-full max-w-2xl px-6 py-12 sm:px-10 sm:py-16">
        {children}
        <footer className="mt-16 text-center">
          <SmallFlourish className="mx-auto w-28 opacity-80" />
          <p className="font-display mt-4 text-sm italic text-[hsl(19_14%_45%)]">
            {t("footer.love")}
          </p>
          <Link
            href="/admin"
            className="label-caps mt-3 inline-block text-[10px] opacity-60 hover:opacity-100"
            data-testid="link-admin"
          >
            {t("footer.hostLogin")}
          </Link>
        </footer>
      </div>
    </div>
  );
}

/** Wide shell used for the full invitation page (extra sections need more width). */
function WideShell({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  return (
    <div className="invite-page relative min-h-screen overflow-hidden font-sans text-foreground">
      <PageCornerFlorals />
      <LanguageToggle />
      <div className="relative z-10 mx-auto w-full max-w-5xl px-5 py-12 sm:px-10 sm:py-16">
        {children}
        <footer className="mt-16 text-center">
          <SmallFlourish className="mx-auto w-28 opacity-80" />
          <p className="font-display mt-4 text-sm italic text-[hsl(19_14%_45%)]">
            {t("footer.love")}
          </p>
          <Link
            href="/admin"
            className="label-caps mt-3 inline-block text-[10px] opacity-60 hover:opacity-100"
            data-testid="link-admin"
          >
            {t("footer.hostLogin")}
          </Link>
        </footer>
      </div>
    </div>
  );
}

function RsvpByBadge() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[hsl(28_31%_55%/.35)] bg-[hsl(30_100%_99%/.8)] px-4 py-1.5">
      <span className="label-caps text-[10px]">{t("hero.rsvpBy")}</span>
      <span className="font-display text-sm text-[hsl(346_33%_46%)]">
        {t("hero.rsvpByDate")}
      </span>
    </div>
  );
}

/* ----------------------------------------------------------------- hero */

/**
 * Absolute-positioned floral bouquets anchored to the top corners of the entire
 * invitation page (not just the hero card). Sized responsively.
 */
function PageCornerFlorals() {
  const base =
    "pointer-events-none select-none absolute top-0 z-0 w-[36%] max-w-[280px] sm:max-w-[360px] opacity-95";
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-0">
      <img src="/floral-tl.png" alt="" className={`${base} left-0`} />
      <img src="/floral-tr.png" alt="" className={`${base} right-0`} />
    </div>
  );
}

function Hero() {
  const { t } = useLanguage();
  return (
    <header
      className="relative overflow-hidden rounded-2xl text-center"
      data-testid="section-hero"
    >
      <div className="relative z-10 px-2 pb-2 pt-2">
        <Tiara className="mx-auto w-48 sm:w-64" />
        <p className="label-caps mt-6">{t("hero.invited")}</p>
        <p className="font-display mt-3 text-lg italic leading-snug text-[hsl(19_17%_30%)]">
          {t("hero.line1")}
          <br />
          {t("hero.line2")}
        </p>
        <h1
          className="font-script mt-2 text-[3.4rem] leading-[1.05] text-[hsl(346_37%_56%)] sm:text-[5rem]"
          data-testid="text-event-title"
        >
          {t("hero.title")}
        </h1>
        <p className="font-display text-base italic text-[hsl(28_31%_50%)]">
          {t("hero.of")}
        </p>
        <h2 className="font-script text-[2.4rem] leading-tight text-[hsl(346_37%_56%)] sm:text-[3.4rem]">
          {EVENT.honoree}
        </h2>
        <Divider className="mx-auto mt-5 w-64 sm:w-80" />
        <div className="mt-6">
          <DateBlock />
        </div>
        <div className="mt-8">
          <EventDetails />
        </div>
        <div className="mt-8">
          <RsvpByBadge />
        </div>
      </div>
      <div className="relative z-10">
        <Countdown />
      </div>
    </header>
  );
}

/* --------------------------------------------------------------- pieces */

function Card({
  children,
  className = "",
  testId,
}: {
  children: React.ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <section
      data-testid={testId}
      className={`ivory-card mt-10 rounded-xl px-6 py-8 sm:px-10 sm:py-10 ${className}`}
    >
      {children}
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
  onChange: (v: number) => void;
  testId: string;
}) {
  const { t } = useLanguage();
  const clamp = (v: number) => Math.max(0, Math.min(max, v));
  return (
    <div>
      <div className="font-display text-base text-[hsl(19_17%_28%)]">{label}</div>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          aria-label={`${t("rsvp.decrease")} ${label}`}
          onClick={() => onChange(clamp(value - 1))}
          disabled={value <= 0}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[hsl(28_31%_55%/.4)] bg-white text-[hsl(28_31%_45%)] transition hover:bg-[hsl(28_45%_96%)] disabled:opacity-40"
          data-testid={`button-${testId}-minus`}
        >
          <Minus className="h-4 w-4" />
        </button>
        <output
          className="font-display min-w-[3.5rem] rounded-md border border-[hsl(28_31%_55%/.3)] bg-[hsl(28_60%_98%)] py-2 text-center text-2xl text-[hsl(346_33%_46%)]"
          data-testid={`text-${testId}-value`}
        >
          {value}
        </output>
        <button
          type="button"
          aria-label={`${t("rsvp.increase")} ${label}`}
          onClick={() => onChange(clamp(value + 1))}
          disabled={value >= max}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[hsl(28_31%_55%/.4)] bg-white text-[hsl(28_31%_45%)] transition hover:bg-[hsl(28_45%_96%)] disabled:opacity-40"
          data-testid={`button-${testId}-plus`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-[hsl(28_31%_55%/.35)] bg-white px-4 py-3 font-sans text-base text-foreground placeholder:text-[hsl(19_12%_58%)] focus:border-[hsl(346_37%_56%)] focus:outline-none focus:ring-2 focus:ring-[hsl(346_37%_56%/.18)]";

const primaryButton =
  "inline-flex w-full items-center justify-center gap-2 rounded-full bg-[hsl(346_37%_52%)] px-6 py-3.5 font-sans text-[13px] uppercase tracking-[0.18em] text-white transition hover:bg-[hsl(348_33%_46%)] disabled:cursor-not-allowed disabled:opacity-50";

/* ----------------------------------------------------------------- page */

export default function Home() {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [guest, setGuest] = useState<Match | null>(null);
  const [attending, setAttending] = useState(0);
  const [declined, setDeclined] = useState(0);
  // Per-person attendance for households with named members.
  // Keys are stable identifiers: "primary" for the main contact, and
  // "extra-<index>" for each additional household member.
  const [personStatus, setPersonStatus] = useState<Record<string, "yes" | "no" | null>>({});
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);

  const people = (n: number) => (n === 1 ? t("rsvp.person") : t("rsvp.people"));

  function reset() {
    setQuery("");
    setSearched(false);
    setMatches([]);
    setGuest(null);
    setSubmitted(null);
    setError(null);
    setNote("");
    setEmail("");
  }

  function selectGuest(m: Match) {
    setGuest(m);
    const extras = (m.additionalNames || []).filter((n) => n.firstName || n.lastName);
    const hasNamedList = extras.length > 0;

    if (hasNamedList) {
      // Build a per-person map. If they previously RSVPed, we don't know WHICH
      // people attended, only totals — so pre-fill "yes" for the first N people
      // (attendees count) and "no" for the rest. Guests can then adjust.
      const totalNamed = 1 + extras.length; // primary + additional
      const targetAttending = m.existing ? m.existing.attendees : totalNamed;
      const initial: Record<string, "yes" | "no" | null> = {};
      let remaining = targetAttending;
      const keys = ["primary", ...extras.map((_, i) => `extra-${i}`)];
      for (const k of keys) {
        if (remaining > 0) {
          initial[k] = "yes";
          remaining -= 1;
        } else {
          initial[k] = "no";
        }
      }
      setPersonStatus(initial);
      setAttending(targetAttending);
      setDeclined(m.invites - targetAttending);
    } else {
      const a = m.existing ? m.existing.attendees : m.invites;
      setAttending(a);
      setDeclined(m.existing ? m.existing.declinedCount : m.invites - a);
      setPersonStatus({});
    }

    setEmail(m.existing?.guestEmail || m.email || "");
    setNote(m.existing?.note || "");
    setError(null);
  }

  // Update one person in the checklist, then recompute attending/declined totals.
  function setPersonAttendance(key: string, status: "yes" | "no") {
    if (!guest) return;
    const extras = (guest.additionalNames || []).filter((n) => n.firstName || n.lastName);
    const keys = ["primary", ...extras.map((_, i) => `extra-${i}`)];
    const next: Record<string, "yes" | "no" | null> = { ...personStatus, [key]: status };
    let a = 0;
    let d = 0;
    for (const k of keys) {
      if (next[k] === "yes") a += 1;
      else if (next[k] === "no") d += 1;
    }
    setPersonStatus(next);
    setAttending(a);
    setDeclined(d);
  }

  async function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const data = await api<{ matches: Match[] }>(
        "GET",
        `/api/guests?q=${encodeURIComponent(query.trim())}`,
      );
      setMatches(data.matches);
      setSearched(true);
      setGuest(null);
      // Always require explicit confirmation, even for a single match, so guests
      // can catch a wrong-person auto-select before filling out the form.
      // (No auto-select here.)
    } catch (err: any) {
      setError(err?.message || t("search.genericError"));
    } finally {
      setSearching(false);
    }
  }

  async function submitRsvp(e: React.FormEvent) {
    e.preventDefault();
    if (!guest) return;
    const extrasCount = (guest.additionalNames || []).filter(
      (n) => n.firstName || n.lastName,
    ).length;
    const expectedTotal = extrasCount > 0 ? 1 + extrasCount : guest.invites;
    if (attending + declined !== expectedTotal) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api<{ email: { guestSent: boolean } }>("POST", "/api/rsvp", {
        guestId: guest.id,
        attending: attending > 0 ? "yes" : "no",
        attendees: attending,
        declinedCount: declined,
        guestEmail: email.trim() || null,
        note: note.trim() || null,
        language,
      });
      setSubmitted({
        firstName: guest.firstName,
        attendees: attending,
        declinedCount: declined,
        emailed: !!res?.email?.guestSent,
      });
    } catch (err: any) {
      setError(err?.message || t("rsvp.submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  /* -------------------------------------------------- confirmation view */
  if (submitted) {
    const coming = submitted.attendees > 0;
    return (
      <Shell>
        <div className="text-center" data-testid="section-confirmation">
          <Butterfly className="mx-auto w-16" />
          <h1 className="font-script mt-4 text-[3.2rem] leading-tight text-[hsl(346_37%_56%)] sm:text-[4.2rem]">
            {t("confirm.thankYou")}
          </h1>
          <p className="font-display mt-2 text-lg italic text-[hsl(19_17%_30%)]">
            {coming
              ? `${t("confirm.coming")} ${submitted.firstName}.`
              : t("confirm.notComing").replace("{name}", submitted.firstName)}
          </p>
          <Divider className="mx-auto mt-6 w-64" />
        </div>

        <Card testId="card-submitted-summary">
          <p className="label-caps text-center">{t("confirm.yourResponse")}</p>
          <p
            className="font-display mt-3 text-center text-xl text-[hsl(19_17%_26%)]"
            data-testid="text-submitted-summary"
          >
            {coming
              ? `${t("confirm.bringing")} ${submitted.attendees} ${people(submitted.attendees)}.`
              : t("confirm.noneAttending")}
            {submitted.declinedCount > 0 && (
              <>
                {" "}
                {submitted.declinedCount}{" "}
                {submitted.declinedCount === 1 ? t("confirm.seat") : t("confirm.seats")}{" "}
                {t("confirm.markedNotAttending")}
              </>
            )}
          </p>
          {submitted.emailed && (
            <p className="mt-3 text-center text-sm text-[hsl(19_14%_45%)]">
              {t("confirm.emailOnWay")}
            </p>
          )}
          <div className="mt-8 border-t border-[hsl(28_31%_55%/.25)] pt-8">
            <p className="font-display mb-6 text-center text-lg text-[hsl(346_33%_46%)]">
              {t("details.dateLong")}
            </p>
            <EventDetails />
          </div>
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={reset}
              className="font-display text-base italic text-[hsl(346_33%_46%)] underline decoration-[hsl(28_31%_55%/.5)] underline-offset-4"
              data-testid="button-edit-rsvp"
            >
              {t("confirm.updateRsvp")}
            </button>
          </div>
        </Card>
      </Shell>
    );
  }

  /* ------------------------------------------------------------- main view */
  const sum = guest ? attending + declined : 0;
  // For households with a named guest list, "complete" means everyone has been
  // marked yes/no. For plus-N households, we still require attending + declined
  // to equal the invited count.
  const hasNamedGuestList = guest
    ? (guest.additionalNames || []).some((n) => n.firstName || n.lastName)
    : false;
  const sumOk = guest
    ? hasNamedGuestList
      ? (1 + (guest.additionalNames || []).filter((n) => n.firstName || n.lastName).length) ===
        attending + declined
      : sum === guest.invites
    : false;

  return (
    <WideShell>
      <div className="mx-auto w-full max-w-2xl">
        <Hero />

        {/* search */}
        <Card testId="card-search">
          <div className="text-center">
            <p className="label-caps">{t("search.eyebrow")}</p>
            <h3 className="font-script mt-2 text-4xl text-[hsl(346_37%_56%)]">
              {t("search.heading")}
            </h3>
          </div>
          <form onSubmit={runSearch} className="mt-6 space-y-3">
            <label htmlFor="guest-search" className="sr-only">
              {t("search.srLabel")}
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(28_31%_55%)]" />
              <input
                id="guest-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search.placeholder")}
                className={`${inputClass} pl-11`}
                data-testid="input-search"
              />
            </div>
            <p className="text-center font-display text-sm italic text-[hsl(19_14%_45%)]">
              {t("search.hint")}
            </p>
            <button
              type="submit"
              className={primaryButton}
              disabled={searching || !query.trim()}
              data-testid="button-search"
            >
              {searching && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("search.button")}
            </button>
          </form>

          {error && !guest && (
            <p
              className="mt-4 rounded-md border border-[hsl(2_55%_48%/.3)] bg-[hsl(2_55%_48%/.06)] px-4 py-3 text-center text-sm text-[hsl(2_55%_38%)]"
              data-testid="text-error"
            >
              {error}
            </p>
          )}

          {searched && matches.length === 0 && (
            <p
              className="font-display mt-6 text-center text-base italic leading-relaxed text-[hsl(19_17%_32%)]"
              data-testid="text-no-matches"
            >
              {t("search.noMatches")}
            </p>
          )}

          {searched && matches.length >= 1 && !guest && (
            <div className="mt-8" data-testid="section-choose">
              <p className="font-display text-center text-lg text-[hsl(346_33%_46%)]">
                {matches.length === 1
                  ? t("search.confirmYou")
                  : t("search.which")}
              </p>
              <ul className="mt-4 space-y-3">
                {matches.map((m) => {
                  // If the search matched an additional household member (not the
                  // primary contact), surface THAT person's name as the headline
                  // and clarify they belong to the primary's party.
                  const needle = query.trim().toLowerCase();
                  const primaryHit =
                    !!needle &&
                    ((m.firstName || "").toLowerCase().includes(needle) ||
                      (m.lastName || "").toLowerCase().includes(needle) ||
                      `${m.firstName} ${m.lastName}`.toLowerCase().includes(needle) ||
                      (m.email || "").toLowerCase().includes(needle));
                  const matchedExtra =
                    !primaryHit && needle
                      ? (m.additionalNames || []).find((n) => {
                          const f = (n.firstName || "").toLowerCase();
                          const l = (n.lastName || "").toLowerCase();
                          const full = `${n.firstName} ${n.lastName}`.trim().toLowerCase();
                          return (
                            (f && f.includes(needle)) ||
                            (l && l.includes(needle)) ||
                            (full && full.includes(needle))
                          );
                        })
                      : undefined;
                  const headline = matchedExtra
                    ? `${matchedExtra.firstName}${
                        matchedExtra.lastName ? " " + matchedExtra.lastName : ""
                      }`.trim()
                    : m.fullName;
                  const subLine = matchedExtra
                    ? t("partyMember.template", {
                        name: matchedExtra.firstName || headline,
                        primary: m.fullName,
                      })
                    : householdLabel(m, t, { includePartyOf: false });
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => selectGuest(m)}
                        className="w-full rounded-lg border border-[hsl(28_31%_55%/.3)] bg-[hsl(28_60%_98%)] px-5 py-4 text-left transition hover:border-[hsl(346_37%_56%/.6)] hover:bg-white"
                        data-testid={`button-select-guest-${m.id}`}
                      >
                        <span className="font-display block text-lg text-[hsl(19_17%_24%)]">
                          {headline}
                        </span>
                        {subLine && (
                          <span
                            className="mt-0.5 block font-display text-sm italic text-[hsl(19_14%_45%)]"
                            data-testid={`text-household-${m.id}`}
                          >
                            {subLine}
                          </span>
                        )}
                        {m.existing && (
                          <span className="label-caps text-[10px]">
                            {t("search.alreadyResponded")}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {matches.length === 1 && (
                <button
                  type="button"
                  onClick={reset}
                  className="mt-4 w-full text-center font-display text-sm italic text-[hsl(19_14%_45%)] underline decoration-[hsl(346_37%_56%/.4)] underline-offset-4 hover:text-[hsl(346_33%_46%)]"
                  data-testid="button-search-again"
                >
                  {t("search.noSearchAgain")}
                </button>
              )}
            </div>
          )}
        </Card>

        {/* rsvp form */}
        {guest && (
          <Card testId="card-rsvp">
            <div className="text-center">
              <h3
                className="font-script text-4xl text-[hsl(346_37%_56%)]"
                data-testid="text-greeting"
              >
                {t("rsvp.hi")} {guest.firstName}!
              </h3>
              {householdLabel(guest, t) ? (
                <p
                  className="font-display mt-2 text-lg text-[hsl(346_33%_46%)]"
                  data-testid="text-party-size"
                >
                  {householdLabel(guest, t)}
                </p>
              ) : (
                <p
                  className="font-display mt-2 text-lg text-[hsl(19_17%_28%)]"
                  data-testid="text-party-size"
                >
                  {t("rsvp.invitedAs")}{" "}
                  <span className="text-[hsl(346_33%_46%)]">
                    {t("rsvp.partyOf")} {guest.invites} {people(guest.invites)}
                  </span>
                  .
                </p>
              )}
              {guest.existing && (
                <p className="mt-2 text-sm text-[hsl(19_14%_45%)]">
                  {t("rsvp.respondedBefore")}
                </p>
              )}
              <SmallFlourish className="mx-auto mt-5 w-32" />
            </div>

            <form onSubmit={submitRsvp} className="mt-7 space-y-6">
              {(() => {
                const extras = (guest.additionalNames || []).filter(
                  (n) => n.firstName || n.lastName,
                );
                const hasNamedGuests = extras.length > 0;

                if (hasNamedGuests) {
                  const people: { key: string; name: string }[] = [
                    { key: "primary", name: guest.fullName },
                    ...extras.map((n, i) => ({
                      key: `extra-${i}`,
                      name: [n.firstName, n.lastName].filter(Boolean).join(" "),
                    })),
                  ];
                  const anyUnanswered = people.some((p) => !personStatus[p.key]);

                  return (
                    <div>
                      <p className="font-display text-lg text-[hsl(346_33%_46%)]">
                        {t("guestList.heading")}
                      </p>
                      <p className="mt-1 text-sm text-[hsl(19_14%_45%)]">
                        {t("guestList.sub")}
                      </p>
                      <ul className="mt-4 space-y-3">
                        {people.map((p) => {
                          const status = personStatus[p.key];
                          return (
                            <li
                              key={p.key}
                              className="flex flex-col gap-3 rounded-lg border border-[hsl(28_31%_80%)] bg-[hsl(28_60%_98%)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                              data-testid={`row-guest-${p.key}`}
                            >
                              <span className="font-display text-base text-[hsl(19_17%_28%)]">
                                {p.name}
                              </span>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPersonAttendance(p.key, "yes")}
                                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                                    status === "yes"
                                      ? "border-[hsl(346_37%_56%)] bg-[hsl(346_37%_56%)] text-white shadow-sm"
                                      : "border-[hsl(28_31%_65%)] bg-white text-[hsl(19_17%_28%)] hover:border-[hsl(346_37%_56%)]"
                                  }`}
                                  data-testid={`button-attending-${p.key}`}
                                >
                                  {t("guestList.attending")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPersonAttendance(p.key, "no")}
                                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                                    status === "no"
                                      ? "border-[hsl(19_17%_28%)] bg-[hsl(19_17%_28%)] text-white shadow-sm"
                                      : "border-[hsl(28_31%_65%)] bg-white text-[hsl(19_17%_28%)] hover:border-[hsl(19_17%_28%)]"
                                  }`}
                                  data-testid={`button-not-attending-${p.key}`}
                                >
                                  {t("guestList.notAttending")}
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                      {anyUnanswered ? (
                        <p
                          className="mt-3 rounded-md border border-[hsl(28_31%_55%/.4)] bg-[hsl(28_60%_97%)] px-4 py-3 text-center text-sm text-[hsl(2_55%_38%)]"
                          data-testid="text-guest-list-warning"
                        >
                          {t("guestList.unanswered")}
                        </p>
                      ) : (
                        <p
                          className="mt-3 text-center text-sm italic text-[hsl(19_14%_45%)]"
                          data-testid="text-guest-list-summary"
                        >
                          {t("guestList.summary", { a: attending, d: declined })}
                        </p>
                      )}
                    </div>
                  );
                }

                return (
                  <>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Stepper
                        label={t("rsvp.attendingLabel")}
                        value={attending}
                        max={guest.invites}
                        testId="attending"
                        onChange={(v) => {
                          setAttending(v);
                          setDeclined(guest.invites - v);
                        }}
                      />
                      <Stepper
                        label={t("rsvp.declinedLabel")}
                        value={declined}
                        max={guest.invites}
                        testId="declined"
                        onChange={setDeclined}
                      />
                    </div>
                    {!sumOk && (
                      <p
                        className="rounded-md border border-[hsl(28_31%_55%/.4)] bg-[hsl(28_60%_97%)] px-4 py-3 text-center text-sm text-[hsl(2_55%_38%)]"
                        data-testid="text-sum-warning"
                      >
                        {t("rsvp.sumWarning")} {guest.invites}.
                      </p>
                    )}
                  </>
                );
              })()}

              <div>
                <label
                  htmlFor="guest-email"
                  className="font-display block text-base text-[hsl(19_17%_28%)]"
                >
                  {t("rsvp.emailLabel")}{" "}
                  <span className="text-sm italic text-[hsl(19_14%_50%)]">
                    {t("rsvp.optional")}
                  </span>
                </label>
                <input
                  id="guest-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("rsvp.emailPlaceholder")}
                  className={`${inputClass} mt-2`}
                  data-testid="input-guest-email"
                />
              </div>

              <div>
                <label
                  htmlFor="guest-note"
                  className="font-display block text-base text-[hsl(19_17%_28%)]"
                >
                  {t("rsvp.noteLabel")}{" "}
                  <span className="text-sm italic text-[hsl(19_14%_50%)]">
                    {t("rsvp.optional")}
                  </span>
                </label>
                <textarea
                  id="guest-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder={t("rsvp.notePlaceholder")}
                  className={`${inputClass} mt-2 resize-y`}
                  data-testid="input-note"
                />
              </div>

              {error && (
                <p
                  className="rounded-md border border-[hsl(2_55%_48%/.3)] bg-[hsl(2_55%_48%/.06)] px-4 py-3 text-center text-sm text-[hsl(2_55%_38%)]"
                  data-testid="text-submit-error"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                className={primaryButton}
                disabled={submitting || !sumOk}
                data-testid="button-submit-rsvp"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("rsvp.submit")}
              </button>
              <p className="text-center font-display text-sm italic text-[hsl(19_14%_45%)]">
                {t("rsvp.respondBy")} {t("hero.rsvpByDate")}.
              </p>
            </form>
          </Card>
        )}
      </div>

      <SectionOrnament />
      <AboutSection />
      <SectionOrnament />
      <ScheduleSection />
      <SectionOrnament />
      <DressCodeSection />
      <SectionOrnament />
      <VenuesSection />
      <SectionOrnament />
      <PadrinosSection />
      <SectionOrnament />
      <CourtOfHonorSection />
      <SectionOrnament />
      <HotelsSection />
    </WideShell>
  );
}
