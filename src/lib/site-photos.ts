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
