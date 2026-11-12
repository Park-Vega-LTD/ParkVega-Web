import type { FAQ, FaqPage } from "@/types/api";

import { OPEN_DAYS_LONG, OPEN_HOURS, formatNaira } from "@/lib/site";
import { CITY_DIRECTIONS } from "@/lib/visit-content";

/**
 * FAQs shown only when the API is unreachable or has no FAQs at all. Staff
 * edit the live ones in the admin console (FAQs); this copy matches what the
 * FaqPages migration loaded into the database in November 2026. Answers may
 * use "\n" line breaks and "•" bullets.
 */

const OPENING_HOURS: [string, string] = [
  "What are Park Vega's opening days and operating hours?",
  "Park Vega is open Thursday through Sunday, as well as on all official public holidays, from 11:00am to 6:00pm. We also offer expanded daily opening hours during major holiday seasons.\n\nSpecial holiday seasons (open daily):\n• Christmas and New Year season (December – January)\n• Easter week/weekend\n• Valentine's week/day",
];

const ATTRACTION_COUNT: [string, string] = [
  "How many attractions does Park Vega have?",
  "Park Vega Waterpark offers a variety of exciting attractions designed for guests of all ages, including thrilling water slides, swimming pools, splash zones, family-friendly play areas and relaxation spaces.\n\nAs we continue to improve and expand our facilities, the best way to explore our attractions is by checking out our photos and videos on TikTok, Instagram and Facebook @parkvegawaterpark. Follow us to see more before your visit.",
];

const NO_OUTSIDE_FOOD: [string, string] = [
  "Can I bring my own food to Park Vega?",
  "No. Outside food, alcohol, glassware and bottles are not allowed. Park Vega Restaurant serves meals, snacks and drinks inside the park.",
];

const [benin, asaba, warri, onitsha] = CITY_DIRECTIONS;

/** Each page's own questions, shown before the "every page" ones. */
const PAGE_FAQS: Partial<Record<FaqPage, [string, string][]>> = {
  home: [
    OPENING_HOURS,
    ATTRACTION_COUNT,
    [
      "What activities are available for adults at Park Vega Waterpark?",
      "Park Vega offers more than just children's attractions. Adults can enjoy thrilling slides, swimming pools, relaxation spaces, social gatherings, birthday celebrations, corporate outings and quality time with family and friends in a safe and enjoyable environment.",
    ],
    [
      "Does Park Vega have on-site hotel accommodation or overnight lodging?",
      "Park Vega operates primarily as a day-experience waterpark. While we do not have an on-site hotel, there are hotels located just a short drive from the park entrance.",
    ],
    [
      "Can we bring our own food and drinks into Park Vega?",
      "Outside food, beverages and coolers are strictly not permitted inside the park. However, we have a food court and a refreshment bar offering delicious meals, snacks, ice cream and cold beverages for guests of all ages.\n\nNote: Baby food and formula are permitted, subject to inspection at the entrance.",
    ],
  ],
  attractions: [
    [
      "What are the height limits for the slides?",
      "At Park Vega Waterpark, guest safety and comfort are our top priorities.\n\nHeight requirements:\n• We measure the height of guests for selected high-thrill attractions, such as our adult slide group.\n• Children must meet a minimum height requirement of 120 cm to access the adult high-thrill slides.\n• Dedicated children's splash zones and interactive play areas are available for younger guests.",
    ],
    ATTRACTION_COUNT,
  ],
  "plan-your-visit": [
    ["What time does Park Vega open and close?", `Park Vega is open ${OPEN_HOURS} on ${OPEN_DAYS_LONG}.`],
    NO_OUTSIDE_FOOD,
  ],
  restaurants: [
    NO_OUTSIDE_FOOD,
    ["Can I order food online at Park Vega?", "Yes. Order on this website and pick up your food in person at the restaurant."],
  ],
  events: [
    [
      "Is Park Vega open on public holidays?",
      "Yes. Park Vega opens on public holidays as well as every Thursday, Friday, Saturday and Sunday, from 11am to 6pm.",
    ],
  ],
  "birthday-parties": [
    [
      "How much is a birthday party at Park Vega?",
      "It depends on your date, number of guests and whether you add a cabana or food. Send your details on this page or on WhatsApp and we'll send a quote.",
    ],
    [
      "How many guests fit in a Park Vega cabana?",
      "A private cabana seats up to 12 guests and has a TV, phone charging and a fan. Bigger groups can book more than one cabana or a group package.",
    ],
    [
      "Can we bring a birthday cake to Park Vega?",
      "Outside food is not normally allowed, so ask our team on WhatsApp about cakes when you book your party.",
    ],
  ],
  "school-excursions": [
    [
      "Does Park Vega give group discounts for schools?",
      "Yes. Schools, churches, corporates and any group above 20 get group pricing. Send your group size and date and we'll reply with a quote.",
    ],
    [
      "Is Park Vega safe for school children?",
      "Yes. There are lifeguards on duty, zero-depth kids' pools, anti-slip floors, life jackets for non-swimmers and staff guidance at every slide.",
    ],
    [
      "How many teachers should come on a school trip?",
      "We recommend at least one supervising adult for every 10 pupils, and children under 150cm must be with an adult.",
    ],
  ],
  services: [
    [
      "Can I rent a cabana at Park Vega?",
      "Yes. Private cabanas seat up to 12 guests and come with a TV, phone charging and a fan. Cabanas are limited, so book ahead on WhatsApp.",
    ],
    [
      "Can I bring my own food to Park Vega?",
      "Outside food, alcohol, glassware and bottles are not allowed. Park Vega Restaurant serves meals and drinks all day, and you can order online and pick up in person.",
    ],
    [
      "Are life jackets free at Park Vega?",
      "Yes. Life jackets and tubes are available for every non-swimmer, and lifeguards are on duty at the pools and slides.",
    ],
    [
      "Does Park Vega host corporate events?",
      "Yes. Companies, churches and groups of 20 or more get group pricing, with cabanas and meal packages planned for you. Send an enquiry on this page or on WhatsApp.",
    ],
  ],
  tickets: [
    [
      "When can I use my Park Vega ticket?",
      "Tickets are valid on Thursdays, Fridays, Saturdays, Sundays and public holidays, from 11am to 6pm.",
    ],
    ["Do children pay at Park Vega?", "Kids between 90cm and 150cm pay the child rate, and children under 90cm get in free."],
  ],
  directions: [
    [
      "How far is Park Vega from Benin City?",
      `Park Vega is ${benin.distance} from Benin City, ${benin.driveTime} by car along the Benin–Asaba Expressway.`,
    ],
    [
      "How far is Park Vega from Asaba?",
      `Park Vega is ${asaba.distance} from Asaba, ${asaba.driveTime} by car heading west on the Benin–Asaba Expressway.`,
    ],
    [
      "How do I get to Park Vega from Warri?",
      `Drive north-east through Abraka and Obiaruku to Agbor – ${warri.distance}, ${warri.driveTime}.`,
    ],
    [
      "How do I get to Park Vega from Onitsha?",
      `Cross the River Niger into Asaba, then head west on the Benin–Asaba Expressway to Agbor – ${onitsha.distance}, ${onitsha.driveTime}.`,
    ],
  ],
};

/** FAQs that show on every page, after the page's own. */
function sharedFaqs(fromPrice: number): [string, string][] {
  return [
    [
      "How much is Park Vega Waterpark ticket?",
      `Entry is ${formatNaira(fromPrice)} per person and gives you unlimited access to every attraction from ${OPEN_HOURS}. Children under 90cm get in free. Buy online at parkvega.com/tickets.`,
    ],
    OPENING_HOURS,
    [
      "What activities are available for adults at Park Vega Waterpark?",
      "Park Vega Waterpark offers more than just children's attractions. Adults can enjoy thrilling slides, the wave pool, swimming pools, social gatherings, relaxation spaces, birthday celebrations, corporate outings and quality time with family and friends in a safe and enjoyable environment.",
    ],
    [
      "How far is Park Vega from Asaba and Benin?",
      `Park Vega is in Agbor, Delta State, just off the Benin–Asaba Expressway: ${asaba.distance} (${asaba.driveTime} by car) west of Asaba and ${benin.distance} (${benin.driveTime}) east of Benin City.`,
    ],
    [
      "Is Park Vega a good destination for family and group trips?",
      "Yes! Park Vega Waterpark welcomes individuals, couples, families and groups looking for a fun and refreshing experience. Whether you are planning a weekend outing, a celebration or simply a day to unwind, our facilities provide entertainment and relaxation for guests of all ages.",
    ],
    [
      "What should I wear?",
      "Only lined swimwear made of swimming-friendly material. No underwear, footwear or socks in the pools or on the slides, and no jewellery on rides.",
    ],
    [
      "Can I book a birthday party or school trip?",
      "Yes. Private cabanas seat up to 12 guests, and schools, corporates and groups above 20 get group pricing. Chat with us on WhatsApp to plan it.",
    ],
  ];
}

/** The full fallback set, shaped like the API's response. */
export function fallbackFaqs(fromPrice: number): FAQ[] {
  const rows: [FaqPage, [string, string]][] = [
    ...sharedFaqs(fromPrice).map((pair): [FaqPage, [string, string]] => ["all", pair]),
    ...Object.entries(PAGE_FAQS).flatMap(([page, pairs]) =>
      pairs.map((pair): [FaqPage, [string, string]] => [page as FaqPage, pair]),
    ),
  ];
  return rows.map(([page, [question, answer]], index) => ({
    id: `faq-${index}`,
    page,
    question,
    answer,
    display_position: index,
  }));
}
