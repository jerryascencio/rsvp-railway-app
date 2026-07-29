import { useEffect, useState } from "react";
import {
  Building2,
  Church,
  Heart,
  MapPin,
  Music,
  UtensilsCrossed,
} from "lucide-react";
import { Divider, SmallFlourish } from "@/components/ornaments";
import { useLanguage } from "@/lib/language";
import leahPhotoUrl from "@/assets/leah.jpg";

/* -------------------------------------------------------- shared styling */

const CARD =
  "rounded-xl border border-[hsl(346_37%_56%/.3)] bg-[linear-gradient(180deg,#fffdfb_0%,#fffaf5_100%)] shadow-[0_18px_44px_-30px_hsl(19_20%_35%/.3)]";

const ROSE_BUTTON =
  "inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[hsl(var(--primary))] px-2.5 py-2.5 font-sans text-[10px] uppercase tracking-[0.08em] text-white transition hover:bg-[hsl(348_33%_46%)] sm:px-3 sm:text-[11px] sm:tracking-[0.12em]";

export function SectionOrnament() {
  return (
    <div className="my-14 flex items-center justify-center" aria-hidden="true">
      <span className="h-px w-16 bg-[hsl(28_31%_55%/.35)] sm:w-24" />
      <SmallFlourish className="mx-3 w-24 opacity-80 sm:w-32" />
      <span className="h-px w-16 bg-[hsl(28_31%_55%/.35)] sm:w-24" />
    </div>
  );
}

function SectionHeader({
  eyebrow,
  heading,
  sub,
  ornament = false,
}: {
  eyebrow: string;
  heading: string;
  sub?: string;
  ornament?: boolean;
}) {
  return (
    <div className="text-center">
      <p className="label-caps" style={{ letterSpacing: "0.2em" }}>
        {eyebrow}
      </p>
      <h2 className="font-display mt-3 text-[2.15rem] leading-tight text-[hsl(346_37%_56%)] sm:text-[2.85rem]">
        {heading}
      </h2>
      {ornament && <Divider className="mx-auto mt-4 w-56 sm:w-72" />}
      {sub && (
        <p className="font-display mt-3 text-base italic text-[hsl(19_14%_45%)]">{sub}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------- language toggle */

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();
  const pill = (code: "en" | "es") =>
    `rounded-full px-2.5 py-1 text-[11px] font-sans uppercase tracking-[0.14em] transition sm:px-3 sm:text-[12px] ${
      language === code
        ? "bg-[hsl(var(--primary))] text-white"
        : "text-[hsl(28_31%_45%)] hover:text-[hsl(346_37%_50%)]"
    }`;
  return (
    <div
      className="fixed right-3 top-3 z-50 flex items-center gap-1 rounded-full border border-[hsl(28_31%_55%/.4)] bg-[hsl(30_100%_99%/.92)] p-1 shadow-[0_8px_24px_-14px_hsl(19_20%_35%/.4)] backdrop-blur sm:right-5 sm:top-5"
      role="group"
      aria-label={t("toggle.aria")}
    >
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={pill("en")}
        aria-pressed={language === "en"}
        data-testid="button-lang-en"
      >
        EN
      </button>
      <span className="h-4 w-px bg-[hsl(28_31%_55%/.4)]" aria-hidden="true" />
      <button
        type="button"
        onClick={() => setLanguage("es")}
        className={pill("es")}
        aria-pressed={language === "es"}
        data-testid="button-lang-es"
      >
        ES
      </button>
    </div>
  );
}

/* ------------------------------------------------------------- countdown */

/** Fixed moment: Friday, September 18, 2026, 2:30 PM Pacific (PDT, UTC-7). */
const TARGET = new Date("2026-09-18T14:30:00-07:00");

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function Countdown() {
  const { t } = useLanguage();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const delta = TARGET.getTime() - now;

  if (delta <= 0) {
    return (
      <div className="mt-8 text-center" data-testid="section-countdown">
        <div
          className={`${CARD} mx-auto inline-block px-8 py-5`}
          style={{ background: "hsl(28 45% 94%)" }}
        >
          <p className="font-display text-2xl text-[hsl(346_37%_52%)]" data-testid="text-countdown-today">
            {t("countdown.today")}
          </p>
        </div>
      </div>
    );
  }

  const totalSeconds = Math.floor(delta / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const cells: Array<[string, string]> = [
    [pad(days), t("countdown.days")],
    [pad(hours), t("countdown.hours")],
    [pad(mins), t("countdown.mins")],
    [pad(secs), t("countdown.secs")],
  ];

  return (
    <div className="mt-8" data-testid="section-countdown" aria-label={t("countdown.aria")}>
      <div
        className="mx-auto grid max-w-md grid-cols-4 gap-2 rounded-xl border border-[hsl(28_31%_55%/.45)] px-3 py-4 sm:gap-3 sm:px-5"
        style={{ background: "hsl(28 45% 94%)" }}
      >
        {cells.map(([value, label], i) => (
          <div
            key={label + i}
            className="flex flex-col items-center rounded-lg border border-[hsl(28_31%_55%/.3)] bg-[hsl(30_100%_99%/.85)] px-1 py-2.5"
            data-testid={`countdown-cell-${i}`}
          >
            <span className="font-display text-2xl leading-none text-[hsl(346_33%_46%)] sm:text-3xl">
              {value}
            </span>
            <span className="label-caps mt-1.5 text-[9px] sm:text-[10px]" style={{ letterSpacing: "0.16em" }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- tiara  */

export function TiaraGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 78" className={className} fill="none" aria-hidden="true">
      <g
        stroke="hsl(28 31% 52% / .9)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M10 60 L22 26 L38 48 L60 16 L82 48 L98 26 L110 60 Z"
          fill="hsl(346 37% 56% / .12)"
        />
        <path d="M8 62h104" />
        <path d="M8 68h104" strokeWidth="1" />
        <circle cx="60" cy="12" r="4.2" fill="hsl(346 37% 56% / .35)" />
        <circle cx="22" cy="22" r="3" fill="hsl(346 37% 56% / .3)" />
        <circle cx="98" cy="22" r="3" fill="hsl(346 37% 56% / .3)" />
        <path d="M60 34 l7 8 -7 10 -7-10z" fill="hsl(346 37% 56% / .22)" />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------ about leah */

export function AboutSection() {
  const { t } = useLanguage();
  return (
    <section className="mt-2" data-testid="section-about">
      <div className="flex flex-col items-center gap-8 sm:flex-row sm:gap-10">
        <div
          className="relative h-[280px] w-[220px] shrink-0 overflow-hidden rounded-full border-2 border-[hsl(28_31%_55%/.55)] sm:h-[360px] sm:w-[280px]"
          style={{
            boxShadow: "0 22px 50px -34px hsl(19 20% 35% / .4)",
          }}
        >
          <img
            src={leahPhotoUrl}
            alt="Leah Adalynn Espinoza De Anda"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: "50% 30%" }}
            data-testid="img-leah"
          />
        </div>
        <div className="text-center sm:text-left">
          <p className="label-caps" style={{ letterSpacing: "0.2em" }}>
            {t("about.eyebrow")}
          </p>
          <h2 className="font-display mt-3 text-[2.05rem] leading-tight text-[hsl(346_37%_56%)] sm:text-[2.6rem]">
            {t("about.heading")}
          </h2>
          <Divider className="mt-4 w-56 mx-auto sm:mx-0 sm:w-64" />
          <p
            className="font-display mt-5 text-[17px] leading-[1.7] text-[hsl(19_17%_30%)]"
            data-testid="text-about-body"
          >
            {t("about.body")}
          </p>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- schedule */

export function ScheduleSection() {
  const { t } = useLanguage();
  const items = [
    {
      time: "2:30 PM",
      title: t("schedule.massTitle"),
      body: t("schedule.massPlace"),
      Icon: Church,
    },
    {
      time: "5:00 PM",
      title: t("schedule.receptionTitle"),
      body: t("schedule.receptionPlace"),
      Icon: UtensilsCrossed,
    },
    {
      time: "7:00 PM",
      title: t("schedule.valsTitle"),
      body: t("schedule.valsBody"),
      Icon: Heart,
    },
    {
      time: "8:00 PM",
      title: t("schedule.danceTitle"),
      body: t("schedule.danceBody"),
      Icon: Music,
    },
  ];

  return (
    <section data-testid="section-schedule">
      <SectionHeader eyebrow={t("schedule.eyebrow")} heading={t("schedule.heading")} ornament />

      <div className="relative mt-10">
        {/* central / left vertical line */}
        <span
          aria-hidden="true"
          className="absolute left-[19px] top-2 bottom-2 w-px bg-[hsl(28_31%_55%/.4)] sm:left-1/2 sm:-translate-x-1/2"
        />
        <ol className="space-y-8">
          {items.map(({ time, title, body, Icon }, i) => {
            const left = i % 2 === 0;
            return (
              <li
                key={time + i}
                className="relative pl-14 sm:flex sm:pl-0"
                data-testid={`timeline-item-${i}`}
              >
                {/* icon node */}
                <span className="absolute left-0 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-[hsl(28_31%_55%/.5)] bg-[hsl(30_100%_99%)] shadow-[0_6px_16px_-10px_hsl(19_20%_35%/.5)] sm:left-1/2 sm:-translate-x-1/2">
                  <Icon className="h-4 w-4 text-[hsl(346_37%_52%)]" />
                </span>

                {left ? (
                  <>
                    <div className="sm:w-1/2 sm:pr-12">
                      <TimelineCard time={time} title={title} body={body} align="right" />
                    </div>
                    <div className="hidden sm:block sm:w-1/2" />
                  </>
                ) : (
                  <>
                    <div className="hidden sm:block sm:w-1/2" />
                    <div className="sm:w-1/2 sm:pl-12">
                      <TimelineCard time={time} title={title} body={body} align="left" />
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function TimelineCard({
  time,
  title,
  body,
  align,
}: {
  time: string;
  title: string;
  body: string;
  align: "left" | "right";
}) {
  return (
    <div className={`${CARD} px-6 py-5 ${align === "right" ? "sm:text-right" : "sm:text-left"}`}>
      <p className="label-caps" style={{ letterSpacing: "0.2em" }}>
        {time}
      </p>
      <h3 className="font-display mt-1.5 text-xl leading-snug text-[hsl(346_33%_46%)]">
        {title}
      </h3>
      <p className="font-display mt-2 text-[16px] leading-[1.7] text-[hsl(19_17%_32%)]">{body}</p>
    </div>
  );
}

/* ----------------------------------------------------------------- venues */

function MapButtons({ address }: { address: string }) {
  const q = encodeURIComponent(address);
  return (
    <div className="mt-3 flex gap-2">
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${q}`}
        target="_blank"
        rel="noreferrer"
        className={ROSE_BUTTON}
        data-testid="link-google-maps"
      >
        <MapPin className="h-3.5 w-3.5" />
        Google Maps
      </a>
      <a
        href={`https://maps.apple.com/?q=${q}`}
        target="_blank"
        rel="noreferrer"
        className={ROSE_BUTTON}
        data-testid="link-apple-maps"
      >
        <MapPin className="h-3.5 w-3.5" />
        Apple Maps
      </a>
    </div>
  );
}

function VenueCard({
  label,
  name,
  address,
  parking,
  viewOnMap,
}: {
  label: string;
  name: string;
  address: string;
  parking: string;
  viewOnMap: string;
}) {
  return (
    <div className={`${CARD} px-6 py-7 sm:px-7`} data-testid={`card-venue-${name}`}>
      <p className="label-caps" style={{ letterSpacing: "0.2em" }}>
        {label}
      </p>
      <h3 className="font-display mt-2 text-[1.5rem] leading-snug text-[hsl(346_33%_46%)]">
        {name}
      </h3>
      <p className="font-display mt-2 text-[16px] leading-[1.7] text-[hsl(19_17%_32%)]">
        {address}
      </p>
      <p className="font-display mt-2 text-[15px] italic leading-[1.6] text-[hsl(19_14%_45%)]">
        {parking}
      </p>

      <div
        className="mt-5 flex h-20 items-center justify-center rounded-lg border border-dashed border-[hsl(28_31%_55%/.5)]"
        style={{
          background:
            "linear-gradient(135deg, hsl(28 45% 94%) 0%, hsl(346 37% 90%) 100%)",
        }}
      >
        <span className="font-display text-base text-[hsl(346_33%_44%)]">{viewOnMap}</span>
      </div>
      <MapButtons address={address} />
    </div>
  );
}

export function VenuesSection() {
  const { t } = useLanguage();
  return (
    <section data-testid="section-venues">
      <SectionHeader eyebrow={t("venues.eyebrow")} heading={t("venues.heading")} ornament />
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <VenueCard
          label={t("venues.massLabel")}
          name="Guardian Angel Catholic Church"
          address="12307 Terra Bella St, Pacoima, CA 91331"
          parking={t("venues.churchParking")}
          viewOnMap={t("venues.viewOnMap")}
        />
        <VenueCard
          label={t("venues.receptionLabel")}
          name="Platinum Banquet Hall"
          address="8704 Van Nuys Blvd, Panorama City, CA 91402"
          parking={t("venues.hallParking")}
          viewOnMap={t("venues.viewOnMap")}
        />
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- hotels */

type Hotel = {
  name: string;
  miles: string;
  address?: string;
  phone?: string;
  noteKey?: string;
  searchCity: string;
};

const HOTELS: Hotel[] = [
  {
    name: "Hilton Woodland Hills",
    miles: "9",
    address: "6360 Canoga Ave, Woodland Hills, CA 91367",
    phone: "(818) 226-1000",
    searchCity: "Woodland Hills",
  },
  {
    name: "Sheraton Universal",
    miles: "12",
    address: "333 Universal Hollywood Dr, Universal City, CA 91608",
    phone: "(818) 980-1212",
    searchCity: "Universal City",
  },
  {
    name: "Courtyard by Marriott Sherman Oaks",
    miles: "7",
    address: "15433 Ventura Blvd, Sherman Oaks, CA 91403",
    phone: "(818) 981-5400",
    searchCity: "Sherman Oaks",
  },
  {
    name: "Hampton Inn Panorama City",
    miles: "3",
    noteKey: "hotels.confirmAvailability",
    searchCity: "Panorama City",
  },
];

export function HotelsSection() {
  const { t } = useLanguage();
  return (
    <section data-testid="section-hotels">
      <SectionHeader
        eyebrow={t("hotels.eyebrow")}
        heading={t("hotels.heading")}
        sub={t("hotels.sub")}
      />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {HOTELS.map((h) => (
          <div
            key={h.name}
            className={`${CARD} flex flex-col overflow-hidden`}
            data-testid={`card-hotel-${h.name}`}
          >
            <div
              className="flex h-[160px] items-center justify-center"
              style={{
                background:
                  "linear-gradient(140deg, hsl(28 45% 93%) 0%, hsl(346 30% 88%) 55%, hsl(28 31% 78%) 100%)",
              }}
              aria-hidden="true"
            >
              <Building2 className="h-12 w-12 text-[hsl(28_31%_42%)] opacity-80" />
            </div>
            <div className="flex flex-1 flex-col px-5 py-5">
              <h3 className="font-display text-[1.2rem] font-semibold leading-snug text-[hsl(19_17%_26%)]">
                {h.name}
              </h3>
              <p className="font-display mt-1.5 text-[14px] italic text-[hsl(28_31%_48%)]">
                {t("hotels.distancePrefix")} {h.miles} {t("hotels.distanceSuffix")}
              </p>
              <p className="font-display mt-2 text-[15px] leading-[1.6] text-[hsl(19_17%_32%)]">
                {h.address ?? t("hotels.hamptonArea")}
              </p>
              <p className="font-display mt-1 text-[15px] text-[hsl(19_14%_45%)]">
                {h.phone ?? t(h.noteKey!)}
              </p>
              <span className="flex-1" aria-hidden="true" />
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(
                  `${h.name} ${h.searchCity} hotel booking`,
                )}`}
                target="_blank"
                rel="noreferrer"
                className={`${ROSE_BUTTON} mt-5 w-full flex-none self-stretch`}
                data-testid={`link-book-${h.name}`}
              >
                {t("hotels.book")}
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- dress code */

export function DressCodeSection() {
  const { t } = useLanguage();
  const swatches = [
    { hex: "#E8C4C4", label: t("dress.blush") },
    { hex: "#C97B8A", label: t("dress.dusty") },
    { hex: "#F5EBE0", label: t("dress.cream") },
    { hex: "#B0B99C", label: t("dress.sage") },
    { hex: "#C89B7B", label: t("dress.rosegold") },
  ];
  return (
    <section data-testid="section-dress-code">
      <SectionHeader eyebrow={t("dress.eyebrow")} heading={t("dress.heading")} ornament />
      <p className="font-display mx-auto mt-5 max-w-xl text-center text-[17px] leading-[1.7] text-[hsl(19_17%_30%)]">
        {t("dress.body")}
      </p>
      <div className="mt-8 flex flex-wrap items-start justify-center gap-5 sm:gap-7">
        {swatches.map((s) => (
          <div key={s.hex} className="w-[64px] text-center" data-testid={`swatch-${s.hex}`}>
            <span
              className="mx-auto block h-12 w-12 rounded-full border border-[hsl(28_31%_55%/.6)]"
              style={{ backgroundColor: s.hex }}
              aria-hidden="true"
            />
            <span className="mt-2 block font-sans text-[10px] uppercase leading-tight tracking-[0.1em] text-[hsl(19_14%_45%)]">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
