import 'server-only'

import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET)

/** Role from the verified `pv_access` JWT, or null when signed out / invalid. */
export async function getSessionRole(): Promise<string | null> {
  const token = (await cookies()).get('pv_access')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_KEY)
    return typeof payload.role === 'string' ? payload.role : null
  } catch {
    return null
  }
}
