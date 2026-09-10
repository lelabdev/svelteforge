/**
 * Public sign-up policy (#318) — resolved ONCE from `SIGNUP_MODE` and
 * enforced server-side by the Better Auth config, never by the UI.
 *
 * Modes:
 * - `closed` (DEFAULT): no public sign-up at all (`disableSignUp`). Users are
 *   created by an admin from `/admin/users` (always role `user`), and the very
 *   first administrator by the bootstrap (`<pm> run admin:create` — see package.json — or the
 *   dev-only `/setup` route).
 * - `invite-only`: `POST /api/auth/sign-up/email` is allowed ONLY for a
 *   pre-approved email (an unexpired, unaccepted row in the `invitation`
 *   table). Invitations are created by an admin from `/admin/users`.
 * - `self-service`: anyone may register. Safe by construction: the admin
 *   status is an explicit persisted `role`, and sign-up can never set it —
 *   every self-registered user is `role = 'user'`.
 *
 * SECURITY: unknown or missing values FAIL CLOSED to `closed`. A typo in the
 * environment can only ever shrink the public surface, never widen it.
 */
export const SIGNUP_MODES = ['closed', 'invite-only', 'self-service'] as const;

export type SignupMode = (typeof SIGNUP_MODES)[number];

export const DEFAULT_SIGNUP_MODE: SignupMode = 'closed';

/** Resolves a raw environment value to a sign-up mode — unknown ⇒ closed. */
export function resolveSignupMode(value: string | undefined): SignupMode {
	return (SIGNUP_MODES as readonly string[]).includes(value ?? '')
		? (value as SignupMode)
		: DEFAULT_SIGNUP_MODE;
}
