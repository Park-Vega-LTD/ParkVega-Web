import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import { API_URL } from '@/lib/api-url'
import { forwardedFor } from '@/lib/forwarded'
import { ACCESS_COOKIE } from '@/lib/session-cookies'
import type { PaginationMeta } from '@/types/api'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export class AuthError extends Error {
  constructor(message = 'Unauthenticated') {
    super(message)
  }
}

type Envelope<T> = { data: T; meta: PaginationMeta }

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
  extraHeaders: Record<string, string> = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.message ?? `API error ${res.status}`)
  }

  const envelope: Envelope<T> = await res.json()
  return envelope.data
}

/**
 * Fetch public, non-personalised data. It never reads cookies, so pages that
 * use it stay statically cached (ISR) instead of hitting the API per request.
 * It sends no correlation ID either: headers are part of Next's fetch cache
 * key, so a fresh ID per call would defeat the cache.
 */
export async function publicFetch<T>(path: string, options?: RequestInit): Promise<T> {
  if (apiDown) {
    // While the API is down no page waits on it. Once per cooldown a call is
    // still sent, unawaited, to notice when the API is back.
    if (Date.now() >= apiDownUntil) {
      apiDownUntil = Date.now() + API_DOWN_COOLDOWN_MS
      apiFetch<T>(path, options).then(
        () => { apiDown = false },
        (err) => { if (err instanceof ApiError) apiDown = false },
      )
    }
    throw new ApiError(503, 'API unreachable')
  }

  // A timer rather than an AbortSignal: passing a signal to fetch opts the
  // call out of Next's request memoization.
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TypeError('API timeout')), PUBLIC_TIMEOUT_MS)
  })

  try {
    return await Promise.race([apiFetch<T>(path, options), timeout])
  } catch (err) {
    // An HTTP error means the API answered; only a network failure or a
    // timeout (both TypeError) marks it as down.
    if (!(err instanceof ApiError)) {
      apiDown = true
      apiDownUntil = Date.now() + API_DOWN_COOLDOWN_MS
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Public pages fall back to built-in content when the API fails, so a slow or
 * unreachable API must not hold up the page. A call gives up after
 * PUBLIC_TIMEOUT_MS, and after one network failure every public call fails
 * immediately, instead of each waiting out its own DNS or connect timeout,
 * until a background check every API_DOWN_COOLDOWN_MS gets an answer.
 */
const PUBLIC_TIMEOUT_MS = 2500
const API_DOWN_COOLDOWN_MS = 30_000
let apiDown = false
let apiDownUntil = 0

/** One correlation ID per server request, so identical fetches still de-duplicate. */
const requestCorrelationId = cache(() => crypto.randomUUID())

/**
 * Fetch with the visitor's session. The proxy has already refreshed an
 * expired session before this render started, and a Server Component can't
 * write cookies, so a 401 here is final: it throws AuthError.
 */
export async function serverFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const accessToken = (await cookies()).get(ACCESS_COOKIE)?.value
  const incoming = await headers()
  const extra = {
    ...forwardedFor(incoming),
    'X-Correlation-ID': incoming.get('x-correlation-id') ?? requestCorrelationId(),
  }

  try {
    return await apiFetch<T>(path, options, accessToken, extra)
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) throw new AuthError()
    throw err
  }
}
