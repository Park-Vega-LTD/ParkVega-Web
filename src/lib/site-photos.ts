/**
 * The site keeps no built-in photos: every image comes from the REST API
 * (Page images, attraction / event / menu photos, site settings). A spot
 * with nothing chosen shows no photo.
 */

/** A photo and its alt text, as shown in a page-image spot. */
export interface Photo {
  src: string;
  alt: string;
}

const HERO_PHOTOS = "https://res.cloudinary.com/rlenhslv/image/upload";

/**
 * Real Park Vega photos shown behind a page's hero until staff choose one
 * for its `<page>/hero` spot under Page images (staff choices always win).
 */
export const DEFAULT_HERO_PHOTOS = {
  "plan-your-visit": {
    src: `${HERO_PHOTOS}/v1794922625/parkvega/site/photos/heroes/plan-your-visit.jpg`,
    alt: "Splash pad and water slides at Park Vega Waterpark under a blue sky",
  },
  directions: {
    src: `${HERO_PHOTOS}/v1794922623/parkvega/site/photos/heroes/directions.jpg`,
    alt: "View across Park Vega Waterpark in Agbor, with the kids' slide tower and pools",
  },
  services: {
    src: `${HERO_PHOTOS}/v1794922629/parkvega/site/photos/heroes/services.jpg`,
    alt: "Shaded loungers, the food station and the wave pool at Park Vega",
  },
  "birthday-parties": {
    src: `${HERO_PHOTOS}/v1794922620/parkvega/site/photos/heroes/birthday-parties.jpg`,
    alt: "Guests celebrating under colourful bunting at Park Vega",
  },
  "school-excursions": {
    src: `${HERO_PHOTOS}/v1794922627/parkvega/site/photos/heroes/school-excursions.jpg`,
    alt: "Young guests floating on tubes in the pool at Park Vega",
  },
} satisfies Record<string, Photo>;
