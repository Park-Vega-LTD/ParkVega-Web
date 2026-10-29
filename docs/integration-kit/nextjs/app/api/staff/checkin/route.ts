import { NextResponse } from 'next/server';
import { staffApi } from '../../../../lib/services';
import { ApiError } from '../../../../lib/api-error';

/**
 * Route Handler for the gate scanner, a client component that can't read
 * the httpOnly token. The browser POSTs `{ ticket_code }` here; this handler
 * forwards it with the session's token. Use the same pattern for any
 * client-side staff screen (kitchen board, media upload).
 */
export async function POST(req: Request) {
  const { ticket_code } = (await req.json().catch(() => ({}))) as {
    ticket_code?: unknown;
  };
  if (typeof ticket_code !== 'string' || !ticket_code.trim()) {
    return NextResponse.json({ message: 'Scan a ticket code.' }, { status: 422 });
  }

  try {
    const result = await staffApi.checkIn({ ticket_code: ticket_code.trim() });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json(
        { message: err.message, errorCode: err.errorCode },
        { status: err.status },
      );
    }
    return NextResponse.json({ message: 'Check-in failed.' }, { status: 500 });
  }
}
