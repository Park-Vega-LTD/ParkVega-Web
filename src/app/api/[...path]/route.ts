import { type NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/auth';
import { API_URL } from '@/lib/api-url';
import { apiHeaders } from '@/lib/forwarded';
import { ACCESS_COOKIE } from '@/lib/session-cookies';

type RouteContext = { params: Promise<{ path: string[] }> };

/** Statuses that must not carry a body, not even an empty one. */
const NO_BODY = new Set([204, 205, 304]);

/** Perform a single proxied request to the REST API. */
async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  accessToken: string | undefined,
): Promise<Response> {
  // Forward the original query string
  const { search } = new URL(request.url);
  const targetUrl = `${API_URL}/${pathSegments.join('/')}${search}`;

  const headers: Record<string, string> = apiHeaders(request.headers);

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
 * Core handler shared by all HTTP methods: forwards the request with the
 * session's bearer token and passes the API's response straight back. The
 * client-side clientFetch unwraps the Envelope.
 *
 * The proxy (src/proxy.ts) has already refreshed an expired session, so a 401
 * here means the session is over (revoked, or the account deactivated). The
 * cookies are cleared and the visitor has to log in again. Refreshing here as
 * well would risk replaying a rotated refresh token.
 */
async function handle(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path: pathSegments } = await context.params;
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;

  const apiRes = await proxyRequest(request, pathSegments, accessToken);

  if (apiRes.status === 401 && accessToken) {
    const response = NextResponse.json(
      { message: 'Session expired. Please log in again.' },
      { status: 401 },
    );
    clearAuthCookies(response);
    return response;
  }

  const headers = new Headers({
    'Content-Type': apiRes.headers.get('content-type') ?? 'application/json',
  });
  const correlationId = apiRes.headers.get('x-correlation-id');
  if (correlationId) headers.set('X-Correlation-ID', correlationId);

  return new NextResponse(NO_BODY.has(apiRes.status) ? null : await apiRes.arrayBuffer(), {
    status: apiRes.status,
    headers,
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
