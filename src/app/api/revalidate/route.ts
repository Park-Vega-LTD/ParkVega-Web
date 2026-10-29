import { timingSafeEqual } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

function secretMatches(given: string | null): boolean {
  const expected = process.env.REVALIDATE_SECRET
  if (!expected || !given) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * POST /api/revalidate
 *
 * Called by the staff console (parkvega-admin) after an edit to public
 * content, so the change shows on the next visit instead of after the
 * 60-second ISR window. Guarded by the shared `REVALIDATE_SECRET`, sent in
 * the `x-revalidate-secret` header.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!secretMatches(request.headers.get('x-revalidate-secret'))) {
    return NextResponse.json({ message: 'Forbidden.' }, { status: 403 })
  }

  revalidatePath('/', 'layout')
  return NextResponse.json({ revalidated: true }, { status: 200 })
}
