// Thin data-access helpers over the D1 binding. Keeping the SQL in one place
// makes the route handlers easy to read.

export interface ScoreRow {
  id: number;
  game_id: string;
  board_id: string;
  player_name: string;
  score: number;
  metadata_json: string | null;
  created_at: string;
}

/** Returns true if the game is registered and active. */
export async function isGameActive(db: D1Database, gameId: string): Promise<boolean> {
  const row = await db
    .prepare("SELECT is_active FROM games WHERE game_id = ?")
    .bind(gameId)
    .first<{ is_active: number }>();
  return !!row && row.is_active === 1;
}

/** Reads the sort direction for a board, defaulting to descending. */
export async function getSortDirection(
  db: D1Database,
  gameId: string,
  boardId: string,
): Promise<"asc" | "desc"> {
  const row = await db
    .prepare(
      "SELECT sort_direction FROM leaderboard_configs WHERE game_id = ? AND board_id = ?",
    )
    .bind(gameId, boardId)
    .first<{ sort_direction: string }>();
  return row?.sort_direction === "asc" ? "asc" : "desc";
}

export interface InsertScoreInput {
  gameId: string;
  boardId: string;
  playerName: string;
  score: number;
  metadataJson: string | null;
  ipHash: string | null;
  userAgentHash: string | null;
}

/** Inserts a score and returns the stored row. */
export async function insertScore(
  db: D1Database,
  input: InsertScoreInput,
): Promise<ScoreRow> {
  const result = await db
    .prepare(
      `INSERT INTO leaderboard_scores
        (game_id, board_id, player_name, score, metadata_json, ip_hash, user_agent_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       RETURNING id, game_id, board_id, player_name, score, metadata_json, created_at`,
    )
    .bind(
      input.gameId,
      input.boardId,
      input.playerName,
      input.score,
      input.metadataJson,
      input.ipHash,
      input.userAgentHash,
    )
    .first<ScoreRow>();
  if (!result) throw new Error("Failed to insert score");
  return result;
}

/** Reads the top scores for a board. */
export async function getTopScores(
  db: D1Database,
  gameId: string,
  boardId: string,
  limit: number,
  direction: "asc" | "desc",
): Promise<ScoreRow[]> {
  // `direction` is constrained to "asc" | "desc" above, so it is safe to
  // interpolate; everything else is bound as a parameter.
  const order = direction === "asc" ? "ASC" : "DESC";
  const { results } = await db
    .prepare(
      `SELECT id, game_id, board_id, player_name, score, metadata_json, created_at
       FROM leaderboard_scores
       WHERE game_id = ? AND board_id = ?
       ORDER BY score ${order}, created_at ASC
       LIMIT ?`,
    )
    .bind(gameId, boardId, limit)
    .all<ScoreRow>();
  return results ?? [];
}

export interface InsertEventInput {
  gameId: string;
  buildId: string | null;
  sessionId: string | null;
  eventName: string;
  metadataJson: string | null;
}

/** Inserts an analytics event. */
export async function insertEvent(
  db: D1Database,
  input: InsertEventInput,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO analytics_events
        (game_id, build_id, session_id, event_name, metadata_json)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(
      input.gameId,
      input.buildId,
      input.sessionId,
      input.eventName,
      input.metadataJson,
    )
    .run();
}

/** Shapes a stored score row for the public API response. */
export function serializeScore(row: ScoreRow) {
  return {
    id: row.id,
    gameId: row.game_id,
    boardId: row.board_id,
    playerName: row.player_name,
    score: row.score,
    metadata: row.metadata_json ? JSON.parse(row.metadata_json) : null,
    createdAt: row.created_at,
  };
}
