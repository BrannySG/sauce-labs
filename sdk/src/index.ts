/**
 * Sauce Games SDK (browser, V1)
 * =============================
 *
 * A tiny, framework-agnostic client that lets a static web game talk to the
 * Sauce Games backend for leaderboards and analytics — without ever calling
 * the API directly.
 *
 * Quick start:
 *
 *   import { Sauce } from "@sauce/sdk";
 *
 *   const sauce = Sauce.init({ gameId: "clicker-demo", buildId: "v0.1.0" });
 *   sauce.analytics.startSession();
 *   sauce.analytics.track("game_start");
 *
 *   await sauce.leaderboards.submitScore({
 *     boardId: "main",
 *     playerName: "Branny",
 *     score: 123,
 *   });
 *
 *   const board = await sauce.leaderboards.getTop({ boardId: "main", limit: 10 });
 *
 * There are no secrets in the browser — the SDK only sends public game data.
 */

// --- Public types ---------------------------------------------------------

export interface SauceConfig {
  /** Unique id for your game, e.g. "clicker-demo". Registered in the backend. */
  gameId: string;
  /** Build/version string, e.g. "v0.1.0". Attached to every analytics event. */
  buildId: string;
  /**
   * Base URL of the Sauce API. Defaults to the production API.
   * For local development pass e.g. "http://localhost:8787".
   */
  apiBaseUrl?: string;
}

export interface SubmitScoreInput {
  boardId: string;
  playerName: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface GetTopInput {
  boardId: string;
  limit?: number;
}

export interface LeaderboardEntry {
  id: number;
  gameId: string;
  boardId: string;
  playerName: string;
  score: number;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

/** Default events the SDK and games commonly emit. Free-form names are fine too. */
export type SauceEventName =
  | "session_start"
  | "session_end"
  | "game_start"
  | "game_end"
  | "score_submit"
  | "click"
  | "leaderboard_view"
  | (string & {});

const DEFAULT_API_BASE_URL = "https://api.saucegames.io";

/** Limits mirrored from the server so we fail fast before any network call. */
const PLAYER_NAME_MAX = 24;
const SCORE_MAX = 1_000_000_000;
const SESSION_STORAGE_KEY = "sauce.sessionId";

// --- Analytics module ------------------------------------------------------

class Analytics {
  private sessionId: string;

  constructor(
    private readonly gameId: string,
    private readonly buildId: string,
    private readonly apiBaseUrl: string,
  ) {
    this.sessionId = this.loadOrCreateSessionId();
  }

  /** The current session id (a random UUID). */
  getSessionId(): string {
    return this.sessionId;
  }

  /** Starts a new analytics session and emits `session_start`. */
  startSession(metadata?: Record<string, unknown>): void {
    // Fresh id per explicit session start, so distinct plays are distinct
    // sessions even within the same page load.
    this.sessionId = createUuid();
    persistSessionId(this.sessionId);
    this.track("session_start", metadata);
  }

  /**
   * Ends the current session and emits `session_end`. Uses `sendBeacon` when
   * available so it still fires reliably during page unload.
   */
  endSession(metadata?: Record<string, unknown>): void {
    this.track("session_end", metadata, { preferBeacon: true });
  }

  /**
   * Tracks an arbitrary event. Fire-and-forget: failures are swallowed and
   * never block gameplay. Every event automatically includes gameId, buildId,
   * sessionId and a timestamp.
   */
  track(
    eventName: SauceEventName,
    metadata?: Record<string, unknown>,
    opts?: { preferBeacon?: boolean },
  ): void {
    const name = String(eventName ?? "").trim();
    if (!name) {
      console.warn("[Sauce] track() called with an empty eventName; ignoring.");
      return;
    }

    const payload = {
      gameId: this.gameId,
      buildId: this.buildId,
      sessionId: this.sessionId,
      eventName: name,
      timestamp: new Date().toISOString(),
      metadata: metadata ?? {},
    };

    const url = `${this.apiBaseUrl}/api/v1/events`;
    const bodyText = JSON.stringify(payload);

    // During unload, sendBeacon is the only reliable transport.
    if (opts?.preferBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
      try {
        const blob = new Blob([bodyText], { type: "application/json" });
        navigator.sendBeacon(url, blob);
        return;
      } catch {
        // Fall through to fetch below.
      }
    }

    // Normal path: keepalive lets short requests survive a navigation.
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: bodyText,
      keepalive: true,
    }).catch(() => {
      /* analytics is best-effort; never throw */
    });
  }

  private loadOrCreateSessionId(): string {
    const existing = readPersistedSessionId();
    if (existing) return existing;
    const id = createUuid();
    persistSessionId(id);
    return id;
  }
}

// --- Leaderboards module ---------------------------------------------------

class Leaderboards {
  constructor(
    private readonly gameId: string,
    private readonly apiBaseUrl: string,
  ) {}

  /**
   * Submits a score. Validates input client-side first and throws a clear
   * Error on bad input or a failed request. Returns the stored entry.
   */
  async submitScore(input: SubmitScoreInput): Promise<LeaderboardEntry> {
    const boardId = requireNonEmpty(input?.boardId, "boardId");
    const playerName = validatePlayerName(input?.playerName);
    const score = validateScore(input?.score);
    if (input?.metadata !== undefined && !isPlainObject(input.metadata)) {
      throw new Error("[Sauce] metadata must be an object");
    }

    const res = await fetch(`${this.apiBaseUrl}/api/v1/scores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameId: this.gameId,
        boardId,
        playerName,
        score,
        metadata: input.metadata,
      }),
    });

    const data = await parseJsonSafe(res);
    if (!res.ok || !data?.ok) {
      throw new Error(`[Sauce] submitScore failed: ${data?.error ?? res.status}`);
    }
    return data.score as LeaderboardEntry;
  }

  /** Fetches the top entries for a board (highest first by default). */
  async getTop(input: GetTopInput): Promise<LeaderboardEntry[]> {
    const boardId = requireNonEmpty(input?.boardId, "boardId");
    const limit = input?.limit ?? 10;

    const url =
      `${this.apiBaseUrl}/api/v1/leaderboards/` +
      `${encodeURIComponent(this.gameId)}/${encodeURIComponent(boardId)}` +
      `?limit=${encodeURIComponent(String(limit))}`;

    const res = await fetch(url, { method: "GET" });
    const data = await parseJsonSafe(res);
    if (!res.ok || !data?.ok) {
      throw new Error(`[Sauce] getTop failed: ${data?.error ?? res.status}`);
    }
    return (data.entries ?? []) as LeaderboardEntry[];
  }
}

// --- Client + entry point --------------------------------------------------

export class SauceClient {
  readonly gameId: string;
  readonly buildId: string;
  readonly apiBaseUrl: string;
  readonly analytics: Analytics;
  readonly leaderboards: Leaderboards;

  constructor(config: SauceConfig) {
    this.gameId = requireNonEmpty(config?.gameId, "gameId");
    this.buildId = requireNonEmpty(config?.buildId, "buildId");
    this.apiBaseUrl = (config.apiBaseUrl ?? DEFAULT_API_BASE_URL).replace(/\/+$/, "");
    this.analytics = new Analytics(this.gameId, this.buildId, this.apiBaseUrl);
    this.leaderboards = new Leaderboards(this.gameId, this.apiBaseUrl);
  }
}

/**
 * Initializes the SDK and returns a configured client.
 *
 * Exposed as a top-level export so the IIFE build's global works as
 * `window.Sauce.init(...)`, and `Sauce.init(...)` works for ESM consumers.
 */
export function init(config: SauceConfig): SauceClient {
  return new SauceClient(config);
}

export const Sauce = { init };

// --- Validation + small utilities -----------------------------------------

function requireNonEmpty(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`[Sauce] ${field} is required and must be a non-empty string`);
  }
  return value.trim();
}

function validatePlayerName(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("[Sauce] playerName is required and must not be empty");
  }
  const name = value.trim();
  if (name.length > PLAYER_NAME_MAX) {
    throw new Error(`[Sauce] playerName must be at most ${PLAYER_NAME_MAX} characters`);
  }
  return name;
}

function validateScore(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error("[Sauce] score must be a finite number");
  }
  if (value < 0) throw new Error("[Sauce] score must not be negative");
  if (value > SCORE_MAX) throw new Error(`[Sauce] score must be at most ${SCORE_MAX}`);
  return Math.trunc(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for older environments.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function readPersistedSessionId(): string | null {
  try {
    return typeof localStorage !== "undefined"
      ? localStorage.getItem(SESSION_STORAGE_KEY)
      : null;
  } catch {
    return null;
  }
}

function persistSessionId(id: string): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(SESSION_STORAGE_KEY, id);
    }
  } catch {
    /* ignore storage failures (private mode, etc.) */
  }
}

async function parseJsonSafe(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// Default export for convenience: `import Sauce from "@sauce/sdk"`.
export default Sauce;

// Note for <script> tag (IIFE) users: the build sets the global to this
// module's namespace under `name: "Sauce"`, so `Sauce.init({...})` works
// directly thanks to the top-level `init` export above.
