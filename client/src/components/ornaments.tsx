import { EVENT } from "@shared/schema";

export function Tiara({ className = "" }: { className?: string }) {
  return (
    <img
      src="./tiara.png"
      alt="Rose gold tiara"
      className={`select-none ${className}`}
      draggable={false}
    />
  );
}

export function Divider({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 26"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <g stroke="hsl(28 31% 55% / .75)" strokeWidth="1.1" strokeLinecap="round">
        <path d="M10 13h96" />
        <path d="M214 13h96" />
        <path d="M118 13c8-9 16-9 20-3s-4 12-12 10c-10-3-6-14 6-16 10-2 20 4 28 9" />
        <path d="M202 13c-8-9-16-9-20-3s4 12 12 10c10-3 6-14-6-16-10-2-20 4-28 9" />
        <path d="M160 8.5c2.5-3.5 7-1.5 7 1.8 0 2.6-3.4 5.2-7 7.7-3.6-2.5-7-5.1-7-7.7 0-3.3 4.5-5.3 7-1.8z" fill="hsl(346 37% 56% / .35)" stroke="none" />
      </g>
    </svg>
  );
}

export function SmallFlourish({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 14" className={className} fill="none" aria-hidden="true">
      <g stroke="hsl(28 31% 55% / .7)" strokeWidth="1" strokeLinecap="round">
        <path d="M4 7h48" />
        <path d="M108 7h48" />
        <path d="M62 7c4-5 10-3 10 1s-6 5-9 2" />
        <path d="M98 7c-4-5-10-3-10 1s6 5 9 2" />
        <circle cx="80" cy="7" r="1.6" fill="hsl(346 37% 56% / .55)" stroke="none" />
      </g>
    </svg>
  );
}

export function Butterfly({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 52" className={className} fill="none" aria-hidden="true">
      <g stroke="hsl(28 31% 55% / .8)" strokeWidth="1.1" strokeLinecap="round">
        <path
          d="M32 26C26 8 12 4 8 12c-4 8 6 16 24 14"
          fill="hsl(346 37% 56% / .16)"
        />
        <path
          d="M32 26c6-18 20-22 24-14 4 8-6 16-24 14"
          fill="hsl(346 37% 56% / .16)"
        />
        <path d="M32 26c-8 14-18 18-22 12-3-5 4-12 22-12" fill="hsl(28 31% 55% / .12)" />
        <path d="M32 26c8 14 18 18 22 12 3-5-4-12-22-12" fill="hsl(28 31% 55% / .12)" />
        <path d="M32 22v20" />
        <path d="M32 22l-5-9M32 22l5-9" />
      </g>
    </svg>
  );
}

/** Watercolor floral corners generated to match the printed invitation. */
export function FloralFrame() {
  const base =
    "pointer-events-none select-none absolute z-0 w-[46%] max-w-[420px] opacity-95";
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <img src="./floral-tl.png" alt="" className={`${base} top-0 left-0`} />
      <img
        src="./floral-tr.png"
        alt=""
        className={`${base} top-0 right-0 hidden sm:block`}
      />
      <img
        src="./floral-bl.png"
        alt=""
        className={`${base} bottom-0 left-0 hidden sm:block`}
      />
      <img src="./floral-br.png" alt="" className={`${base} bottom-0 right-0`} />
    </div>
  );
}

export function DateBlock() {
  return (
    <div className="flex items-stretch justify-center gap-4 sm:gap-6">
      <div className="flex flex-col justify-center text-right">
        <span className="font-display text-sm sm:text-base tracking-[0.2em] uppercase text-[hsl(19_17%_28%)]">
          {EVENT.dayName}
        </span>
      </div>
      <div className="w-px bg-[hsl(28_31%_55%/.45)]" />
      <div className="font-display text-5xl sm:text-6xl leading-none text-[hsl(28_31%_48%)]">
        {EVENT.day}
      </div>
      <div className="w-px bg-[hsl(28_31%_55%/.45)]" />
      <div className="flex flex-col justify-center text-left">
        <span className="font-display text-sm sm:text-base tracking-[0.2em] text-[hsl(19_17%_28%)]">
          {EVENT.year}
        </span>
      </div>
    </div>
  );
}

export function VenueBlock({
  label,
  time,
  venue,
  address,
}: {
  label: string;
  time: string;
  venue: string;
  address: string;
}) {
  const maps = `https://maps.google.com/?q=${encodeURIComponent(`${venue}, ${address}`)}`;
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-3">
        <span className="h-px w-8 bg-[hsl(28_31%_55%/.5)]" />
        <span className="label-caps">
          {label} · {time}
        </span>
        <span className="h-px w-8 bg-[hsl(28_31%_55%/.5)]" />
      </div>
      <div className="font-display mt-2 text-lg sm:text-xl tracking-[0.08em] uppercase text-[hsl(19_17%_24%)]">
        {venue}
      </div>
      <a
        href={maps}
        target="_blank"
        rel="noreferrer"
        className="font-display text-base text-[hsl(19_14%_40%)] underline decoration-[hsl(28_31%_55%/.4)] underline-offset-4 hover:text-[hsl(346_37%_46%)]"
        data-testid={`link-map-${label.toLowerCase()}`}
      >
        {address}
      </a>
    </div>
  );
}

export function EventDetails({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      <VenueBlock
        label="Mass"
        time={EVENT.massTime}
        venue={EVENT.massVenue}
        address={EVENT.massAddress}
      />
      <SmallFlourish className="mx-auto w-32" />
      <VenueBlock
        label="Reception"
        time={EVENT.receptionTime}
        venue={EVENT.receptionVenue}
        address={EVENT.receptionAddress}
      />
    </div>
  );
}
