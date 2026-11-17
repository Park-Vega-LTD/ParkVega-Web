/**
 * Staff-edited homepage sections (Admin → Homepage sections), read from
 * GET /content/page-blocks. Each section has built-in copy below; a section
 * staff haven't saved, or one that comes back in an unexpected shape, shows
 * the built-in copy, so the page never breaks. The API checks each section
 * against the same shapes (park-vega-services: page-block-specs.ts).
 */

import { publicFetch } from "@/lib/api.server";
import { TESTIMONIALS } from "@/lib/home-content";
import { publicFetchOpts } from "@/lib/public-data";

/** Icon names staff can pick; see BlockIcon for the drawings. */
export type BlockIconName =
  | "clock"
  | "shirt"
  | "users"
  | "life-buoy"
  | "cake"
  | "school"
  | "ticket"
  | "umbrella"
  | "utensils"
  | "waves"
  | "shield-check"
  | "map-pin"
  | "sun"
  | "star"
  | "heart"
  | "camera"
  | "baby"
  | "car"
  | "droplets"
  | "party-popper";

type Heading = { eyebrow: string; title: string; description: string };

export type VideosBlock = Heading & {
  chips: string[];
  videos: { youtube_id: string; title: string; badge: string; tone: "lime" | "coral" | "cyan" }[];
};

export type PlanVisitBlock = Heading & {
  rules: { icon: BlockIconName; text: string }[];
  price_title: string;
  /** `{from_price}` in a value is replaced with the live "Tickets from" price. */
  prices: { label: string; value: string }[];
  group_note: string;
};

export type CelebrateBlock = Heading & {
  cards: {
    icon: BlockIconName;
    title: string;
    text: string;
    points: string[];
    whatsapp_message: string;
    button_label: string;
    link_label: string;
    link_href: string;
  }[];
};

export type TestimonialsBlock = Heading & {
  testimonials: { quote: string; author: string; detail: string; /** "1" to "5" stars. */ rating: string }[];
};

export type HomeBlocks = {
  videos: VideosBlock;
  "plan-visit": PlanVisitBlock;
  celebrate: CelebrateBlock;
  testimonials: TestimonialsBlock;
};

/** The homepage's built-in copy, shown until staff save their own. */
export const DEFAULT_HOME_BLOCKS: HomeBlocks = {
  videos: {
    eyebrow: "Watch · filmed at Park Vega",
    title: "See the park in action.",
    description:
      "Real guests, real splashes. Ride the slides and float the waves before you even get here – tap a video to play it.",
    chips: ["15 attractions", "Unlimited rides", "Fun for every age"],
    videos: [
      { youtube_id: "0lGxolhIYxI", title: "Slides. Waves. Smiles.", badge: "Thrill slides", tone: "lime" },
      { youtube_id: "rF4kpE23AeE", title: "Your kind of fun", badge: "Wave pool", tone: "coral" },
    ],
  },
  "plan-visit": {
    eyebrow: "Plan your visit",
    title: "Everything you need for a perfect day.",
    description: "",
    rules: [
      { icon: "shirt", text: "Swimwear required on all slides – no jewellery on rides" },
      { icon: "users", text: "Children under 150cm must be with an adult" },
      { icon: "life-buoy", text: "Non-swimmers must use life jackets or tubes and stay in the shallow end" },
    ],
    price_title: "Ticket prices",
    prices: [
      { label: "Adults & kids over 150cm", value: "From {from_price}" },
      { label: "Kids 90cm – 150cm", value: "Child rate" },
      { label: "Kids under 90cm", value: "Free" },
      { label: "Private cabana · seats 12", value: "Book ahead" },
    ],
    group_note: "Schools, corporates and groups above 20 get group pricing.",
  },
  celebrate: {
    eyebrow: "Celebrate with us",
    title: "Birthdays & school trips.",
    description: "Bring the whole crew. We'll help you plan everything on WhatsApp, from cabanas to group tickets.",
    cards: [
      {
        icon: "cake",
        title: "Birthday parties",
        text: "Turn a birthday into a splash day. Book a private cabana, add food and drinks, and let the party loose on every slide.",
        points: ["Private cabana for up to 12 guests", "Food & drinks on site"],
        whatsapp_message: "Hi Park Vega! I'd like to plan a birthday party.",
        button_label: "Plan a party",
        link_label: "Party packages",
        link_href: "/birthday-parties",
      },
      {
        icon: "school",
        title: "School excursions",
        text: "A fun, safe day out for pupils, with zero-depth kids' pools, anti-slip floors and life jackets for non-swimmers.",
        points: ["Group pricing for schools", "Staff guidance on every slide"],
        whatsapp_message: "Hi Park Vega! I'd like to book a school excursion.",
        button_label: "Book a school trip",
        link_label: "School trips",
        link_href: "/school-excursions",
      },
    ],
  },
  testimonials: {
    eyebrow: "Testimonials",
    title: "Loved by families across Nigeria.",
    description: "Real words from real guests about their day at Park Vega.",
    testimonials: TESTIMONIALS.map((testimonial) => ({ ...testimonial })),
  },
};

/**
 * True when `value` has the same shape as `model`: the same keys with the
 * same kinds of values, and list items shaped like the model's first item.
 */
function sameShape(model: unknown, value: unknown): boolean {
  if (Array.isArray(model)) {
    return Array.isArray(value) && (model.length === 0 || value.every((item) => sameShape(model[0], item)));
  }
  if (model && typeof model === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    return Object.entries(model).every(([key, field]) => sameShape(field, (value as Record<string, unknown>)[key]));
  }
  return typeof model === typeof value;
}

type SavedBlock = { block: string; data: unknown };

/** The homepage sections, each staff's saved copy or the built-in one. */
export async function getHomeBlocks(): Promise<HomeBlocks> {
  const saved = await publicFetch<SavedBlock[]>("/content/page-blocks?page_key=home", publicFetchOpts).catch(
    () => [] as SavedBlock[],
  );
  const blocks = { ...DEFAULT_HOME_BLOCKS };
  for (const { block, data } of Array.isArray(saved) ? saved : []) {
    if (Object.hasOwn(DEFAULT_HOME_BLOCKS, block)) {
      const key = block as keyof HomeBlocks;
      if (sameShape(DEFAULT_HOME_BLOCKS[key], data)) {
        (blocks as Record<keyof HomeBlocks, unknown>)[key] = data;
      }
    }
  }
  return blocks;
}
