/* =========================================================
   Emergency Doctor Simulator
   script.js FINAL DEFINITIVO
   - Dificuldade progressiva automática (por carreira)
   - Relatório pós-caso educacional
   ========================================================= */

(() => {
  "use strict";

  /* =========================
     CONFIG
  ========================= */
  const STORAGE_SAVE = "eds_save_final_v2";
  const STORAGE_RANK = "eds_rank_final_v2";

  const BASE_TIME = 120;

  // Progressão automática por carreira (rank)
  const DIFFICULTY_BY_RANK = {
    "Interno":   { label: "Leve",   timeFactor: 1.3, penalty: 0.8 },
    "Residente": { label: "Normal", timeFactor: 1.0, penalty: 1.0 },
    "Titular":   { label: "Difícil",timeFactor: 0.85, penalty: 1.2 },
    "Pleno":     { label: "Caos",   timeFactor: 0.7, penalty: 1.5 }
  };

  /* =========================
     HELPERS
  ========================= */
  const $ = (id) => document.getElementById(id);

  function showScreen(name) {
    document.querySelectorAll(".screen").forEach(s => {
      s.classList.toggle("active", s.dataset.screen === name);
    });
  }

  function formatTime(sec) {
    sec = Math.max(0, Math.floor(sec));
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  /* =========================
     STATE
  ========================= */
  const state = {
    doctor: {
      name: "",
      avatar: "",
      rank: "Interno"
    },
    stats: {
      points: 0,
      cases: 0,
      deaths: 0
    },
    timer: {
      remaining: 0,
      interval: null,
      initial: 0
    },
    data: {
      cases: [],
      exams: []
    },
    current: {
      case: null,
      exams: [],
      diagnosis: null,
      conduct: null,
      score: 0
    }
  };

  /* =========================
     SAVE / LOAD
  ========================= */
  function saveGame() {
    localStorage.setItem(STORAGE_SAVE, JSON.stringify({
      doctor: state.doctor,
      stats: state.stats
    }));
    updateRanking();
  }

  function loadGame() {
    const raw = localStorage.getItem(STORAGE_SAVE);
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      if (s.doctor) state.doctor = s.doctor;
      if (s.stats) state.stats = s.stats;
    } catch {}
  }

  /* =========================
     RANKING
  ========================= */
  function updateRanking() {
    if (!state.doctor.name) return;

    const list = JSON.parse(localStorage.getItem(STORAGE_RANK) || "[]");
    const entry = {
      name: state.doctor.name,
      rank: state.doctor.rank,
      points: state.stats.points,
      cases: state.stats.cases,
      deaths: state.stats.deaths
    };

    const i = list.findIndex(e => e.name === entry.name);
    if (i >= 0) list[i] = entry;
    else list.push(entry);

    list.sort((a, b) => b.points - a.points);
    localStorage.setItem(STORAGE_RANK, JSON.stringify(list.slice(0, 20)));
  }

  function renderRanking() {
    const box = $("rankingList");
    if (!box) return;
    box.innerHTML = "";
    const list = JSON.parse(localStorage.getItem(STORAGE_RANK) || "[]");
    list.forEach((r, i) => {
      box.innerHTML += `<div>${i + 1}º ${r.name} (${r.rank}) — ${r.points} pts</div>`;
    });
  }

  /* =========================
     TIMER
  ========================= */
  function startTimer(sec) {
    clearInterval(state.timer.interval);
    state.timer.remaining = sec;
    state.timer.initial = sec;
    $("caseTimer").textContent = formatTime(sec);

    state.timer.interval = setInterval(() => {
      state.timer.remaining--;
      $("caseTimer").textContent = formatTime(state.timer.remaining);

      if (state.timer.remaining <= 0) {
        clearInterval(state.timer.interval);
        registerDeath("Tempo esgotado. Óbito inevitável.");
      }
    }, 1000);
  }

  function consumeTime(sec) {
    state.timer.remaining -= sec;
    $("caseTimer").textContent = formatTime(state.timer.remaining);
    if (state.timer.remaining <= 0) {
      clearInterval(state.timer.interval);
      registerDeath("Atraso crítico durante atendimento.");
    }
  }

  /* =========================
     LOAD DATA
  ========================= */
  async function loadJSON(file) {
    const r = await fetch(file, { cache: "no-store" });
    if (!r.ok) throw new Error(file);
    return r.json();
  }

  /* =========================
     PROGRESSÃO DE CARREIRA
  ========================= */
  function updateRank() {
    const p = state.stats.points;
    let r = "Interno";
    if (p >= 300) r = "Pleno";
    else if (p >= 180) r = "Titular";
    else if (p >= 80) r = "Residente";
    state.doctor.rank = r;

    const d = DIFFICULTY_BY_RANK[r];
    $("uiDifficulty").textContent = d.label;
    $("uiRank").textContent = r;
  }

  /* =========================
     GAME FLOW
  ========================= */
  function startCase() {
    updateRank();

    const diff = DIFFICULTY_BY_RANK[state.doctor.rank];
    const c = state.data.cases[Math.floor(Math.random() * state.data.cases.length)];

    state.current = {
      case: c,
      exams: [],
      diagnosis: null,
      conduct: null,
      score: 0
    };

    state.stats.cases++;
    $("uiCases").textContent = state.stats.cases;

    $("caseTitle").textContent = c.title;
    $("caseStatus").textContent = c.complaint + " — " + c.history;
    $("caseVitals").textContent = c.vitals.join(" • ");

    const baseTime = c.timeLimitSec || BASE_TIME;
    const finalTime = Math.floor(baseTime * diff.timeFactor);

    startTimer(finalTime);
    showScreen("case");
    saveGame();
  }

  function registerDeath(reason) {
    state.stats.deaths++;
    state.stats.points = Math.max(0, state.stats.points - 30);
    saveGame();

    $("deathReason").textContent = reason;
    showScreen("death");
  }

  /* =========================
     EXAMS
  ========================= */
  function openExams() {
    const list = $("examList");
    list.innerHTML = "";
    state.data.exams.forEach(ex => {
      const b = document.createElement("button");
      b.className = "btn";
      b.textContent = `${ex.name} (+${ex.timeSec}s)`;
      b.onclick = () => {
        state.current.exams.push(ex.id);
        consumeTime(ex.timeSec);
        $("examResults").innerHTML +=
          `<div class="caseCard"><b>${ex.name}</b><br/>Resultado disponível.</div>`;
        showScreen("results");
      };
      list.appendChild(b);
    });
    showScreen("exams");
  }

  /* =========================
     DIAGNOSIS & CONDUCT
  ========================= */
  function openDiagnosis() {
    const box = $("diagnosisList");
    box.innerHTML = "";
    state.current.case.diagnoses.forEach(d => {
      const b = document.createElement("button");
      b.className = "btn";
      b.textContent = d;
      b.onclick = () => state.current.diagnosis = d;
      box.appendChild(b);
    });
    showScreen("diagnosis");
  }

  function openConduct() {
    if (!state.current.diagnosis) {
      alert("Escolha um diagnóstico.");
      return;
    }
    const box = $("conductList");
    box.innerHTML = "";
    state.current.case.conducts.forEach(c => {
      const b = document.createElement("button");
      b.className = "btn";
      b.textContent = c;
      b.onclick = () => state.current.conduct = c;
      box.appendChild(b);
    });
    showScreen("conduct");
  }

  /* =========================
     FINALIZAÇÃO + RELATÓRIO
  ========================= */
  function finalizeCase() {
    clearInterval(state.timer.interval);

    const c = state.current.case;
    const diff = DIFFICULTY_BY_RANK[state.doctor.rank];

    let score = 10;

    const dxCorrect = state.current.diagnosis === c.correctDiagnosis;
    const cdCorrect = state.current.conduct === c.correctConduct;

    if (dxCorrect) score += 20;
    else score -= 10 * diff.penalty;

    if (cdCorrect) score += 25;
    else score -= 15 * diff.penalty;

    const timeUsed = state.timer.initial - state.timer.remaining;
    const timeBonus = Math.max(0, Math.floor(state.timer.remaining / 10));
    score += timeBonus;

    score = Math.floor(score);

    state.current.score = score;
    state.stats.points = clamp(state.stats.points + score, 0, 999999);

    // Relatório
    $("reportSummary").textContent = c.title;
    $("reportDxChosen").textContent = state.current.diagnosis || "—";
    $("reportDxCorrect").textContent = c.correctDiagnosis;
    $("reportConductChosen").textContent = state.current.conduct || "—";
    $("reportConductCorrect").textContent = c.correctConduct;
    $("reportTime").textContent =
      `${formatTime(state.timer.initial)} → ${formatTime(state.timer.remaining)} (usado ${timeUsed}s)`;
    $("reportScore").textContent = `${score} pts`;
    $("reportFeedback").textContent =
      c.educationalFeedback || "Avalie condutas e diagnóstico conforme diretrizes clínicas.";

    saveGame();
    updateRank();

    showScreen("report");
  }

  /* =========================
     UI BINDINGS
  ========================= */
  $("btnNextCase").onclick = startCase;
  $("btnExams").onclick = openExams;
  $("btnToDiagnosis").onclick = openDiagnosis;
  $("btnToDiagnosisFromResults").onclick = openDiagnosis;
  $("btnToConduct").onclick = openConduct;
  $("btnFinalizeCase").onclick = finalizeCase;

  $("btnReturnCase").onclick = () => showScreen("case");
  $("btnBackCase").onclick = () => showScreen("case");
  $("btnDiagnosisBack").onclick = () => showScreen("case");
  $("btnConductBack").onclick = () => showScreen("diagnosis");

  $("btnReportContinue").onclick = () => showScreen("office");
  $("btnBackOffice").onclick = () => showScreen("office");

  $("btnRanking").onclick = () => {
    renderRanking();
    $("rankingModal").classList.remove("hidden");
  };
  $("btnCloseRanking").onclick = () =>
    $("rankingModal").classList.add("hidden");

  /* =========================
     BOOT
  ========================= */
  async function boot() {
    loadGame();

    $("uiPoints").textContent = state.stats.points;
    $("uiCases").textContent = state.stats.cases;
    $("uiDeaths").textContent = state.stats.deaths;

    try {
      state.data.cases = await loadJSON("cases.json");
      const ex = await loadJSON("exams.json");
      state.data.exams = ex.exams;
    } catch (e) {
      alert("Erro ao carregar arquivos JSON.");
    }

    updateRank();
    showScreen("home");
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
