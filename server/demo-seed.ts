import type { Storage } from "./storage";
import { describeDate } from "@shared/platform";

/**
 * Sample invitations for the marketing gallery.
 * Runs on a platform database only. Leah's legacy root is left untouched.
 * A second boot finds the slugs and does not insert another guest list.
 */

type Household = {
  firstName: string;
  lastName: string;
  invites: number;
  partyName?: string;
  additionalNames?: { firstName: string; lastName: string }[];
};

type DemoSpec = {
  id: string;
  slug: string;
  template: "elegant" | "fiesta" | "minimal";
  honoree: string;
  partnerName: string;
  eventKind: string;
  familyLine: string;
  title: string;
  dateIso: string;
  ceremonyLabel: string;
  ceremonyLabelEs: string;
  ceremonyTime: string;
  ceremonyVenue: string;
  ceremonyAddress: string;
  receptionTime: string;
  receptionVenue: string;
  receptionAddress: string;
  rsvpByLabel: string;
  rsvpByLabelEs: string;
  rsvpClosesOn: string;
  dressCode: string;
  dressCodeEs: string;
  giftText: string;
  giftTextEs: string;
  aboutText: string;
  aboutTextEs: string;
  hotels: { name: string; address: string; note: string }[];
  schedule: { time: string; title: string; titleEs: string; detail?: string }[];
  hero: string;
  detail: string;
  households: Household[];
};

const ELEGANT_GUESTS: Household[] = [
  { firstName: "Priya", lastName: "Marrow", invites: 2, partyName: "Priya & Jonah Marrow", additionalNames: [{ firstName: "Jonah", lastName: "Marrow" }] },
  { firstName: "Jonah", lastName: "Pell", invites: 1 },
  { firstName: "Amara", lastName: "Quill", invites: 3, partyName: "The Quill household", additionalNames: [{ firstName: "Leo", lastName: "Quill" }, { firstName: "Ada", lastName: "Quill" }] },
  { firstName: "Felix", lastName: "Bramble", invites: 2, additionalNames: [{ firstName: "Willa", lastName: "Bramble" }] },
  { firstName: "Nora", lastName: "Fenwick", invites: 1 },
  { firstName: "Hugo", lastName: "Langtree", invites: 4, partyName: "Langtree family", additionalNames: [{ firstName: "Edith", lastName: "Langtree" }, { firstName: "Pip", lastName: "Langtree" }, { firstName: "Nell", lastName: "Langtree" }] },
  { firstName: "Celeste", lastName: "Voss", invites: 2, additionalNames: [{ firstName: "Anton", lastName: "Voss" }] },
  { firstName: "Mateo", lastName: "Inkwood", invites: 1 },
  { firstName: "Imani", lastName: "Shore", invites: 2, additionalNames: [{ firstName: "Ruth", lastName: "Shore" }] },
  { firstName: "Oscar", lastName: "Penrose", invites: 2, partyName: "Penrose", additionalNames: [{ firstName: "Cora", lastName: "Penrose" }] },
];

const FIESTA_GUESTS: Household[] = [
  { firstName: "Luz", lastName: "Pembleton", invites: 4, partyName: "Pembleton family", additionalNames: [{ firstName: "Rico", lastName: "Pembleton" }, { firstName: "Sol", lastName: "Pembleton" }, { firstName: "Nia", lastName: "Pembleton" }] },
  { firstName: "Rafael", lastName: "Quill", invites: 2, additionalNames: [{ firstName: "Paz", lastName: "Quill" }] },
  { firstName: "Noemi", lastName: "Bramble", invites: 1 },
  { firstName: "Tomas", lastName: "Langtree", invites: 3, additionalNames: [{ firstName: "Vera", lastName: "Langtree" }, { firstName: "Teo", lastName: "Langtree" }] },
  { firstName: "Silvia", lastName: "Voss", invites: 2, additionalNames: [{ firstName: "Otto", lastName: "Voss" }] },
  { firstName: "Andres", lastName: "Fenwick", invites: 2, additionalNames: [{ firstName: "Lila", lastName: "Fenwick" }] },
  { firstName: "Paloma", lastName: "Inkwood", invites: 1 },
  { firstName: "Diego", lastName: "Marrow", invites: 5, partyName: "Marrow cousins", additionalNames: [{ firstName: "Ines", lastName: "Marrow" }, { firstName: "Bruno", lastName: "Marrow" }, { firstName: "Cleo", lastName: "Marrow" }, { firstName: "Yara", lastName: "Marrow" }] },
  { firstName: "Renata", lastName: "Shore", invites: 2, additionalNames: [{ firstName: "Nico", lastName: "Shore" }] },
  { firstName: "Emilio", lastName: "Pell", invites: 1 },
];

const MINIMAL_GUESTS: Household[] = [
  { firstName: "Helen", lastName: "Pembleton", invites: 2, additionalNames: [{ firstName: "Mark", lastName: "Pembleton" }] },
  { firstName: "Chris", lastName: "Quill", invites: 1 },
  { firstName: "Nadia", lastName: "Bramble", invites: 2, additionalNames: [{ firstName: "Eli", lastName: "Bramble" }] },
  { firstName: "Owen", lastName: "Langtree", invites: 1 },
  { firstName: "Rosa", lastName: "Voss", invites: 3, partyName: "Voss", additionalNames: [{ firstName: "Paul", lastName: "Voss" }, { firstName: "June", lastName: "Voss" }] },
  { firstName: "Simon", lastName: "Fenwick", invites: 2, additionalNames: [{ firstName: "Anya", lastName: "Fenwick" }] },
  { firstName: "Amina", lastName: "Inkwood", invites: 1 },
  { firstName: "Peter", lastName: "Marrow", invites: 2, additionalNames: [{ firstName: "Gail", lastName: "Marrow" }] },
  { firstName: "Lucia", lastName: "Shore", invites: 1 },
  { firstName: "Graham", lastName: "Penrose", invites: 2, partyName: "Penrose", additionalNames: [{ firstName: "Ivy", lastName: "Penrose" }] },
];

const DEMOS: DemoSpec[] = [
  {
    id: "demo-elegant",
    slug: "demo-elegant",
    template: "elegant",
    honoree: "Sofia Reyes",
    partnerName: "Daniel Navarro",
    eventKind: "wedding",
    familyLine: "Reyes & Navarro",
    title: "Wedding",
    dateIso: "2027-06-12",
    ceremonyLabel: "Ceremony",
    ceremonyLabelEs: "Ceremonia",
    ceremonyTime: "4:00 PM",
    ceremonyVenue: "St. Brigid Chapel",
    ceremonyAddress: "18 Sample Lane, Pasadena",
    receptionTime: "6:00 PM",
    receptionVenue: "The Orchard House",
    receptionAddress: "90 Sample Court, Pasadena",
    rsvpByLabel: "May 12, 2027",
    rsvpByLabelEs: "12 de mayo de 2027",
    rsvpClosesOn: "2027-05-12",
    dressCode: "Black tie optional. Soft garden colors are welcome.",
    dressCodeEs: "Etiqueta opcional. Se agradecen los colores suaves de jardín.",
    giftText: "Your company is the gift. A card is more than enough.",
    giftTextEs: "Su compañía es el regalo. Una tarjeta es más que suficiente.",
    aboutText:
      "Sofia and Daniel met on a Sunday at the Highland Park market and have cooked for each other ever since. The afternoon starts at the chapel and ends with dinner under the trees.",
    aboutTextEs:
      "Sofia y Daniel se conocieron un domingo en el mercado de Highland Park y desde entonces cocinan juntos. La tarde empieza en la capilla y termina con la cena bajo los árboles.",
    hotels: [
      { name: "The Lantern Inn", address: "210 Sample Street, Pasadena", note: "A short walk to the chapel. Mention Reyes Navarro." },
    ],
    schedule: [
      { time: "3:30 PM", title: "Guests arrive", titleEs: "Llegan los invitados", detail: "St. Brigid Chapel" },
      { time: "4:00 PM", title: "Ceremony", titleEs: "Ceremonia" },
      { time: "5:00 PM", title: "Garden cocktails", titleEs: "Cóctel en el jardín", detail: "The Orchard House" },
      { time: "6:00 PM", title: "Dinner and dancing", titleEs: "Cena y baile" },
    ],
    hero: "/demos/elegant-hero.svg",
    detail: "/demos/elegant-table.svg",
    households: ELEGANT_GUESTS,
  },
  {
    id: "demo-fiesta",
    slug: "demo-fiesta",
    template: "fiesta",
    honoree: "Camila Ortiz",
    partnerName: "",
    eventKind: "quinceanera",
    familyLine: "Ortiz",
    title: "Quinceañera",
    dateIso: "2027-08-21",
    ceremonyLabel: "Mass",
    ceremonyLabelEs: "Misa",
    ceremonyTime: "3:00 PM",
    ceremonyVenue: "Chapel of the Paper Flowers",
    ceremonyAddress: "800 Sample Lane, Glendale",
    receptionTime: "5:30 PM",
    receptionVenue: "Salón Marigold",
    receptionAddress: "44 Sample Court, Glendale",
    rsvpByLabel: "July 21, 2027",
    rsvpByLabelEs: "21 de julio de 2027",
    rsvpClosesOn: "2027-07-21",
    dressCode: "Cocktail. Coral, gold, and teal are welcome.",
    dressCodeEs: "Cóctel. Coral, dorado y verde azulado son bienvenidos.",
    giftText: "Camila is collecting recipes and songs from the people who raised her. A note in the book at the door is the gift she wants.",
    giftTextEs: "Camila está juntando recetas y canciones de quienes la criaron. Una nota en el libro de la entrada es el regalo que quiere.",
    aboutText:
      "Camila Ortiz turns fifteen with mass, a waltz, and a long table at Salón Marigold. Come ready to dance. The court is made of cousins, and the cake is mango.",
    aboutTextEs:
      "Camila Ortiz cumple quince años con misa, un vals y una mesa larga en el Salón Marigold. Venga listo para bailar. La corte la forman sus primos y el pastel es de mango.",
    hotels: [
      { name: "Hotel Paperflower", address: "12 Sample Street, Glendale", note: "Ask for the Ortiz block. Fictional, for this sample." },
    ],
    schedule: [
      { time: "2:30 PM", title: "Guests seated", titleEs: "Se sientan los invitados", detail: "Chapel of the Paper Flowers" },
      { time: "3:00 PM", title: "Mass", titleEs: "Misa" },
      { time: "5:30 PM", title: "Reception doors open", titleEs: "Abre la recepción", detail: "Salón Marigold" },
      { time: "6:30 PM", title: "Waltz and dinner", titleEs: "Vals y cena" },
      { time: "8:00 PM", title: "Dance", titleEs: "Baile" },
    ],
    hero: "/demos/fiesta-hero.svg",
    detail: "/demos/fiesta-flower.svg",
    households: FIESTA_GUESTS,
  },
  {
    id: "demo-minimal",
    slug: "demo-minimal",
    template: "minimal",
    honoree: "Elena Morales",
    partnerName: "",
    eventKind: "babyshower",
    familyLine: "Morales",
    title: "Baby shower",
    dateIso: "2027-03-20",
    ceremonyLabel: "Welcome",
    ceremonyLabelEs: "Bienvenida",
    ceremonyTime: "11:00 AM",
    ceremonyVenue: "The North Room",
    ceremonyAddress: "15 Sample Street, Eagle Rock",
    receptionTime: "12:30 PM",
    receptionVenue: "Lunch in the same room",
    receptionAddress: "15 Sample Street, Eagle Rock",
    rsvpByLabel: "March 6, 2027",
    rsvpByLabelEs: "6 de marzo de 2027",
    rsvpClosesOn: "2027-03-06",
    dressCode: "Comfortable. A light layer is enough.",
    dressCodeEs: "Cómodo. Basta una capa ligera.",
    giftText: "Elena has what she needs. If you want to bring something, a children's book with your name inside is welcome.",
    giftTextEs: "Elena tiene lo que necesita. Si desea traer algo, un libro infantil con su nombre adentro es bienvenido.",
    aboutText:
      "A morning for Elena before the baby arrives. Coffee at eleven, lunch at half past twelve, and no games that require a prize.",
    aboutTextEs:
      "Una mañana para Elena antes de que llegue el bebé. Café a las once, almuerzo a las doce y media, y ningún juego que pida un premio.",
    hotels: [],
    schedule: [
      { time: "11:00 AM", title: "Coffee and hello", titleEs: "Café y saludo", detail: "The North Room" },
      { time: "12:00 PM", title: "A short toast", titleEs: "Un brindis breve" },
      { time: "12:30 PM", title: "Lunch", titleEs: "Almuerzo" },
    ],
    hero: "/demos/minimal-hero.svg",
    detail: "/demos/minimal-arch.svg",
    households: MINIMAL_GUESTS,
  },
];

export function seedDemoEvents(store: Storage) {
  try {
    if (store.getLegacyEvent()) return;
    for (const spec of DEMOS) ensureDemo(store, spec);
  } catch (err: any) {
    console.warn("[db] demo seed skipped:", err?.message || err);
  }
}

function ensureDemo(store: Storage, spec: DemoSpec) {
  let event = store.getEventBySlug(spec.slug);
  if (!event) {
    const dated = describeDate(spec.dateIso);
    if (!dated) throw new Error(`Bad demo date ${spec.dateIso}`);
    const now = Date.now();
    event = store.createEvent({
      id: spec.id,
      slug: spec.slug,
      isLegacyRoot: 0,
      isDemo: 1,
      status: "active",
      package: "basic",
      template: spec.template,
      paid: 1,
      honoree: spec.honoree,
      partnerName: spec.partnerName,
      eventKind: spec.eventKind,
      familyLine: spec.familyLine,
      title: spec.title,
      dateIso: spec.dateIso,
      dateLong: dated.dateLong,
      dateLongEs: dated.dateLongEs,
      dayName: dated.dayName,
      dayNameEs: dated.dayNameEs,
      day: dated.day,
      year: dated.year,
      ceremonyLabel: spec.ceremonyLabel,
      ceremonyLabelEs: spec.ceremonyLabelEs,
      ceremonyTime: spec.ceremonyTime,
      ceremonyVenue: spec.ceremonyVenue,
      ceremonyAddress: spec.ceremonyAddress,
      receptionTime: spec.receptionTime,
      receptionVenue: spec.receptionVenue,
      receptionAddress: spec.receptionAddress,
      rsvpByLabel: spec.rsvpByLabel,
      rsvpByLabelEs: spec.rsvpByLabelEs,
      rsvpClosesOn: spec.rsvpClosesOn,
      photoUploadUrl: "",
      dressCode: spec.dressCode,
      dressCodeEs: spec.dressCodeEs,
      giftText: spec.giftText,
      giftTextEs: spec.giftTextEs,
      aboutText: spec.aboutText,
      aboutTextEs: spec.aboutTextEs,
      hotelsJson: JSON.stringify(spec.hotels),
      scheduleJson: JSON.stringify(spec.schedule),
      photosJson: JSON.stringify([
        { id: `${spec.slug}-hero`, filename: spec.hero, caption: spec.title },
        { id: `${spec.slug}-detail`, filename: spec.detail, caption: spec.honoree },
      ]),
      hostnames: "",
      desiredDomain: "",
      customDomain: 0,
      customNotes: "",
      smtpUser: "",
      smtpPass: "",
      notifyEmail: "",
      stripeSessionId: null,
      amountCents: 0,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`[db] seeded sample event ${spec.slug}`);
  }
  if (store.allGuests(event.id).length > 0) return;
  spec.households.forEach((guest, index) => {
    const n = String(index + 1).padStart(2, "0");
    store.createGuest({
      id: `${spec.slug}-guest-${n}`,
      eventId: event!.id,
      firstName: guest.firstName,
      lastName: guest.lastName,
      partyName: guest.partyName || "",
      phone: `555010${n}`,
      email: `${guest.firstName}.${guest.lastName}@example.com`.toLowerCase(),
      invites: guest.invites,
      additionalNames: guest.additionalNames || [],
      language: index % 2 === 0 ? "English" : "Spanish",
    });
  });
}
