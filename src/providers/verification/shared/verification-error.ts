/**
 * shared/verification-error.ts
 */

export type VerificationErrorCode =
  | "INTERNAL_ERROR"
  | "PROVIDER_UNAVAILABLE"
  | "AUTHENTICATION_FAILED"
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "ALREADY_EXISTS"
  | "UNAUTHORIZED"
  | "FORBIDDEN";

export class VerificationError extends Error {
  constructor(
    public readonly provider: string,
    public readonly code: VerificationErrorCode,
    message: string,
    public readonly raw?: any,
  ) {
    super(`[${provider}:${code}] ${message}`);
    this.name = "VerificationError";
  }
}
