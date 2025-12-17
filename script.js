/* =========================================================
   Emergency Doctor Simulator
   script.js — FINAL DEFINITIVO COM RAMIFICAÇÃO
   ========================================================= */

(() => {
  "use strict";

  /* =========================
     STORAGE
  ========================= */
  const STORAGE_SAVE = "eds_save_v4";
  const STORAGE_RANK = "eds_rank_v4";

  /* =========================
     DIFICULDADE PROGRESSIVA
  ========================= */
  const DIFFICULTY_BY_RANK = {
    "Interno":   { label: "Leve",   timeFactor: 1.3, penalty: 0.8 },
    "Residente": { label: "Normal", timeFactor: 1.0, penalty: 1.0 },
    "Titular":   { label: "Difícil",timeFactor: 0.85,penalty: 1.25 },
    "Pleno":     { label: "Caos",   timeFactor: 0.7, penalty: 1.5 }
  };

  const CERT_LEVELS = [
    { name: "Bronze",   check: s => s.cases >= 5 },
    { name: "Prata",    check: s => s.cases >= 15 && s.deaths <= 3 },
    { name: "Ouro",     check: s => s.cases >= 30 && s.dxAcc >= 0.75 },
    { name: "Platina",  check: s => s.cases >= 50 && s.deaths === 0 && s.dxAcc >= 0.85 }
  ];

  /* =========================
     HELPERS
  ========================= */
  const $ = id => document.getElementById(id);

  function showScreen(name) {
    document.querySelectorAll(".screen").forEach(s =>
      s.classList.toggle("active", s.dataset.screen === name)
    );
  }

  function formatTime(sec) {
    sec = Math.max(0, Math.floor(sec));
    return `${String(Math.floor(sec / 60)).padStart(2,"0")}:${String(sec % 60).padStart(2,"0")}`;
  }

  function uid() {
    return "EDS-" + Math.random().toString(36).substr(2,9).toUpperCase();
  }

  /* =========================
     STATE
  ========================= */
  const state = {
    doctor: {
      name: "Médico",
      avatar: "",
      rank: "Interno",
      certId: uid()
    },
    stats: {
      points: 0,
      cases: 0,
      deaths: 0,
      dxCorrect: 0,
      condCorrect: 0,
      examsTotal: 0
    },
    timer: {
      remaining: 0,
      initial: 0,
      interval: null
    },
    data: {
      cases: [],
      exams: []
    },
    current: {
      case: null,
      stageId: null,
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
    localStorage.setItem(STORAGE_SAVE, JSON.stringify(state));
    updateRanking();
  }

  function loadGame() {
    const raw = localStorage.getItem(STORAGE_SAVE);
    if (!raw) return;
    try { Object.assign(state, JSON.parse(raw)); } catch {}
  }

  /* =========================
     RANKING
  ========================= */
  function updateRanking() {
    const list = JSON.parse(localStorage.getItem(STORAGE_RANK) || "[]");
    const entry = {
      name: state.doctor.name,
      rank: state.doctor.rank,
      points: state.stats.points
    };
    const i = list.findIndex(e => e.name === entry.name);
    if (i >= 0) list[i] = entry;
    else list.push(entry);
    list.sort((a,b)=>b.points-a.points);
    localStorage.setItem(STORAGE_RANK, JSON.stringify(list.slice(0,20)));
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
        registerDeath("Tempo excedido.");
      }
    }, 1000);
  }

  function consumeTime(sec) {
    state.timer.remaining -= sec;
    $("caseTimer").textContent = formatTime(state.timer.remaining);
    if (state.timer.remaining <= 0) {
      registerDeath("Atraso crítico.");
    }
  }

  /* =========================
     PROGRESSÃO
  ========================= */
  function updateRank() {
    const p = state.stats.points;
    if (p >= 300) state.doctor.rank = "Pleno";
    else if (p >= 180) state.doctor.rank = "Titular";
    else if (p >= 80) state.doctor.rank = "Residente";
    else state.doctor.rank = "Interno";

    const d = DIFFICULTY_BY_RANK[state.doctor.rank];
    $("uiRank").textContent = state.doctor.rank;
    $("uiDifficulty").textContent = d.label;
  }

  function getCertification() {
    const s = {
      cases: state.stats.cases,
      deaths: state.stats.deaths,
      dxAcc: state.stats.cases ? state.stats.dxCorrect/state.stats.cases : 0
    };
    let level = CERT_LEVELS[0];
    CERT_LEVELS.forEach(c => { if (c.check(s)) level = c; });
    return level.name;
  }

  /* =========================
     CASE FLOW
  ========================= */
  function startCase() {
    updateRank();
    const diff = DIFFICULTY_BY_RANK[state.doctor.rank];
    const c = state.data.cases[Math.floor(Math.random()*state.data.cases.length)];

    state.current = {
      case: c,
      stageId: c.stages ? "initial" : null,
      exams: [],
      diagnosis: null,
      conduct: null,
      score: 0
    };

    state.stats.cases++;
    $("uiCases").textContent = state.stats.cases;

    renderStage();
    const base = c.timeLimitSec || 120;
    startTimer(Math.floor(base * diff.timeFactor));

    saveGame();
    showScreen("case");
  }

  function renderStage() {
    const c = state.current.case;
    let status = c.complaint + " — " + c.history;
    let vitals = c.vitals;

    if (c.stages && state.current.stageId) {
      const stage = c.stages.find(s => s.id === state.current.stageId);
      if (stage) {
        status = stage.status;
        vitals = stage.vitals;
      }
    }

    $("caseTitle").textContent = c.title;
    $("caseStatus").textContent = status;
    $("caseVitals").textContent = vitals.join(" • ");
  }

  function advanceStage(correct) {
    const c = state.current.case;
    if (!c.stages) return;

    const stage = c.stages.find(s => s.id === state.current.stageId);
    if (!stage || !stage.next) return;

    const nextId = correct ? stage.next.onCorrect : stage.next.onWrong;
    const nextStage = c.stages.find(s => s.id === nextId);

    if (!nextStage) return;

    if (nextStage.outcome === "death") {
      registerDeath("Evolução clínica desfavorável.");
      return;
    }

    if (nextStage.outcome === "survive") {
      state.current.stageId = nextStage.id;
      renderStage();
      return;
    }

    state.current.stageId = nextStage.id;
    renderStage();
  }

  function registerDeath(reason) {
    clearInterval(state.timer.interval);
    state.stats.deaths++;
    state.stats.points = Math.max(0, state.stats.points - 40);
    saveGame();
    $("deathReason").textContent = reason;
    showScreen("death");
  }

  /* =========================
     DIAG / CONDUTA
  ========================= */
  function openDiagnosis() {
    const box = $("diagnosisList");
    box.innerHTML = "";
    state.current.case.diagnoses.forEach(d => {
      const b = document.createElement("button");
      b.className = "btn";
      b.textContent = d;
      b.onclick = () => {
        state.current.diagnosis = d;
        showScreen("case");
      };
      box.appendChild(b);
    });
    showScreen("diagnosis");
  }

  function openConduct() {
    if (!state.current.diagnosis) return alert("Escolha um diagnóstico.");
    const box = $("conductList");
    box.innerHTML = "";
    state.current.case.conducts.forEach(c => {
      const b = document.createElement("button");
      b.className = "btn";
      b.textContent = c;
      b.onclick = () => {
        state.current.conduct = c;
        finalizeDecision();
      };
      box.appendChild(b);
    });
    showScreen("conduct");
  }

  function finalizeDecision() {
    clearInterval(state.timer.interval);
    const c = state.current.case;
    const diff = DIFFICULTY_BY_RANK[state.doctor.rank];

    const dxOk = state.current.diagnosis === c.correctDiagnosis;
    const cdOk = state.current.conduct === c.correctConduct;

    if (dxOk) state.stats.dxCorrect++;
    if (cdOk) state.stats.condCorrect++;

    advanceStage(dxOk && cdOk);

    if (c.stages && state.current.stageId) {
      // Caso ramificado continua
      startTimer(Math.floor((c.timeLimitSec || 120) * 0.5));
      showScreen("case");
      return;
    }

    // Caso finalizado
    let score = 20;
    if (dxOk) score += 25; else score -= 15 * diff.penalty;
    if (cdOk) score += 30; else score -= 20 * diff.penalty;
    score += Math.floor(state.timer.remaining / 10);

    state.stats.points = Math.max(0, state.stats.points + score);
    saveGame();

    $("reportSummary").textContent = c.title;
    $("reportDxChosen").textContent = state.current.diagnosis;
    $("reportDxCorrect").textContent = c.correctDiagnosis;
    $("reportConductChosen").textContent = state.current.conduct;
    $("reportConductCorrect").textContent = c.correctConduct;
    $("reportScore").textContent = score + " pts";
    $("reportFeedback").textContent = c.educationalFeedback;
    $("reportCert").textContent = getCertification();

    updateRank();
    showScreen("report");
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
     UI BINDINGS
  ========================= */
  $("btnNextCase").onclick = startCase;
  $("btnToDiagnosis").onclick = openDiagnosis;
  $("btnToConduct").onclick = openConduct;
  $("btnBackOffice").onclick = () => showScreen("office");
  $("btnReportContinue").onclick = () => showScreen("office");

  /* =========================
     BOOT
  ========================= */
  async function boot() {
    loadGame();

    $("uiPoints").textContent = state.stats.points;
    $("uiCases").textContent = state.stats.cases;
    $("uiDeaths").textContent = state.stats.deaths;

    state.data.cases = await loadJSON("cases.json");

    updateRank();
    $("uiCertLevel").textContent = getCertification();

    showScreen("home");
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
