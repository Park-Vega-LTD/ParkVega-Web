'use server';

import { redirect } from 'next/navigation';
import { authApi } from '../../lib/services';
import { setTokens, getRefreshToken, clearTokens } from '../../lib/tokens';
import { ApiError } from '../../lib/api-error';

export interface AuthActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

/** Only same-site paths, so ?redirect= can't send users off-site. */
function safeRedirect(value: FormDataEntryValue | null): string {
  const path = typeof value === 'string' ? value : '';
  return path.startsWith('/') && !path.startsWith('//') ? path : '/account';
}

function toState(err: unknown, fallback: string): AuthActionState {
  if (err instanceof ApiError) {
    // The API's messages are written for users, including 401 "Invalid
    // credentials" and the 429 rate-limit notice.
    return { error: err.message, fieldErrors: err.fieldErrorMap };
  }
  return { error: fallback };
}

/**
 * Server Action: log in. The session's tokens go into httpOnly cookies, then
 * the user is sent on to `redirect` (from the login page's query string).
 */
export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  try {
    const session = await authApi.login({
      email: String(formData.get('email') ?? '').trim(),
      password: String(formData.get('password') ?? ''),
    });
    await setTokens(session);
  } catch (err) {
    return toState(err, 'Login failed. Please try again.');
  }

  redirect(safeRedirect(formData.get('redirect')));
}

/** Server Action: register (which returns no tokens), then log in. */
export async function registerAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  try {
    await authApi.register({
      email,
      password,
      first_name: String(formData.get('first_name') ?? '').trim(),
      last_name: String(formData.get('last_name') ?? '').trim(),
    });
    await setTokens(await authApi.login({ email, password }));
  } catch (err) {
    return toState(err, 'Registration failed. Please try again.');
  }

  redirect('/account');
}

/** Server Action: revoke the session on the API, then clear cookies. */
export async function logoutAction(): Promise<void> {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    try {
      await authApi.logout(refreshToken);
    } catch {
      // Best effort; the cookies are cleared either way.
    }
  }
  await clearTokens();
  redirect('/login');
}
