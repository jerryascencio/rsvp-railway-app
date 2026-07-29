import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type Lang = "en" | "es";

type Entry = { en: string; es: string };

/**
 * All public-page copy. Admin pages stay English-only and never call t().
 * NOTE: no localStorage — sandboxed iframes block it and this is a public page.
 */
export const translations = {
  toggle: {
    aria: { en: "Switch language", es: "Cambiar idioma" },
  },
  hero: {
    invited: { en: "You are cordially invited", es: "Están cordialmente invitados" },
    line1: { en: "to celebrate with the", es: "a celebrar con la" },
    line2: { en: "Espinoza De Anda Family at the", es: "Familia Espinoza De Anda en la" },
    title: { en: "Quinceañera", es: "Quinceañera" },
    of: { en: "of", es: "de" },
    rsvpBy: { en: "RSVP by", es: "Confirme antes del" },
    rsvpByDate: { en: "August 18th, 2026", es: "18 de agosto de 2026" },
    dayName: { en: "FRIDAY, SEP", es: "VIERNES, SEP" },
  },
  countdown: {
    days: { en: "DAYS", es: "DÍAS" },
    hours: { en: "HOURS", es: "HORAS" },
    mins: { en: "MINS", es: "MIN" },
    secs: { en: "SECS", es: "SEG" },
    today: { en: "Today's the day!", es: "¡Hoy es el día!" },
    aria: { en: "Countdown to the celebration", es: "Cuenta regresiva para la celebración" },
  },
  details: {
    mass: { en: "Mass", es: "Misa" },
    reception: { en: "Reception", es: "Recepción" },
    massVenue: { en: "Guardian Angel Church", es: "Iglesia Guardian Angel" },
    receptionVenue: { en: "Platinum Banquet Hall", es: "Platinum Banquet Hall" },
    dateLong: { en: "Friday, September 18, 2026", es: "Viernes, 18 de septiembre de 2026" },
  },
  search: {
    eyebrow: { en: "Kindly Respond", es: "Favor de Responder" },
    heading: { en: "Find your invitation", es: "Encuentre su invitación" },
    srLabel: { en: "Search for your invitation", es: "Buscar su invitación" },
    placeholder: {
      en: "Enter your name, phone, or email to find your invitation",
      es: "Escriba su nombre, teléfono o correo para encontrar su invitación",
    },
    hint: {
      en: "Try your first name, last name, phone number, or email — the name of anyone in your party works.",
      es: "Pruebe con su nombre, apellido, número de teléfono o correo electrónico — funciona el nombre de cualquier persona de su grupo.",
    },
    button: { en: "Find my invitation", es: "Buscar mi invitación" },
    noMatches: {
      en: "We couldn’t find you in the guest list. Please double-check your spelling, or contact the family.",
      es: "No pudimos encontrarlo en la lista de invitados. Por favor revise la ortografía o comuníquese con la familia.",
    },
    which: { en: "Which one are you?", es: "¿Cuál de estos es usted?" },
    confirmYou: { en: "Is this you?", es: "¿Es usted?" },
    yesItsMe: { en: "Yes, that's me", es: "Sí, soy yo" },
    noSearchAgain: { en: "No, search again", es: "No, buscar de nuevo" },
    partyOf: { en: "Party of", es: "Grupo de" },
    alreadyResponded: { en: " · already responded", es: " · ya respondió" },
    genericError: {
      en: "Something went wrong. Please try again.",
      es: "Algo salió mal. Por favor intente de nuevo.",
    },
  },
  household: {
    theParty: { en: "The {lastname} party", es: "La familia {lastname}" },
    possessiveParty: { en: "{name}'s party", es: "La familia de {name}" },
    partyOf: { en: "party of {n}", es: "grupo de {n}" },
    andOthers: { en: "and {n} others", es: "y {n} más" },
  },
  rsvp: {
    hi: { en: "Hi", es: "¡Hola" },
    invitedAs: { en: "You’ve been invited as a", es: "Está invitado como" },
    partyOf: { en: "party of", es: "grupo de" },
    person: { en: "person", es: "persona" },
    people: { en: "people", es: "personas" },
    respondedBefore: {
      en: "You’ve responded before — submitting again will update your RSVP.",
      es: "Ya respondió antes — al enviar de nuevo se actualizará su confirmación.",
    },
    attendingLabel: { en: "How many will be attending?", es: "¿Cuántos asistirán?" },
    declinedLabel: { en: "How many will NOT be attending?", es: "¿Cuántos NO asistirán?" },
    sumWarning: { en: "These should add up to", es: "La suma debe ser" },
    increase: { en: "Increase", es: "Aumentar" },
    decrease: { en: "Decrease", es: "Disminuir" },
    emailLabel: { en: "Email for confirmation", es: "Correo para la confirmación" },
    optional: { en: "(optional)", es: "(opcional)" },
    emailPlaceholder: { en: "you@example.com", es: "usted@ejemplo.com" },
    noteLabel: { en: "A note for the family", es: "Un mensaje para la familia" },
    notePlaceholder: {
      en: "Dietary needs, well wishes, anything at all",
      es: "Necesidades alimenticias, buenos deseos, lo que guste",
    },
    submit: { en: "Send my RSVP", es: "Enviar mi confirmación" },
    respondBy: { en: "Please respond by", es: "Por favor responda antes del" },
    submitError: {
      en: "We couldn’t save your RSVP. Please try again.",
      es: "No pudimos guardar su confirmación. Por favor intente de nuevo.",
    },
  },
  confirm: {
    thankYou: { en: "Thank you", es: "Gracias" },
    coming: { en: "We can’t wait to celebrate with you,", es: "No podemos esperar para celebrar con usted," },
    notComing: {
      en: "We’ll miss you, {name} — thank you for letting us know.",
      es: "Lo extrañaremos, {name} — gracias por avisarnos.",
    },
    yourResponse: { en: "Your response", es: "Su respuesta" },
    bringing: { en: "You’re bringing", es: "Usted trae a" },
    noneAttending: {
      en: "No one from your party will be attending.",
      es: "Nadie de su grupo podrá asistir.",
    },
    seat: { en: "seat", es: "lugar" },
    seats: { en: "seats", es: "lugares" },
    markedNotAttending: { en: "marked not attending.", es: "marcados como no asistentes." },
    emailOnWay: {
      en: "A confirmation email is on its way.",
      es: "Un correo de confirmación está en camino.",
    },
    updateRsvp: {
      en: "Made a mistake? Update your RSVP",
      es: "¿Se equivocó? Actualice su confirmación",
    },
  },
  about: {
    eyebrow: { en: "WITH LOVE", es: "CON AMOR" },
    heading: { en: "A Celebration of Grace & Joy", es: "Una Celebración de Gracia y Alegría" },
    body: {
      en: "The Espinoza De Anda Family joyfully invites you to celebrate Leah's fifteenth birthday. Join us as we give thanks for the beautiful young woman she has become and gather for an unforgettable evening filled with love, laughter, faith, and cherished traditions.",
      es: "La Familia Espinoza De Anda los invita con alegría a celebrar los quince años de Leah. Acompáñenos a dar gracias por la hermosa joven que se ha convertido y a reunirnos para una velada inolvidable llena de amor, risas, fe y tradiciones queridas.",
    },
  },
  schedule: {
    eyebrow: { en: "THE CELEBRATION", es: "LA CELEBRACIÓN" },
    heading: { en: "Schedule of Events", es: "Cronograma del Día" },
    massTitle: { en: "Quinceañera Celebration Mass", es: "Misa de Quinceañera" },
    massPlace: {
      en: "Guardian Angel Catholic Church, 12307 Terra Bella St, Pacoima, CA 91331",
      es: "Guardian Angel Catholic Church, 12307 Terra Bella St, Pacoima, CA 91331",
    },
    receptionTitle: { en: "Reception & Dinner", es: "Recepción y Cena" },
    receptionPlace: {
      en: "Platinum Banquet Hall, 8704 Van Nuys Blvd, Panorama City, CA 91402",
      es: "Platinum Banquet Hall, 8704 Van Nuys Blvd, Panorama City, CA 91402",
    },
    valsTitle: { en: "Vals, Toast & Traditions", es: "Vals, Brindis y Tradiciones" },
    valsBody: {
      en: "A special moment honoring Leah and the love of family and friends.",
      es: "Un momento especial en honor a Leah y al amor de familia y amigos.",
    },
    danceTitle: { en: "Dancing & Celebration", es: "Baile y Celebración" },
    danceBody: {
      en: "Dance the night away as we celebrate this beautiful milestone.",
      es: "Baila toda la noche mientras celebramos este hermoso momento.",
    },
  },
  venues: {
    eyebrow: { en: "GATHERING PLACES", es: "LUGARES DE ENCUENTRO" },
    heading: { en: "Mass & Reception", es: "Misa y Recepción" },
    massLabel: { en: "QUINCEAÑERA CELEBRATION MASS", es: "MISA DE QUINCEAÑERA" },
    receptionLabel: { en: "RECEPTION & DINNER", es: "RECEPCIÓN Y CENA" },
    churchParking: {
      en: "Street parking and parking lot are available.",
      es: "Hay estacionamiento en la calle y estacionamiento disponible.",
    },
    hallParking: {
      en: "Complimentary on-site parking is available for our guests.",
      es: "Estacionamiento gratuito disponible en el lugar para nuestros invitados.",
    },
    viewOnMap: { en: "View on map →", es: "Ver en el mapa →" },
  },
  hotels: {
    eyebrow: { en: "STAY NEARBY", es: "HOSPEDAJE CERCANO" },
    heading: { en: "Travel & Hotels", es: "Viaje y Hoteles" },
    sub: {
      en: "For guests coming from out of town",
      es: "Para huéspedes que vienen de fuera de la ciudad",
    },
    distancePrefix: { en: "Approx.", es: "Aprox." },
    distanceSuffix: { en: "miles from venue", es: "millas del lugar" },
    book: { en: "BOOK", es: "RESERVAR" },
    confirmAvailability: {
      en: "Please confirm current availability",
      es: "Por favor confirme la disponibilidad actual",
    },
    hamptonArea: { en: "Panorama City area, California", es: "Zona de Panorama City, California" },
  },
  dress: {
    eyebrow: { en: "ATTIRE", es: "VESTIMENTA" },
    heading: { en: "Dress Code", es: "Código de Vestimenta" },
    body: {
      en: "Formal / Semi-formal attire. We kindly ask our guests to celebrate with us in their finest.",
      es: "Vestimenta formal / semiformal. Les pedimos amablemente que nos acompañen en su mejor atuendo.",
    },
  },
  footer: {
    love: { en: "With love, the Espinoza De Anda Family", es: "Con cariño, la Familia Espinoza De Anda" },
    hostLogin: { en: "Host Login", es: "Acceso Anfitrión" },
  },
} as const;

function lookup(key: string): Entry | null {
  const parts = key.split(".");
  let node: any = translations;
  for (const p of parts) {
    if (node == null || typeof node !== "object") return null;
    node = node[p];
  }
  if (node && typeof node === "object" && "en" in node && "es" in node) return node as Entry;
  return null;
}

/** Replace {placeholders} with the supplied values. */
function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    vars[name] === undefined ? match : String(vars[name]),
  );
}

type Vars = Record<string, string | number>;

type Ctx = {
  language: Lang;
  setLanguage: (l: Lang) => void;
  toggleLanguage: () => void;
  t: (key: string, vars?: Vars) => string;
};

const LanguageContext = createContext<Ctx>({
  language: "en",
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (k, vars) => interpolate(lookup(k)?.en ?? k, vars),
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Lang>("en");

  const t = useCallback(
    (key: string, vars?: Vars) => {
      const entry = lookup(key);
      if (!entry) return key;
      return interpolate(entry[language], vars);
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage: () => setLanguage((l) => (l === "en" ? "es" : "en")),
      t,
    }),
    [language, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
