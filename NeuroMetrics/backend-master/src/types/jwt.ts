/**
 * JWT token payload shape used by the application.
 *
 * Include commonly used fields: `sub` (subject / user id), `email`, `iat`, and `exp`.
 * Extend this interface when you add more claims to your tokens.
 */
export interface TokenPayload {
  /** Subject (user id) */
  sub: string;
  /** User email */
  email?: string;
  /** Issued at time (timestamp) */
  iat?: number;
  /** Expiration time (timestamp) */
  exp?: number;
  // Allow other claims
  [key: string]: any;
}
