# Analytics setup (Phase 1: GTM, GA4, Clarity, Search Console, consent)

The site loads nothing third-party until a visitor accepts the cookie banner.
After that it loads Google Tag Manager (analytics or advertising allowed) and
Microsoft Clarity (analytics allowed, public pages only). The code lives in
`src/components/analytics/` and `src/lib/analytics/`.

## What the site pushes to the dataLayer

| When | dataLayer entry |
| --- | --- |
| Every page load, before anything else | `gtag('consent','default', all optional = denied)`, then `consent update` from the `pv_consent` cookie if the visitor already chose; `gtag('set', {page_location, page_referrer, page_path})` with redacted values |
| Every route (first page included) | `{ event: "pv_page_view", page_location, page_path, page_referrer, page_title }` |
| Visitor saves a choice | `gtag('consent','update', …)` and `{ event: "pv_consent_update", consent_analytics, consent_marketing }` |

`page_location` and `page_referrer` are already redacted: `/booking/<code>`
becomes `/booking/[code]`, `/ticket/<code>` becomes `/ticket/[code]`, and every
query parameter except `utm_*`, `gclid`, `gbraid`, `wbraid`, `fbclid`,
`msclkid`, `ttclid` is dropped (the payment gateway appends `tx_ref` and
`transaction_id` on its way back). **GA4 must use these values, never the raw
URL.** The settings below make sure of that.

## Google Tag Manager container (web)

Variables (Data Layer Variable, version 2):

- `DLV - page_location` → `page_location`
- `DLV - page_referrer` → `page_referrer`
- `DLV - page_title` → `page_title`

Trigger:

- `CE - pv_page_view`: Custom Event, event name `pv_page_view`.

Tags:

1. **Google tag** (GA4 measurement ID `G-…`)
   - Configuration parameters: `send_page_view` = `false`,
     `page_location` = `{{DLV - page_location}}`,
     `page_referrer` = `{{DLV - page_referrer}}`.
   - Trigger: Initialization - All Pages.
   - Consent settings: require `analytics_storage`.
2. **GA4 Event – page_view**
   - Measurement ID: same `G-…`. Event name `page_view`.
   - Event parameters: `page_location` = `{{DLV - page_location}}`,
     `page_referrer` = `{{DLV - page_referrer}}`, `page_title` = `{{DLV - page_title}}`.
   - Trigger: `CE - pv_page_view`.
   - Consent settings: require `analytics_storage`.

Container settings: leave Consent Overview on; do **not** add the GTM
`<noscript>` iframe (nothing may load without consent).

Do not add Clarity or any other tag that reads the raw URL to this container;
Clarity is loaded by the site itself so it can be kept off private pages.

## Events (Phase 2)

The site pushes these custom events (`src/lib/analytics/events.ts`). Nothing
is pushed without consent, and no event carries a name, phone, email or
booking code. Ecommerce events carry GA4's standard `ecommerce` object;
every other parameter is under `pv`.

| Event | When | Parameters (`pv.*` unless noted) |
| --- | --- | --- |
| `view_item_list` | Ticket options load for a date | `ecommerce.items`, `item_list_id`, `item_list_name`, `visit_date` |
| `select_visit_date` | Date step → Continue | `visit_date`, `lead_time_days`, `visit_weekday` |
| `add_to_cart` | Ticket step → Continue | `ecommerce.{value,currency,items}`, `visit_date`, `ticket_count` |
| `begin_checkout` | Checkout step shown | same as `add_to_cart` |
| `add_payment_info` | Booking created, about to go to the gateway | `ecommerce.*`, `visit_date`, `payment_type` |
| `checkout_error` | Booking or payment start failed | `step` |
| `payment_return_view` | Back from the gateway on `/booking/[code]` | `payment_status` (paid, pending, failed, other) |
| `generate_lead` | Birthday / school / corporate enquiry sent | `lead_type`, `method` (form, whatsapp_fallback) |
| `contact_whatsapp`, `contact_phone`, `contact_email` | Any WhatsApp / tel / mailto link | `link_placement` (header, footer, floating, content) |
| `get_directions` | Any Google Maps link | `link_placement`, `origin_city` |
| `food_order_placed` | Food order accepted | `value`, `item_count`, `payment_mode` |

**`purchase` and `refund` are sent by the API, not the browser** (GA4
Measurement Protocol, after the payment provider confirms the money; see
"Server-side purchase events" below). Do not create a browser purchase tag.

GTM setup for these:

1. Data Layer Variables (version 2) for each `pv.*` parameter you want in GA4:
   `pv.visit_date`, `pv.lead_time_days`, `pv.visit_weekday`, `pv.ticket_count`,
   `pv.item_list_id`, `pv.item_list_name`, `pv.payment_type`, `pv.step`,
   `pv.payment_status`, `pv.lead_type`, `pv.method`, `pv.link_placement`,
   `pv.origin_city`, `pv.value`, `pv.item_count`, `pv.payment_mode`.
2. Trigger `CE - pv events`: Custom Event, regex, event name
   `^(view_item_list|select_visit_date|add_to_cart|begin_checkout|add_payment_info|checkout_error|payment_return_view|generate_lead|contact_whatsapp|contact_phone|contact_email|get_directions|food_order_placed)$`.
3. Tag `GA4 Event – pv events`: Event name `{{Event}}`; Event parameters:
   one row per variable above (parameter name without `pv.`); More settings →
   Ecommerce → **Send ecommerce data** from the Data Layer. Trigger
   `CE - pv events`. Consent: require `analytics_storage`.
4. In GA4 (Admin → Custom definitions) register the parameters you want to
   report on as event-scoped custom dimensions/metrics: `lead_type`,
   `link_placement`, `visit_weekday`, `payment_status`, `origin_city`
   (dimensions); `lead_time_days`, `ticket_count` (metrics).
5. In GA4 (Admin → Key events) mark `purchase`, `generate_lead`,
   `contact_whatsapp` and `contact_phone` as key events.

## Server-side purchase events

The API (`park-vega-services`, `src/modules/analytics`) reports each
verified payment to GA4:

- When a booking is created, the site sends the visitor's consent and GA ids
  (`_ga` client id, `_ga_<stream>` session id) with it; nothing personal.
  Set `NEXT_PUBLIC_GA4_ID` so the right session cookie is read.
- When the provider confirms a payment (webhook, re-verified with the
  provider), a `purchase` row is written to `conversion_dispatches` in the
  same transaction, then sent with `transaction_id` = booking code, value,
  items, `visit_date` and `lead_time_days`. A refund approval sends `refund`.
- Visitors who did not allow analytics are never sent (`skipped_no_consent`).
- A repeated webhook can't send twice (unique key), unsent rows are retried
  every 5 minutes, and rows older than GA4's 72-hour limit are marked expired.
- API env: `GA4_MEASUREMENT_ID` (same G- id) and `GA4_API_SECRET` (GA4 Admin
  → Data streams → your stream → Measurement Protocol API secrets → Create).

## Campaign attribution (Phase 4)

`src/lib/analytics/attribution.ts` records how each visitor arrived and sends
it with every booking, enquiry and food order; the admin Analytics page shows
paid bookings, revenue and enquiries by channel ("Where bookings come from",
marked **Estimate**).

- **Tag every campaign link** with `utm_source`, `utm_medium` and
  `utm_campaign` (lower case, no spaces), e.g.
  `https://parkvega.com/tickets?utm_source=facebook&utm_medium=paid_social&utm_campaign=dec-promo`.
  Use `utm_medium=whatsapp` for WhatsApp broadcasts, `email` for emails,
  `sms` for texts, `qr` for flyers.
- Untagged visits are worked out from ad click ids (`gclid`, `fbclid`,
  `msclkid`, `ttclid`) or the referring site (Google → organic search,
  Facebook → social, other sites → referral). No referrer = direct.
- **First touch** (`pv_ft`, 90 days) is the earliest visit we know of.
  **Last touch** (`pv_lt`, 30 days) is the latest campaign, ad click or
  referring site; a plain return visit or the return from the payment page
  never replaces it.
- Both cookies are written only after the visitor allows analytics, and are
  deleted if they withdraw. Before they choose, the landing is held in memory
  for that page only.
- The API recomputes the channel from source / medium / click id
  (`park-vega-services/src/modules/analytics/attribution.ts`), so every report
  groups the same way. Bookings without consent are shown as "Not tracked",
  never guessed.

## GA4 property

- Admin → Data streams → Web → Enhanced measurement: turn **off** "Page changes
  based on browser history events" (the site sends its own page views) and
  "Form interactions". Scrolls, outbound clicks, site search, video and file
  downloads may stay on.
- Admin → Data collection: leave Google signals **off**.
- Admin → Data retention: 14 months.
- Reporting time zone: (GMT+01:00) Lagos. Currency: Nigerian Naira (NGN).
- Admin → Data streams → Configure tag settings → List unwanted referrals:
  `checkout.flutterwave.com`, `checkout.paystack.com` (so the return from the
  payment page does not start a new session credited to the gateway).
- Link Search Console (Admin → Product links).

## Microsoft Clarity

- Settings → Masking: **Strict**.
- Settings → Setup: no extra install; the project ID goes in
  `NEXT_PUBLIC_CLARITY_ID`.
- Clarity never runs on `/booking`, `/ticket`, `/my-bookings`, `/my-day`,
  `/account`, `/login`, `/register`. If a visitor moves into one of those in
  the same tab, the page reloads without Clarity.
- Microsoft's terms say Clarity should not be used on sites aimed at people
  under 18. Park Vega's site is aimed at parents, schools and adult visitors,
  but keep that in mind for any children's content.

## Search Console

Verify `https://parkvega.com` as a **Domain property** with the DNS TXT record
Google gives you (covers www and all subdomains). Only if DNS is not possible,
use the HTML-tag method and put the token in `NEXT_PUBLIC_GSC_VERIFICATION`.
Then submit `https://parkvega.com/sitemap.xml`.

## Consent

- Cookie `pv_consent` = `<version>|<analytics 0/1>|<advertising 0/1>|<unix seconds>`,
  first-party, 12 months, `SameSite=Lax`.
- "Reject all" and "Accept all" are equally prominent; "Cookie settings" in the
  footer reopens the choice. Withdrawing consent deletes `_ga*`, `_gid`,
  `_gat*`, `_clck`, `_clsk`, `pv_ft`, `pv_lt` (and `_fbp`, `_fbc`, `_gcl_*`
  for advertising) and reloads the page.
- Raise `NEXT_PUBLIC_CONSENT_VERSION` to ask everyone again.
- The site still needs a written privacy and cookie notice page; the banner
  should link to it once it exists.

## Checking it works

1. Open the site in a private window: no requests to `googletagmanager.com`,
   `google-analytics.com` or `clarity.ms` before choosing.
2. Reject all: still none.
3. Cookie settings → Accept analytics: GTM and Clarity load. In GTM Preview,
   `pv_page_view` fires with `page_location` redacted.
4. Open `/booking/ANYCODE?tx_ref=x`: GA4 DebugView shows
   `page_location = https://…/booking/[code]` with no query.
