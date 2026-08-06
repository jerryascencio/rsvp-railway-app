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
    allResponded: {
      en: "Everyone in these results has already responded.",
      es: "Todos en estos resultados ya han respondido.",
    },
    changeReservationPrompt: {
      en: "Looking to make a change to your reservation?",
      es: "\u00bfDesea cambiar su reservaci\u00f3n?",
    },
    changeReservationCta: {
      en: "Click here to see who\u2019s already responded.",
      es: "Toque aqu\u00ed para ver qui\u00e9nes ya respondieron.",
    },
    changeReservationHide: {
      en: "Hide already-responded guests",
      es: "Ocultar invitados que ya respondieron",
    },
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
  placeCards: {
    heading: {
      en: "Help us with your place cards (optional)",
      es: "Ay\u00fadenos con sus tarjetas de mesa (opcional)",
    },
    sub: {
      en: "Confirm or update how each attendee's name should appear on their place card.",
      es: "Confirme o actualice c\u00f3mo debe aparecer el nombre de cada asistente en su tarjeta de mesa.",
    },
    seatLabel: { en: "Seat {n} name", es: "Nombre del asiento {n}" },
    placeholder: { en: "Guest {n} full name", es: "Invitado {n} nombre completo" },
    hint: {
      en: "Leave any name blank to skip; we'll use what we have on file.",
      es: "Deje cualquier nombre en blanco para omitirlo; usaremos lo que tenemos.",
    },
  },
  addNames: {
    heading: {
      en: "Add your party's names (optional)",
      es: "Agregue los nombres de su grupo (opcional)",
    },
    sub: {
      en: "Fill in as many as you can \u2014 you'll then mark each person as attending or not attending. Skip to use a simple count instead.",
      es: "Complete los que pueda \u2014 luego marcar\u00e1 a cada persona como asistir\u00e1 o no asistir\u00e1. Om\u00edtalos para usar solo un conteo.",
    },
    placeholder: { en: "Guest {n} full name", es: "Invitado {n} nombre completo" },
  },
  guestList: {
    heading: {
      en: "Who from your party can join us?",
      es: "¿Quiénes de su grupo nos acompañarán?",
    },
    sub: {
      en: "Please mark each person as attending or not attending.",
      es: "Por favor marque a cada persona como asistir\u00e1 o no asistir\u00e1.",
    },
    attending: { en: "Attending", es: "Asistir\u00e1" },
    notAttending: { en: "Not attending", es: "No asistir\u00e1" },
    unanswered: {
      en: "Please mark everyone in your party.",
      es: "Por favor marque a todos los miembros de su grupo.",
    },
    summary: {
      en: "{a} attending, {d} not attending.",
      es: "{a} asistir\u00e1n, {d} no asistir\u00e1n.",
    },
  },
  partyMember: {
    // e.g. "Stefanie — part of Gerardo Ascencio Jr's party"
    template: {
      en: "{name} — part of {primary}'s party",
      es: "{name} — parte del grupo de {primary}",
    },
  },
  padrinos: {
    eyebrow: { en: "WITH GRATITUDE", es: "CON GRATITUD" },
    heading: { en: "Padrinos & Madrinas", es: "Padrinos y Madrinas" },
    sub: {
      en: "With heartfelt thanks to our godparents",
      es: "Con gratitud a nuestros padrinos y madrinas",
    },
    honorLabel: { en: "Padrinos de Honor", es: "Padrinos de Honor" },
    ramoLabel: { en: "Padrinos de Ramo", es: "Padrinos de Ramo" },
    bibliaLabel: { en: "Padrinos de Biblia y Rosario", es: "Padrinos de Biblia y Rosario" },
    medallaLabel: { en: "Padrinos de Medalla", es: "Padrinos de Medalla" },
    anilloLabel: { en: "Padrinos de Anillo", es: "Padrinos de Anillo" },
    coronacionLabel: { en: "Coronación", es: "Coronación" },
    zapatosLabel: { en: "Change of Shoes", es: "Cambio de Zapatos" },
    regaloLabel: { en: "Regalo Sorpresa", es: "Regalo Sorpresa" },
    recuerdosLabel: { en: "Padrinos de Recuerdos", es: "Padrinos de Recuerdos" },
  },
  court: {
    eyebrow: { en: "BY HER SIDE", es: "A SU LADO" },
    heading: { en: "Quince Court of Honor", es: "Corte de Honor" },
    sub: {
      en: "The dear friends and family accompanying Leah",
      es: "Los queridos amigos y familiares que acompañan a Leah",
    },
    mainChambelanLabel: { en: "Chambelán de Honor", es: "Chambelán de Honor" },
    couplesLabel: { en: "Damas & Chambelanes", es: "Damas y Chambelanes" },
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
