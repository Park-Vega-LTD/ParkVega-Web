/**
 * Static homepage copy. Each block is the fallback shown when the matching
 * REST API collection is empty or unreachable, so the page never renders
 * blank sections. Staff-managed content from the API always wins.
 */

export type AttractionHighlight = {
  name: string;
  description: string;
  tags: string[];
  /** The attraction's photo. */
  image?: string;
  /** A YouTube link or MP4 file; when set, the photo gets a play button that opens it. */
  video?: string;
};

const PHOTOS = "https://res.cloudinary.com/rlenhslv/image/upload";

export const FALLBACK_ATTRACTIONS: AttractionHighlight[] = [
  {
    name: "Wave Pool",
    description: "Half a million gallons of ocean-style waves across 1,500m² – the heart of the park.",
    tags: ["All ages", "1,500m² pool"],
    image: `${PHOTOS}/v1793463013/parkvega/site/photos/pool-guests-ball.jpg`,
  },
  {
    name: "Blackhole Combo",
    description: "A steep drop up a near-vertical wall for a moment of weightlessness. Ride it as a pair.",
    tags: ["Min. 120cm", "Double raft"],
    image: `${PHOTOS}/v1793463021/parkvega/site/photos/tube-slide-pair.png`,
  },
  {
    name: "Mat Racer",
    description: "Grab a mat and race your friends side by side down the slide to the splash at the bottom.",
    tags: ["Race your friends", "Thrill"],
    image: `${PHOTOS}/v1793463010/parkvega/site/photos/mat-racer-slide.jpg`,
  },
  {
    name: "Aqua Tower",
    description: "Four gentle slides and 50+ splash features: tipping bucket, bubbler jets and more.",
    tags: ["Kids", "Zero-depth pool"],
    image: `${PHOTOS}/v1793463002/parkvega/site/photos/aqua-tower-aerial.jpg`,
  },
  {
    name: "Kids' Splash Zone",
    description: "Fountains, spray poles and anti-slip floors where little ones can splash safely.",
    tags: ["Kids", "Zero-depth pool"],
    image: `${PHOTOS}/v1793463017/parkvega/site/photos/splash-zone-kids.jpg`,
  },
  {
    name: "Relax Pool",
    description: "A slow, meandering pool with a swim-up bar. Grab a drink and unwind.",
    tags: ["1.2m deep", "Swim-up bar"],
    image: `${PHOTOS}/v1793463008/parkvega/site/photos/friends-floating-tubes.jpg`,
  },
];

export type MenuHighlight = { name: string; detail?: string; price: number; label: string };

export const FALLBACK_MENU: MenuHighlight[] = [
  { name: "Jollof Rice", price: 4300, label: "Popular choice" },
  { name: "Burger Max Combo + Chips", price: 14100, label: "Popular choice" },
  { name: "Pizza Extravaganza", detail: "Large pizza + 4 wings + 1 soda", price: 18100, label: "Family favourite" },
  { name: "6 Wings + Chips", price: 11800, label: "Popular choice" },
];

/** Built-in guest testimonials; staff replace them in Admin → Homepage sections. */
export const TESTIMONIALS = [
  {
    quote:
      "The entry fee covers all activities in the park: the pools, wave pool, slides etc. The activities are really nice for water lovers… Very good security too.",
    author: "Illorah Ella",
    detail: "Park Vega guest",
    rating: "5",
  },
  {
    quote:
      "It was fun, the staff were very friendly and helpful. The meal was great and the bar drinks are top-notch. It's a complete enjoyment package!",
    author: "successfulsunshine Obokparo",
    detail: "Park Vega guest",
    rating: "5",
  },
  {
    quote:
      "It was fun! The lifeguards there are always alert and caring. The staff are welcoming. The environment is neat and the service is top-notch.",
    author: "Esosa Favour",
    detail: "Park Vega guest",
    rating: "5",
  },
];

export const DIRECTION_CITIES = [
  { city: "Benin City", origin: "Benin City, Edo State", note: "Head east on the Benin–Asaba Expressway to Agbor." },
  { city: "Asaba", origin: "Asaba, Delta State", note: "Head west on the Benin–Asaba Expressway to Agbor." },
  { city: "Warri", origin: "Warri, Delta State", note: "Drive north towards Abraka, then join the expressway at Agbor." },
  { city: "Onitsha", origin: "Onitsha, Anambra State", note: "Cross the Niger Bridge to Asaba, then head west to Agbor." },
];

/** Official park rules, in the order of the Park Vega rules poster. */
export const PARK_RULES = [
  "Shower before and after swimming",
  "No matter what swimwear a woman wears, she is to be respected",
  "No physical or verbal harassment towards women in any clothing",
  "Only lined swimwear made of swimming-friendly material",
  "Water can be dangerous: non-swimmers must always use life jackets or tubes and stay in the shallow part of the pool",
  "Do not push others into the water",
  "Do not push others below the water",
  "Do not jump into the water",
  "Do not dive into the water",
  "Take special care of children and elderly people",
  "No underwear in the swimming pool",
  "Listen to staff advice on how to use the water slides safely",
  "Footwear and socks are not permitted in the pool or on slides",
  "All children under 3 years must wear swim diapers",
  "All areas of Park Vega are smoke and substance free",
];

/**
 * Items not allowed in the park, from the official prohibited-items list,
 * with plain-language labels. `icon` keys are mapped to icons where the list
 * is rendered.
 */
export const PROHIBITED_ITEMS = [
  { label: "Outside food", icon: "food" },
  { label: "Alcohol", icon: "alcohol" },
  { label: "Glass items", icon: "glass" },
  { label: "Bottles", icon: "bottle" },
  { label: "Chairs", icon: "chair" },
  { label: "Drones", icon: "drone" },
  { label: "Drugs", icon: "drugs" },
  { label: "Guns", icon: "gun" },
  { label: "Knives", icon: "knife" },
  { label: "Pets", icon: "pet" },
  { label: "Jewellery on rides", icon: "jewellery" },
  { label: "Smoking", icon: "smoking" },
  { label: "Sprays", icon: "spray" },
  { label: "Jerry cans & tanks", icon: "tank" },
  { label: "Tasers", icon: "taser" },
] as const;

