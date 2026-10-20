import { Link } from "wouter";
import { useLanguage } from "@/lib/language";

const LEAH_LIVE = "https://www.leahaespinoza.com";

const copy = {
  en: {
    start: "Start your site",
    eyebrow: "For quinceañeras, weddings, baptisms, and sweet 16s",
    title: "A bilingual RSVP site for your celebration.",
    lede: "Guests find their invitation by name. You get a private dashboard, a guest list you already have, and texts you send from your own phone.",
    basic: "Basic",
    basicPrice: "$100",
    basicNote: "per event",
    basicPoints: [
      "Your own invitation page and host dashboard",
      "Floral quinceañera or elegant wedding template",
      "English and Spanish",
      "Upload your guest list (CSV) and photos",
      "Gmail confirmations and a text-message queue",
    ],
    domain: "Custom domain",
    domainPrice: "+$25",
    domainNote: "we register it for a year",
    domainPoints: ["Your family's name in the address", "We buy the domain and point it at your site"],
    custom: "Full custom",
    customPrice: "$250",
    customNote: "designed with you",
    customPoints: ["Everything in Basic", "A design made for your celebration", "We build it by hand from your notes"],
    choose: "Choose this",
    how: "How it works",
    steps: [
      { n: "01", t: "Tell us about the day", d: "Names, date, venues, dress code, and the words you want guests to read." },
      { n: "02", t: "Pay once", d: "Checkout is a single payment. Nothing is published until you say so." },
      { n: "03", t: "Invite your people", d: "Upload the guest list, share the link, and watch RSVPs arrive." },
    ],
    templates: "Two templates, ready today",
    quince: "Quinceañera",
    quinceD: "Floral corners, script lettering, the same warmth as a family invitation.",
    wedding: "Wedding",
    weddingD: "Ivory, ink, and a thin gold line. Quiet enough for a ceremony.",
    from: "From the family who built Leah's Quinceañera site.",
    fine: "Unpaid events stay a private preview. A custom domain is requested at checkout and connected by hand.",
    exampleEyebrow: "See a real example",
    exampleTitle: "Leah Adalynn Espinoza's Quinceañera",
    exampleBody:
      "This is the public invitation families receive. The host dashboard, the guest list, and every RSVP stay private.",
    exampleOpen: "Open the live site",
    exampleMeta: "Friday, September 18, 2026 · Pacoima & Panorama City",
  },
  es: {
    start: "Crear mi sitio",
    eyebrow: "Para quinceañeras, bodas, bautizos y sweet 16",
    title: "Un sitio bilingüe para confirmar asistencia.",
    lede: "Los invitados encuentran su invitación por nombre. Usted recibe un tablero privado, su lista de invitados, y mensajes que envía desde su propio teléfono.",
    basic: "Básico",
    basicPrice: "$100",
    basicNote: "por evento",
    basicPoints: [
      "Su propia invitación y tablero de anfitrión",
      "Plantilla floral de quinceañera o de boda",
      "Inglés y español",
      "Suba su lista (CSV) y sus fotos",
      "Confirmaciones por Gmail y cola de mensajes",
    ],
    domain: "Dominio propio",
    domainPrice: "+$25",
    domainNote: "lo registramos por un año",
    domainPoints: ["El nombre de su familia en la dirección", "Compramos el dominio y lo conectamos"],
    custom: "Diseño a medida",
    customPrice: "$250",
    customNote: "lo diseñamos con usted",
    customPoints: ["Todo lo del plan Básico", "Un diseño hecho para su celebración", "Lo armamos a mano según sus notas"],
    choose: "Elegir",
    how: "Cómo funciona",
    steps: [
      { n: "01", t: "Cuéntenos del día", d: "Nombres, fecha, lugares, código de vestimenta y el texto para sus invitados." },
      { n: "02", t: "Pague una vez", d: "Un solo pago. Nada se publica hasta que usted lo decida." },
      { n: "03", t: "Invite a su gente", d: "Suba la lista, comparta el enlace y vea llegar las confirmaciones." },
    ],
    templates: "Dos plantillas, listas hoy",
    quince: "Quinceañera",
    quinceD: "Flores, letra manuscrita, la calidez de una invitación familiar.",
    wedding: "Boda",
    weddingD: "Marfil, tinta y una línea de oro. Lo bastante serena para una ceremonia.",
    from: "De la familia que hizo el sitio de la quinceañera de Leah.",
    fine: "Un evento sin pagar queda como vista previa privada. El dominio se pide al pagar y se conecta a mano.",
    exampleEyebrow: "Vea un ejemplo real",
    exampleTitle: "La quinceañera de Leah Adalynn Espinoza",
    exampleBody:
      "Esta es la invitación pública que recibe la familia. El tablero, la lista de invitados y cada confirmación quedan en privado.",
    exampleOpen: "Abrir el sitio en vivo",
    exampleMeta: "Viernes, 18 de septiembre de 2026 · Pacoima y Panorama City",
  },
} as const;

export default function Landing() {
  const { language, toggleLanguage } = useLanguage();
  const t = copy[language];

  return (
    <div className="min-h-screen bg-[hsl(28_60%_97%)] text-[hsl(19_17%_22%)]" data-testid="page-landing">
      <header className="sticky top-0 z-20 border-b border-[hsl(27_30%_88%)] bg-[hsl(28_60%_97%/.92)] backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-3">
          <Link href="/" className="font-script text-3xl leading-none text-[hsl(346_37%_48%)]">
            Invitation
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLanguage}
              className="rounded-full border border-[hsl(28_31%_55%/.35)] px-3 py-1.5 text-[11px] uppercase tracking-[0.16em]"
              data-testid="button-landing-language"
            >
              {language === "en" ? "ES" : "EN"}
            </button>
            <a
              href="#example"
              className="hidden text-[11px] uppercase tracking-[0.16em] text-[hsl(19_14%_40%)] sm:inline"
            >
              {t.exampleEyebrow}
            </a>
            <Link
              href="/start"
              className="rounded-full bg-[hsl(346_37%_48%)] px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-white"
              data-testid="link-start"
            >
              {t.start}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <img src="/floral-tl.png" alt="" className="pointer-events-none absolute left-0 top-0 w-[42%] max-w-[280px] opacity-90" />
          <img src="/floral-tr.png" alt="" className="pointer-events-none absolute right-0 top-0 w-[42%] max-w-[280px] opacity-90" />
          <div className="relative mx-auto max-w-3xl px-5 pb-16 pt-24 text-center sm:pt-28">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[hsl(28_31%_42%)]">{t.eyebrow}</p>
            <h1 className="font-script mt-4 text-[3.2rem] leading-[1.05] text-[hsl(346_37%_46%)] sm:text-7xl">
              {t.title}
            </h1>
            <p className="font-display mx-auto mt-5 max-w-xl text-lg italic leading-relaxed text-[hsl(19_14%_32%)]">
              {t.lede}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/start"
                className="inline-flex w-full items-center justify-center rounded-full bg-[hsl(346_37%_48%)] px-8 py-3.5 text-[12px] uppercase tracking-[0.18em] text-white sm:w-auto"
                data-testid="link-start-hero"
              >
                {t.start}
              </Link>
              <a href="#example" className="text-[12px] uppercase tracking-[0.18em] text-[hsl(19_14%_38%)]" data-testid="link-see-example">
                {t.exampleEyebrow}
              </a>
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto grid max-w-5xl gap-4 px-5 pb-16 sm:grid-cols-3">
          <PriceCard
            name={t.basic}
            price={t.basicPrice}
            note={t.basicNote}
            points={t.basicPoints}
            href="/start?package=basic"
            cta={t.choose}
            featured
          />
          <PriceCard
            name={t.domain}
            price={t.domainPrice}
            note={t.domainNote}
            points={t.domainPoints}
            href="/start?package=basic&domain=1"
            cta={t.choose}
          />
          <PriceCard
            name={t.custom}
            price={t.customPrice}
            note={t.customNote}
            points={t.customPoints}
            href="/start?package=full_custom"
            cta={t.choose}
          />
        </section>

        <section id="example" className="mx-auto max-w-5xl px-5 pb-16" data-testid="section-example">
          <div className="overflow-hidden rounded-3xl border border-[hsl(27_30%_86%)] bg-white shadow-sm sm:grid sm:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <a
              href={LEAH_LIVE}
              target="_blank"
              rel="noreferrer"
              className="relative block bg-[hsl(28_45%_94%)]"
              data-testid="link-leah-live"
            >
              <img
                src="/og-image.jpg"
                alt="Public invitation for Leah Adalynn Espinoza's Quinceañera"
                className="h-full max-h-[420px] w-full object-cover object-top sm:max-h-none"
              />
            </a>
            <div className="flex flex-col justify-center px-6 py-8 sm:px-8">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[hsl(28_31%_42%)]">{t.exampleEyebrow}</p>
              <h2 className="font-script mt-3 text-4xl leading-tight text-[hsl(346_37%_46%)] sm:text-5xl">{t.exampleTitle}</h2>
              <p className="mt-3 text-sm leading-relaxed text-[hsl(19_12%_36%)]">{t.exampleBody}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[hsl(28_31%_42%)]">{t.exampleMeta}</p>
              <div className="mt-6">
                <a
                  href={LEAH_LIVE}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex justify-center rounded-full bg-[hsl(346_37%_48%)] px-5 py-3 text-[12px] uppercase tracking-[0.16em] text-white"
                  data-testid="link-leah-live-cta"
                >
                  {t.exampleOpen}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[hsl(27_30%_88%)] bg-white/60">
          <div className="mx-auto max-w-5xl px-5 py-14">
            <h2 className="font-script text-center text-5xl text-[hsl(346_37%_46%)]">{t.templates}</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <TemplateCard
                kicker="01"
                title={t.quince}
                body={t.quinceD}
                swatch="bg-[hsl(346_37%_56%)]"
                sample="font-script text-[hsl(346_37%_48%)]"
              />
              <TemplateCard
                kicker="02"
                title={t.wedding}
                body={t.weddingD}
                swatch="bg-[hsl(32_28%_42%)]"
                sample="font-serif tracking-wide text-[hsl(24_10%_18%)]"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-14">
          <h2 className="font-script text-center text-5xl text-[hsl(346_37%_46%)]">{t.how}</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {t.steps.map((s) => (
              <li key={s.n} className="rounded-2xl border border-[hsl(27_30%_86%)] bg-white px-5 py-6">
                <div className="text-[11px] tracking-[0.2em] text-[hsl(28_31%_45%)]">{s.n}</div>
                <h3 className="font-display mt-2 text-2xl">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[hsl(19_12%_36%)]">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-t border-[hsl(27_30%_88%)] px-5 py-10 text-center">
        <p className="font-display italic text-[hsl(19_14%_36%)]">{t.from}</p>
        <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-[hsl(19_10%_46%)]">{t.fine}</p>
        <Link href="/super" className="mt-4 inline-block text-xs text-[hsl(19_10%_55%)] underline">
          Studio
        </Link>
      </footer>
    </div>
  );
}

function PriceCard({
  name,
  price,
  note,
  points,
  href,
  cta,
  featured,
}: {
  name: string;
  price: string;
  note: string;
  points: readonly string[];
  href: string;
  cta: string;
  featured?: boolean;
}) {
  return (
    <article
      className={`flex flex-col rounded-2xl border px-5 py-6 ${
        featured
          ? "border-[hsl(346_37%_56%)] bg-white shadow-sm"
          : "border-[hsl(27_30%_86%)] bg-white/80"
      }`}
    >
      <h2 className="text-[11px] uppercase tracking-[0.18em] text-[hsl(28_31%_40%)]">{name}</h2>
      <p className="font-display mt-2 text-5xl text-[hsl(346_33%_40%)]">{price}</p>
      <p className="text-sm italic text-[hsl(19_12%_42%)]">{note}</p>
      <ul className="mt-4 flex-1 space-y-2 text-sm leading-relaxed">
        {points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <Link
        href={href}
        className="mt-6 inline-flex justify-center rounded-full border border-[hsl(346_37%_48%)] px-4 py-2.5 text-[11px] uppercase tracking-[0.16em] text-[hsl(346_37%_40%)]"
      >
        {cta}
      </Link>
    </article>
  );
}

function TemplateCard({
  kicker,
  title,
  body,
  swatch,
  sample,
}: {
  kicker: string;
  title: string;
  body: string;
  swatch: string;
  sample: string;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[hsl(27_30%_86%)] bg-[hsl(30_60%_98%)]">
      <div className="flex items-end justify-between px-5 pt-5">
        <span className={`font-display text-4xl ${sample}`}>{title}</span>
        <span className={`h-8 w-8 rounded-full ${swatch}`} />
      </div>
      <p className="px-5 pb-5 pt-3 text-sm leading-relaxed text-[hsl(19_12%_36%)]">
        <span className="mr-2 text-[11px] tracking-[0.16em] text-[hsl(28_31%_45%)]">{kicker}</span>
        {body}
      </p>
    </article>
  );
}
