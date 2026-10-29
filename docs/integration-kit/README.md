# Park Vega — Next.js Frontend Integration

A drop-in integration layer for connecting a Next.js (App Router) frontend to
the Park Vega API. It covers the public site (content, guest booking and
Flutterwave checkout, food orders, enquiries), signed-in accounts, the staff
dashboard and admin. Auth is JWT in httpOnly cookies.

The full API contract (endpoints, bodies, response shapes, errors, rate
limits) is in the API repo at `park-vega-services/docs/frontend-integration-guide.md`.
This README covers the kit.

## What's in here

```
integration-kit/
├─ shared-types/
│  └─ index.ts                     # @park-vega/api-types: the wire contract
└─ nextjs/
   ├─ .env.local.example
   ├─ middleware.ts                # session refresh + /account and /admin gating
   ├─ lib/
   │  ├─ session.ts                # cookie names, single-flight refresh (Edge-safe)
   │  ├─ tokens.ts                 # httpOnly cookie store (server-only)
   │  ├─ api-client.ts             # typed fetch, envelope unwrap, IP forwarding
   │  ├─ api-error.ts              # ApiError with errorCode + field errors
   │  ├─ phone.ts                  # normalise "0802…" to "+234802…"
   │  └─ services.ts               # typed functions grouped by surface
   └─ app/
      ├─ auth/actions.ts           # login / register / logout Server Actions
      ├─ checkout/actions.ts       # guest booking → Flutterwave redirect
      ├─ booking/[ref]/page.tsx    # return page + confirmation link target
      ├─ booking/[ref]/refresh-while-pending.tsx
      ├─ admin/bookings/page.tsx   # cursor-paginated admin list
      └─ api/staff/checkin/route.ts  # Route Handler pattern for client components
```

## Architecture decisions

1. **Shared types, not shared classes.** `shared-types/index.ts` mirrors the
   API's response views and request DTOs. Nothing imports backend code.

2. **Tokens in httpOnly cookies.** `pv_access` and `pv_refresh` are
   `httpOnly; Secure; SameSite=Lax`, so client JS can never read them. All
   API calls run server-side (Server Components, Server Actions, Route
   Handlers). Client components call your own Route Handlers, which call the
   API (see `app/api/staff/checkin/route.ts`).

3. **Middleware is the only place that refreshes.** The API rotates refresh
   tokens, and a **reused refresh token revokes every session for that
   user**. A Server Component can't write cookies, so a refresh during a
   render would lose the rotated token, and the next request would replay
   the old one. Middleware runs before every request, refreshes when the
   access cookie has expired (it's set to lapse a minute before the token),
   and writes the new pair to both the response and the current request.
   Parallel requests share one in-flight refresh (`lib/session.ts`).

4. **The visitor's IP is forwarded.** The API rate-limits per client IP
   (`/auth` at 10 a minute; guest lookups and forms at 20–30). `apiFetch` and
   the refresh call both send `X-Forwarded-For`; run the API with
   `TRUST_PROXY_HOPS=1`.

5. **Webhook-driven payment.** Checkout creates a booking, gets
   `authorization_url` and redirects to Flutterwave. The return page never
   trusts the redirect: it polls the booking until the webhook marks it
   paid, then shows the tickets.

## Setup

### 1. Share the types
Publish `shared-types/` as a workspace package named `@park-vega/api-types`
(or copy it into the Next.js repo and adjust imports):

```json
{ "name": "@park-vega/api-types", "version": "0.0.1", "types": "index.ts", "main": "index.ts" }
```

In a monorepo, depend on it as `"@park-vega/api-types": "workspace:*"`. If you
use a package like this, add it to `transpilePackages` in `next.config`.

### 2. Copy the Next.js layer and install dependencies
Copy `nextjs/lib`, `nextjs/middleware.ts` and the `nextjs/app/*` examples into
your project:

```bash
npm install server-only jose
```

### 3. Configure env
```bash
cp nextjs/.env.local.example .env.local
```

| Variable | Purpose |
|---|---|
| `PARK_VEGA_API_URL` | API origin. Server-only, deliberately not `NEXT_PUBLIC_`. |
| `SITE_URL` | This site's origin. Payment returns to `${SITE_URL}/booking/<id>`, so it must be in the API's `FRONTEND_ORIGINS`. |
| `JWT_SECRET` | The API's secret, so middleware can read `role` and gate `/admin`. Optional: blank skips the gate, and the API still answers non-staff with 403. |

### 4. Allow Cloudinary images
Media URLs come from `res.cloudinary.com`. Add it to `images.remotePatterns`
in `next.config`.

## Using it

The services are grouped by who calls them:

| Group | Auth | Examples |
|---|---|---|
| `publicApi` | none, cached 60 s | `getSettings`, `getPage`, `listTicketProducts(date)`, `getRestaurantMenu`, `createEnquiry` |
| `checkoutApi` | token if signed in | `createBooking`, `initiatePayment`, `getBooking(idOrCode)`, `getTickets`, `createFoodOrder` |
| `authApi` | none | `login`, `register`, `logout` (Server Actions only) |
| `accountApi` | required | `getProfile`, `listBookings`, `requestRefund`, plans |
| `staffApi` | staff/admin | CMS, media upload, attractions, restaurants, kitchen board, enquiries, `checkIn` |
| `adminApi` | admin | `listBookings` (raw records), `getRevenue`, `approveRefund`, staff roles |

`publicApi` never sends a token, so its responses can be cached and staff
don't see drafts on public pages. Use `staffApi.listPages()` and friends in
the dashboard for drafts and inactive items.

### Public pages
```tsx
import { publicApi } from '@/lib/services';

export default async function Home() {
  const [settings, hero] = await Promise.all([
    publicApi.getSettings(),
    publicApi.getPageImages('home'),
  ]);
  // settings.opening_days, settings.extra_open_dates, hero.filter(i => i.slot === 'hero')…
}
```

### Auth forms
```tsx
'use client';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { loginAction } from '@/app/auth/actions';

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {});
  const redirect = useSearchParams().get('redirect') ?? '/account';
  return (
    <form action={action}>
      <input type="hidden" name="redirect" value={redirect} />
      <input name="email" type="email" required />
      {state.fieldErrors?.email && <small>{state.fieldErrors.email}</small>}
      <input name="password" type="password" required />
      {state.error && <p role="alert">{state.error}</p>}
      <button disabled={pending}>Sign in</button>
    </form>
  );
}
```

### Booking and payment
```tsx
'use client';
import { useActionState } from 'react';
import { checkoutAction } from '@/app/checkout/actions';

export function CheckoutForm({ productId, date }: { productId: string; date: string }) {
  const [state, action, pending] = useActionState(checkoutAction, {});
  return (
    <form action={action}>
      <input type="hidden" name="visit_date" value={date} />
      <input type="hidden" name="items[0][ticket_product_id]" value={productId} />
      <input name="items[0][adults]" type="number" min={0} max={50} defaultValue={1} />
      <input name="items[0][children]" type="number" min={0} max={50} defaultValue={0} />
      <input name="full_name" required />
      <input name="phone" inputMode="tel" required />
      {state.fieldErrors?.phone && <small>{state.fieldErrors.phone}</small>}
      <input name="email" type="email" />
      {state.error && <p role="alert">{state.error}</p>}
      <button disabled={pending}>Pay now</button>
    </form>
  );
}
```
The server prices the booking. Show `TicketProduct.pricing_tiers` and
`quantity_discounts` as an estimate only. On success the browser goes to
Flutterwave and comes back to `/booking/<id>`. That page is also the target
of the `/booking/<code>` links in WhatsApp confirmations, and it handles
both.

### Food orders
```ts
const order = await checkoutApi.createFoodOrder({ /* … */ pickup_time: 'asap', items });
if (order.authorization_url) redirect(order.authorization_url); // online mode
// otherwise: pay at the counter; show order.code
```

### Client-side staff screens
Client components can't read the token, so give each one a Route Handler,
as `app/api/staff/checkin/route.ts` does for the gate scanner:
```ts
const res = await fetch('/api/staff/checkin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ticket_code: scanned }),
});
const body = await res.json(); // CheckInResult, or { message } to show on failure
```

## Error handling
`ApiError` exposes `status`, `errorCode`, `message` (safe to show),
`fieldErrors`/`fieldErrorMap` and `retryAfter`, plus the helpers
`isUnauthorized`, `isForbidden`, `isNotFound`, `isConflict`, `isValidation`
and `isRateLimited`.

| Status | Meaning | Frontend action |
|---|---|---|
| 401 | No session, or it was revoked | Send to `/login?redirect=…` (middleware already tried a refresh) |
| 403 | Wrong role | Hide the action, or show a notice |
| 404 | Not found | `notFound()` |
| 409 | Conflict (email taken, slug in use) | Inline message |
| 422 | Validation, closed day, booking not payable | Map `fieldErrorMap` to fields and show `message` |
| 429 | Rate limited | Show `message`, wait `retryAfter` seconds |
| 502 | Payment provider unavailable | "Try again in a moment" |

## Money, dates, phones
- Money is a **number of naira** on every public view. Admin records and the
  revenue report use decimal strings. Format with
  `Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })`.
- Dates are `YYYY-MM-DD` and times `HH:MM`, in **West Africa Time**. Work out
  "today" in `Africa/Lagos`, not the browser's zone.
- Phones must be `+234…`. Run inputs through `normalizeNgPhone` first.
- Request bodies must not carry extra fields: the API rejects unknown
  properties.

## Production notes
- **Several Next.js instances:** the single-flight refresh is per instance.
  If two instances refresh the same token at the same moment, reuse
  detection logs the user out. Sticky sessions avoid this; so does a shared
  lock, e.g. Redis keyed by the refresh token.
- Set `TRUST_PROXY_HOPS=1` on the API, or every visitor shares one rate limit.
- `SITE_URL`'s origin must be in the API's `FRONTEND_ORIGINS`, or initiating
  payment answers 422 on `redirect_url`.
- Cookies are `Secure` when `NODE_ENV=production` (HTTPS required).
- Middleware gating is UX only. The API re-checks the role on every request.
