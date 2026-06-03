-- Sauce Games Labs — V1 database schema (Cloudflare D1 / SQLite)
--
-- Apply locally:  npm run db:local
-- Apply remote:   npm run db:remote
--
-- The schema is idempotent (IF NOT EXISTS + INSERT OR IGNORE) so it is safe
-- to re-run. Adding a new game is just an INSERT into `games` — no code change.

-- Registered games. A score/event is only accepted for a game that exists
-- here and is active.
CREATE TABLE IF NOT EXISTS games (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id     TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  is_active   INTEGER NOT NULL DEFAULT 1
);

-- Submitted leaderboard scores. Raw IPs are never stored — only salted hashes.
CREATE TABLE IF NOT EXISTS leaderboard_scores (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id         TEXT NOT NULL,
  board_id        TEXT NOT NULL,
  player_name     TEXT NOT NULL,
  score           INTEGER NOT NULL,
  metadata_json   TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  ip_hash         TEXT,
  user_agent_hash TEXT
);

-- Analytics events (session_start, game_start, game_end, score_submit, ...).
CREATE TABLE IF NOT EXISTS analytics_events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id       TEXT NOT NULL,
  build_id      TEXT,
  session_id    TEXT,
  event_name    TEXT NOT NULL,
  metadata_json TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Optional per-board config. If a row is missing we default to descending
-- (highest score first), which suits the clicker demo.
CREATE TABLE IF NOT EXISTS leaderboard_configs (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id        TEXT NOT NULL,
  board_id       TEXT NOT NULL,
  sort_direction TEXT NOT NULL DEFAULT 'desc',
  display_name   TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (game_id, board_id)
);

-- Indexes for the hot read paths.
CREATE INDEX IF NOT EXISTS idx_scores_board
  ON leaderboard_scores (game_id, board_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_events_game_time
  ON analytics_events (game_id, created_at);
CREATE INDEX IF NOT EXISTS idx_events_session
  ON analytics_events (session_id);

-- Seed: the clicker demo testbed.
INSERT OR IGNORE INTO games (game_id, name) VALUES ('clicker-demo', 'Clicker Demo');
INSERT OR IGNORE INTO leaderboard_configs (game_id, board_id, sort_direction, display_name)
  VALUES ('clicker-demo', 'main', 'desc', 'Top Clickers');
