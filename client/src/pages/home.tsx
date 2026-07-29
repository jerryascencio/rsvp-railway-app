import { useState } from "react";
import { Link } from "wouter";
import { Minus, Plus, Search, Loader2 } from "lucide-react";
import { EVENT } from "@shared/schema";
import { api } from "@/lib/api";
import {
  Tiara,
  Divider,
  SmallFlourish,
  Butterfly,
  FloralFrame,
  DateBlock,
  EventDetails,
} from "@/components/ornaments";

type Match = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  invites: number;
  email: string | null;
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

const people = (n: number) => (n === 1 ? "person" : "people");

/* ---------------------------------------------------------------- shell */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="invite-page relative min-h-screen overflow-hidden font-sans text-foreground">
      <FloralFrame />
      <div className="relative z-10 mx-auto w-full max-w-2xl px-6 py-12 sm:px-10 sm:py-16">
        {children}
        <footer className="mt-16 text-center">
          <SmallFlourish className="mx-auto w-28 opacity-80" />
          <p className="font-display mt-4 text-sm italic text-[hsl(19_14%_45%)]">
            With love, the Espinoza Family
          </p>
          <Link
            href="/admin"
            className="label-caps mt-3 inline-block text-[10px] opacity-60 hover:opacity-100"
            data-testid="link-admin"
          >
            Host Login
          </Link>
        </footer>
      </div>
    </div>
  );
}

function RsvpByBadge() {
  return (
    <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[hsl(28_31%_55%/.35)] bg-[hsl(30_100%_99%/.8)] px-4 py-1.5">
      <span className="label-caps text-[10px]">RSVP by</span>
      <span className="font-display text-sm text-[hsl(346_33%_46%)]">
        August 18th, 2026
      </span>
    </div>
  );
}

/* ----------------------------------------------------------------- hero */

function Hero() {
  return (
    <header className="text-center" data-testid="section-hero">
      <Tiara className="mx-auto w-48 sm:w-64" />
      <p className="label-caps mt-6">You are cordially invited</p>
      <p className="font-display mt-3 text-lg italic leading-snug text-[hsl(19_17%_30%)]">
        to celebrate with the
        <br />
        Espinoza Family at the
      </p>
      <h1
        className="font-script mt-2 text-[3.4rem] leading-[1.05] text-[hsl(346_37%_56%)] sm:text-[5rem]"
        data-testid="text-event-title"
      >
        Quinceañera
      </h1>
      <p className="font-display text-base italic text-[hsl(28_31%_50%)]">of</p>
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
  const clamp = (v: number) => Math.max(0, Math.min(max, v));
  return (
    <div>
      <div className="font-display text-base text-[hsl(19_17%_28%)]">{label}</div>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
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
          aria-label={`Increase ${label}`}
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
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [guest, setGuest] = useState<Match | null>(null);
  const [attending, setAttending] = useState(0);
  const [declined, setDeclined] = useState(0);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);

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
    const a = m.existing ? m.existing.attendees : m.invites;
    setAttending(a);
    setDeclined(m.existing ? m.existing.declinedCount : m.invites - a);
    setEmail(m.existing?.guestEmail || m.email || "");
    setNote(m.existing?.note || "");
    setError(null);
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
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  async function submitRsvp(e: React.FormEvent) {
    e.preventDefault();
    if (!guest) return;
    if (attending + declined !== guest.invites) return;
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
      });
      setSubmitted({
        firstName: guest.firstName,
        attendees: attending,
        declinedCount: declined,
        emailed: !!res?.email?.guestSent,
      });
    } catch (err: any) {
      setError(err?.message || "We couldn't save your RSVP. Please try again.");
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
            Thank you
          </h1>
          <p className="font-display mt-2 text-lg italic text-[hsl(19_17%_30%)]">
            {coming
              ? `We can't wait to celebrate with you, ${submitted.firstName}.`
              : `We'll miss you, ${submitted.firstName} — thank you for letting us know.`}
          </p>
          <Divider className="mx-auto mt-6 w-64" />
        </div>

        <Card testId="card-submitted-summary">
          <p className="label-caps text-center">Your response</p>
          <p
            className="font-display mt-3 text-center text-xl text-[hsl(19_17%_26%)]"
            data-testid="text-submitted-summary"
          >
            {coming
              ? `You're bringing ${submitted.attendees} ${people(submitted.attendees)}.`
              : "No one from your party will be attending."}
            {submitted.declinedCount > 0 && (
              <>
                {" "}
                {submitted.declinedCount}{" "}
                {submitted.declinedCount === 1 ? "seat" : "seats"} marked not
                attending.
              </>
            )}
          </p>
          {submitted.emailed && (
            <p className="mt-3 text-center text-sm text-[hsl(19_14%_45%)]">
              A confirmation email is on its way.
            </p>
          )}
          <div className="mt-8 border-t border-[hsl(28_31%_55%/.25)] pt-8">
            <p className="font-display mb-6 text-center text-lg text-[hsl(346_33%_46%)]">
              {EVENT.dateLong}
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
              Made a mistake? Update your RSVP
            </button>
          </div>
        </Card>
      </Shell>
    );
  }

  /* ------------------------------------------------------------- main view */
  const sum = guest ? attending + declined : 0;
  const sumOk = guest ? sum === guest.invites : false;

  return (
    <Shell>
      <Hero />

      {/* search */}
      <Card testId="card-search">
        <div className="text-center">
          <p className="label-caps">Kindly Respond</p>
          <h3 className="font-script mt-2 text-4xl text-[hsl(346_37%_56%)]">
            Find your invitation
          </h3>
        </div>
        <form onSubmit={runSearch} className="mt-6 space-y-3">
          <label htmlFor="guest-search" className="sr-only">
            Search for your invitation
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(28_31%_55%)]" />
            <input
              id="guest-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your name, phone, or email to find your invitation"
              className={`${inputClass} pl-11`}
              data-testid="input-search"
            />
          </div>
          <p className="text-center font-display text-sm italic text-[hsl(19_14%_45%)]">
            Try your first name, last name, phone number, or email.
          </p>
          <button
            type="submit"
            className={primaryButton}
            disabled={searching || !query.trim()}
            data-testid="button-search"
          >
            {searching && <Loader2 className="h-4 w-4 animate-spin" />}
            Find my invitation
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
            We couldn&rsquo;t find you in the guest list. Please double-check your
            spelling, or contact the family.
          </p>
        )}

        {searched && matches.length >= 1 && !guest && (
          <div className="mt-8" data-testid="section-choose">
            <p className="font-display text-center text-lg text-[hsl(346_33%_46%)]">
              {matches.length === 1 ? "Is this you?" : "Which one are you?"}
            </p>
            <ul className="mt-4 space-y-3">
              {matches.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => selectGuest(m)}
                    className="w-full rounded-lg border border-[hsl(28_31%_55%/.3)] bg-[hsl(28_60%_98%)] px-5 py-4 text-left transition hover:border-[hsl(346_37%_56%/.6)] hover:bg-white"
                    data-testid={`button-select-guest-${m.id}`}
                  >
                    <span className="font-display block text-lg text-[hsl(19_17%_24%)]">
                      {m.fullName}
                    </span>
                    <span className="label-caps text-[10px]">
                      Party of {m.invites}
                      {m.existing ? " · already responded" : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* rsvp form */}
      {guest && (
        <Card testId="card-rsvp">
          <div className="text-center">
            <h3 className="font-script text-4xl text-[hsl(346_37%_56%)]" data-testid="text-greeting">
              Hi {guest.firstName}!
            </h3>
            <p
              className="font-display mt-2 text-lg text-[hsl(19_17%_28%)]"
              data-testid="text-party-size"
            >
              You&rsquo;ve been invited as a{" "}
              <span className="text-[hsl(346_33%_46%)]">
                party of {guest.invites} {people(guest.invites)}
              </span>
              .
            </p>
            {guest.existing && (
              <p className="mt-2 text-sm text-[hsl(19_14%_45%)]">
                You&rsquo;ve responded before — submitting again will update your RSVP.
              </p>
            )}
            <SmallFlourish className="mx-auto mt-5 w-32" />
          </div>

          <form onSubmit={submitRsvp} className="mt-7 space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Stepper
                label="How many will be attending?"
                value={attending}
                max={guest.invites}
                testId="attending"
                onChange={(v) => {
                  setAttending(v);
                  setDeclined(guest.invites - v);
                }}
              />
              <Stepper
                label="How many will NOT be attending?"
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
                These should add up to {guest.invites}.
              </p>
            )}

            <div>
              <label
                htmlFor="guest-email"
                className="font-display block text-base text-[hsl(19_17%_28%)]"
              >
                Email for confirmation{" "}
                <span className="text-sm italic text-[hsl(19_14%_50%)]">(optional)</span>
              </label>
              <input
                id="guest-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`${inputClass} mt-2`}
                data-testid="input-guest-email"
              />
            </div>

            <div>
              <label
                htmlFor="guest-note"
                className="font-display block text-base text-[hsl(19_17%_28%)]"
              >
                A note for the family{" "}
                <span className="text-sm italic text-[hsl(19_14%_50%)]">(optional)</span>
              </label>
              <textarea
                id="guest-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Dietary needs, well wishes, anything at all"
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
              Send my RSVP
            </button>
            <p className="text-center font-display text-sm italic text-[hsl(19_14%_45%)]">
              Please respond by {EVENT.rsvpBy}.
            </p>
          </form>
        </Card>
      )}
    </Shell>
  );
}
