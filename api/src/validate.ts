// Server-side validation for incoming requests.
//
// Everything the browser sends is untrusted, so each endpoint runs its body
// through these helpers before touching the database. The rules are
// deliberately strict but simple — V1 is trust-based, but we still refuse
// obviously malformed or oversized input.

export const LIMITS = {
  /** Max characters for a player's display name. */
  PLAYER_NAME_MAX: 24,
  /** Highest score we will accept (guards against overflow / nonsense). */
  SCORE_MAX: 1_000_000_000,
  /** Max characters for an event name. */
  EVENT_NAME_MAX: 64,
  /** Max characters for an id-like field (gameId, boardId, sessionId, buildId). */
  ID_MAX: 64,
  /** Max serialized size of a metadata object, in bytes. */
  METADATA_MAX_BYTES: 2048,
  /** Hard cap on leaderboard rows returned, regardless of requested limit. */
  LEADERBOARD_LIMIT_MAX: 100,
  /** Default leaderboard limit when none is supplied. */
  LEADERBOARD_LIMIT_DEFAULT: 10,
} as const;

export class ValidationError extends Error {}

/** Removes ASCII control characters that would corrupt display/storage. */
function stripControlChars(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001F\u007F]/g, "");
}

/** Validates a short id-like string (gameId, boardId, etc.). */
export function validateId(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new ValidationError(`${field} is required and must be a string`);
  }
  const trimmed = value.trim();
  if (!trimmed) throw new ValidationError(`${field} must not be empty`);
  if (trimmed.length > LIMITS.ID_MAX) {
    throw new ValidationError(`${field} must be at most ${LIMITS.ID_MAX} characters`);
  }
  return trimmed;
}

/** Validates an optional id-like string, returning null when absent. */
export function validateOptionalId(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  return validateId(value, field);
}

/** Validates a player display name. */
export function validatePlayerName(value: unknown): string {
  if (typeof value !== "string") {
    throw new ValidationError("playerName is required and must be a string");
  }
  const cleaned = stripControlChars(value).trim();
  if (!cleaned) throw new ValidationError("playerName must not be empty");
  if (cleaned.length > LIMITS.PLAYER_NAME_MAX) {
    throw new ValidationError(
      `playerName must be at most ${LIMITS.PLAYER_NAME_MAX} characters`,
    );
  }
  return cleaned;
}

/** Validates a numeric score. */
export function validateScore(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ValidationError("score must be a finite number");
  }
  const score = Math.trunc(value);
  if (score < 0) throw new ValidationError("score must not be negative");
  if (score > LIMITS.SCORE_MAX) {
    throw new ValidationError(`score must be at most ${LIMITS.SCORE_MAX}`);
  }
  return score;
}

/** Validates an analytics event name. */
export function validateEventName(value: unknown): string {
  if (typeof value !== "string") {
    throw new ValidationError("eventName is required and must be a string");
  }
  const trimmed = value.trim();
  if (!trimmed) throw new ValidationError("eventName must not be empty");
  if (trimmed.length > LIMITS.EVENT_NAME_MAX) {
    throw new ValidationError(
      `eventName must be at most ${LIMITS.EVENT_NAME_MAX} characters`,
    );
  }
  return trimmed;
}

/**
 * Validates optional metadata. Returns a JSON string ready for storage, or
 * null when no metadata was supplied. Rejects non-objects and oversized blobs.
 */
export function validateMetadata(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError("metadata must be an object");
  }
  let json: string;
  try {
    json = JSON.stringify(value);
  } catch {
    throw new ValidationError("metadata must be JSON-serializable");
  }
  // Byte length matters for storage; use the UTF-8 encoded size.
  const bytes = new TextEncoder().encode(json).length;
  if (bytes > LIMITS.METADATA_MAX_BYTES) {
    throw new ValidationError(
      `metadata must be at most ${LIMITS.METADATA_MAX_BYTES} bytes when serialized`,
    );
  }
  return json;
}

/** Clamps a requested leaderboard limit into the safe range. */
export function clampLimit(raw: string | null): number {
  if (!raw) return LIMITS.LEADERBOARD_LIMIT_DEFAULT;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return LIMITS.LEADERBOARD_LIMIT_DEFAULT;
  }
  return Math.min(parsed, LIMITS.LEADERBOARD_LIMIT_MAX);
}
