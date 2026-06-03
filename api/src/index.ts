// Sauce Games Labs — leaderboard + analytics API (Cloudflare Worker).
//
// Routes (all JSON):
//   POST /api/v1/scores
//   GET  /api/v1/leaderboards/:gameId/:boardId?limit=10
//   POST /api/v1/events
//   GET  /api/v1/admin/recent-scores   (token-guarded, optional)
//   GET  /api/v1/admin/recent-events   (token-guarded, optional)
//   GET  /api/v1/admin/stats           (token-guarded, optional)
//
// The Worker is intentionally dependency-free: a tiny hand-rolled matcher
// dispatches the handful of routes below.

import { corsHeaders, handlePreflight, isOriginAllowed } from "./cors";
import {
  getSortDirection,
  getTopScores,
  insertEvent,
  insertScore,
  isGameActive,
  serializeScore,
} from "./db";
import { saltedHash } from "./hash";
import {
  clampLimit,
  validateEventName,
  validateId,
  validateMetadata,
  validateOptionalId,
  validatePlayerName,
  validateScore,
  ValidationError,
} from "./validate";

export interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS?: string;
  HASH_SALT?: string;
  ADMIN_TOKEN?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin") ?? "";

    // Preflight.
    if (request.method === "OPTIONS") {
      return handlePreflight(request, env);
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, ""); // tolerate trailing slash

    try {
      const response = await route(request, env, url, path);
      return withCors(response, origin, env);
    } catch (err) {
      if (err instanceof ValidationError) {
        return withCors(json({ ok: false, error: err.message }, 400), origin, env);
      }
      console.error("Unhandled API error:", err);
      return withCors(
        json({ ok: false, error: "Internal server error" }, 500),
        origin,
        env,
      );
    }
  },
};

async function route(
  request: Request,
  env: Env,
  url: URL,
  path: string,
): Promise<Response> {
  const method = request.method;

  if (method === "GET" && (path === "" || path === "/api/v1" || path === "/api/v1/health")) {
    return json({ ok: true, service: "sauce-api", version: "v1" });
  }

  if (method === "POST" && path === "/api/v1/scores") {
    return handleSubmitScore(request, env);
  }

  if (method === "POST" && path === "/api/v1/events") {
    return handleTrackEvent(request, env);
  }

  // GET /api/v1/leaderboards/:gameId/:boardId
  const lbMatch = path.match(/^\/api\/v1\/leaderboards\/([^/]+)\/([^/]+)$/);
  if (method === "GET" && lbMatch) {
    return handleGetLeaderboard(
      env,
      decodeURIComponent(lbMatch[1]),
      decodeURIComponent(lbMatch[2]),
      url,
    );
  }

  if (method === "GET" && path.startsWith("/api/v1/admin/")) {
    return handleAdmin(request, env, path);
  }

  return json({ ok: false, error: "Not found" }, 404);
}

// POST /api/v1/scores
async function handleSubmitScore(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);

  const gameId = validateId(body.gameId, "gameId");
  const boardId = validateId(body.boardId, "boardId");
  const playerName = validatePlayerName(body.playerName);
  const score = validateScore(body.score);
  const metadataJson = validateMetadata(body.metadata);

  if (!(await isGameActive(env.DB, gameId))) {
    return json({ ok: false, error: `Unknown or inactive gameId: ${gameId}` }, 400);
  }

  const salt = env.HASH_SALT ?? "dev-salt";
  const ipHash = await saltedHash(request.headers.get("CF-Connecting-IP"), salt);
  const userAgentHash = await saltedHash(request.headers.get("User-Agent"), salt);

  const row = await insertScore(env.DB, {
    gameId,
    boardId,
    playerName,
    score,
    metadataJson,
    ipHash,
    userAgentHash,
  });

  return json({ ok: true, score: serializeScore(row) }, 201);
}

// GET /api/v1/leaderboards/:gameId/:boardId?limit=10
async function handleGetLeaderboard(
  env: Env,
  gameIdRaw: string,
  boardIdRaw: string,
  url: URL,
): Promise<Response> {
  const gameId = validateId(gameIdRaw, "gameId");
  const boardId = validateId(boardIdRaw, "boardId");
  const limit = clampLimit(url.searchParams.get("limit"));

  const direction = await getSortDirection(env.DB, gameId, boardId);
  const rows = await getTopScores(env.DB, gameId, boardId, limit, direction);

  return json({
    ok: true,
    gameId,
    boardId,
    limit,
    entries: rows.map(serializeScore),
  });
}

// POST /api/v1/events
async function handleTrackEvent(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);

  const gameId = validateId(body.gameId, "gameId");
  const buildId = validateOptionalId(body.buildId, "buildId");
  const sessionId = validateOptionalId(body.sessionId, "sessionId");
  const eventName = validateEventName(body.eventName);
  const metadataJson = validateMetadata(body.metadata);

  if (!(await isGameActive(env.DB, gameId))) {
    return json({ ok: false, error: `Unknown or inactive gameId: ${gameId}` }, 400);
  }

  await insertEvent(env.DB, {
    gameId,
    buildId,
    sessionId,
    eventName,
    metadataJson,
  });

  return json({ ok: true });
}

// GET /api/v1/admin/* — lightweight debug views, guarded by ADMIN_TOKEN.
async function handleAdmin(request: Request, env: Env, path: string): Promise<Response> {
  if (!env.ADMIN_TOKEN) {
    return json({ ok: false, error: "Admin endpoints are disabled" }, 404);
  }
  const url = new URL(request.url);
  const token =
    request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ??
    url.searchParams.get("token") ??
    "";
  if (token !== env.ADMIN_TOKEN) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  if (path === "/api/v1/admin/recent-scores") {
    const { results } = await env.DB.prepare(
      `SELECT id, game_id, board_id, player_name, score, metadata_json, created_at
       FROM leaderboard_scores ORDER BY id DESC LIMIT 50`,
    ).all();
    return json({ ok: true, scores: results });
  }

  if (path === "/api/v1/admin/recent-events") {
    const { results } = await env.DB.prepare(
      `SELECT id, game_id, build_id, session_id, event_name, metadata_json, created_at
       FROM analytics_events ORDER BY id DESC LIMIT 50`,
    ).all();
    return json({ ok: true, events: results });
  }

  if (path === "/api/v1/admin/stats") {
    return json({ ok: true, stats: await computeStats(env.DB, url) });
  }

  return json({ ok: false, error: "Not found" }, 404);
}

// Aggregate counts that answer the V1 analytics questions.
async function computeStats(db: D1Database, url: URL) {
  const gameId = url.searchParams.get("gameId") ?? "clicker-demo";

  const plays = await db
    .prepare(
      "SELECT COUNT(*) AS n FROM analytics_events WHERE game_id = ? AND event_name = 'game_start'",
    )
    .bind(gameId)
    .first<{ n: number }>();

  const uniqueSessions = await db
    .prepare(
      "SELECT COUNT(DISTINCT session_id) AS n FROM analytics_events WHERE game_id = ?",
    )
    .bind(gameId)
    .first<{ n: number }>();

  // Average play time pulled from game_end metadata.duration (seconds).
  const avgDuration = await db
    .prepare(
      `SELECT AVG(CAST(json_extract(metadata_json, '$.duration') AS REAL)) AS v
       FROM analytics_events
       WHERE game_id = ? AND event_name = 'game_end'`,
    )
    .bind(gameId)
    .first<{ v: number | null }>();

  const scores = await db
    .prepare("SELECT COUNT(*) AS n, AVG(score) AS avg FROM leaderboard_scores WHERE game_id = ?")
    .bind(gameId)
    .first<{ n: number; avg: number | null }>();

  const leaderboardViews = await db
    .prepare(
      "SELECT COUNT(*) AS n FROM analytics_events WHERE game_id = ? AND event_name = 'leaderboard_view'",
    )
    .bind(gameId)
    .first<{ n: number }>();

  const { results: builds } = await db
    .prepare(
      `SELECT build_id, COUNT(*) AS events
       FROM analytics_events WHERE game_id = ? AND build_id IS NOT NULL
       GROUP BY build_id ORDER BY events DESC`,
    )
    .bind(gameId)
    .all();

  return {
    gameId,
    gamesPlayed: plays?.n ?? 0,
    uniqueSessions: uniqueSessions?.n ?? 0,
    avgPlayTimeSeconds: avgDuration?.v ?? null,
    scoresSubmitted: scores?.n ?? 0,
    avgScore: scores?.avg ?? null,
    leaderboardViews: leaderboardViews?.n ?? 0,
    builds,
  };
}

// --- small helpers --------------------------------------------------------

async function readJson(request: Request): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ValidationError("Request body must be a JSON object");
  }
  return body as Record<string, unknown>;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function withCors(response: Response, origin: string, env: Env): Response {
  const headers = new Headers(response.headers);
  const cors = corsHeaders(origin, env);
  for (const [k, v] of Object.entries(cors)) headers.set(k, v);
  // Only expose the body to allowed origins; others still get a response but
  // the browser will block reads without the Allow-Origin header.
  if (origin && !isOriginAllowed(origin, env)) {
    headers.delete("Access-Control-Allow-Origin");
  }
  return new Response(response.body, { status: response.status, headers });
}
