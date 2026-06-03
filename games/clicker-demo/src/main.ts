// Sauce Clicker — a deliberately tiny game whose only job is to exercise the
// Sauce SDK end to end: start a session, track game events, submit a score,
// and render a leaderboard.
//
// The SDK is imported straight from source for local development. A shipped
// game would import the built package (`@sauce/sdk`) or a <script> tag.

import { Sauce, type LeaderboardEntry } from "../../../sdk/src/index";
import "./styles.css";

// --- Config ----------------------------------------------------------------

const GAME_ID = "clicker-demo";
const BUILD_ID = "v0.1.0";
const BOARD_ID = "main";
const ROUND_SECONDS = 30;

// In dev, talk to the local Worker; in a production build, use the default
// (https://api.saucegames.io). Override anytime with VITE_API_BASE_URL.
const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? "http://localhost:8787" : undefined);

const sauce = Sauce.init({ gameId: GAME_ID, buildId: BUILD_ID, apiBaseUrl });

// Start the analytics session immediately on page load.
sauce.analytics.startSession();
// Reliably close the session when the player leaves.
window.addEventListener("pagehide", () => sauce.analytics.endSession());

// --- DOM references --------------------------------------------------------

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el as T;
};

const scoreEl = $<HTMLSpanElement>("score");
const timeEl = $<HTMLSpanElement>("time");
const clickerBtn = $<HTMLButtonElement>("clicker");
const hintEl = $<HTMLParagraphElement>("hint");
const submitForm = $<HTMLFormElement>("submit-form");
const resultEl = $<HTMLParagraphElement>("result");
const nameInput = $<HTMLInputElement>("player-name");
const submitBtn = $<HTMLButtonElement>("submit-btn");
const replayBtn = $<HTMLButtonElement>("replay-btn");
const submitMsg = $<HTMLParagraphElement>("submit-msg");
const refreshBtn = $<HTMLButtonElement>("refresh-btn");
const leaderboardList = $<HTMLOListElement>("leaderboard-list");

// --- Game state ------------------------------------------------------------

type Phase = "idle" | "playing" | "ended";

let phase: Phase = "idle";
let score = 0;
let totalClicks = 0;
let timeLeft = ROUND_SECONDS;
let timerHandle: number | undefined;

// --- Game flow -------------------------------------------------------------

function startRound(): void {
  phase = "playing";
  score = 0;
  totalClicks = 0;
  timeLeft = ROUND_SECONDS;

  scoreEl.textContent = "0";
  timeEl.textContent = String(timeLeft);
  clickerBtn.textContent = "CLICK!";
  hintEl.textContent = "Click as fast as you can!";
  submitForm.hidden = true;
  submitMsg.textContent = "";

  sauce.analytics.track("game_start");

  timerHandle = window.setInterval(() => {
    timeLeft -= 1;
    timeEl.textContent = String(Math.max(0, timeLeft));
    if (timeLeft <= 0) endRound();
  }, 1000);
}

function registerClick(): void {
  if (phase !== "playing") return;
  score += 1;
  totalClicks += 1;
  scoreEl.textContent = String(score);
  // Pop animation feedback (no network call per click — clicks are batched
  // into the game_end event below).
  clickerBtn.classList.remove("pop");
  void clickerBtn.offsetWidth; // restart the animation
  clickerBtn.classList.add("pop");
}

function endRound(): void {
  if (timerHandle) window.clearInterval(timerHandle);
  timerHandle = undefined;
  phase = "ended";

  clickerBtn.textContent = "Done!";
  hintEl.textContent = "";

  // One analytics event summarising the whole round.
  sauce.analytics.track("game_end", {
    score,
    duration: ROUND_SECONDS,
    totalClicks,
  });

  resultEl.textContent = `You scored ${score} in ${ROUND_SECONDS}s!`;
  submitForm.hidden = false;
  nameInput.focus();
}

// --- Score submission ------------------------------------------------------

async function handleSubmit(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const playerName = nameInput.value.trim();
  if (!playerName) {
    showMsg("Please enter a name.", "bad");
    return;
  }

  submitBtn.disabled = true;
  showMsg("Submitting…");

  try {
    await sauce.leaderboards.submitScore({
      boardId: BOARD_ID,
      playerName,
      score,
      metadata: { duration: ROUND_SECONDS, totalClicks },
    });
    sauce.analytics.track("score_submit", { score });
    showMsg("Saved! See the leaderboard below.", "good");
    submitForm.hidden = true;
    clickerBtn.textContent = "Play again";
    phase = "idle";
    await loadLeaderboard();
  } catch (err) {
    showMsg(err instanceof Error ? err.message : "Submission failed.", "bad");
  } finally {
    submitBtn.disabled = false;
  }
}

// --- Leaderboard -----------------------------------------------------------

async function loadLeaderboard(): Promise<void> {
  sauce.analytics.track("leaderboard_view");
  leaderboardList.innerHTML = `<li class="empty">Loading…</li>`;
  try {
    const entries = await sauce.leaderboards.getTop({ boardId: BOARD_ID, limit: 10 });
    renderLeaderboard(entries);
  } catch (err) {
    leaderboardList.innerHTML = `<li class="empty">Couldn't load leaderboard.</li>`;
    console.warn("[clicker] leaderboard load failed:", err);
  }
}

function renderLeaderboard(entries: LeaderboardEntry[]): void {
  if (entries.length === 0) {
    leaderboardList.innerHTML = `<li class="empty">No scores yet — be the first!</li>`;
    return;
  }
  leaderboardList.innerHTML = entries
    .map(
      (e, i) => `
      <li>
        <span class="rank">#${i + 1}</span>
        <span class="name">${escapeHtml(e.playerName)}</span>
        <span class="pts">${e.score}</span>
      </li>`,
    )
    .join("");
}

// --- Helpers ---------------------------------------------------------------

function showMsg(text: string, kind?: "good" | "bad"): void {
  submitMsg.textContent = text;
  submitMsg.className = `msg${kind ? " " + kind : ""}`;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

// --- Wire up events --------------------------------------------------------

clickerBtn.addEventListener("click", () => {
  if (phase === "playing") {
    registerClick();
  } else {
    // "idle" → Start / Play again kicks off a new round.
    startRound();
  }
});

submitForm.addEventListener("submit", handleSubmit);
replayBtn.addEventListener("click", () => {
  submitForm.hidden = true;
  startRound();
});
refreshBtn.addEventListener("click", () => void loadLeaderboard());

$("conn").textContent = `API: ${sauce.apiBaseUrl}`;

// Initial leaderboard load.
void loadLeaderboard();
