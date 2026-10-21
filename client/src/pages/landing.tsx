import { Link } from "wouter";
import { useLanguage } from "@/lib/language";
import { BRAND_NAME } from "@shared/platform";
import { BrandHeader, BrandShell } from "@/components/brand-shell";

const LEAH_LIVE = "https://www.leahaespinoza.com";

const copy = {
  en: {
    start: "Start your site",
    eyebrow: "RSVP websites for any celebration",
    title: "A bilingual site your guests can actually use.",
    lede: "Pick a template, upload the guest list you already have, and share one link. People find their name and respond. You watch it happen from a private dashboard.",
    see: "See a real example",
    eventsTitle: "Made for the day you're hosting",
    events: ["Weddings", "Quinceañeras", "Birthdays", "Baby showers", "Anniversaries", "Graduations", "Parties"],
    how: "How it works",
    steps: [
      { n: "01", t: "Pick a template", d: "Six looks, from quiet type to confetti. The words and photos are yours." },
      { n: "02", t: "Upload your guest list", d: "The same spreadsheet you already keep. Names, phones, and how many seats." },
      { n: "03", t: "Share your link", d: "Guests search for their name. No accounts, no app to install." },
      { n: "04", t: "Track RSVPs", d: "See who's coming, who's pending, and close responses when the day is set." },
    ],
    featuresTitle: "What you get",
    features: [
      { t: "Bilingual guests", d: "English and Spanish on the same invitation. Guests switch with one tap." },
      { t: "Guest list upload", d: "Import a CSV. Households, extra names, and seat counts come with them." },
      { t: "Live RSVP dashboard", d: "Headcount, notes, and who still hasn't answered, updated as replies arrive." },
      { t: "Close RSVPs", d: "Pick a last day. After that, the form stops and guests see a closed message." },
      { t: "Custom domain", d: "Add your family's name in the address. We register it for a year and connect it." },
    ],
    templates: "Six templates",
    templatesLede: "A starting point for any celebration, not a single kind of party.",
    elegant: "Elegant",
    elegantD: "Quiet type, a warm paper ground, and room for a long name.",
    fiesta: "Fiesta",
    fiestaD: "Color at the edges. Marigold, coral, and teal without the clutter.",
    minimal: "Minimal",
    minimalD: "Black, white, and the facts of the day. Nothing else competing.",
    viewSample: "View sample",
    elegantWhen: "June 12, 2027",
    fiestaWhen: "August 21, 2027",
    minimalWhen: "March 20, 2027",
    garden: "Garden",
    gardenD: "Blush, leaf green, and a wedding that feels like a garden.",
    gardenWhen: "May 15, 2027",
    noche: "Noche",
    nocheD: "Black and gold for a birthday after dark.",
    nocheWhen: "November 6, 2027",
    confetti: "Confetti",
    confettiD: "Bright color for a kids' party or a baptism.",
    confettiWhen: "April 10, 2027",
    basic: "Basic",
    basicPrice: "$100",
    basicNote: "per event",
    basicPoints: ["Invitation page and host dashboard", "Any of the six templates", "English and Spanish", "Guest list upload and photos"],
    domain: "Custom domain",
    domainPrice: "+$25",
    domainNote: "per year",
    domainPoints: ["Your name in the address", "We buy the domain for a year", "Added to a Basic site"],
    custom: "Full custom",
    customPrice: "$250",
    customNote: "designed with you",
    customPoints: ["Everything in Basic", "A design made for your day", "We build it from your notes"],
    choose: "Choose this",
    pricing: "Simple pricing",
    exampleEyebrow: "A real example",
    exampleTitle: "Leah Adalynn Espinoza's Quinceañera",
    exampleBody: "This is the public invitation guests receive. The host dashboard, the guest list, and every RSVP stay private.",
    exampleOpen: "Open the live site",
    exampleMeta: "Friday, September 18, 2026 · Pacoima & Panorama City",
    faqTitle: "Questions",
    faqs: [
      { q: "Who is this for?", a: "Any host with a guest list: weddings, quinceañeras, birthdays, showers, anniversaries, graduations, and parties." },
      { q: "Do guests need an account?", a: "No. They search their name on your link and respond." },
      { q: "When does the site go public?", a: "After you pay, you preview it and publish when you're ready. Unpaid drafts stay private." },
      { q: "Can I use my own domain?", a: "Yes. The custom-domain add-on is $25 for a year. We register it and connect it by hand." },
    ],
    fine: "Unpaid events stay a private preview. A custom domain is requested at checkout and connected by hand.",
  },
  es: {
    start: "Crear mi sitio",
    eyebrow: "Sitios de confirmación para cualquier celebración",
    title: "Un sitio bilingüe que sus invitados sí pueden usar.",
    lede: "Elija una plantilla, suba la lista que ya tiene y comparta un enlace. Cada persona busca su nombre y responde. Usted lo ve en un tablero privado.",
    see: "Ver un ejemplo real",
    eventsTitle: "Para el día que usted organiza",
    events: ["Bodas", "Quinceañeras", "Cumpleaños", "Baby showers", "Aniversarios", "Graduaciones", "Fiestas"],
    how: "Cómo funciona",
    steps: [
      { n: "01", t: "Elija una plantilla", d: "Seis estilos, del tipo sereno al confeti. Las palabras y las fotos son suyas." },
      { n: "02", t: "Suba su lista", d: "La misma hoja que ya usa. Nombres, teléfonos y cuántos lugares." },
      { n: "03", t: "Comparta su enlace", d: "Los invitados buscan su nombre. Sin cuentas y sin instalar una app." },
      { n: "04", t: "Siga las confirmaciones", d: "Vea quién viene, quién falta, y cierre las respuestas cuando la fecha esté fija." },
    ],
    featuresTitle: "Lo que incluye",
    features: [
      { t: "Invitados bilingües", d: "Inglés y español en la misma invitación. Cambian de idioma con un toque." },
      { t: "Lista de invitados", d: "Importe un CSV. Familias, nombres extra y número de lugares vienen juntos." },
      { t: "Tablero en vivo", d: "Conteo, notas y quién no ha respondido, al día a medida que llegan las respuestas." },
      { t: "Cerrar confirmaciones", d: "Elija el último día. Después, el formulario se detiene y se muestra un aviso." },
      { t: "Dominio propio", d: "El nombre de su familia en la dirección. Lo registramos por un año y lo conectamos." },
    ],
    templates: "Seis plantillas",
    templatesLede: "Un punto de partida para cualquier celebración, no para un solo tipo de fiesta.",
    elegant: "Elegante",
    elegantD: "Tipografía serena, papel cálido y espacio para un nombre largo.",
    fiesta: "Fiesta",
    fiestaD: "Color en los bordes. Amarillo, coral y verde, sin recargar.",
    minimal: "Minimal",
    minimalD: "Negro, blanco y los datos del día. Nada más compitiendo.",
    viewSample: "Ver ejemplo",
    elegantWhen: "12 de junio de 2027",
    fiestaWhen: "21 de agosto de 2027",
    minimalWhen: "20 de marzo de 2027",
    garden: "Jardín",
    gardenD: "Rosa y verde hoja, para una boda o un shower.",
    gardenWhen: "15 de mayo de 2027",
    noche: "Noche",
    nocheD: "Negro y dorado para un cumpleaños de noche.",
    nocheWhen: "6 de noviembre de 2027",
    confetti: "Confetti",
    confettiD: "Color vivo para una fiesta infantil o un bautizo.",
    confettiWhen: "10 de abril de 2027",
    basic: "Básico",
    basicPrice: "$100",
    basicNote: "por evento",
    basicPoints: ["Invitación y tablero de anfitrión", "Cualquiera de las seis plantillas", "Inglés y español", "Lista de invitados y fotos"],
    domain: "Dominio propio",
    domainPrice: "+$25",
    domainNote: "por año",
    domainPoints: ["Su nombre en la dirección", "Compramos el dominio por un año", "Se agrega a un sitio Básico"],
    custom: "Diseño a medida",
    customPrice: "$250",
    customNote: "lo diseñamos con usted",
    customPoints: ["Todo lo del plan Básico", "Un diseño hecho para su día", "Lo armamos según sus notas"],
    choose: "Elegir",
    pricing: "Precios simples",
    exampleEyebrow: "Un ejemplo real",
    exampleTitle: "La quinceañera de Leah Adalynn Espinoza",
    exampleBody: "Esta es la invitación pública que reciben los invitados. El tablero, la lista y cada confirmación quedan en privado.",
    exampleOpen: "Abrir el sitio en vivo",
    exampleMeta: "Viernes, 18 de septiembre de 2026 · Pacoima y Panorama City",
    faqTitle: "Preguntas",
    faqs: [
      { q: "¿Para quién es?", a: "Para quien tenga una lista: bodas, quinceañeras, cumpleaños, baby showers, aniversarios, graduaciones y fiestas." },
      { q: "¿Los invitados necesitan una cuenta?", a: "No. Buscan su nombre en su enlace y responden." },
      { q: "¿Cuándo se publica el sitio?", a: "Después de pagar, usted lo previsualiza y lo publica cuando quiera. Los borradores sin pago quedan en privado." },
      { q: "¿Puedo usar mi propio dominio?", a: "Sí. El complemento cuesta $25 por un año. Lo registramos y lo conectamos a mano." },
    ],
    fine: "Un evento sin pagar queda como vista previa privada. El dominio se pide al pagar y se conecta a mano.",
  },
} as const;

export default function Landing() {
  const { language } = useLanguage();
  const t = copy[language];

  return (
    <BrandShell>
      <BrandHeader cta={t.start} />
      <main data-testid="page-landing">
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 sm:py-20 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0f766e]">{t.eyebrow}</p>
            <h1 className="brand-display mt-3 text-5xl leading-[1.05] text-[#142033] sm:text-6xl">{t.title}</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#526072]">{t.lede}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/start" className="brand-btn" data-testid="link-start-hero">
                {t.start}
              </Link>
              <a href="#example" className="brand-btn-ghost" data-testid="link-see-example">
                {t.see}
              </a>
            </div>
          </div>
          <div className="rounded-3xl border border-[#d7dee7] bg-white p-5 shadow-sm" aria-hidden="true">
            <div className="flex gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#e23d2b]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#e8a317]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#0f766e]" />
            </div>
            <p className="brand-display mt-6 text-3xl">Saturday, June 12</p>
            <p className="mt-1 text-sm text-[#526072]">Ceremony 4:00 · Dinner 6:30</p>
            <div className="mt-6 grid grid-cols-3 gap-2 text-center">
              {[
                ["128", language === "es" ? "invitados" : "invited"],
                ["86", language === "es" ? "confirmaron" : "yes"],
                ["19", language === "es" ? "pendientes" : "waiting"],
              ].map(([n, label]) => (
                <div key={label} className="rounded-2xl bg-[#f3f5f8] px-2 py-4">
                  <div className="brand-display text-2xl">{n}</div>
                  <div className="text-[11px] uppercase tracking-wide text-[#526072]">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-[#d7dee7] bg-white" data-testid="section-events">
          <div className="mx-auto max-w-6xl px-5 py-10">
            <h2 className="brand-display text-3xl">{t.eventsTitle}</h2>
            <ul className="mt-5 flex flex-wrap gap-2">
              {t.events.map((name) => (
                <li key={name} className="rounded-full border border-[#d7dee7] bg-[#f3f5f8] px-4 py-2 text-sm font-medium">
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-14" data-testid="section-how">
          <h2 className="brand-display text-4xl">{t.how}</h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.steps.map((s) => (
              <li key={s.n} className="rounded-2xl border border-[#d7dee7] bg-white p-5">
                <div className="text-xs font-semibold text-[#e23d2b]">{s.n}</div>
                <h3 className="mt-2 text-lg font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#526072]">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-[#142033] text-white" data-testid="section-features">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <h2 className="brand-display text-4xl">{t.featuresTitle}</h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {t.features.map((f) => (
                <li key={f.t} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="text-lg font-semibold">{f.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/75">{f.d}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-14" id="templates" data-testid="section-templates">
          <h2 className="brand-display text-4xl">{t.templates}</h2>
          <p className="mt-2 max-w-xl text-[#526072]">{t.templatesLede}</p>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <TemplatePreview
              href="/e/demo-elegant"
              testId="link-sample-elegant"
              name={t.elegant}
              body={t.elegantD}
              view={t.viewSample}
              sampleName="Sofia & Daniel"
              sampleWhen={t.elegantWhen}
              sampleClass="bg-[#f4efe6] text-[#1c1914]"
              bar="bg-[#9a7b4f]"
            />
            <TemplatePreview
              href="/e/demo-fiesta"
              testId="link-sample-fiesta"
              name={t.fiesta}
              body={t.fiestaD}
              view={t.viewSample}
              sampleName="Camila Ortiz"
              sampleWhen={t.fiestaWhen}
              sampleClass="bg-[#fff6ea] text-[#c2410c]"
              bar="bg-gradient-to-r from-[#e23d2b] via-[#f0b429] to-[#0f766e]"
            />
            <TemplatePreview
              href="/e/demo-minimal"
              testId="link-sample-minimal"
              name={t.minimal}
              body={t.minimalD}
              view={t.viewSample}
              sampleName="Elena Morales"
              sampleWhen={t.minimalWhen}
              sampleClass="bg-white text-[#111]"
              bar="bg-[#111]"
            />
            <TemplatePreview
              href="/e/demo-garden"
              testId="link-sample-garden"
              name={t.garden}
              body={t.gardenD}
              view={t.viewSample}
              sampleName="Maya & Andres"
              sampleWhen={t.gardenWhen}
              sampleClass="bg-[#f4f7f2] text-[#1f4d3a]"
              bar="bg-[#1f4d3a]"
            />
            <TemplatePreview
              href="/e/demo-noche"
              testId="link-sample-noche"
              name={t.noche}
              body={t.nocheD}
              view={t.viewSample}
              sampleName="Valentina Cruz"
              sampleWhen={t.nocheWhen}
              sampleClass="bg-[#14110e] text-[#f4efe4]"
              bar="bg-[#d4b483]"
            />
            <TemplatePreview
              href="/e/demo-confetti"
              testId="link-sample-confetti"
              name={t.confetti}
              body={t.confettiD}
              view={t.viewSample}
              sampleName="Leo Ramos"
              sampleWhen={t.confettiWhen}
              sampleClass="bg-[#fff8fb] text-[#ff5a7a]"
              bar="bg-gradient-to-r from-[#ff5a7a] via-[#ffd23f] to-[#3d7eff]"
            />
          </div>
        </section>

        <section id="pricing" className="border-y border-[#d7dee7] bg-white" data-testid="section-pricing">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <h2 className="brand-display text-4xl">{t.pricing}</h2>
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              <PriceCard name={t.basic} price={t.basicPrice} note={t.basicNote} points={t.basicPoints} href="/start?package=basic" cta={t.choose} featured />
              <PriceCard name={t.domain} price={t.domainPrice} note={t.domainNote} points={t.domainPoints} href="/start?package=basic&domain=1" cta={t.choose} />
              <PriceCard name={t.custom} price={t.customPrice} note={t.customNote} points={t.customPoints} href="/start?package=full_custom" cta={t.choose} />
            </div>
          </div>
        </section>

        <section id="example" className="mx-auto max-w-6xl px-5 py-14" data-testid="section-example">
          <div className="overflow-hidden rounded-3xl border border-[#d7dee7] bg-white sm:grid sm:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <a href={LEAH_LIVE} target="_blank" rel="noreferrer" data-testid="link-leah-live">
              <img
                src="/og-image.jpg"
                alt="Public invitation for Leah Adalynn Espinoza's Quinceañera"
                className="h-full max-h-[420px] w-full object-cover object-top sm:max-h-none"
              />
            </a>
            <div className="flex flex-col justify-center px-6 py-8 sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f766e]">{t.exampleEyebrow}</p>
              <h2 className="brand-display mt-3 text-4xl leading-tight">{t.exampleTitle}</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#526072]">{t.exampleBody}</p>
              <p className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-[#526072]">{t.exampleMeta}</p>
              <a
                href={LEAH_LIVE}
                target="_blank"
                rel="noreferrer"
                className="brand-btn mt-6 w-full sm:w-auto"
                data-testid="link-leah-live-cta"
              >
                {t.exampleOpen}
              </a>
            </div>
          </div>
        </section>

        <section className="border-t border-[#d7dee7] bg-white" data-testid="section-faq">
          <div className="mx-auto max-w-3xl px-5 py-14">
            <h2 className="brand-display text-4xl">{t.faqTitle}</h2>
            <div className="mt-6 divide-y divide-[#d7dee7] border-y border-[#d7dee7]">
              {t.faqs.map((item) => (
                <details key={item.q} className="group py-4">
                  <summary className="cursor-pointer list-none font-semibold">{item.q}</summary>
                  <p className="mt-2 text-sm leading-relaxed text-[#526072]">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-[#d7dee7] px-5 py-10 text-center">
        <p className="font-semibold">{BRAND_NAME}</p>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#526072]">{t.fine}</p>
        <Link href="/super" className="mt-4 inline-block text-xs text-[#526072] underline">
          Studio
        </Link>
      </footer>
    </BrandShell>
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
    <article className={`flex flex-col rounded-2xl border p-6 ${featured ? "border-[#142033] bg-[#142033] text-white" : "border-[#d7dee7] bg-[#f3f5f8]"}`}>
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] opacity-80">{name}</h3>
      <p className="brand-display mt-3 text-5xl">{price}</p>
      <p className="text-sm opacity-70">{note}</p>
      <ul className="mt-5 flex-1 space-y-2 text-sm leading-relaxed">
        {points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <Link href={href} className={`mt-6 ${featured ? "brand-btn" : "brand-btn-ghost"}`}>
        {cta}
      </Link>
    </article>
  );
}

function TemplatePreview({
  href,
  testId,
  name,
  body,
  view,
  sampleName,
  sampleWhen,
  sampleClass,
  bar,
}: {
  href: string;
  testId: string;
  name: string;
  body: string;
  view: string;
  sampleName: string;
  sampleWhen: string;
  sampleClass: string;
  bar: string;
}) {
  return (
    <Link href={href} className="overflow-hidden rounded-2xl border border-[#d7dee7] bg-white" data-testid={testId}>
      <div className={`px-5 py-8 ${sampleClass}`}>
        <div className={`mb-6 h-1.5 w-16 rounded-full ${bar}`} />
        <p className="brand-display text-3xl">{sampleName}</p>
        <p className="mt-1 text-sm opacity-70">{sampleWhen}</p>
      </div>
      <div className="px-5 py-4">
        <h3 className="font-semibold">{name}</h3>
        <p className="mt-1 text-sm leading-relaxed text-[#526072]">{body}</p>
        <p className="mt-3 text-sm font-semibold text-[#e23d2b]">{view}</p>
      </div>
    </Link>
  );
}
