/****************************************************
 * SIMULADOR DE ATENDIMENTO MÉDICO — SCRIPT FINAL
 ****************************************************/

/* =======================
   ESTADO GLOBAL
======================= */
let currentScreen = "splash";
let gameState = null;
let allCases = [];
let currentCase = null;
let timer = null;
let timeLeft = 0;
let selectedCorrect = false;

/* =======================
   CONSTANTES
======================= */
const SAVE_KEY = "sim_med_save_v1";
const RANK_KEY = "sim_med_rank_v1";

/* =======================
   BOOT
======================= */
document.addEventListener("DOMContentLoaded", () => {
  bindSplash();
  bindMenu();
  bindGameButtons();
  loadCases();
});

/* =======================
   SPLASH
======================= */
function bindSplash() {
  const splash = document.getElementById("splashScreen");
  splash.addEventListener(
    "pointerdown",
    () => {
      splash.classList.add("hidden");
      showScreen("menu");
    },
    { once: true }
  );
}

/* =======================
   MENU
======================= */
function bindMenu() {
  document.getElementById("btnStart").addEventListener("pointerdown", startGame);
  document
    .getElementById("btnReset")
    .addEventListener("pointerdown", resetCareer);
}

function startGame() {
  gameState = loadGame();
  updateHUD();
  showScreen("game");
  nextCase();
}

/* =======================
   GAME BUTTONS
======================= */
function bindGameButtons() {
  document
    .getElementById("btnFinishCase")
    .addEventListener("pointerdown", finishCase);

  document
    .getElementById("btnBackMenu")
    ?.addEventListener("pointerdown", () => showScreen("menu"));

  document
    .getElementById("btnCertificate")
    ?.addEventListener("pointerdown", showCertificate);

  document
    .getElementById("btnCertBack")
    ?.addEventListener("pointerdown", () => showScreen("report"));

  document
    .getElementById("btnDownloadCert")
    ?.addEventListener("pointerdown", downloadCertificate);
}

/* =======================
   LOAD CASES
======================= */
async function loadCases() {
  const res = await fetch("cases.json");
  allCases = await res.json();
}

/* =======================
   CASE FLOW
======================= */
function nextCase() {
  selectedCorrect = false;

  const available = allCases.filter(
    (c) => c.difficulty <= gameState.difficulty
  );

  currentCase = available[Math.floor(Math.random() * available.length)];

  document.getElementById("caseTitle").textContent = currentCase.title;
  document.getElementById("caseText").textContent = currentCase.description;

  renderActions(currentCase);
  startTimer(currentCase.timeLimit || 40);
}

function renderActions(caseData) {
  const actions = document.getElementById("actions");
  actions.innerHTML = "";

  caseData.actions.forEach((act) => {
    const btn = document.createElement("button");
    btn.textContent = act.text;
    if (!act.correct) btn.classList.add("wrong");

    btn.addEventListener("pointerdown", () => {
      selectedCorrect = act.correct;
      stopTimer();
    });

    actions.appendChild(btn);
  });
}

/* =======================
   TIMER
======================= */
function startTimer(seconds) {
  stopTimer();
  timeLeft = seconds;
  document.getElementById("timer").textContent = timeLeft;

  timer = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").textContent = timeLeft;

    if (timeLeft <= 0) {
      stopTimer();
      registerFailure(true);
    }
  }, 1000);
}

function stopTimer() {
  if (timer) clearInterval(timer);
}

/* =======================
   FINISH CASE
======================= */
function finishCase() {
  stopTimer();

  if (!selectedCorrect) {
    registerFailure(false);
    return;
  }

  gameState.score += 100;
  gameState.cases++;
  gameState.xp += 20;

  checkLevelUp();
  saveGame(gameState);

  updateHUD();
  nextCase();
}

/* =======================
   FAILURE / ÓBITO
======================= */
function registerFailure(timeOut) {
  gameState.errors++;
  gameState.score -= 50;

  saveGame(gameState);
  endShift();
}

/* =======================
   END SHIFT
======================= */
function endShift() {
  saveToRanking();
  showReport();
}

/* =======================
   REPORT
======================= */
function showReport() {
  document.getElementById("repCases").textContent = gameState.cases;
  document.getElementById("repHits").textContent =
    gameState.cases - gameState.errors;
  document.getElementById("repErrors").textContent = gameState.errors;
  document.getElementById("repScore").textContent = gameState.score;

  showScreen("report");
}

/* =======================
   CERTIFICATE
======================= */
function showCertificate() {
  document.getElementById("certScore").textContent = gameState.score;
  document.getElementById("certLevel").textContent = gameState.level;
  showScreen("certificate");
}

function downloadCertificate() {
  window.print();
}

/* =======================
   PROGRESSION
======================= */
function checkLevelUp() {
  if (gameState.xp >= gameState.level * 100) {
    gameState.level++;
    gameState.difficulty = Math.min(5, gameState.difficulty + 1);
  }
}

/* =======================
   SAVE / LOAD
======================= */
function loadGame() {
  return (
    JSON.parse(localStorage.getItem(SAVE_KEY)) || {
      level: 1,
      xp: 0,
      score: 0,
      cases: 0,
      errors: 0,
      difficulty: 1,
    }
  );
}

function saveGame(state) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function resetCareer() {
  localStorage.removeItem(SAVE_KEY);
  location.reload();
}

/* =======================
   RANKING
======================= */
function saveToRanking() {
  const rank = JSON.parse(localStorage.getItem(RANK_KEY)) || [];
  rank.push({
    score: gameState.score,
    level: gameState.level,
    date: new Date().toLocaleDateString(),
  });
  rank.sort((a, b) => b.score - a.score);
  localStorage.setItem(RANK_KEY, JSON.stringify(rank.slice(0, 10)));
}

/* =======================
   UI HELPERS
======================= */
function showScreen(name) {
  document.querySelectorAll(".screen").forEach((s) =>
    s.classList.add("hidden")
  );
  document.getElementById(`${name}Screen`).classList.remove("hidden");
}

function updateHUD() {
  document.getElementById("score").textContent = gameState.score;
  document.getElementById("level").textContent = gameState.level;
}
