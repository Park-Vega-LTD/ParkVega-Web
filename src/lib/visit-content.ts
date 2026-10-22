/**
 * Copy for the SEO landing pages (brief §3): plan-your-visit, birthday
 * parties, school excursions and directions.
 *
 * Package prices are left undefined until Park Vega confirms them; the pages
 * then show "Price on request" with a WhatsApp CTA instead of a made-up
 * number. Travel times and landmarks are approximate and should be checked
 * by the Park Vega team before launch.
 */

export const WHAT_TO_WEAR = {
  wear: [
    "Lined swimwear made of swimming-friendly material",
    "Swim diapers for children under 3",
    "Sunscreen, sunglasses and a hat for time out of the water",
    "A towel and a change of clothes for the ride home",
  ],
  avoid: [
    "Underwear, footwear or socks in the pools or on slides",
    "Jewellery on rides",
    "Cotton clothing, jeans or anything with zips or buckles on slides",
  ],
};

export const FOOD_POLICY = [
  "Outside food, alcohol, glassware and bottles are not allowed into the park.",
  "Park Vega Restaurant serves jollof, burgers, pizza, wings, snacks and cold drinks all day.",
  "Order on this website and pick up in person – no waiting in line.",
  "Relax Pool guests can grab a drink at the swim-up bar.",
];

export const WHAT_TO_EXPECT = [
  {
    title: "Arrive & check in",
    text: "Show the QR code on your ticket (WhatsApp, email or the My Bookings page) at the gate. Arrive close to 11am to enjoy the full day.",
  },
  {
    title: "Get ready to swim",
    text: "Change into swimwear, shower before swimming and pick up a life jacket if anyone in your group is a non-swimmer.",
  },
  {
    title: "Ride all day",
    text: "One ticket covers unlimited rides on every attraction until 6pm. Staff at each slide show you how to ride it safely.",
  },
  {
    title: "Refuel",
    text: "Eat at Park Vega Restaurant or relax in a private cabana between rides.",
  },
];

export const ADD_ONS = [
  {
    name: "Private cabana",
    text: "Seats up to 12 with TV, phone charging and a fan – your shaded base for the day.",
    href: "whatsapp:Hi Park Vega! I'd like to book a private cabana.",
    cta: "Book a cabana",
  },
  {
    name: "Birthday package",
    text: "Cabana, tickets and food for the birthday crew, planned with our team.",
    href: "/birthday-parties",
    cta: "See packages",
  },
  {
    name: "Group pass (20+)",
    text: "Special pricing for schools, churches, corporates and groups above 20.",
    href: "/school-excursions",
    cta: "Group pricing",
  },
];

export const ACCOMMODATION =
  "Making a weekend of it? Agbor has hotels and guesthouses a short drive from the park, and Benin City and Asaba are about an hour away. Ask us on WhatsApp and we'll point you to nearby options.";

export type Package = {
  name: string;
  tagline: string;
  /** Price in naira. Leave undefined to show "Price on request". */
  price?: number;
  priceNote?: string;
  includes: string[];
  highlight?: boolean;
};

export const BIRTHDAY_PACKAGES: Package[] = [
  {
    name: "Splash Party",
    tagline: "Tickets for the whole crew",
    priceNote: "per guest",
    includes: [
      "Park tickets for every guest",
      "Unlimited rides on all attractions",
      "Food & drinks can be added",
    ],
  },
  {
    name: "Cabana Party",
    tagline: "Your own shaded party base",
    priceNote: "up to 12 guests",
    highlight: true,
    includes: [
      "Private cabana for up to 12 guests",
      "TV, phone charging and a fan",
      "Park tickets for every guest",
      "Food & drinks from Park Vega Restaurant",
    ],
  },
  {
    name: "Big Group Party",
    tagline: "For 20 guests and above",
    priceNote: "group pricing",
    includes: [
      "Group ticket pricing",
      "Cabanas and seating planned for your group",
      "Food & drink packages for the party",
      "Dedicated contact on WhatsApp",
    ],
  },
];

export const SCHOOL_PRICING: Package[] = [
  {
    name: "Pupils",
    tagline: "Group rate per pupil",
    priceNote: "groups of 20+",
    includes: ["Unlimited rides suited to their height", "Life jackets for non-swimmers"],
  },
  {
    name: "Teachers & staff",
    tagline: "Supervising adults",
    priceNote: "staff rate",
    highlight: true,
    includes: ["Access to every area to supervise pupils", "Cabana options for staff"],
  },
  {
    name: "Meal add-on",
    tagline: "Lunch for the whole group",
    priceNote: "per pupil",
    includes: ["Pre-ordered meals ready on arrival", "Drinks for every pupil"],
  },
];

export const SCHOOL_SAFETY = [
  "Lifeguards on duty at the pools and slides",
  "Life jackets or tubes for every non-swimmer",
  "Zero-depth kids' pools and anti-slip floors",
  "Staff guidance at every slide",
  "Height checks: big slides need 120cm and above",
  "Children under 150cm must be with an adult",
];

export const TEACHER_CHECKLIST = [
  "Signed parent consent forms for every pupil",
  "A list of non-swimmers to share with our team on arrival",
  "At least one supervising adult for every 10 pupils (recommended)",
  "Swimwear, towel and a change of clothes for each pupil",
  "Any medical needs or allergies noted in advance",
  "Your booking reference and group size",
];

export type CityDirections = {
  slug: string;
  city: string;
  origin: string;
  distance: string;
  driveTime: string;
  steps: string[];
  landmarks: string[];
  publicTransport: string;
};

export const CITY_DIRECTIONS: CityDirections[] = [
  {
    slug: "benin",
    city: "Benin City",
    origin: "Benin City, Edo State",
    distance: "about 85 km",
    driveTime: "about 1 hr 15 min",
    steps: [
      "Leave Benin City heading east on the Benin–Asaba Expressway (via Ikpoba Hill).",
      "Stay on the expressway into Delta State towards Agbor.",
      "In Agbor, turn onto Ewuru Road and follow it to ParkVega Street.",
    ],
    landmarks: ["Ikpoba Hill", "Benin–Asaba Expressway", "Agbor town", "Ewuru Road"],
    publicTransport:
      "Take an Agbor- or Asaba-bound bus from a Benin City motor park and ask to stop in Agbor. From Agbor, a taxi or keke to Park Vega on Ewuru Road takes a few minutes.",
  },
  {
    slug: "asaba",
    city: "Asaba",
    origin: "Asaba, Delta State",
    distance: "about 75 km",
    driveTime: "about 1 hr",
    steps: [
      "Leave Asaba heading west on the Benin–Asaba Expressway.",
      "Continue past Issele-Uku and Umunede towards Agbor.",
      "In Agbor, turn onto Ewuru Road and follow it to ParkVega Street.",
    ],
    landmarks: ["Benin–Asaba Expressway", "Issele-Uku junction", "Umunede", "Ewuru Road"],
    publicTransport:
      "Take a Benin- or Agbor-bound bus from an Asaba motor park and ask to stop in Agbor. From Agbor, a taxi or keke to Park Vega on Ewuru Road takes a few minutes.",
  },
  {
    slug: "warri",
    city: "Warri",
    origin: "Warri, Delta State",
    distance: "about 140 km",
    driveTime: "about 2 hr 30 min",
    steps: [
      "Leave Warri heading north-east towards Abraka.",
      "Continue through Obiaruku towards Agbor.",
      "In Agbor, turn onto Ewuru Road and follow it to ParkVega Street.",
    ],
    landmarks: ["Abraka", "Obiaruku", "Agbor town", "Ewuru Road"],
    publicTransport:
      "Take an Agbor-bound bus from a Warri motor park, or travel via Benin City. From Agbor, a taxi or keke to Park Vega on Ewuru Road takes a few minutes.",
  },
  {
    slug: "onitsha",
    city: "Onitsha",
    origin: "Onitsha, Anambra State",
    distance: "about 85 km",
    driveTime: "about 1 hr 20 min",
    steps: [
      "Cross the River Niger from Onitsha into Asaba.",
      "Join the Benin–Asaba Expressway heading west towards Agbor.",
      "In Agbor, turn onto Ewuru Road and follow it to ParkVega Street.",
    ],
    landmarks: ["River Niger bridge", "Asaba", "Benin–Asaba Expressway", "Ewuru Road"],
    publicTransport:
      "Take a Benin- or Agbor-bound bus from Onitsha (Upper Iweka) and ask to stop in Agbor. From Agbor, a taxi or keke to Park Vega on Ewuru Road takes a few minutes.",
  },
];
