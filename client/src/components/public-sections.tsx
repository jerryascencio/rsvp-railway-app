import { useEffect, useState } from "react";
import {
  Church,
  Heart,
  MapPin,
  Music,
  UtensilsCrossed,
} from "lucide-react";
import { Divider, SmallFlourish } from "@/components/ornaments";
import { useLanguage } from "@/lib/language";
import leahPhotoUrl from "@/assets/leah.jpg";
import hotelHiltonUrl from "@/assets/hotel-hilton.jpg";
import hotelSheratonUrl from "@/assets/hotel-sheraton.jpg";
import hotelCourtyardUrl from "@/assets/hotel-courtyard.jpg";
import hotelHamptonUrl from "@/assets/hotel-hampton.jpg";
import venueChurchUrl from "@/assets/venue-church.jpg";
import venueHallUrl from "@/assets/venue-hall.jpg";

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
  photo,
}: {
  label: string;
  name: string;
  address: string;
  parking: string;
  photo: string;
}) {
  const q = encodeURIComponent(address);
  // Google Maps free embed (no API key required for the standard /maps?output=embed endpoint).
  const mapSrc = `https://maps.google.com/maps?q=${q}&z=15&output=embed`;
  return (
    <div
      className={`${CARD} overflow-hidden`}
      data-testid={`card-venue-${name}`}
    >
      {/* Venue hero photo — full-bleed at the top of the card */}
      <div className="relative h-[200px] w-full overflow-hidden">
        <img
          src={photo}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        {/* Subtle gradient overlay so the label chip reads clearly on any photo */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.35) 100%)",
          }}
        />
      </div>

      <div className="px-6 py-6 sm:px-7">
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

        <a
          href={`https://www.google.com/maps/search/?api=1&query=${q}`}
          target="_blank"
          rel="noreferrer"
          className="mt-5 block overflow-hidden rounded-lg border border-[hsl(28_31%_55%/.4)] shadow-[0_10px_30px_-20px_hsl(19_20%_35%/.4)]"
          aria-label={`Open ${name} in Google Maps`}
          data-testid={`map-preview-${name}`}
        >
          <div className="relative h-[180px] w-full">
            <iframe
              src={mapSrc}
              title={`Map of ${name}`}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            {/* Transparent overlay so the whole card acts as a link and drags don't hijack the page */}
            <span
              aria-hidden="true"
              className="absolute inset-0 cursor-pointer"
              style={{ background: "transparent" }}
            />
          </div>
        </a>
        <MapButtons address={address} />
      </div>
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
          photo={venueChurchUrl}
        />
        <VenueCard
          label={t("venues.receptionLabel")}
          name="Platinum Banquet Hall"
          address="8704 Van Nuys Blvd, Panorama City, CA 91402"
          parking={t("venues.hallParking")}
          photo={venueHallUrl}
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
  photo: string;
};

const HOTELS: Hotel[] = [
  {
    name: "Hilton Woodland Hills",
    miles: "9",
    address: "6360 Canoga Ave, Woodland Hills, CA 91367",
    phone: "(818) 226-1000",
    searchCity: "Woodland Hills",
    photo: hotelHiltonUrl,
  },
  {
    name: "Sheraton Universal",
    miles: "12",
    address: "333 Universal Hollywood Dr, Universal City, CA 91608",
    phone: "(818) 980-1212",
    searchCity: "Universal City",
    photo: hotelSheratonUrl,
  },
  {
    name: "Courtyard by Marriott Sherman Oaks",
    miles: "7",
    address: "15433 Ventura Blvd, Sherman Oaks, CA 91403",
    phone: "(818) 981-5400",
    searchCity: "Sherman Oaks",
    photo: hotelCourtyardUrl,
  },
  {
    name: "Hampton Inn Panorama City",
    miles: "3",
    noteKey: "hotels.confirmAvailability",
    searchCity: "Panorama City",
    photo: hotelHamptonUrl,
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
            <div className="relative h-[160px] overflow-hidden">
              <img
                src={h.photo}
                alt={`${h.name} exterior`}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
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

/* --------------------------------------------------------------- padrinos */

function PadrinoRow({
  label,
  names,
  large = false,
}: {
  label: string;
  names: string;
  large?: boolean;
}) {
  return (
    <div
      className={`text-center ${large ? "py-5" : "py-3"}`}
      data-testid={`padrino-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
    >
      <p
        className="label-caps"
        style={{
          letterSpacing: "0.2em",
          fontSize: large ? "0.82rem" : "0.72rem",
        }}
      >
        {label}
      </p>
      <p
        className={`font-display mt-1.5 leading-snug text-[hsl(346_33%_46%)] ${
          large ? "text-[1.35rem] sm:text-[1.55rem]" : "text-[1.05rem] sm:text-[1.15rem]"
        }`}
      >
        {names}
      </p>
    </div>
  );
}

function OrnamentDivider() {
  return (
    <div className="my-1 flex items-center justify-center gap-3 opacity-60">
      <span className="h-px w-16 bg-[hsl(28_31%_55%/.55)]" />
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M7 1.5c1.6 0 3 1.2 3 2.8 0 1.6-1.4 3-3 3s-3-1.4-3-3c0-1.6 1.4-2.8 3-2.8Z"
          stroke="hsl(28 31% 55%)"
          strokeWidth="0.8"
          fill="none"
        />
        <circle cx="7" cy="7" r="1" fill="hsl(28 31% 55%)" />
      </svg>
      <span className="h-px w-16 bg-[hsl(28_31%_55%/.55)]" />
    </div>
  );
}

export function PadrinosSection() {
  const { t } = useLanguage();
  return (
    <section data-testid="section-padrinos">
      <SectionHeader
        eyebrow={t("padrinos.eyebrow")}
        heading={t("padrinos.heading")}
        ornament
      />
      <p className="font-display mx-auto mt-4 max-w-xl text-center text-[16px] italic leading-[1.7] text-[hsl(19_14%_45%)]">
        {t("padrinos.sub")}
      </p>

      <div className={`${CARD} mx-auto mt-8 max-w-2xl px-6 py-8 sm:px-10`}>
        {/* Padrinos de Honor — larger, centered */}
        <PadrinoRow
          label={t("padrinos.honorLabel")}
          names="Angelica De Anda & Miguel Muñoz"
          large
        />
        <OrnamentDivider />

        <PadrinoRow
          label={t("padrinos.ramoLabel")}
          names={"Silvia Mendez & Juan Abel \u201cChaco\u201d Mendez"}
        />
        <PadrinoRow
          label={t("padrinos.bibliaLabel")}
          names={"Martina Delgadillo & Gerardo \u201cJerry\u201d Ascencio"}
        />
        <PadrinoRow
          label={t("padrinos.medallaLabel")}
          names="Rudy De Anda & Atoor De Anda"
        />
        <PadrinoRow
          label={t("padrinos.anilloLabel")}
          names="Reynaldo Ascencio & Rosa Ascencio"
        />
        <PadrinoRow
          label={t("padrinos.coronacionLabel")}
          names="Rosamaria Jimenez & Angela Arriola"
        />
        <PadrinoRow
          label={t("padrinos.zapatosLabel")}
          names="John Anthony Espinoza"
        />
        <PadrinoRow
          label={t("padrinos.regaloLabel")}
          names="Stefanie & Gerardo Ascencio"
        />
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- court of honor */

function CourtCoupleRow({ names }: { names: string }) {
  return (
    <div
      className="py-3 text-center"
      data-testid={`court-${names.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
    >
      <p className="font-display text-[1.1rem] leading-snug text-[hsl(19_17%_30%)] sm:text-[1.2rem]">
        {names}
      </p>
    </div>
  );
}

export function CourtOfHonorSection() {
  const { t } = useLanguage();
  const couples = [
    "Laylanie Solis & Nathan Olea",
    "Victoria Ascencio & Max Zavala",
    "Izabella Paz & Evan Acosta",
    "Monica Alvarado & Antonio Casillas",
    "Sophia Rodriguez & Ricardo Ascencio",
    "Valentina Ascencio & Everest N\u00e1jera",
  ];
  return (
    <section data-testid="section-court">
      <SectionHeader
        eyebrow={t("court.eyebrow")}
        heading={t("court.heading")}
        ornament
      />
      <p className="font-display mx-auto mt-4 max-w-xl text-center text-[16px] italic leading-[1.7] text-[hsl(19_14%_45%)]">
        {t("court.sub")}
      </p>

      <div className={`${CARD} mx-auto mt-8 max-w-2xl px-6 py-8 sm:px-10`}>
        {/* Chamberlain of Honor — larger, centered */}
        <div className="text-center py-4" data-testid="court-main-chambelan">
          <p
            className="label-caps"
            style={{ letterSpacing: "0.2em", fontSize: "0.82rem" }}
          >
            {t("court.mainChambelanLabel")}
          </p>
          <p className="font-display mt-1.5 text-[1.5rem] leading-snug text-[hsl(346_33%_46%)] sm:text-[1.7rem]">
            Juan Mendez
          </p>
        </div>

        <OrnamentDivider />

        <div className="text-center mt-2">
          <p
            className="label-caps"
            style={{ letterSpacing: "0.2em", fontSize: "0.72rem" }}
          >
            {t("court.couplesLabel")}
          </p>
        </div>

        <div className="mt-2">
          {couples.map((c) => (
            <CourtCoupleRow key={c} names={c} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- dress code */

export function DressCodeSection() {
  const { t } = useLanguage();
  return (
    <section data-testid="section-dress-code">
      <SectionHeader eyebrow={t("dress.eyebrow")} heading={t("dress.heading")} ornament />
      <p className="font-display mx-auto mt-5 max-w-xl text-center text-[17px] leading-[1.7] text-[hsl(19_17%_30%)]">
        {t("dress.body")}
      </p>
    </section>
  );
}
