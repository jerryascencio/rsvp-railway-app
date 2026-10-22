/** Bilingual sample invitations. Venues are public parks and recreation centers in the San Fernando Valley, not private homes. */

export type Household = {
  firstName: string;
  lastName: string;
  invites: number;
  partyName?: string;
  additionalNames?: { firstName: string; lastName: string }[];
};

export type DemoSpec = {
  id: string;
  slug: string;
  template: "elegant" | "fiesta" | "minimal" | "garden" | "noche" | "confetti";
  honoree: string;
  partnerName: string;
  eventKind: string;
  familyLine: string;
  familyLineEs: string;
  title: string;
  dateIso: string;
  ceremonyLabel: string;
  ceremonyLabelEs: string;
  ceremonyTime: string;
  ceremonyVenue: string;
  ceremonyAddress: string;
  ceremonyMapUrl: string;
  receptionTime: string;
  receptionVenue: string;
  receptionAddress: string;
  receptionMapUrl: string;
  rsvpByLabel: string;
  rsvpByLabelEs: string;
  rsvpClosesOn: string;
  dressCode: string;
  dressCodeEs: string;
  giftText: string;
  giftTextEs: string;
  aboutText: string;
  aboutTextEs: string;
  parkingText: string;
  parkingTextEs: string;
  hostNote: string;
  hostNoteEs: string;
  contactEmail: string;
  contactPhone: string;
  contactNote: string;
  contactNoteEs: string;
  mealPrompt: string;
  mealPromptEs: string;
  hotels: { name: string; address: string; note: string; noteEs: string }[];
  schedule: { time: string; title: string; titleEs: string; detail?: string; detailEs?: string }[];
  faqs: { q: string; a: string; qEs: string; aEs: string }[];
  party: { role: string; roleEs: string; name: string }[];
  photos: { id: string; filename: string; caption: string; captionEs: string }[];
  households: Household[];
};

function mapLink(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function homes(rows: [string, string, number][]): Household[] {
  return rows.map(([firstName, lastName, invites]) => ({ firstName, lastName, invites }));
}

const sharedFaqTail = {
  plusEn: "The invitation is for the seats on your card. Please ask the hosts before adding someone.",
  plusEs: "La invitación es para los lugares de su tarjeta. Pregunte a los anfitriones antes de agregar a alguien.",
};

export const DEMOS: DemoSpec[] = [
  {
    id: "demo-elegant",
    slug: "demo-elegant",
    template: "elegant",
    honoree: "Sofia Reyes",
    partnerName: "Daniel Navarro",
    eventKind: "wedding",
    familyLine: "The Reyes and Navarro families",
    familyLineEs: "Las familias Reyes y Navarro",
    title: "Wedding",
    dateIso: "2027-06-12",
    ceremonyLabel: "Ceremony",
    ceremonyLabelEs: "Ceremonia",
    ceremonyTime: "4:00 PM",
    ceremonyVenue: "Chapel Lawn at Brand Park",
    ceremonyAddress: "15174 San Fernando Mission Blvd, Mission Hills, CA 91345",
    ceremonyMapUrl: mapLink("Brand Park Mission Hills CA"),
    receptionTime: "6:15 PM",
    receptionVenue: "The Orchard Lawn at Orcutt Ranch",
    receptionAddress: "23600 Roscoe Blvd, West Hills, CA 91304",
    receptionMapUrl: mapLink("Orcutt Ranch Horticultural Center West Hills CA"),
    rsvpByLabel: "May 12, 2027",
    rsvpByLabelEs: "12 de mayo de 2027",
    rsvpClosesOn: "2027-05-12",
    dressCode: "Black tie optional. Soft garden colors are welcome. The lawn is grass, so skip very thin heels.",
    dressCodeEs: "Etiqueta opcional. Se agradecen los colores suaves de jardín. El piso es pasto, así que evite tacones muy delgados.",
    giftText: "Your company is the gift. If you would like to give something, a card or a contribution toward their first kitchen is welcome. No registry is held for this sample.",
    giftTextEs: "Su compañía es el regalo. Si desea obsequiar algo, una tarjeta o una aportación para su primera cocina es bienvenida. Esta muestra no tiene mesa de regalos.",
    aboutText:
      "Sofia Reyes and Daniel Navarro met on a Sunday at the market and have cooked for each other ever since. They will marry on the lawn at Brand Park, then have dinner under the trees at Orcutt Ranch. Come for the vows, stay for the first dance, and expect a long table rather than a ballroom.",
    aboutTextEs:
      "Sofia Reyes y Daniel Navarro se conocieron un domingo en el mercado y desde entonces cocinan juntos. Se casarán en el prado de Brand Park y cenarán bajo los árboles en Orcutt Ranch. Venga a las promesas, quédese para el primer baile y espere una mesa larga, no un salón de hotel.",
    parkingText:
      "Brand Park has a public lot off San Fernando Mission Boulevard. Leave that lot by 5:15 and use the Orcutt Ranch visitor lot on Roscoe Boulevard for dinner. Both are public parks. Street parking on nearby residential blocks is not part of the plan.",
    parkingTextEs:
      "Brand Park tiene un estacionamiento público sobre San Fernando Mission Boulevard. Salga de ahí a las 5:15 y use el estacionamiento de visitantes de Orcutt Ranch, sobre Roscoe Boulevard, para la cena. Los dos son parques públicos. No contamos con estacionamiento en las casas vecinas.",
    hostNote:
      "Inés and Raúl Reyes, with Carmen and Luis Navarro, are hosting the day. They will greet guests at the chapel lawn and again before dinner.",
    hostNoteEs:
      "Inés y Raúl Reyes, junto con Carmen y Luis Navarro, son los anfitriones. Recibirán a los invitados en el prado de la ceremonia y otra vez antes de la cena.",
    contactEmail: "sofia.and.daniel@example.com",
    contactPhone: "(818) 555-0142",
    contactNote: "Questions about seats, the meal, or a ride go to the sample inbox. Nothing here reaches a real family.",
    contactNoteEs: "Las preguntas sobre lugares, la comida o un aventón van al correo de muestra. Nada de esto llega a una familia real.",
    mealPrompt: "Dinner is chicken, roasted fish, or a vegetarian plate. Which would you like?",
    mealPromptEs: "La cena es pollo, pescado al horno o un plato vegetariano. ¿Cuál prefiere?",
    hotels: [
      {
        name: "Sample stay near Mission Hills",
        address: "Mission Hills, CA 91345",
        note: "No room block is held. This name is fictional. Guests in the sample usually look near Brand Park.",
        noteEs: "No hay un bloque de habitaciones. Este nombre es ficticio. En la muestra, los invitados suelen buscar cerca de Brand Park.",
      },
    ],
    schedule: [
      { time: "3:30 PM", title: "Guests seated", titleEs: "Se sientan los invitados", detail: "Chapel Lawn, Brand Park", detailEs: "Chapel Lawn, Brand Park" },
      { time: "4:00 PM", title: "Ceremony", titleEs: "Ceremonia" },
      { time: "4:45 PM", title: "Family portraits", titleEs: "Retratos de familia", detail: "Under the pines", detailEs: "Bajo los pinos" },
      { time: "5:30 PM", title: "Cocktails", titleEs: "Cóctel", detail: "The Orchard Lawn", detailEs: "The Orchard Lawn" },
      { time: "6:15 PM", title: "Dinner", titleEs: "Cena" },
      { time: "7:30 PM", title: "First dance", titleEs: "Primer baile" },
      { time: "8:00 PM", title: "Dancing", titleEs: "Baile", detail: "The band plays until 10.", detailEs: "La banda toca hasta las 10." },
    ],
    party: [
      { role: "Parents of the bride", roleEs: "Padres de la novia", name: "Inés and Raúl Reyes" },
      { role: "Parents of the groom", roleEs: "Padres del novio", name: "Carmen and Luis Navarro" },
      { role: "Maid of honor", roleEs: "Dama de honor", name: "Lila Fenwick" },
      { role: "Best man", roleEs: "Padrino", name: "Mateo Inkwood" },
    ],
    faqs: [
      { q: "Are children invited?", a: "Yes, if they are named on your invitation. The lawn has room for a blanket, not a separate kids' room.", qEs: "¿Los niños están invitados?", aEs: "Sí, si aparecen en su invitación. El prado tiene espacio para una manta, no un salón aparte para niños." },
      { q: "May I bring a guest?", a: sharedFaqTail.plusEn, qEs: "¿Puedo llevar a alguien más?", aEs: sharedFaqTail.plusEs },
      { q: "Is the ceremony outside?", a: "Yes. Shade tents go up if the afternoon is hot. A light layer is useful after sunset.", qEs: "¿La ceremonia es al aire libre?", aEs: "Sí. Habrá carpas si la tarde está caliente. Una capa ligera sirve después del atardecer." },
      { q: "What if I have an allergy?", a: "Write it in the meal field. The kitchen can do gluten-free and vegetarian. It cannot do a separate kids' menu.", qEs: "¿Y si tengo una alergia?", aEs: "Escríbala en el campo de la comida. La cocina puede preparar sin gluten y vegetariano. No hay un menú infantil aparte." },
      { q: "Where do I park?", a: "Use the public lots at Brand Park and, later, at Orcutt Ranch. Do not park in driveways.", qEs: "¿Dónde estaciono?", aEs: "Use los estacionamientos públicos de Brand Park y, después, de Orcutt Ranch. No estacione en las entradas de las casas." },
      { q: "When do replies close?", a: "May 12, 2027. After that the form stops and the meal count is sent to the kitchen.", qEs: "¿Cuándo cierran las respuestas?", aEs: "El 12 de mayo de 2027. Después el formulario se detiene y el conteo de comidas se envía a la cocina." },
    ],
    photos: [
      { id: "demo-elegant-hero", filename: "/demos/elegant-hero.svg", caption: "Two rings on warm paper", captionEs: "Dos anillos sobre papel cálido" },
      { id: "demo-elegant-table", filename: "/demos/elegant-table.svg", caption: "A place setting", captionEs: "Un puesto en la mesa" },
      { id: "demo-elegant-sprig", filename: "/demos/elegant-sprig.svg", caption: "A sprig for the menu", captionEs: "Una ramita para el menú" },
    ],
    households: homes([
      ["Priya", "Marrow", 2],
      ["Jonah", "Pell", 1],
      ["Amara", "Quill", 3],
      ["Felix", "Bramble", 2],
      ["Nora", "Fenwick", 1],
      ["Hugo", "Langtree", 4],
      ["Celeste", "Voss", 2],
      ["Mateo", "Inkwood", 1],
      ["Imani", "Shore", 2],
      ["Oscar", "Penrose", 2],
    ]),
  },
  {
    id: "demo-fiesta",
    slug: "demo-fiesta",
    template: "fiesta",
    honoree: "Camila Ortiz",
    partnerName: "",
    eventKind: "quinceanera",
    familyLine: "The Ortiz family",
    familyLineEs: "La familia Ortiz",
    title: "Quinceañera",
    dateIso: "2027-08-21",
    ceremonyLabel: "Mass",
    ceremonyLabelEs: "Misa",
    ceremonyTime: "3:00 PM",
    ceremonyVenue: "Chapel Lawn at Recreation Park",
    ceremonyAddress: "208 Park Avenue, San Fernando, CA 91340",
    ceremonyMapUrl: mapLink("Recreation Park San Fernando CA"),
    receptionTime: "5:30 PM",
    receptionVenue: "Marigold Hall at Ritchie Valens Recreation Center",
    receptionAddress: "10736 Laurel Canyon Blvd, Pacoima, CA 91331",
    receptionMapUrl: mapLink("Ritchie Valens Recreation Center Pacoima CA"),
    rsvpByLabel: "July 21, 2027",
    rsvpByLabelEs: "21 de julio de 2027",
    rsvpClosesOn: "2027-07-21",
    dressCode: "Cocktail. Coral, gold, and teal are the colors of the court. Comfortable shoes for the dance floor.",
    dressCodeEs: "Cóctel. Coral, dorado y verde azulado son los colores de la corte. Zapatos cómodos para la pista.",
    giftText: "Camila is collecting recipes and songs, not a store registry. A card, or a contribution in a sobre at the book by the door, is the gift she wants.",
    giftTextEs: "Camila está juntando recetas y canciones, no una mesa de regalos. Una tarjeta, o una aportación en un sobre junto al libro de la entrada, es el regalo que quiere.",
    aboutText:
      "Camila Ortiz turns fifteen with a mass, a waltz, and a long table. The court is made of cousins. The cake is mango. Her parents, Rosa and Emilio Ortiz, ask you to be there from the blessing through the last song.",
    aboutTextEs:
      "Camila Ortiz cumple quince años con misa, un vals y una mesa larga. La corte la forman sus primos. El pastel es de mango. Sus padres, Rosa y Emilio Ortiz, le piden que esté desde la bendición hasta la última canción.",
    parkingText:
      "Park in the public lot at Recreation Park for mass. For the reception, use the Ritchie Valens Recreation Center lot on Laurel Canyon Boulevard. A few family members will stand at each entrance in coral sashes. Do not block the fire lane.",
    parkingTextEs:
      "Estacione en el lote público de Recreation Park para la misa. Para la recepción, use el estacionamiento del centro Ritchie Valens, sobre Laurel Canyon Boulevard. Algunos familiares estarán en cada entrada con bandas color coral. No bloquee el carril de bomberos.",
    hostNote: "Rosa and Emilio Ortiz are the hosts, with Camila's grandmother, Luz Pembleton, offering the blessing before dinner.",
    hostNoteEs: "Rosa y Emilio Ortiz son los anfitriones, y la abuela de Camila, Luz Pembleton, ofrece la bendición antes de la cena.",
    contactEmail: "ortiz.family@example.com",
    contactPhone: "(818) 555-0174",
    contactNote: "Seat changes and song requests go to this sample address.",
    contactNoteEs: "Los cambios de lugar y las peticiones de canciones van a este correo de muestra.",
    mealPrompt: "Please choose beef, chicken, or vegetarian for your household.",
    mealPromptEs: "Elija res, pollo o vegetariano para su familia.",
    hotels: [
      {
        name: "Sample stay in San Fernando",
        address: "San Fernando, CA 91340",
        note: "No block is reserved. The name is fictional. Look near Recreation Park if you are coming from out of town.",
        noteEs: "No hay habitaciones apartadas. El nombre es ficticio. Si viene de fuera, busque cerca de Recreation Park.",
      },
    ],
    schedule: [
      { time: "2:30 PM", title: "Guests seated", titleEs: "Se sientan los invitados", detail: "Recreation Park", detailEs: "Recreation Park" },
      { time: "3:00 PM", title: "Mass", titleEs: "Misa" },
      { time: "4:30 PM", title: "Court photographs", titleEs: "Fotos de la corte" },
      { time: "5:30 PM", title: "Doors open", titleEs: "Abren las puertas", detail: "Marigold Hall", detailEs: "Salón Marigold" },
      { time: "6:00 PM", title: "Waltz", titleEs: "Vals" },
      { time: "6:30 PM", title: "Dinner", titleEs: "Cena" },
      { time: "8:00 PM", title: "Dance", titleEs: "Baile" },
      { time: "9:30 PM", title: "Surprise dance", titleEs: "Baile sorpresa", detail: "The court changes shoes.", detailEs: "La corte se cambia los zapatos." },
    ],
    party: [
      { role: "Parents", roleEs: "Padres", name: "Rosa and Emilio Ortiz" },
      { role: "Padrinos of the blessing", roleEs: "Padrinos de velación", name: "Luz and Rico Pembleton" },
      { role: "Dama de honor", roleEs: "Dama de honor", name: "Paloma Inkwood" },
      { role: "Chambelán", roleEs: "Chambelán", name: "Andrés Fenwick" },
      { role: "Padrinos of the cake", roleEs: "Padrinos del pastel", name: "Silvia and Otto Voss" },
    ],
    faqs: [
      { q: "What is the dress code for the court?", a: "The court wears coral and gold. Guests may wear cocktail attire in any color that is not white.", qEs: "¿Cómo viste la corte?", aEs: "La corte viste coral y dorado. Los invitados pueden usar cóctel de cualquier color que no sea blanco." },
      { q: "May I bring a guest?", a: sharedFaqTail.plusEn, qEs: "¿Puedo llevar a alguien más?", aEs: sharedFaqTail.plusEs },
      { q: "Is there a cash bar?", a: "Dinner includes agua fresca and a toast. A cash bar is not part of this sample.", qEs: "¿Hay barra de pago?", aEs: "La cena incluye agua fresca y un brindis. Esta muestra no tiene barra de pago." },
      { q: "Where do sobres go?", a: "A book sits by the door at Marigold Hall. A card or a sobre there is enough.", qEs: "¿Dónde van los sobres?", aEs: "Hay un libro junto a la puerta del Salón Marigold. Una tarjeta o un sobre ahí es suficiente." },
      { q: "Are the two places far apart?", a: "Recreation Park and the recreation center are a short drive apart in the northeast Valley. Leave time for parking.", qEs: "¿Los dos lugares quedan lejos?", aEs: "Recreation Park y el centro recreativo quedan a un trayecto corto en el noreste del Valle. Deje tiempo para estacionar." },
      { q: "When do replies close?", a: "July 21, 2027. The court list and the meal count lock that night.", qEs: "¿Cuándo cierran las respuestas?", aEs: "El 21 de julio de 2027. Esa noche se cierran la lista de la corte y el conteo de comidas." },
    ],
    photos: [
      { id: "demo-fiesta-hero", filename: "/demos/fiesta-hero.svg", caption: "Papel picado and a marigold", captionEs: "Papel picado y una maravilla" },
      { id: "demo-fiesta-flower", filename: "/demos/fiesta-flower.svg", caption: "A marigold medallion", captionEs: "Un medallón de maravilla" },
      { id: "demo-fiesta-flags", filename: "/demos/fiesta-flags.svg", caption: "Flags for the court", captionEs: "Banderines para la corte" },
    ],
    households: homes([
      ["Luz", "Pembleton", 4],
      ["Rafael", "Quill", 2],
      ["Noemi", "Bramble", 1],
      ["Tomas", "Langtree", 3],
      ["Silvia", "Voss", 2],
      ["Andres", "Fenwick", 2],
      ["Paloma", "Inkwood", 1],
      ["Diego", "Marrow", 5],
      ["Renata", "Shore", 2],
      ["Emilio", "Pell", 1],
    ]),
  },
  {
    id: "demo-minimal",
    slug: "demo-minimal",
    template: "minimal",
    honoree: "Elena Morales",
    partnerName: "",
    eventKind: "babyshower",
    familyLine: "The Morales cousins",
    familyLineEs: "Los primos Morales",
    title: "Baby shower",
    dateIso: "2027-03-20",
    ceremonyLabel: "Welcome",
    ceremonyLabelEs: "Bienvenida",
    ceremonyTime: "11:00 AM",
    ceremonyVenue: "The North Room at El Cariso Regional Park",
    ceremonyAddress: "13100 Hubbard Street, Sylmar, CA 91342",
    ceremonyMapUrl: mapLink("El Cariso Regional Park Sylmar CA"),
    receptionTime: "12:30 PM",
    receptionVenue: "Lunch in the same room",
    receptionAddress: "13100 Hubbard Street, Sylmar, CA 91342",
    receptionMapUrl: mapLink("El Cariso Regional Park Sylmar CA"),
    rsvpByLabel: "March 6, 2027",
    rsvpByLabelEs: "6 de marzo de 2027",
    rsvpClosesOn: "2027-03-06",
    dressCode: "Comfortable. A light layer is enough. The room is indoors, beside the park.",
    dressCodeEs: "Cómodo. Basta una capa ligera. El salón está techado, junto al parque.",
    giftText: "Elena has what the baby needs. If you want to bring something, a children's book with your name inside is welcome. No store registry.",
    giftTextEs: "Elena tiene lo que el bebé necesita. Si desea traer algo, un libro infantil con su nombre adentro es bienvenido. No hay mesa de regalos.",
    aboutText:
      "A morning for Elena Morales before the baby arrives. Coffee at eleven, a short toast, then lunch. There are no games that require a prize. The cousins are hosting so Elena can sit down.",
    aboutTextEs:
      "Una mañana para Elena Morales antes de que llegue el bebé. Café a las once, un brindis breve y después el almuerzo. No hay juegos que pidan un premio. Los primos organizan el día para que Elena pueda sentarse.",
    parkingText:
      "Use the public lot at El Cariso Regional Park, off Hubbard Street. The North Room is the indoor room nearest the playground, not a private address. Accessible parking is marked at the front of the lot.",
    parkingTextEs:
      "Use el estacionamiento público de El Cariso Regional Park, sobre Hubbard Street. El North Room es el salón techado más cercano al área de juegos, no una casa particular. El estacionamiento accesible está marcado al frente del lote.",
    hostNote: "Nadia Bramble and Rosa Voss, Elena's cousins, are the hosts. Elena's parents, Peter and Gail Marrow, will arrive with her.",
    hostNoteEs: "Nadia Bramble y Rosa Voss, primas de Elena, son las anfitrionas. Los padres de Elena, Peter y Gail Marrow, llegan con ella.",
    contactEmail: "elena.morales@example.com",
    contactPhone: "(818) 555-0190",
    contactNote: "Write if you need a seat near the door or a ride from the Sylmar Metrolink station.",
    contactNoteEs: "Escriba si necesita un lugar cerca de la puerta o un aventón desde la estación Metrolink de Sylmar.",
    mealPrompt: "Lunch is a tea sandwich plate, a fruit plate, or vegetarian. What should we set for you?",
    mealPromptEs: "El almuerzo es un plato de sándwiches de té, un plato de fruta o vegetariano. ¿Qué le servimos?",
    hotels: [
      {
        name: "No hotel block",
        address: "Sylmar, CA 91342",
        note: "This is a morning gathering. Nothing is reserved overnight.",
        noteEs: "Es una reunión de mañana. No hay hospedaje apartado.",
      },
    ],
    schedule: [
      { time: "11:00 AM", title: "Coffee and hello", titleEs: "Café y saludo", detail: "The North Room", detailEs: "The North Room" },
      { time: "11:40 AM", title: "A short toast", titleEs: "Un brindis breve" },
      { time: "12:00 PM", title: "Stories and a book", titleEs: "Historias y un libro" },
      { time: "12:30 PM", title: "Lunch", titleEs: "Almuerzo" },
    ],
    party: [
      { role: "Hosts", roleEs: "Anfitrionas", name: "Nadia Bramble and Rosa Voss" },
      { role: "Parents", roleEs: "Padres", name: "Peter and Gail Marrow" },
    ],
    faqs: [
      { q: "Is this a surprise?", a: "No. Elena knows, and she would like to sit the whole time.", qEs: "¿Es una sorpresa?", aEs: "No. Elena lo sabe y quiere permanecer sentada." },
      { q: "May I bring a child?", a: "Only if the child is named on your invitation. The playground is outside, and the lunch is inside.", qEs: "¿Puedo llevar a un niño?", aEs: "Solo si el niño está en su invitación. El área de juegos está afuera y el almuerzo es adentro." },
      { q: "What should I bring?", a: "A children's book, if you want. Please do not bring large gifts that need a car ride home for Elena.", qEs: "¿Qué llevo?", aEs: "Un libro infantil, si desea. No traiga regalos grandes que Elena tenga que llevarse en el carro." },
      { q: "Is there a registry?", a: "No. The gift note on this page is the whole request.", qEs: "¿Hay mesa de regalos?", aEs: "No. La nota de regalos de esta página es todo el pedido." },
      { q: "Where exactly is the room?", a: "El Cariso Regional Park, the indoor room closest to the playground, off Hubbard Street in Sylmar.", qEs: "¿Dónde queda el salón?", aEs: "El Cariso Regional Park, el salón techado más cercano al área de juegos, sobre Hubbard Street en Sylmar." },
      { q: "When should I reply?", a: "By March 6, 2027, so the cousins can order lunch.", qEs: "¿Para cuándo respondo?", aEs: "Antes del 6 de marzo de 2027, para que los primos pidan el almuerzo." },
    ],
    photos: [
      { id: "demo-minimal-hero", filename: "/demos/minimal-hero.svg", caption: "A single arch", captionEs: "Un solo arco" },
      { id: "demo-minimal-arch", filename: "/demos/minimal-arch.svg", caption: "The room, reduced to a line", captionEs: "El salón, reducido a una línea" },
      { id: "demo-minimal-rule", filename: "/demos/minimal-rule.svg", caption: "A place card", captionEs: "Una tarjeta de lugar" },
    ],
    households: homes([
      ["Helen", "Pembleton", 2],
      ["Chris", "Quill", 1],
      ["Nadia", "Bramble", 2],
      ["Owen", "Langtree", 1],
      ["Rosa", "Voss", 3],
      ["Simon", "Fenwick", 2],
      ["Amina", "Inkwood", 1],
      ["Peter", "Marrow", 2],
      ["Lucia", "Shore", 1],
      ["Graham", "Penrose", 2],
    ]),
  },
  {
    id: "demo-garden",
    slug: "demo-garden",
    template: "garden",
    honoree: "Maya Chen",
    partnerName: "Andres Solis",
    eventKind: "wedding",
    familyLine: "The Chen and Solis families",
    familyLineEs: "Las familias Chen y Solis",
    title: "Wedding",
    dateIso: "2027-05-15",
    ceremonyLabel: "Ceremony",
    ceremonyLabelEs: "Ceremonia",
    ceremonyTime: "4:00 PM",
    ceremonyVenue: "The Rose Walk at Sepulveda Garden Center",
    ceremonyAddress: "16633 Magnolia Blvd, Encino, CA 91436",
    ceremonyMapUrl: mapLink("Sepulveda Garden Center Encino CA"),
    receptionTime: "6:00 PM",
    receptionVenue: "The Long Lawn",
    receptionAddress: "16633 Magnolia Blvd, Encino, CA 91436",
    receptionMapUrl: mapLink("Sepulveda Garden Center Encino CA"),
    rsvpByLabel: "April 15, 2027",
    rsvpByLabelEs: "15 de abril de 2027",
    rsvpClosesOn: "2027-04-15",
    dressCode: "Garden formal. Blush, sage, and cream. The paths are gravel, so a low heel or a flat shoe is kinder.",
    dressCodeEs: "Formal de jardín. Rosa, salvia y crema. Los senderos son de grava, así que un tacón bajo o un zapato plano es más amable.",
    giftText: "Maya and Andres would rather have you there than open a store registry. A card, or a note toward a week in the garden they are planting, is plenty.",
    giftTextEs: "Maya y Andres prefieren tenerlo ahí que abrir una mesa de regalos. Una tarjeta, o una nota para una semana en el jardín que están plantando, es suficiente.",
    aboutText:
      "Maya Chen and Andres Solis will marry among the roses at Sepulveda Garden Center. The ceremony and the dinner are on the same public grounds, a short walk apart. They want a soft afternoon: vows, a toast under the trees, and dancing on the lawn until the gates close.",
    aboutTextEs:
      "Maya Chen y Andres Solis se casarán entre las rosas del Sepulveda Garden Center. La ceremonia y la cena son en el mismo jardín público, a un paseo corto. Quieren una tarde suave: promesas, un brindis bajo los árboles y baile en el prado hasta que cierren las rejas.",
    parkingText:
      "The Garden Center lot is on Magnolia Boulevard in Encino. It is a public lot and it fills on Saturdays. If it is full, use the marked street spaces along Magnolia, not the driveways of the houses nearby. A host in a sage ribbon will point you to the Rose Walk.",
    parkingTextEs:
      "El estacionamiento del Garden Center está sobre Magnolia Boulevard, en Encino. Es público y se llena los sábados. Si está lleno, use los espacios marcados sobre Magnolia, no las entradas de las casas cercanas. Un anfitrión con un listón color salvia le indicará el Rose Walk.",
    hostNote: "Mei Chen and Rosa Solis are hosting with their families. They will be at the gate from 3:30.",
    hostNoteEs: "Mei Chen y Rosa Solis reciben con sus familias. Estarán en la reja desde las 3:30.",
    contactEmail: "maya.and.andres@example.com",
    contactPhone: "(818) 555-0133",
    contactNote: "Ask here about seating among the roses, a ride, or a dietary need.",
    contactNoteEs: "Pregunte aquí por los lugares entre las rosas, un aventón o una necesidad de comida.",
    mealPrompt: "Supper is a garden salad, roasted salmon, or a vegetarian tart. What should we plate?",
    mealPromptEs: "La cena es ensalada del jardín, salmón al horno o una tarta vegetariana. ¿Qué le servimos?",
    hotels: [
      {
        name: "Sample stay in Encino",
        address: "Encino, CA 91436",
        note: "No rooms are held. The inn name is fictional. The gardens close in the evening, so plan the drive before the gates lock.",
        noteEs: "No hay habitaciones apartadas. El nombre del hotel es ficticio. Los jardines cierran por la noche, así que calcule el regreso antes de que echen llave.",
      },
    ],
    schedule: [
      { time: "3:30 PM", title: "Gate opens", titleEs: "Abre la reja", detail: "Sepulveda Garden Center", detailEs: "Sepulveda Garden Center" },
      { time: "4:00 PM", title: "Ceremony among the roses", titleEs: "Ceremonia entre las rosas" },
      { time: "4:45 PM", title: "Portraits on the path", titleEs: "Retratos en el sendero" },
      { time: "5:30 PM", title: "Garden hour", titleEs: "Hora de jardín", detail: "Lemonade and a small bite", detailEs: "Limonada y un bocado" },
      { time: "6:30 PM", title: "Dinner on the long lawn", titleEs: "Cena en el prado largo" },
      { time: "8:00 PM", title: "Dancing", titleEs: "Baile", detail: "Music ends when the park closes.", detailEs: "La música termina cuando cierra el parque." },
    ],
    party: [
      { role: "Parents of the bride", roleEs: "Padres de la novia", name: "Mei and Arthur Chen" },
      { role: "Parents of the groom", roleEs: "Padres del novio", name: "Rosa and Mateo Solis" },
      { role: "Maid of honor", roleEs: "Dama de honor", name: "Cora Penrose" },
      { role: "Best man", roleEs: "Padrino", name: "Felix Bramble" },
    ],
    faqs: [
      { q: "Is the whole day outside?", a: "The vows and dinner are outdoors on public garden paths. A sail goes up if the sun is strong.", qEs: "¿Todo el día es afuera?", aEs: "Las promesas y la cena son al aire libre, en los senderos del jardín público. Habrá una vela si el sol está fuerte." },
      { q: "Can I walk the gardens before?", a: "The gate opens at 3:30 for guests. Please stay with the wedding paths and off the planted beds.", qEs: "¿Puedo recorrer los jardines antes?", aEs: "La reja abre a las 3:30 para los invitados. Quédese en los senderos de la boda y fuera de los macizos." },
      { q: "May I bring a guest?", a: sharedFaqTail.plusEn, qEs: "¿Puedo llevar a alguien más?", aEs: sharedFaqTail.plusEs },
      { q: "What if it rains?", a: "Clear tents are reserved for the Rose Walk and the long lawn. The day does not move indoors.", qEs: "¿Y si llueve?", aEs: "Hay carpas transparentes para el Rose Walk y el prado. El día no se pasa a un salón." },
      { q: "Are heels a problem?", a: "The paths are gravel. A wedge or a flat shoe will be happier than a thin heel.", qEs: "¿Los tacones son un problema?", aEs: "Los senderos son de grava. Una cuña o un zapato plano irá mejor que un tacón delgado." },
      { q: "When do replies close?", a: "April 15, 2027. The kitchen and the chair count lock that day.", qEs: "¿Cuándo cierran las respuestas?", aEs: "El 15 de abril de 2027. Ese día se cierran la cocina y el número de sillas." },
    ],
    photos: [
      { id: "demo-garden-hero", filename: "/demos/garden-hero.svg", caption: "An arch of leaves", captionEs: "Un arco de hojas" },
      { id: "demo-garden-bloom", filename: "/demos/garden-bloom.svg", caption: "A blush bloom", captionEs: "Una flor color rosa" },
      { id: "demo-garden-path", filename: "/demos/garden-path.svg", caption: "The garden path", captionEs: "El sendero del jardín" },
    ],
    households: homes([
      ["Mei", "Chen", 2],
      ["Arthur", "Quill", 1],
      ["Rosa", "Solis", 2],
      ["Cora", "Penrose", 1],
      ["Felix", "Bramble", 2],
      ["Hugo", "Langtree", 3],
      ["Willa", "Voss", 2],
      ["Mateo", "Inkwood", 1],
      ["Imani", "Shore", 2],
      ["Leona", "Pembleton", 2],
    ]),
  },
  {
    id: "demo-noche",
    slug: "demo-noche",
    template: "noche",
    honoree: "Valentina Cruz",
    partnerName: "",
    eventKind: "birthday",
    familyLine: "Hosted by her sisters",
    familyLineEs: "La reciben sus hermanas",
    title: "40th birthday",
    dateIso: "2027-11-06",
    ceremonyLabel: "Doors",
    ceremonyLabelEs: "Puertas",
    ceremonyTime: "7:00 PM",
    ceremonyVenue: "The Gold Room at Hansen Dam",
    ceremonyAddress: "11798 Foothill Blvd, Lake View Terrace, CA 91342",
    ceremonyMapUrl: mapLink("Hansen Dam Lake View Terrace CA"),
    receptionTime: "8:00 PM",
    receptionVenue: "Dinner on the same patio",
    receptionAddress: "11798 Foothill Blvd, Lake View Terrace, CA 91342",
    receptionMapUrl: mapLink("Hansen Dam Lake View Terrace CA"),
    rsvpByLabel: "October 16, 2027",
    rsvpByLabelEs: "16 de octubre de 2027",
    rsvpClosesOn: "2027-10-16",
    dressCode: "Black and gold. A dark jacket or a long dress. The patio is open to the night air, so bring a wrap.",
    dressCodeEs: "Negro y dorado. Un saco oscuro o un vestido largo. El patio está abierto al aire de la noche, así que traiga un abrigo ligero.",
    giftText: "Valentina asked for no store registry. A letter, or a sobre toward a weekend she has not planned yet, is the gift. Please do not bring wrapped boxes.",
    giftTextEs: "Valentina pidió que no haya mesa de regalos. Una carta, o un sobre para un fin de semana que todavía no planea, es el regalo. No traiga cajas envueltas.",
    aboutText:
      "Valentina Cruz turns forty after dark. Her sisters took the patio at Hansen Dam, strung a little gold light, and kept the guest list short. There will be a toast, a long dinner, and dancing until the park asks us to go home.",
    aboutTextEs:
      "Valentina Cruz cumple cuarenta después del anochecer. Sus hermanas tomaron el patio de Hansen Dam, colgaron un poco de luz dorada y dejaron la lista corta. Habrá un brindis, una cena larga y baile hasta que el parque nos pida irnos.",
    parkingText:
      "Use the public Hansen Dam lot off Foothill Boulevard. The Gold Room is the covered patio nearest that lot, not a private hall. The lot is lit. Do not follow navigation into the neighborhood streets behind the park.",
    parkingTextEs:
      "Use el estacionamiento público de Hansen Dam, sobre Foothill Boulevard. The Gold Room es el patio cubierto más cercano a ese lote, no un salón particular. El lote tiene luz. No siga la navegación hacia las calles de las casas detrás del parque.",
    hostNote: "Clara and Nia Cruz are throwing the night. They will meet you at the patio steps.",
    hostNoteEs: "Clara y Nia Cruz organizan la noche. Lo esperan en los escalones del patio.",
    contactEmail: "valentina.cruz@example.com",
    contactPhone: "(818) 555-0166",
    contactNote: "This inbox is fictional. Use it in the sample for a ride or a song.",
    contactNoteEs: "Este correo es ficticio. Úselo en la muestra para un aventón o una canción.",
    mealPrompt: "Dinner is steak, pasta, or a vegetarian plate. Tell us which, and any allergy.",
    mealPromptEs: "La cena es corte de res, pasta o un plato vegetariano. Díganos cuál, y cualquier alergia.",
    hotels: [
      {
        name: "Sample stay in Lake View Terrace",
        address: "Lake View Terrace, CA 91342",
        note: "No block. The night ends when the park closes, so a nearby stay is only for guests coming from far away.",
        noteEs: "No hay bloque. La noche termina cuando cierra el parque, así que el hospedaje es solo para quien viene de lejos.",
      },
    ],
    schedule: [
      { time: "7:00 PM", title: "Doors", titleEs: "Puertas", detail: "Hansen Dam patio", detailEs: "Patio de Hansen Dam" },
      { time: "7:30 PM", title: "Toast", titleEs: "Brindis" },
      { time: "8:00 PM", title: "Dinner", titleEs: "Cena" },
      { time: "9:15 PM", title: "Dancing", titleEs: "Baile" },
      { time: "10:30 PM", title: "Cake", titleEs: "Pastel", detail: "Chocolate, with gold leaf only on the sample.", detailEs: "Chocolate, con hoja de oro solo en la muestra." },
    ],
    party: [
      { role: "Hosts", roleEs: "Anfitrionas", name: "Clara and Nia Cruz" },
      { role: "Toast", roleEs: "Brindis", name: "Oscar Penrose" },
      { role: "Playlist", roleEs: "Lista de canciones", name: "Nico Shore" },
    ],
    faqs: [
      { q: "Is this a surprise party?", a: "No. Valentina chose the date and the color. Please do not arrive early with a banner.", qEs: "¿Es una fiesta sorpresa?", aEs: "No. Valentina eligió la fecha y el color. No llegue temprano con una pancarta." },
      { q: "What do I wear?", a: "Black or gold, something you would wear to a dinner after dark. White is for someone else's wedding.", qEs: "¿Qué me pongo?", aEs: "Negro o dorado, algo para una cena de noche. El blanco es para la boda de otra persona." },
      { q: "May I bring someone?", a: sharedFaqTail.plusEn, qEs: "¿Puedo llevar a alguien?", aEs: sharedFaqTail.plusEs },
      { q: "Is it indoors?", a: "It is a covered public patio. A wrap is worth bringing.", qEs: "¿Es adentro?", aEs: "Es un patio público cubierto. Vale la pena traer un abrigo ligero." },
      { q: "Are children invited?", a: "The list is adults this time. If a child is named on your card, they are welcome.", qEs: "¿Hay niños invitados?", aEs: "Esta vez la lista es de adultos. Si un niño está en su tarjeta, es bienvenido." },
      { q: "When do replies close?", a: "October 16, 2027. After that the form closes and the sisters stop holding seats.", qEs: "¿Cuándo cierran las respuestas?", aEs: "El 16 de octubre de 2027. Después el formulario cierra y las hermanas ya no guardan lugares." },
    ],
    photos: [
      { id: "demo-noche-hero", filename: "/demos/noche-hero.svg", caption: "A gold line on black", captionEs: "Una línea dorada sobre negro" },
      { id: "demo-noche-star", filename: "/demos/noche-star.svg", caption: "One star", captionEs: "Una estrella" },
      { id: "demo-noche-frame", filename: "/demos/noche-frame.svg", caption: "The evening frame", captionEs: "El marco de la noche" },
    ],
    households: homes([
      ["Clara", "Cruz", 1],
      ["Nia", "Cruz", 1],
      ["Oscar", "Penrose", 2],
      ["Nico", "Shore", 1],
      ["Hugo", "Langtree", 2],
      ["Celeste", "Voss", 2],
      ["Felix", "Bramble", 1],
      ["Amara", "Quill", 2],
      ["Mateo", "Inkwood", 1],
      ["Imani", "Marrow", 2],
    ]),
  },
  {
    id: "demo-confetti",
    slug: "demo-confetti",
    template: "confetti",
    honoree: "Leo Ramos",
    partnerName: "",
    eventKind: "birthday",
    familyLine: "The Ramos family",
    familyLineEs: "La familia Ramos",
    title: "7th birthday",
    dateIso: "2027-04-10",
    ceremonyLabel: "Drop-off",
    ceremonyLabelEs: "Llegada",
    ceremonyTime: "11:00 AM",
    ceremonyVenue: "Confetti Room at Branford Recreation Center",
    ceremonyAddress: "13310 Branford Street, Arleta, CA 91331",
    ceremonyMapUrl: mapLink("Branford Recreation Center Arleta CA"),
    receptionTime: "12:00 PM",
    receptionVenue: "Lunch in the same room",
    receptionAddress: "13310 Branford Street, Arleta, CA 91331",
    receptionMapUrl: mapLink("Branford Recreation Center Arleta CA"),
    rsvpByLabel: "March 27, 2027",
    rsvpByLabelEs: "27 de marzo de 2027",
    rsvpClosesOn: "2027-03-27",
    dressCode: "Play clothes that can meet frosting. Sneakers. No costumes required, though a paper crown is encouraged.",
    dressCodeEs: "Ropa de jugar que pueda encontrarse con el betún. Tenis. No hace falta disfraz, aunque una corona de papel es bienvenida.",
    giftText: "Leo loves books about trucks and anything that can be built and taken apart. A small gift is plenty. Please no toys that make a loud electronic noise.",
    giftTextEs: "A Leo le gustan los libros de camiones y cualquier cosa que se pueda armar y desarmar. Un regalo pequeño es suficiente. Por favor, nada de juguetes con ruido electrónico.",
    aboutText:
      "Leo Ramos is turning seven. The party is two hours at the Branford Recreation Center: games, lunch, cake, and pickup. Parents are welcome to stay. There is no separate adults' program, just a chair and a cup of coffee.",
    aboutTextEs:
      "Leo Ramos cumple siete. La fiesta dura dos horas en el Branford Recreation Center: juegos, almuerzo, pastel y salida. Los padres pueden quedarse. No hay un programa aparte para adultos, solo una silla y una taza de café.",
    parkingText:
      "Park in the Branford Recreation Center lot on Branford Street in Arleta. The Confetti Room is the community room inside the public center. Walk in the main doors and follow the paper flags. Do not park in the staff spaces.",
    parkingTextEs:
      "Estacione en el lote del Branford Recreation Center, sobre Branford Street, en Arleta. El Confetti Room es el salón comunitario dentro del centro público. Entre por la puerta principal y siga los banderines de papel. No estacione en los lugares del personal.",
    hostNote: "Ana and Gil Ramos are Leo's parents and the hosts. Gil's sister, Tía Remy Shore, runs the games.",
    hostNoteEs: "Ana y Gil Ramos son los padres de Leo y los anfitriones. La hermana de Gil, la tía Remy Shore, dirige los juegos.",
    contactEmail: "ramos.birthday@example.com",
    contactPhone: "(818) 555-0118",
    contactNote: "Tell us about an allergy, a ride, or an early pickup. This address is fictional.",
    contactNoteEs: "Cuéntenos una alergia, un aventón o una salida temprana. Este correo es ficticio.",
    mealPrompt: "For each child, cheese pizza, a cheese quesadilla, or a fruit plate? Note any allergy.",
    mealPromptEs: "Para cada niño, ¿pizza de queso, quesadilla de queso o plato de fruta? Anote cualquier alergia.",
    hotels: [
      {
        name: "No hotel block",
        address: "Arleta, CA 91331",
        note: "The party is two hours in the middle of the day. Nothing is reserved overnight.",
        noteEs: "La fiesta dura dos horas a mediodía. No hay hospedaje apartado.",
      },
    ],
    schedule: [
      { time: "11:00 AM", title: "Drop-off and crowns", titleEs: "Llegada y coronas", detail: "Branford Recreation Center", detailEs: "Branford Recreation Center" },
      { time: "11:20 AM", title: "Games", titleEs: "Juegos", detail: "A parachute and a quiet race", detailEs: "Un paracaídas y una carrera tranquila" },
      { time: "12:00 PM", title: "Lunch", titleEs: "Almuerzo" },
      { time: "12:40 PM", title: "Cake", titleEs: "Pastel" },
      { time: "1:15 PM", title: "Pickup", titleEs: "Salida", detail: "Please be at the door.", detailEs: "Por favor esté en la puerta." },
    ],
    party: [
      { role: "Parents and hosts", roleEs: "Padres y anfitriones", name: "Ana and Gil Ramos" },
      { role: "Games", roleEs: "Juegos", name: "Tía Remy Shore" },
      { role: "Cake", roleEs: "Pastel", name: "Cousin Lila Fenwick" },
    ],
    faqs: [
      { q: "Do parents stay?", a: "Yes. There is coffee. You do not have to play the games.", qEs: "¿Los padres se quedan?", aEs: "Sí. Hay café. No tiene que jugar." },
      { q: "What ages?", a: "Leo's friends are about six and seven. Siblings on the invitation are welcome.", qEs: "¿Qué edades?", aEs: "Los amigos de Leo tienen unos seis y siete años. Los hermanos que estén en la invitación son bienvenidos." },
      { q: "Are there allergies in the room?", a: "Yes. Please do not bring outside candy or nut snacks. Write your child's allergy in the meal field.", qEs: "¿Hay alergias en el salón?", aEs: "Sí. No traiga dulces de fuera ni botanas con nuez. Escriba la alergia de su hijo en el campo de la comida." },
      { q: "What should my child wear?", a: "Play clothes and sneakers. We will hand out paper crowns.", qEs: "¿Qué debe vestir mi hijo?", aEs: "Ropa de jugar y tenis. Repartiremos coronas de papel." },
      { q: "Is there a pinata?", a: "No pinata. There is cake and a take-home bag with a book and stickers.", qEs: "¿Hay piñata?", aEs: "No hay piñata. Hay pastel y una bolsita con un libro y calcomanías." },
      { q: "When do I reply?", a: "By March 27, 2027, so we know how much pizza and how many crowns.", qEs: "¿Para cuándo respondo?", aEs: "Antes del 27 de marzo de 2027, para saber cuánta pizza y cuántas coronas." },
    ],
    photos: [
      { id: "demo-confetti-hero", filename: "/demos/confetti-hero.svg", caption: "Paper flags", captionEs: "Banderines de papel" },
      { id: "demo-confetti-balloon", filename: "/demos/confetti-balloon.svg", caption: "Three balloons", captionEs: "Tres globos" },
      { id: "demo-confetti-dots", filename: "/demos/confetti-dots.svg", caption: "A handful of confetti", captionEs: "Un puñado de confeti" },
    ],
    households: homes([
      ["Ana", "Ramos", 3],
      ["Remy", "Shore", 2],
      ["Lila", "Fenwick", 2],
      ["Owen", "Bramble", 1],
      ["Paz", "Quill", 2],
      ["Theo", "Langtree", 3],
      ["June", "Voss", 2],
      ["Bruno", "Marrow", 1],
      ["Cleo", "Inkwood", 2],
      ["Nico", "Pell", 2],
    ]),
  },
];
