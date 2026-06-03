// Sauce Clicker — a deliberately tiny game whose only job is to exercise the
// Sauce SDK end to end: start a session, track game events, submit a score,
// and render a leaderboard.
//
// The SDK is imported straight from source for local development. A shipped
// game would import the built package (`@sauce/sdk`) or a <script> tag.

import { Sauce, type LeaderboardEntry } from "../../../sdk/src/index";
import "./styles.css";
import {
  initAudio,
  isMuted,
  playClick,
  playFanfare,
  playTick,
  playWarning,
  resumeAudio,
  setMuted,
} from "./audio";

// --- Config ----------------------------------------------------------------

const GAME_ID = "clicker-demo";
const BUILD_ID = "v0.2.0";
const BOARD_ID = "main";
const ROUND_SECONDS = 30;
const WARN_AT = 5; // start the urgency beeps when this many seconds remain

const NAME_KEY = "sauce-clicker:name";
const BEST_KEY = "sauce-clicker:best";

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
const bestEl = $<HTMLSpanElement>("best");
const cpsEl = $<HTMLSpanElement>("cps");
const timeEl = $<HTMLSpanElement>("time");
const progressFill = $<HTMLDivElement>("progress-fill");
const clickerBtn = $<HTMLButtonElement>("clicker");
const fxLayer = $<HTMLDivElement>("fx");
const readyOverlay = $<HTMLDivElement>("ready-overlay");
const readyCount = $<HTMLSpanElement>("ready-count");
const hintEl = $<HTMLParagraphElement>("hint");
const soundToggle = $<HTMLButtonElement>("sound-toggle");

const modal = $<HTMLDialogElement>("result-modal");
const modalDismiss = $<HTMLButtonElement>("modal-dismiss");
const finalScoreEl = $<HTMLSpanElement>("final-score");
const resultDetailEl = $<HTMLParagraphElement>("result-detail");
const submitFields = $<HTMLDivElement>("submit-fields");
const submitForm = modal.querySelector("form") as HTMLFormElement;
const nameInput = $<HTMLInputElement>("player-name");
const submitBtn = $<HTMLButtonElement>("submit-btn");
const replayBtn = $<HTMLButtonElement>("replay-btn");
const submitMsg = $<HTMLParagraphElement>("submit-msg");
const refreshBtn = $<HTMLButtonElement>("refresh-btn");
const leaderboardList = $<HTMLOListElement>("leaderboard-list");

// --- Game state ------------------------------------------------------------

type Phase = "idle" | "ready" | "playing" | "ended";

let phase: Phase = "idle";
let score = 0;
let totalClicks = 0;
let timeLeft = ROUND_SECONDS;
let timerHandle: number | undefined;
let readyHandle: number | undefined;
let best = readNumber(BEST_KEY);
let lastSubmitted: { name: string; score: number } | null = null;

// --- Game flow -------------------------------------------------------------

function beginGameStart(): void {
  // Any tap counts as the user gesture that unlocks audio.
  resumeAudio();
  if (phase === "ready" || phase === "playing") return;
  startReadyCountdown();
}

function startReadyCountdown(): void {
  phase = "ready";
  score = 0;
  totalClicks = 0;
  timeLeft = ROUND_SECONDS;

  scoreEl.textContent = "0";
  cpsEl.textContent = "0.0";
  timeEl.textContent = String(ROUND_SECONDS);
  timeEl.classList.remove("danger");
  setProgress(1);
  progressFill.classList.remove("warn", "danger");
  clickerBtn.disabled = true;
  clickerBtn.textContent = "";
  hintEl.textContent = "Get ready…";

  let n = 3;
  readyCount.textContent = String(n);
  readyOverlay.hidden = false;
  playTick();

  readyHandle = window.setInterval(() => {
    n -= 1;
    if (n <= 0) {
      window.clearInterval(readyHandle);
      readyHandle = undefined;
      readyOverlay.hidden = true;
      startRound();
      return;
    }
    readyCount.textContent = String(n);
    // Restart the pop animation.
    readyCount.style.animation = "none";
    void readyCount.offsetWidth;
    readyCount.style.animation = "";
    playTick();
  }, 700);
}

function startRound(): void {
  phase = "playing";
  clickerBtn.disabled = false;
  clickerBtn.textContent = "CLICK!";
  clickerBtn.classList.add("playing");
  hintEl.textContent = "Click as fast as you can!";

  sauce.analytics.track("game_start");

  timerHandle = window.setInterval(() => {
    timeLeft -= 1;
    timeEl.textContent = String(Math.max(0, timeLeft));
    setProgress(Math.max(0, timeLeft) / ROUND_SECONDS);
    updateCps();

    if (timeLeft <= WARN_AT && timeLeft > 0) {
      progressFill.classList.add("danger");
      timeEl.classList.add("danger");
      playWarning();
    } else if (timeLeft <= 10) {
      progressFill.classList.add("warn");
    }

    if (timeLeft <= 0) endRound();
  }, 1000);
}

function registerClick(): void {
  if (phase !== "playing") return;
  score += 1;
  totalClicks += 1;
  scoreEl.textContent = String(score);
  updateCps();
  playClick(score);
  spawnPip();

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

  clickerBtn.classList.remove("playing");
  clickerBtn.textContent = "Play again";
  hintEl.textContent = "";
  setProgress(0);
  timeEl.classList.remove("danger");

  playFanfare();

  const isBest = score > best;
  if (isBest) {
    best = score;
    writeNumber(BEST_KEY, best);
  }
  renderBest();

  // One analytics event summarising the whole round.
  sauce.analytics.track("game_end", {
    score,
    duration: ROUND_SECONDS,
    totalClicks,
  });

  openResultModal(isBest);
}

// --- Result modal ----------------------------------------------------------

function openResultModal(isBest: boolean): void {
  finalScoreEl.textContent = String(score);
  const cps = (score / ROUND_SECONDS).toFixed(1);
  resultDetailEl.innerHTML = isBest
    ? `<span class="pb">New personal best!</span> · ${cps} clicks/s`
    : `${cps} clicks/s · best ${best}`;

  submitFields.hidden = false;
  submitBtn.disabled = false;
  submitBtn.textContent = "Submit score";
  showMsg("");
  nameInput.value = readString(NAME_KEY);

  if (typeof modal.showModal === "function") {
    if (!modal.open) modal.showModal();
  } else {
    modal.setAttribute("open", "");
  }
  // Defer focus so the open animation doesn't fight the caret.
  window.setTimeout(() => nameInput.focus(), 60);
}

function closeResultModal(): void {
  if (modal.open) modal.close();
  if (phase === "ended") phase = "idle";
}

async function handleSubmit(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const playerName = nameInput.value.trim();
  if (!playerName) {
    showMsg("Please enter a name.", "bad");
    nameInput.focus();
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
    writeString(NAME_KEY, playerName);
    lastSubmitted = { name: playerName, score };

    showMsg("Saved! You're on the board.", "good");
    submitFields.hidden = true;
    phase = "idle";
    await loadLeaderboard();
    // Let the success message land before dismissing.
    window.setTimeout(() => closeResultModal(), 900);
  } catch (err) {
    showMsg(err instanceof Error ? err.message : "Submission failed.", "bad");
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

  let highlighted = false;
  leaderboardList.innerHTML = entries
    .map((e, i) => {
      const rankClass = i < 3 ? ` top${i + 1}` : "";
      let youClass = "";
      if (
        !highlighted &&
        lastSubmitted &&
        e.playerName === lastSubmitted.name &&
        e.score === lastSubmitted.score
      ) {
        youClass = " you";
        highlighted = true;
      }
      const cls = `${rankClass}${youClass}`.trim();
      return `
      <li class="${cls}" style="animation-delay:${i * 25}ms">
        <span class="rank">${i + 1}</span>
        <span class="name">${escapeHtml(e.playerName)}</span>
        <span class="pts">${e.score}</span>
      </li>`;
    })
    .join("");
}

// --- Helpers ---------------------------------------------------------------

function setProgress(fraction: number): void {
  progressFill.style.width = `${Math.max(0, Math.min(1, fraction)) * 100}%`;
}

function updateCps(): void {
  const elapsed = ROUND_SECONDS - timeLeft;
  const cps = elapsed > 0 ? score / elapsed : 0;
  cpsEl.textContent = cps.toFixed(1);
}

function renderBest(): void {
  if (best > 0) {
    bestEl.textContent = String(best);
    bestEl.classList.remove("muted-value");
  } else {
    bestEl.textContent = "—";
    bestEl.classList.add("muted-value");
  }
}

function spawnPip(): void {
  const pip = document.createElement("span");
  pip.className = "pip";
  pip.textContent = "+1";
  const jitter = (Math.random() - 0.5) * 60;
  pip.style.marginLeft = `${jitter}px`;
  fxLayer.appendChild(pip);
  window.setTimeout(() => pip.remove(), 750);
}

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

function readNumber(key: string): number {
  const raw = Number(localStorage.getItem(key));
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
}

function writeNumber(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* storage may be unavailable (private mode) — ignore */
  }
}

function readString(key: string): string {
  return localStorage.getItem(key) ?? "";
}

function writeString(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function syncSoundToggle(): void {
  const muted = isMuted();
  soundToggle.setAttribute("aria-pressed", muted ? "true" : "false");
  soundToggle.title = muted ? "Sound off" : "Sound on";
}

// --- Wire up events --------------------------------------------------------

clickerBtn.addEventListener("click", () => {
  if (phase === "playing") {
    registerClick();
  } else if (phase === "idle" || phase === "ended") {
    // "idle"/"ended" → Start / Play again kicks off a new round.
    beginGameStart();
  }
});

submitForm.addEventListener("submit", handleSubmit);

replayBtn.addEventListener("click", () => {
  closeResultModal();
  beginGameStart();
});

modalDismiss.addEventListener("click", () => closeResultModal());
modal.addEventListener("close", () => {
  if (phase === "ended") phase = "idle";
});

refreshBtn.addEventListener("click", () => void loadLeaderboard());

soundToggle.addEventListener("click", () => {
  setMuted(!isMuted());
  syncSoundToggle();
  if (!isMuted()) {
    resumeAudio();
    playTick();
  }
});

// --- Init ------------------------------------------------------------------

initAudio();
syncSoundToggle();
renderBest();

// Initial leaderboard load.
void loadLeaderboard();
