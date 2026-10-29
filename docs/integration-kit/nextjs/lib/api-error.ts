import type { ErrorEnvelope, FieldError } from '@park-vega/api-types';

/**
 * Thrown by the API client when the backend returns a non-2xx response.
 * Carries the backend's error envelope so the UI can branch on `errorCode`
 * and put validation `errors` (422) next to their form fields. `message` is
 * written for end users and safe to display.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly errorCode: string;
  readonly fieldErrors?: FieldError[];
  /** Seconds to wait before retrying, from a 429's headers. */
  readonly retryAfter?: number;

  constructor(
    status: number,
    envelope: Pick<ErrorEnvelope, 'errorCode' | 'message' | 'errors'>,
    retryAfter?: number,
  ) {
    super(envelope.message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = envelope.errorCode;
    this.fieldErrors = envelope.errors;
    this.retryAfter = retryAfter;
  }

  /** Validation errors as a { field: message } record (first message wins). */
  get fieldErrorMap(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const e of this.fieldErrors ?? []) map[e.field] ??= e.message;
    return map;
  }

  get isUnauthorized() {
    return this.status === 401;
  }
  get isForbidden() {
    return this.status === 403;
  }
  get isNotFound() {
    return this.status === 404;
  }
  get isConflict() {
    return this.status === 409;
  }
  get isValidation() {
    return this.status === 422;
  }
  get isRateLimited() {
    return this.status === 429;
  }
}
