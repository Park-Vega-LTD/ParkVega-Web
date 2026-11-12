/**
 * Copy for the services page: guest services grouped the way international
 * parks present them (comfort, food, groups, safety, visit tools).
 *
 * Facilities marked "confirm" below (lockers, parking, first aid) are listed
 * from the original services brief and should be checked by the Park Vega
 * team before launch.
 */

import type { Package } from "@/lib/visit-content";

export type ServiceTone = "ocean" | "coral" | "sun" | "leaf";

export type ServiceItem = {
  title: string;
  text: string;
  /** Internal path, or `whatsapp:<message>` for a click-to-chat link. */
  href?: string;
  cta?: string;
};

export type ServiceCategory = {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  tone: ServiceTone;
  items: ServiceItem[];
};

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "comfort",
    label: "Comfort",
    eyebrow: "Comfort & convenience",
    title: "Settle in and stay all day.",
    description: "The facilities that make a full day by the water easy for every age.",
    tone: "ocean",
    items: [
      {
        title: "Private cabanas",
        text: "Shaded, private and yours all day. Seats up to 12 with a TV, phone charging and a fan.",
        href: "#cabanas",
        cta: "See cabanas",
      },
      {
        title: "Changing rooms & showers",
        text: "Change into swimwear and rinse off before and after you swim.",
      },
      {
        // confirm
        title: "Lockers",
        text: "Keep phones, keys and valuables safe while you ride. Ask at the gate on arrival.",
      },
      {
        // confirm
        title: "On-site parking",
        text: "Drive in off Ewuru Road and park close to the entrance.",
        href: "/directions-from-benin-asaba-warri-onitsha",
        cta: "Get directions",
      },
    ],
  },
  {
    id: "dining",
    label: "Food & drink",
    eyebrow: "Food & drink",
    title: "Refuel without leaving the park.",
    description: "Outside food isn't allowed, so we make sure nobody goes hungry.",
    tone: "coral",
    items: [
      {
        title: "Park Vega Restaurant",
        text: "Jollof, burgers, pizza, wings, snacks and cold drinks, served all day.",
        href: "/restaurants",
        cta: "View the menu",
      },
      {
        title: "Order ahead, skip the line",
        text: "Order food on this website and pick it up in person, no queueing.",
        href: "/restaurants",
        cta: "Order food",
      },
      {
        title: "Swim-up bar",
        text: "Float up to the bar in the Relax Pool and grab a drink without leaving the water.",
        href: "/attractions",
        cta: "Explore pools",
      },
      {
        title: "Group meal packages",
        text: "Pre-ordered meals ready on arrival for parties, schools and teams.",
        href: "whatsapp:Hi Park Vega! I'd like a meal package for my group.",
        cta: "Ask for a menu",
      },
    ],
  },
  {
    id: "safety",
    label: "Safety & care",
    eyebrow: "Safety & care",
    title: "Trained eyes on every pool.",
    description: "Fun is better when everyone feels safe, from first-time swimmers to thrill-seekers.",
    tone: "leaf",
    items: [
      {
        title: "Lifeguards on duty",
        text: "Alert, caring lifeguards watch every pool and slide during opening hours.",
      },
      {
        title: "Free life jackets",
        text: "Life jackets and tubes for every non-swimmer. Just ask our team.",
      },
      {
        title: "Ride guidance",
        text: "Staff at each slide show you how to ride safely and check heights before you go.",
        href: "/plan-your-visit#safety",
        cta: "Park rules",
      },
      {
        // confirm
        title: "First aid",
        text: "Trained staff are on hand for scrapes, bumps and anything else you need on the day.",
      },
    ],
  },
  {
    id: "tools",
    label: "Visit tools",
    eyebrow: "Plan & manage",
    title: "Sort it all from your phone.",
    description: "Digital tools that take the queues and guesswork out of your visit.",
    tone: "sun",
    items: [
      {
        title: "Online tickets",
        text: "Buy before you go and walk straight in with the QR code on your ticket.",
        href: "/tickets",
        cta: "Buy tickets",
      },
      {
        title: "Plan My Day",
        text: "A personal day plan built around your group's ages and favourite rides.",
        href: "/my-day",
        cta: "Build my day",
      },
      {
        title: "My bookings",
        text: "Find your tickets, show your QR code and check booking details any time.",
        href: "/my-bookings",
        cta: "My bookings",
      },
      {
        title: "WhatsApp concierge",
        text: "Questions before or during your visit? Our team answers on WhatsApp in opening hours.",
        href: "whatsapp:Hi Park Vega! I have a question about my visit.",
        cta: "Chat with us",
      },
    ],
  },
];

export const CABANA_FEATURES = [
  "Seats up to 12 guests",
  "TV for the whole crew",
  "Phone charging points",
  "Fan to keep things cool",
  "Shaded, private base all day",
  "Ideal for birthdays and groups",
];

export type GroupOffer = {
  title: string;
  text: string;
  href: string;
  cta: string;
};

/** In this order for the `services/groups` page-image spot: birthdays, schools, corporate. */
export const GROUP_OFFERS: GroupOffer[] = [
  {
    title: "Birthday parties",
    text: "Cabanas, tickets and food for the birthday crew, planned with our team.",
    href: "/birthday-parties",
    cta: "Party packages",
  },
  {
    title: "School excursions",
    text: "Group rates, lifeguards and a teacher checklist for a safe, fun trip.",
    href: "/school-excursions",
    cta: "Plan a school trip",
  },
  {
    title: "Corporate & team days",
    text: "Staff fun days, team bonding and client hosting for groups of 20 and above.",
    href: "#corporate",
    cta: "Corporate packages",
  },
];

export const CORPORATE_PACKAGES: Package[] = [
  {
    name: "Team Splash Day",
    tagline: "A day out for your staff",
    priceNote: "groups of 20+",
    includes: [
      "Group ticket pricing",
      "Unlimited rides on every attraction",
      "Meal packages can be added",
    ],
  },
  {
    name: "Premium Hosting",
    tagline: "Cabanas, food and a host",
    priceNote: "groups of 20+",
    highlight: true,
    includes: [
      "Reserved cabanas for your group",
      "Pre-ordered meals ready on arrival",
      "Group ticket pricing",
      "Dedicated contact on WhatsApp",
    ],
  },
  {
    name: "Church & Community",
    tagline: "For congregations and clubs",
    priceNote: "group pricing",
    includes: [
      "Special pricing for large groups",
      "Seating and cabanas planned for you",
      "Life jackets for every non-swimmer",
    ],
  },
];

export const JOURNEY = [
  { step: "Before", title: "Book & plan", text: "Buy tickets online, build your day plan and reserve a cabana on WhatsApp." },
  { step: "Arrive", title: "Scan & walk in", text: "Show the QR code on your ticket at the gate. No printing needed." },
  { step: "Enjoy", title: "Ride, eat, relax", text: "Unlimited rides, food ordered from your phone and lifeguards on every pool." },
  { step: "After", title: "Keep in touch", text: "Your bookings stay in your account, ready for your next splash day." },
];
