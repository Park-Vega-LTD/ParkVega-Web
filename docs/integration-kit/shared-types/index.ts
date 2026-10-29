/**
 * Park Vega — Shared API Types
 * ---------------------------------------------------------------------------
 * Hand-authored contract types for the Park Vega REST API. They describe what
 * the HTTP API sends and receives (the "views" in src/modules/*), not the
 * internal TypeORM entities.
 *
 * Conventions (see docs/frontend-integration-guide.md):
 *  - Money is a JSON number of naira on every public view. The admin
 *    endpoints (/admin/bookings, /admin/revenue) and a few raw entities
 *    still send decimal strings ("12500.00"); those use `MoneyString`.
 *  - Calendar dates are "YYYY-MM-DD" and times "HH:MM", in West Africa Time
 *    (UTC+1). Timestamps are ISO 8601 UTC strings.
 *  - Phone numbers are Nigerian mobiles in E.164 form, e.g. "+2348024440445".
 *  - Request bodies must not carry extra fields: the API rejects unknown
 *    properties with a 422.
 *
 * Publish this folder as a workspace package (`@park-vega/api-types`) or copy
 * it into the Next.js repo.
 */

// ─── Primitive aliases ──────────────────────────────────────────────────────
export type UUID = string;
/** Naira as a JSON number, e.g. 12500. */
export type Naira = number;
/** NUMERIC(12,2) serialized as a decimal string, e.g. "12500.00". */
export type MoneyString = string;
/** Calendar date in WAT, "YYYY-MM-DD". */
export type DateOnly = string;
/** Wall-clock time in WAT, "HH:MM". */
export type TimeOfDay = string;
/** ISO 8601 timestamp, e.g. "2026-10-14T09:30:00.000Z". */
export type DateTime = string;
/** Nigerian mobile in E.164 form, "+234…". */
export type NgPhone = string;

// ─── Enums ───────────────────────────────────────────────────────────────────
export type UserRole = 'user' | 'staff' | 'admin';

export enum VisitorCategory {
  ADULT = 'ADULT',
  CHILD = 'CHILD',
  SENIOR = 'SENIOR',
  INFANT = 'INFANT',
}

/** Booking status as customers see it (`BookingView.status`). */
export type PublicBookingStatus =
  | 'reserved'
  | 'pending_payment'
  | 'paid'
  | 'checked_in'
  | 'cancelled';

/** Internal booking lifecycle state (`BookingView.state`, admin records). */
export enum BookingState {
  PENDING = 'PENDING',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAID = 'PAID',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REFUND_PENDING = 'REFUND_PENDING',
  REFUNDED = 'REFUNDED',
  ISSUANCE_FAILED = 'ISSUANCE_FAILED',
}

export type TicketViewStatus = 'ISSUED' | 'CHECKED_IN' | 'CANCELLED';

export enum AttractionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export enum EventStatus {
  PUBLISHED = 'PUBLISHED',
  DRAFT = 'DRAFT',
  CANCELLED = 'CANCELLED',
}

export enum EventCategory {
  SEASONAL = 'SEASONAL',
  HOLIDAY_OPENING = 'HOLIDAY_OPENING',
  PROMO = 'PROMO',
  PARTY = 'PARTY',
}

export enum RestaurantStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum MenuItemStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export type FoodOrderStatus =
  | 'placed'
  | 'preparing'
  | 'ready'
  | 'collected'
  | 'cancelled';

/** counter = pay at pickup; pending/paid/failed = online payment. */
export type FoodPaymentStatus = 'counter' | 'pending' | 'paid' | 'failed';

/** "asap" or a full hour from 12:00 to 17:00. */
export type PickupTime =
  | 'asap'
  | '12:00'
  | '13:00'
  | '14:00'
  | '15:00'
  | '16:00'
  | '17:00';

export type EnquiryType = 'birthday' | 'school';

export type BirthdayPackage =
  | 'Splash Party'
  | 'Cabana Party'
  | 'Big Group Party'
  | 'Not sure yet';

export type PageStatus = 'DRAFT' | 'PUBLISHED';

export enum ItineraryItemType {
  ATTRACTION = 'ATTRACTION',
  RESTAURANT = 'RESTAURANT',
  EVENT = 'EVENT',
}

export enum RefundStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// ─── Response envelope ─────────────────────────────────────────────────────────
/** Every JSON success response is wrapped like this (204s have no body). */
export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  message: string;
}

/** A single field-level validation failure (HTTP 422). */
export interface FieldError {
  field: string;
  message: string;
}

/**
 * Every error from the API's exception filter. Rate-limit 429s are the
 * exception: their body is `{ message }` (or plain text on /auth).
 */
export interface ErrorEnvelope {
  success: false;
  errorCode: string;
  /** Written for end users; safe to display. */
  message: string;
  errors?: FieldError[];
  /** Present only outside production. Never render it. */
  stack?: string;
}

export type ApiResponse<T> = SuccessEnvelope<T> | ErrorEnvelope;

/** Returned by delete endpoints that answer with JSON. */
export interface Deleted {
  id: UUID;
  deleted: true;
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
export interface RegisterRequest {
  email: string;
  /** 8–72 chars with a lowercase letter, an uppercase letter and a digit. */
  password: string;
  first_name: string;
  last_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

export interface UserPublic {
  id: UUID;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  role: UserRole;
  created_at: DateTime;
}

/** POST /auth/register — creates the account but does not log in. */
export interface RegisterResponse {
  user: UserPublic;
}

/** POST /auth/login and POST /auth/refresh. */
export interface AuthSession {
  user: UserPublic;
  access_token: string;
  /** Rotates on every refresh; a reused token revokes all sessions. */
  refresh_token: string;
  /** Access-token lifetime in seconds. */
  expires_in: number;
}

/** Claims in the access token. */
export interface AccessTokenClaims {
  sub: UUID;
  email: string;
  is_staff: boolean;
  role: UserRole;
  jti: string;
  exp: number;
  iat: number;
}

// ─── Users / profile ─────────────────────────────────────────────────────────
export interface UserProfile {
  id: UUID;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  role: UserRole;
  created_at: DateTime;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  /** E.164, e.g. "+2348012345678". */
  phone_number?: string;
}

// ─── Site settings ──────────────────────────────────────────────────────────
/** GET /content/settings; PUT /content/settings replaces the whole object. */
export interface SiteSettings {
  ticket_price_from: Naira | null;
  opening_days: string;
  opening_hours: string;
  /** Dates the park opens outside Thursday–Sunday. */
  extra_open_dates: DateOnly[];
  hero_video_url: string | null;
  hero_image_url: string | null;
  notice: string | null;
}

// ─── Content: pages, FAQs, media, page images ────────────────────────────────
export interface PageSection {
  id: UUID;
  content: string;
  display_position: number;
}

export interface Page {
  id: UUID;
  slug: string;
  title: string;
  body: string;
  excerpt: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  status: PageStatus;
  published_at: DateTime | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  schema_json: Record<string, unknown> | null;
  tags: string[];
  author_name: string | null;
  created_at: DateTime;
  updated_at: DateTime;
  sections: PageSection[];
}

/** GET /content/pages?page=&limit= (without `page` the API returns Page[]). */
export interface PageList {
  items: Page[];
  total: number;
  page: number;
  limit: number;
}

export interface ListPagesQuery {
  tag?: string;
  page?: number;
  /** Clamped to 50. */
  limit?: number;
}

export interface CreatePageRequest {
  title: string;
  /** Lowercase letters, numbers and single hyphens. */
  slug: string;
  body?: string;
  excerpt?: string | null;
  /** https only. */
  cover_image_url?: string | null;
  cover_image_alt?: string | null;
  status?: PageStatus;
  published_at?: DateTime | null;
  seo_title?: string | null;
  seo_description?: string | null;
  /** https only. */
  canonical_url?: string | null;
  schema_json?: Record<string, unknown> | null;
  tags?: string[];
  author_name?: string | null;
}

export type UpdatePageRequest = Partial<CreatePageRequest>;

export interface Faq {
  id: UUID;
  question: string;
  answer: string;
  is_active: boolean;
  display_position: number;
  created_at: DateTime;
  updated_at: DateTime;
}

export interface CreateFaqRequest {
  question: string;
  answer: string;
  is_active?: boolean;
  display_position?: number;
}

export type UpdateFaqRequest = Partial<CreateFaqRequest>;

export interface MediaFile {
  id: UUID;
  filename: string | null;
  url: string;
  content_type: string;
  size_bytes: number | null;
  created_at: DateTime;
}

export interface PageImage {
  id: UUID;
  page_key: string;
  slot: string;
  position: number;
  media_file_id: UUID;
  url: string;
  alt_text: string;
  content_type: string;
}

export interface ReplacePageImagesRequest {
  /** The slot's new ordered list, at most 30. */
  images: Array<{ media_file_id: UUID; alt_text: string }>;
}

// ─── Attractions ────────────────────────────────────────────────────────────
export interface AttractionSchedule {
  id: UUID;
  attraction_id: UUID;
  day_of_week: DayOfWeek;
  open_time: TimeOfDay;
  close_time: TimeOfDay;
}

export interface Attraction {
  id: UUID;
  name: string;
  description: string | null;
  category: string;
  rules: string[];
  min_age: number | null;
  min_height_cm: number | null;
  max_capacity: number | null;
  status: AttractionStatus;
  image_url: string | null;
  thrill_level: string | null;
  height_requirement: string | null;
  who_it_suits: string | null;
  safety_precautions: string | null;
  sort_order: number;
  schedules?: AttractionSchedule[];
  created_at: DateTime;
  updated_at: DateTime;
}

export interface CreateAttractionRequest {
  name: string;
  category: string;
  description?: string | null;
  image_url?: string | null;
  thrill_level?: string | null;
  height_requirement?: string | null;
  who_it_suits?: string | null;
  safety_precautions?: string | null;
  sort_order?: number;
}

export type UpdateAttractionRequest = Partial<CreateAttractionRequest>;

// ─── Events ─────────────────────────────────────────────────────────────────
export interface EventSession {
  id: UUID;
  event_id: UUID;
  session_date: DateOnly;
  start_time: TimeOfDay;
  end_time: TimeOfDay;
  capacity: number;
  seats_available: number;
  status: string;
}

export interface ParkEvent {
  id: UUID;
  title: string;
  description: string | null;
  category: EventCategory | null;
  image_url: string | null;
  location: string;
  status: EventStatus;
  sessions: EventSession[];
  created_at: DateTime;
  updated_at: DateTime;
}

/** GET /events/sessions/:sessionId/availability */
export interface SessionAvailability {
  id: UUID;
  seats_available: number;
  sessionId: UUID;
  availableCapacity: number;
  capacityLimit: number;
}

// ─── Ticket products ──────────────────────────────────────────────────────────
export interface PricingTier {
  id: UUID;
  category: VisitorCategory;
  price: Naira;
  valid_from: DateOnly;
  valid_to: DateOnly | null;
  promo_price: Naira | null;
  promo_valid_from: DateOnly | null;
  promo_valid_to: DateOnly | null;
}

export interface QuantityDiscount {
  id: UUID;
  min_guests: number;
  /** Null means no upper bound. */
  max_guests: number | null;
  percent_off: number;
}

export interface TicketProduct {
  id: UUID;
  name: string;
  description: string | null;
  valid_from: DateOnly;
  /** Null means open-ended. */
  valid_to: DateOnly | null;
  active: boolean;
  pricing_tiers: PricingTier[];
  entitlements: Array<{ id: UUID; description: string; type: string | null }>;
  quantity_discounts: QuantityDiscount[];
}

/** GET /ticket-products/:id/price?category=&date= */
export interface TicketPrice {
  price: Naira;
  isPromo: boolean;
}

// ─── Bookings ───────────────────────────────────────────────────────────────
export interface BookingLine {
  ticket_product_id: UUID;
  /** 0–50 */
  adults: number;
  /** 0–50 */
  children: number;
}

/** POST /bookings — the same body for guests and signed-in visitors. */
export interface CreateBookingRequest {
  /** Today or later (WAT), on an open day. */
  visit_date: DateOnly;
  full_name: string;
  phone: NgPhone;
  whatsapp?: NgPhone;
  email?: string;
  /** 1–10 lines; 1–100 guests in total. */
  items: BookingLine[];
}

export interface Booking {
  id: UUID;
  /** Reference shown to customers and used in /booking/<code> links. */
  code: string | null;
  status: PublicBookingStatus;
  /** Internal lifecycle state, for staff screens. */
  state: BookingState;
  visit_date: DateOnly;
  ticket_product_id: UUID | null;
  ticket_name: string | null;
  adults: number;
  children: number;
  /** Adult unit price (the first product's, for mixed bookings). */
  unit_price: Naira;
  /** After any group discount. */
  total: Naira;
  /** Group discount already taken off `total`. */
  discount: Naira;
  full_name: string;
  /** Masked ("••••0445") unless the caller owns the booking or is admin. */
  phone: string | null;
  /** Masked ("a•••@example.com") unless the caller owns it or is admin. */
  email: string | null;
  created_at: DateTime;
}

// ─── Payments ───────────────────────────────────────────────────────────────
export interface InitiatePaymentRequest {
  /** Must be on one of the API's FRONTEND_ORIGINS. */
  redirect_url?: string;
}

/** POST /bookings/:bookingId/payment/initiate */
export interface PaymentInit {
  authorization_url: string;
  payment_id: UUID;
}

// ─── Tickets ────────────────────────────────────────────────────────────────
/** GET /bookings/:idOrCode/tickets — one per guest, [] until paid. */
export interface Ticket {
  id: UUID;
  booking_id: UUID;
  /** Encode this in the QR code; the gate scanner reads it. */
  ticket_code: string;
  visitor_category: VisitorCategory | string;
  status: TicketViewStatus;
}

export interface CheckInRequest {
  ticket_code: string;
  deviceId?: string;
}

export interface CheckInResult {
  success: true;
  ticketId: UUID;
  checkedInAt: DateTime;
  visitor_name: string | null;
  visitor_category: string;
  booking_code: string | null;
}

// ─── Refunds ────────────────────────────────────────────────────────────────
export interface Refund {
  id: UUID;
  booking_id: UUID;
  payment_id: UUID;
  status: RefundStatus;
  amount: MoneyString;
  requested_by: UUID;
  approved_by: UUID | null;
  created_at: DateTime;
  updated_at: DateTime;
}

// ─── Restaurants and food orders ───────────────────────────────────────────
export interface DaySchedule {
  /** 0 = Sunday … 6 = Saturday */
  dayOfWeek: number;
  openTime: TimeOfDay;
  closeTime: TimeOfDay;
}

export interface Restaurant {
  id: UUID;
  name: string;
  description: string | null;
  category: string;
  location: string | null;
  opening_hours: string | null;
  dietary_info: string | null;
  image_url: string | null;
  weekly_schedule: DaySchedule[] | null;
  status: RestaurantStatus;
  /** True when status is OPEN. */
  active: boolean;
}

/** GET /restaurants/:id/menu returns a flat list; group by `category`. */
export interface MenuItem {
  id: UUID;
  restaurant_id: UUID;
  name: string;
  description: string | null;
  price: Naira;
  category: string;
  allergens: string[];
  popular: boolean;
  /** False means sold out. */
  active: boolean;
}

export interface CreateRestaurantRequest {
  name: string;
  category?: string;
  description?: string | null;
  location?: string | null;
  opening_hours?: string | null;
  dietary_info?: string | null;
  weekly_schedule?: DaySchedule[] | null;
  active?: boolean;
  status?: RestaurantStatus;
  image_url?: string | null;
}

export type UpdateRestaurantRequest = Partial<CreateRestaurantRequest>;

export interface UpdateMenuItemRequest {
  active?: boolean;
  name?: string;
  description?: string | null;
  price?: Naira;
  category?: string;
  popular?: boolean;
}

export interface UpdateMenuItemStatusRequest {
  status: MenuItemStatus;
}

export interface CreateFoodOrderRequest {
  full_name: string;
  phone: NgPhone;
  whatsapp?: NgPhone;
  email?: string;
  /** Same open-day rules as bookings. */
  pickup_date: DateOnly;
  pickup_time: PickupTime;
  notes?: string | null;
  /** 1–30 lines, quantity 1–20 each. */
  items: Array<{ menu_item_id: UUID; restaurant_id: UUID; quantity: number }>;
  /** Used only when food is paid online. */
  redirect_url?: string;
}

/** POST /food-orders */
export interface FoodOrderCreated {
  id: UUID;
  code: string;
  total: Naira;
  /** Null means pay at the counter. */
  authorization_url: string | null;
}

export interface FoodOrder {
  id: UUID;
  code: string;
  status: FoodOrderStatus;
  payment_status: FoodPaymentStatus;
  full_name: string;
  phone: NgPhone;
  whatsapp: NgPhone;
  email: string | null;
  pickup_date: DateOnly;
  pickup_time: PickupTime;
  notes: string | null;
  total: Naira;
  items: Array<{
    menu_item_id: UUID;
    restaurant_id: UUID;
    restaurant_name: string;
    name: string;
    quantity: number;
    unit_price: Naira;
  }>;
  created_at: DateTime;
}

// ─── Enquiries ──────────────────────────────────────────────────────────────
interface EnquiryBase {
  name: string;
  whatsapp: NgPhone;
  email?: string;
  date: DateOnly;
  notes?: string;
}

/** POST /enquiries. Counts may be sent as numbers or numeric strings. */
export type CreateEnquiryRequest =
  | (EnquiryBase & {
      type: 'birthday';
      guests: number | string;
      package: BirthdayPackage;
    })
  | (EnquiryBase & {
      type: 'school';
      organisation: string;
      pupils: number | string;
      staff: number | string;
    });

export interface Enquiry {
  id: UUID;
  type: EnquiryType;
  name: string;
  whatsapp: NgPhone;
  email: string | null;
  date: DateOnly;
  guests: number | null;
  package: string | null;
  organisation: string | null;
  pupils: number | null;
  staff: number | null;
  notes: string | null;
  status: string;
  created_at: DateTime;
  updated_at: DateTime;
}

// ─── Visit plans ────────────────────────────────────────────────────────────
export interface ItineraryItem {
  id: UUID;
  plan_id: UUID;
  type: ItineraryItemType;
  reference_id: UUID;
  start_time: TimeOfDay;
  note: string | null;
  created_at: DateTime;
  updated_at: DateTime;
}

/** The plan routes still use camelCase bodies. */
export interface AddPlanItemRequest {
  type: ItineraryItemType;
  referenceId: UUID;
  startTime: TimeOfDay;
  note?: string;
}

// ─── Admin ──────────────────────────────────────────────────────────────────
/** A raw booking record from /admin/bookings (not the public Booking view). */
export interface AdminBookingRecord {
  id: UUID;
  visitor_id: UUID | null;
  code: string | null;
  full_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  status: BookingState;
  total_amount: MoneyString;
  discount_amount: MoneyString;
  visit_date: DateOnly;
  version: number;
  created_at: DateTime;
  updated_at: DateTime;
}

export interface AdminBookingFilter {
  status?: BookingState;
  createdFrom?: DateOnly;
  createdTo?: DateOnly;
  visitorEmail?: string;
  /** 1–50 */
  limit?: number;
  cursor?: UUID;
}

/** Cursor-paginated list. Pass `nextCursor` back as `cursor`. */
export interface CursorPage<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export type PaginatedAdminBookings = CursorPage<AdminBookingRecord>;

export interface RevenueReportQuery {
  from: DateOnly;
  to: DateOnly;
}

export interface ProductRevenueBreakdown {
  ticketProductId: UUID | null;
  productName: string;
  quantitySold: number;
  revenueSubtotal: MoneyString;
}

export interface RevenueReport {
  from: DateOnly;
  to: DateOnly;
  totalRevenue: MoneyString;
  totalBookings: number;
  breakdown: ProductRevenueBreakdown[];
}

export interface StaffMember {
  id: UUID;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  is_active: boolean;
  is_staff: boolean;
  role: UserRole;
  created_at: DateTime;
}

export interface CreateStaffRequest {
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role?: 'staff' | 'admin';
}
