import 'server-only';
import type {
  AddPlanItemRequest,
  AdminBookingFilter,
  AdminBookingRecord,
  Attraction,
  AuthSession,
  Booking,
  CheckInRequest,
  CheckInResult,
  CreateAttractionRequest,
  CreateBookingRequest,
  CreateEnquiryRequest,
  CreateFaqRequest,
  CreateFoodOrderRequest,
  CreatePageRequest,
  CreateRestaurantRequest,
  CreateStaffRequest,
  Deleted,
  Enquiry,
  EnquiryType,
  Faq,
  FoodOrder,
  FoodOrderCreated,
  FoodOrderStatus,
  ItineraryItem,
  ListPagesQuery,
  LoginRequest,
  MediaFile,
  MenuItem,
  Page,
  PageImage,
  PageList,
  PaginatedAdminBookings,
  ParkEvent,
  PaymentInit,
  Refund,
  RegisterRequest,
  RegisterResponse,
  ReplacePageImagesRequest,
  Restaurant,
  RevenueReport,
  RevenueReportQuery,
  SessionAvailability,
  SiteSettings,
  StaffMember,
  Ticket,
  TicketPrice,
  TicketProduct,
  UpdateAttractionRequest,
  UpdateFaqRequest,
  UpdateMenuItemRequest,
  UpdateMenuItemStatusRequest,
  UpdatePageRequest,
  UpdateProfileRequest,
  UpdateRestaurantRequest,
  UserProfile,
  UserRole,
  VisitorCategory,
} from '@park-vega/api-types';
import { apiFetch } from './api-client';

const qs = (params: object) => {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
};

const enc = encodeURIComponent;

/** Cache window for public reads, in seconds. */
const PUBLIC_REVALIDATE = 60;
const cached = { auth: 'none' as const, next: { revalidate: PUBLIC_REVALIDATE } };

// ─── Auth (call from Server Actions so cookies can be written) ───────────────
export const authApi = {
  register: (body: RegisterRequest) =>
    apiFetch<RegisterResponse>('/auth/register', {
      method: 'POST',
      json: body,
      auth: 'none',
    }),
  login: (body: LoginRequest) =>
    apiFetch<AuthSession>('/auth/login', {
      method: 'POST',
      json: body,
      auth: 'none',
    }),
  /** Public: only the refresh token is needed. Sends the bearer if present. */
  logout: (refresh_token: string) =>
    apiFetch<void>('/auth/logout', {
      method: 'POST',
      json: { refresh_token },
    }),
};

// ─── Public visitor site (no token, cacheable) ───────────────────────────────
export const publicApi = {
  getSettings: () => apiFetch<SiteSettings>('/content/settings', cached),

  /** Every published page; pass `page` for a paginated PageList instead. */
  listPages: (query: Omit<ListPagesQuery, 'page' | 'limit'> = {}) =>
    apiFetch<Page[]>(`/content/pages${qs(query)}`, cached),
  listPagesPaged: (query: ListPagesQuery & { page: number }) =>
    apiFetch<PageList>(`/content/pages${qs(query)}`, cached),
  getPage: (slug: string) =>
    apiFetch<Page>(`/content/pages/${enc(slug)}`, cached),
  listFaqs: () => apiFetch<Faq[]>('/content/faqs', cached),
  getPageImages: (pageKey: string) =>
    apiFetch<PageImage[]>(`/content/page-images${qs({ page_key: pageKey })}`, cached),

  listAttractions: () => apiFetch<Attraction[]>('/attractions', cached),
  getAttraction: (id: string) =>
    apiFetch<Attraction>(`/attractions/${enc(id)}`, cached),

  listEvents: () => apiFetch<ParkEvent[]>('/events', cached),
  getSessionAvailability: (sessionId: string) =>
    apiFetch<SessionAvailability>(
      `/events/sessions/${enc(sessionId)}/availability`,
      { auth: 'none' },
    ),

  /** Products on sale on `date`; all products when it's left out. */
  listTicketProducts: (date?: string) =>
    apiFetch<TicketProduct[]>(`/ticket-products${qs({ date })}`, cached),
  getTicketPrice: (id: string, category: VisitorCategory, date: string) =>
    apiFetch<TicketPrice>(
      `/ticket-products/${enc(id)}/price${qs({ category, date })}`,
      { auth: 'none' },
    ),

  listRestaurants: () => apiFetch<Restaurant[]>('/restaurants', cached),
  /** Flat list including sold-out items (`active: false`). */
  getRestaurantMenu: (id: string) =>
    apiFetch<MenuItem[]>(`/restaurants/${enc(id)}/menu`, cached),

  createEnquiry: (body: CreateEnquiryRequest) =>
    apiFetch<Enquiry>('/enquiries', { method: 'POST', json: body, auth: 'none' }),
};

// ─── Guest or signed-in visitor (token sent when present) ────────────────────
export const checkoutApi = {
  createBooking: (body: CreateBookingRequest) =>
    apiFetch<Booking>('/bookings', { method: 'POST', json: body }),
  /** By id or reference code. Contact details are masked unless it's yours. */
  getBooking: (idOrCode: string) =>
    apiFetch<Booking>(`/bookings/${enc(idOrCode)}`),
  /** [] until the booking is paid. */
  getTickets: (idOrCode: string) =>
    apiFetch<Ticket[]>(`/bookings/${enc(idOrCode)}/tickets`),
  /** Takes the booking id (UUID), not the code. */
  initiatePayment: (bookingId: string, redirectUrl?: string) =>
    apiFetch<PaymentInit>(`/bookings/${enc(bookingId)}/payment/initiate`, {
      method: 'POST',
      json: redirectUrl ? { redirect_url: redirectUrl } : {},
    }),
  createFoodOrder: (body: CreateFoodOrderRequest) =>
    apiFetch<FoodOrderCreated>('/food-orders', { method: 'POST', json: body }),
};

// ─── Signed-in account ───────────────────────────────────────────────────────
const required = { auth: 'required' as const };

export const accountApi = {
  getProfile: () => apiFetch<UserProfile>('/users/me', required),
  updateProfile: (body: UpdateProfileRequest) =>
    apiFetch<UserProfile>('/users/me', { ...required, method: 'PATCH', json: body }),
  /** The caller's bookings (every booking for admins). */
  listBookings: () => apiFetch<Booking[]>('/bookings', required),
  requestRefund: (bookingId: string) =>
    apiFetch<Refund>(`/bookings/${enc(bookingId)}/refund`, {
      ...required,
      method: 'POST',
    }),

  createPlan: (visitDate: string) =>
    apiFetch<unknown>('/plans', { ...required, method: 'POST', json: { visitDate } }),
  getPlan: (visitDate: string) =>
    apiFetch<ItineraryItem[]>(`/plans${qs({ visitDate })}`, required),
  addPlanItem: (planId: string, body: AddPlanItemRequest) =>
    apiFetch<ItineraryItem[]>(`/plans/${enc(planId)}/items`, {
      ...required,
      method: 'POST',
      json: body,
    }),
  removePlanItem: (planId: string, itemId: string) =>
    apiFetch<ItineraryItem[]>(`/plans/${enc(planId)}/items/${enc(itemId)}`, {
      ...required,
      method: 'DELETE',
    }),
};

// ─── Staff dashboard (role staff or admin) ───────────────────────────────────
export const staffApi = {
  // Settings
  replaceSettings: (body: SiteSettings) =>
    apiFetch<SiteSettings>('/content/settings', { ...required, method: 'PUT', json: body }),

  // Pages (staff also see drafts)
  listPages: () => apiFetch<Page[]>('/content/pages', required),
  createPage: (body: CreatePageRequest) =>
    apiFetch<Page>('/content/pages', { ...required, method: 'POST', json: body }),
  updatePage: (id: string, body: UpdatePageRequest) =>
    apiFetch<Page>(`/content/pages/${enc(id)}`, { ...required, method: 'PATCH', json: body }),
  deletePage: (id: string) =>
    apiFetch<Deleted>(`/content/pages/${enc(id)}`, { ...required, method: 'DELETE' }),

  // FAQs
  listFaqs: (includeInactive = true) =>
    apiFetch<Faq[]>(`/content/faqs${qs({ include_inactive: includeInactive })}`, required),
  createFaq: (body: CreateFaqRequest) =>
    apiFetch<Faq>('/content/faqs', { ...required, method: 'POST', json: body }),
  updateFaq: (id: string, body: UpdateFaqRequest) =>
    apiFetch<Faq>(`/content/faqs/${enc(id)}`, { ...required, method: 'PATCH', json: body }),
  deleteFaq: (id: string) =>
    apiFetch<Deleted>(`/content/faqs/${enc(id)}`, { ...required, method: 'DELETE' }),
  /** Every FAQ id, in the new order. */
  reorderFaqs: (ids: string[]) =>
    apiFetch<Faq[]>('/content/faqs/order', { ...required, method: 'PUT', json: { ids } }),

  // Media library. Images up to 2 MB (webp/jpeg/png/avif), video up to 3 MB.
  listMedia: () => apiFetch<MediaFile[]>('/content/media', required),
  uploadMedia: (file: File) => {
    const form = new FormData();
    form.set('file', file);
    // No Content-Type: fetch sets the multipart boundary itself.
    return apiFetch<MediaFile>('/content/media', { ...required, method: 'POST', body: form });
  },
  deleteMedia: (id: string) =>
    apiFetch<Deleted>(`/content/media/${enc(id)}`, { ...required, method: 'DELETE' }),
  replacePageImages: (pageKey: string, slot: string, body: ReplacePageImagesRequest) =>
    apiFetch<PageImage[]>(`/content/page-images/${enc(pageKey)}/${enc(slot)}`, {
      ...required,
      method: 'PUT',
      json: body,
    }),
  clearPageImages: (pageKey: string, slot: string) =>
    apiFetch<{ page_key: string; slot: string; deleted: true }>(
      `/content/page-images/${enc(pageKey)}/${enc(slot)}`,
      { ...required, method: 'DELETE' },
    ),

  // Attractions
  listAttractions: () => apiFetch<Attraction[]>('/attractions', required),
  createAttraction: (body: CreateAttractionRequest) =>
    apiFetch<Attraction>('/attractions', { ...required, method: 'POST', json: body }),
  updateAttraction: (id: string, body: UpdateAttractionRequest) =>
    apiFetch<Attraction>(`/attractions/${enc(id)}`, { ...required, method: 'PATCH', json: body }),
  setAttractionStatus: (id: string, status: 'ACTIVE' | 'INACTIVE') =>
    apiFetch<Attraction>(`/attractions/${enc(id)}/status`, {
      ...required,
      method: 'PATCH',
      json: { status },
    }),

  // Ticket products (all, including inactive)
  listTicketProducts: () => apiFetch<TicketProduct[]>('/ticket-products', required),

  // Restaurants and menus
  createRestaurant: (body: CreateRestaurantRequest) =>
    apiFetch<Restaurant>('/restaurants', { ...required, method: 'POST', json: body }),
  updateRestaurant: (id: string, body: UpdateRestaurantRequest) =>
    apiFetch<Restaurant>(`/restaurants/${enc(id)}`, { ...required, method: 'PATCH', json: body }),
  deleteRestaurant: (id: string) =>
    apiFetch<Deleted>(`/restaurants/${enc(id)}`, { ...required, method: 'DELETE' }),
  updateMenuItem: (id: string, body: UpdateMenuItemRequest) =>
    apiFetch<MenuItem>(`/menu-items/${enc(id)}`, { ...required, method: 'PATCH', json: body }),
  setMenuItemStatus: (restaurantId: string, itemId: string, body: UpdateMenuItemStatusRequest) =>
    apiFetch<MenuItem>(
      `/restaurants/${enc(restaurantId)}/menu-items/${enc(itemId)}/status`,
      { ...required, method: 'PATCH', json: body },
    ),

  // Kitchen board
  listFoodOrders: (date?: string) =>
    apiFetch<FoodOrder[]>(`/food-orders${qs({ date })}`, required),
  setFoodOrderStatus: (id: string, status: FoodOrderStatus) =>
    apiFetch<FoodOrder>(`/food-orders/${enc(id)}`, {
      ...required,
      method: 'PATCH',
      json: { status },
    }),

  // Enquiries
  listEnquiries: (type?: EnquiryType) =>
    apiFetch<Enquiry[]>(`/enquiries${qs({ type })}`, required),

  // Gate
  checkIn: (body: CheckInRequest) =>
    apiFetch<CheckInResult>('/tickets/checkin', { ...required, method: 'POST', json: body }),
};

// ─── Admin dashboard (role admin) ────────────────────────────────────────────
export const adminApi = {
  /** Raw booking records with cursor paging. */
  listBookings: (filter: AdminBookingFilter = {}) =>
    apiFetch<PaginatedAdminBookings>(`/admin/bookings${qs(filter)}`, required),
  getBooking: (id: string) =>
    apiFetch<AdminBookingRecord>(`/admin/bookings/${enc(id)}`, required),
  cancelBooking: (id: string) =>
    apiFetch<AdminBookingRecord>(`/admin/bookings/${enc(id)}/cancel`, {
      ...required,
      method: 'POST',
    }),
  getRevenue: (query: RevenueReportQuery) =>
    apiFetch<RevenueReport>(`/admin/revenue${qs(query)}`, required),

  approveRefund: (refundId: string) =>
    apiFetch<Refund>(`/refunds/${enc(refundId)}/approve`, { ...required, method: 'POST' }),

  createStaff: (body: CreateStaffRequest) =>
    apiFetch<StaffMember>('/staff', { ...required, method: 'POST', json: body }),
  setRole: (userId: string, role: UserRole) =>
    apiFetch<StaffMember>(`/staff/${enc(userId)}/role`, {
      ...required,
      method: 'PATCH',
      json: { role },
    }),
  /** 204, no body. */
  deactivateStaff: (userId: string) =>
    apiFetch<void>(`/staff/${enc(userId)}/deactivate`, { ...required, method: 'PATCH' }),
};
