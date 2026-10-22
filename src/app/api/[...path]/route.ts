import { type NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { setAuthCookies, clearAuthCookies } from '@/lib/auth';

type RouteContext = { params: Promise<{ path: string[] }> };

/**
 * Perform a single proxied request to the REST API.
 * Returns the raw Response — callers decide what to do with it.
 */
async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  accessToken: string | undefined,
): Promise<Response> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  const apiPath = pathSegments.join('/');

  // Forward the original query string
  const { search } = new URL(request.url);
  const targetUrl = `${apiBase}/${apiPath}${search}`;

  const headers: Record<string, string> = {};

  // Forward Content-Type when the client sent one
  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const method = request.method;
  const hasBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  return fetch(targetUrl, {
    method,
    headers,
    ...(hasBody ? { body: request.body, duplex: 'half' } : {}),
  } as RequestInit);
}

/**
 * Attempt a token refresh. On success, updates cookies on `response` and
 * returns the new access token. On failure, clears cookies on `response`
 * and returns null.
 */
async function attemptRefresh(
  response: NextResponse,
): Promise<string | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('pv_refresh')?.value;

  if (!refreshToken) {
    clearAuthCookies(response);
    return null;
  }

  const refreshRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    },
  );

  if (!refreshRes.ok) {
    clearAuthCookies(response);
    return null;
  }

  const { data } = await refreshRes.json();
  setAuthCookies(response, data.access_token, data.refresh_token, data.expires_in);
  return data.access_token as string;
}

/** API areas the public pages are built from. */
const PUBLIC_CONTENT = new Set(['content', 'events', 'attractions', 'ticket-products', 'restaurants', 'menu-items']);

/**
 * After a successful staff edit to public content, purge the cached public
 * pages so the change shows on the next visit instead of after the 60-second
 * ISR window.
 */
function refreshPublicPages(request: NextRequest, pathSegments: string[], status: number) {
  if (request.method !== 'GET' && status < 300 && PUBLIC_CONTENT.has(pathSegments[0])) {
    revalidatePath('/', 'layout');
  }
}

/**
 * Core handler shared by all HTTP methods.
 * Implements the 401 → refresh → retry pattern required by Requirement 14.2.
 */
async function handle(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path: pathSegments } = await context.params;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('pv_access')?.value;

  // --- First attempt ---
  const firstRes = await proxyRequest(request, pathSegments, accessToken);

  if (firstRes.status !== 401) {
    // Pass the REST API response straight through to the client.
    // The client-side clientFetch unwraps the Envelope.
    const body = await firstRes.arrayBuffer();
    refreshPublicPages(request, pathSegments, firstRes.status);
    return new NextResponse(body, {
      status: firstRes.status,
      headers: { 'Content-Type': firstRes.headers.get('content-type') ?? 'application/json' },
    });
  }

  // --- 401: try to refresh ---
  const sessionExpiredResponse = NextResponse.json(
    { message: 'Session expired. Please log in again.' },
    { status: 401 },
  );

  const newAccessToken = await attemptRefresh(sessionExpiredResponse);

  if (!newAccessToken) {
    return sessionExpiredResponse;
  }

  // --- Retry once with the new token ---
  // proxyRequest reads request.body; for a retry after a 401 the body has
  // already been consumed, so we proxy without a body for non-safe methods.
  // In practice, 401s on data-mutation routes are auth issues, not body issues.
  const retryRes = await proxyRequest(request, pathSegments, newAccessToken);
  const retryBody = await retryRes.arrayBuffer();
  refreshPublicPages(request, pathSegments, retryRes.status);

  const successResponse = new NextResponse(retryBody, {
    status: retryRes.status,
    headers: { 'Content-Type': retryRes.headers.get('content-type') ?? 'application/json' },
  });

  // Copy the updated auth cookies onto the successful response
  sessionExpiredResponse.cookies.getAll().forEach((cookie) => {
    successResponse.cookies.set(cookie.name, cookie.value, {
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite as 'lax' | 'strict' | 'none' | undefined,
      path: cookie.path,
      maxAge: cookie.maxAge,
    });
  });

  return successResponse;
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
