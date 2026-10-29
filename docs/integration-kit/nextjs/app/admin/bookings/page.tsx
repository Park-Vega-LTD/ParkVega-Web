import { redirect } from 'next/navigation';
import { BookingState } from '@park-vega/api-types';
import { adminApi } from '../../../lib/services';
import { ApiError } from '../../../lib/api-error';

const naira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
});

/**
 * Admin bookings list, cursor-paginated. /admin/* is admin-only on the API
 * (middleware lets staff into /admin, so staff get a 403 here). These are
 * raw records: uppercase `status` and decimal-string amounts.
 */
export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const status = Object.values(BookingState).includes(sp.status as BookingState)
    ? (sp.status as BookingState)
    : undefined;

  try {
    const page = await adminApi.listBookings({ cursor: sp.cursor, status, limit: 50 });

    return (
      <main>
        <h1>Bookings</h1>
        <table>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Name</th>
              <th>Status</th>
              <th>Total</th>
              <th>Visit date</th>
            </tr>
          </thead>
          <tbody>
            {page.data.map((b) => (
              <tr key={b.id}>
                <td>{b.code}</td>
                <td>{b.full_name}</td>
                <td>{b.status}</td>
                <td>{naira.format(Number(b.total_amount))}</td>
                <td>{b.visit_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {page.hasMore && page.nextCursor && (
          <a
            href={`/admin/bookings?cursor=${encodeURIComponent(page.nextCursor)}${
              status ? `&status=${status}` : ''
            }`}
          >
            Next page →
          </a>
        )}
      </main>
    );
  } catch (err) {
    if (err instanceof ApiError && err.isUnauthorized) {
      redirect('/login?redirect=/admin/bookings');
    }
    if (err instanceof ApiError && err.isForbidden) {
      return (
        <main>
          <h1>Admins only</h1>
          <p>Customer bookings are visible to admins.</p>
        </main>
      );
    }
    throw err;
  }
}
