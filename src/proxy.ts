import { jwtVerify } from 'jose'
import { NextRequest, NextResponse } from 'next/server'

import { safeNextPath } from '@/lib/auth-redirect'

const JWT_SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET)

const PROTECTED = ['/my-bookings', '/my-day', '/account', '/ticket', '/admin', '/staff']
// Staff (marketing, park team) manage the CMS; customer booking data stays admin-only.
const ADMIN_ONLY = ['/admin/bookings']
const STAFF_OR_ADMIN = ['/staff', '/admin']
const AUTH_PAGES = ['/login', '/register']

function redirect(req: NextRequest, destination: string) {
  const url = req.nextUrl.clone()
  url.pathname = destination.split('?')[0]
  url.search = destination.includes('?') ? destination.split('?')[1] : ''
  return NextResponse.redirect(url)
}

export async function proxy(req: NextRequest) {
  const token = req.cookies.get('pv_access')?.value
  const path = req.nextUrl.pathname

  const isProtected = PROTECTED.some((p) => path.startsWith(p))
  const isAuthPage = AUTH_PAGES.some((p) => path.startsWith(p))

  if (isProtected) {
    if (!token) {
      return redirect(req, `/login?next=${encodeURIComponent(path)}`)
    }
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET_KEY)
      const role = payload.role as string

      if (ADMIN_ONLY.some((p) => path.startsWith(p)) && role !== 'admin') {
        return redirect(req, '/')
      }
      if (
        STAFF_OR_ADMIN.some((p) => path.startsWith(p)) &&
        role !== 'staff' &&
        role !== 'admin'
      ) {
        return redirect(req, '/')
      }
    } catch {
      // JWT invalid or expired
      return redirect(req, `/login?next=${encodeURIComponent(path)}`)
    }
  }

  if (isAuthPage && token) {
    try {
      await jwtVerify(token, JWT_SECRET_KEY)
      return redirect(req, safeNextPath(req.nextUrl.searchParams.get('next')))
    } catch {
      // expired or invalid token — allow through to auth page
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/my-bookings(.*)',
    '/my-day(.*)',
    '/account(.*)',
    '/ticket(.*)',
    '/admin(.*)',
    '/staff(.*)',
    '/login',
    '/register',
  ],
}
