/* =========================================================
   Emergency Doctor Simulator
   script.js FINAL — ciclo clínico completo
   ========================================================= */

(() => {
  "use strict";

  /* =========================
     CONFIG
  ========================= */
  const STORAGE_SAVE = "eds_save_final";
  const STORAGE_RANK = "eds_rank_final";
  const DEFAULT_TIME = 120;

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
      interval: null
    },
    data: {
      cases: [],
      exams: []
    },
    current: {
      case: null,
      exams: [],
      diagnosis: null,
      conduct: null
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
    if (!raw) return false;
    const s = JSON.parse(raw);
    if (!s) return false;
    state.doctor = s.doctor;
    state.stats = s.stats;
    return true;
  }

  /* =========================
     RANKING
  ========================= */
  function updateRanking() {
    if (!state.doctor.name) return;
    const list = JSON.parse(localStorage.getItem(STORAGE_RANK) || "[]");
    const entry = {
      name: state.doctor.name,
      points: state.stats.points,
      cases: state.stats.cases,
      deaths: state.stats.deaths
    };
    const i = list.findIndex(x => x.name === entry.name);
    if (i >= 0) list[i] = entry;
    else list.push(entry);
    list.sort((a,b)=>b.points-a.points);
    localStorage.setItem(STORAGE_RANK, JSON.stringify(list.slice(0,20)));
  }

  function renderRanking() {
    const box = $("rankingList");
    box.innerHTML = "";
    const list = JSON.parse(localStorage.getItem(STORAGE_RANK) || "[]");
    list.forEach((r,i)=>{
      box.innerHTML += `<div>${i+1}º ${r.name} — ${r.points} pts</div>`;
    });
  }

  /* =========================
     TIMER
  ========================= */
  function startTimer(sec) {
    clearInterval(state.timer.interval);
    state.timer.remaining = sec;
    $("caseTimer").textContent = formatTime(sec);
    state.timer.interval = setInterval(()=>{
      state.timer.remaining--;
      $("caseTimer").textContent = formatTime(state.timer.remaining);
      if (state.timer.remaining <= 0) {
        clearInterval(state.timer.interval);
        registerDeath("Tempo esgotado. Óbito inevitável.");
      }
    },1000);
  }

  function consumeTime(sec) {
    state.timer.remaining -= sec;
    $("caseTimer").textContent = formatTime(state.timer.remaining);
    if (state.timer.remaining <= 0) {
      clearInterval(state.timer.interval);
      registerDeath("Tempo excedido durante atendimento.");
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
     GAME FLOW
  ========================= */
  function startCase() {
    const c = state.data.cases[Math.floor(Math.random()*state.data.cases.length)];
    state.current = { case: c, exams: [], diagnosis: null, conduct: null };
    state.stats.cases++;
    $("uiCases").textContent = state.stats.cases;

    $("caseTitle").textContent = c.title;
    $("caseStatus").textContent = c.complaint + " — " + c.history;
    $("caseVitals").textContent = c.vitals.join(" • ");

    startTimer(c.timeLimitSec || DEFAULT_TIME);
    showScreen("case");
  }

  function registerDeath(reason) {
    state.stats.deaths++;
    state.stats.points = Math.max(0, state.stats.points - 20);
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
    state.data.exams.forEach(ex=>{
      const b = document.createElement("button");
      b.className = "btn";
      b.textContent = `${ex.name} (+${ex.timeSec}s)`;
      b.onclick = ()=>{
        state.current.exams.push(ex.id);
        consumeTime(ex.timeSec);
        showResults(ex);
      };
      list.appendChild(b);
    });
    showScreen("exams");
  }

  function showResults(exam) {
    const r = $("examResults");
    r.innerHTML += `<div class="caseCard"><b>${exam.name}</b><br/>Resultado disponível.</div>`;
    showScreen("results");
  }

  /* =========================
     DIAGNOSIS
  ========================= */
  function openDiagnosis() {
    const box = $("diagnosisList");
    box.innerHTML = "";
    state.current.case.diagnoses.forEach(d=>{
      const b = document.createElement("button");
      b.className = "btn";
      b.textContent = d;
      b.onclick = ()=> state.current.diagnosis = d;
      box.appendChild(b);
    });
    showScreen("diagnosis");
  }

  /* =========================
     CONDUCT
  ========================= */
  function openConduct() {
    if (!state.current.diagnosis) {
      alert("Escolha um diagnóstico.");
      return;
    }
    const box = $("conductList");
    box.innerHTML = "";
    state.current.case.conducts.forEach(c=>{
      const b = document.createElement("button");
      b.className = "btn";
      b.textContent = c;
      b.onclick = ()=> state.current.conduct = c;
      box.appendChild(b);
    });
    showScreen("conduct");
  }

  function finalizeCase() {
    const c = state.current.case;
    let score = 10;

    if (state.current.diagnosis === c.correctDiagnosis) score += 15;
    else score -= 10;

    if (state.current.conduct === c.correctConduct) score += 20;
    else score -= 15;

    if (c.expectedOutcome === "death" && score < 15) {
      registerDeath("Conduta inadequada. Óbito evitável.");
      return;
    }

    state.stats.points = Math.max(0, state.stats.points + score);
    saveGame();
    showScreen("office");
  }

  /* =========================
     UI BINDINGS
  ========================= */
  $("btnNextCase").onclick = startCase;
  $("btnExams").onclick = openExams;
  $("btnToDiagnosis").onclick = openDiagnosis;
  $("btnToConduct").onclick = openConduct;
  $("btnFinalizeCase").onclick = finalizeCase;
  $("btnBackOffice").onclick = ()=>showScreen("office");
  $("btnRanking").onclick = ()=>{ renderRanking(); $("rankingModal").classList.remove("hidden"); };
  $("btnCloseRanking").onclick = ()=>$("rankingModal").classList.add("hidden");

  /* =========================
     BOOT
  ========================= */
  async function boot() {
    loadGame();
    $("uiPoints").textContent = state.stats.points;
    $("uiCases").textContent = state.stats.cases;
    $("uiDeaths").textContent = state.stats.deaths;

    state.data.cases = await loadJSON("cases.json");
    const ex = await loadJSON("exams.json");
    state.data.exams = ex.exams;

    showScreen("home");
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
