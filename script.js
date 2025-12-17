/* =========================================================
   Emergency Doctor Simulator
   script.js — FINAL ABSOLUTO
   Balanceamento fino + Certificação por desempenho
   ========================================================= */

(() => {
  "use strict";

  /* =========================
     STORAGE
  ========================= */
  const STORAGE_SAVE = "eds_save_v3";
  const STORAGE_RANK = "eds_rank_v3";

  /* =========================
     DIFICULDADE PROGRESSIVA
  ========================= */
  const DIFFICULTY_BY_RANK = {
    "Interno":   { label: "Leve",   timeFactor: 1.3, penalty: 0.8, criticalChance: 0.15 },
    "Residente": { label: "Normal", timeFactor: 1.0, penalty: 1.0, criticalChance: 0.30 },
    "Titular":   { label: "Difícil",timeFactor: 0.85,penalty: 1.25,criticalChance: 0.45 },
    "Pleno":     { label: "Caos",   timeFactor: 0.7, penalty: 1.5, criticalChance: 0.65 }
  };

  const CERT_LEVELS = [
    {
      name: "Bronze",
      criteria: s => s.cases >= 5,
      desc: "Conclusão dos primeiros atendimentos."
    },
    {
      name: "Prata",
      criteria: s => s.cases >= 15 && s.deaths <= 3,
      desc: "Boa condução clínica com baixo índice de óbitos."
    },
    {
      name: "Ouro",
      criteria: s => s.cases >= 30 && s.deaths <= 2 && s.dxAcc >= 0.75,
      desc: "Alta precisão diagnóstica."
    },
    {
      name: "Platina",
      criteria: s => s.cases >= 50 && s.deaths === 0 && s.dxAcc >= 0.85 && s.condAcc >= 0.85,
      desc: "Excelência clínica."
    }
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
    return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
  }

  function uid() {
    return "EDS-" + Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  /* =========================
     STATE
  ========================= */
  const state = {
    doctor: {
      name: "",
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
    try {
      Object.assign(state, JSON.parse(raw));
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
      points: state.stats.points
    };
    const i = list.findIndex(e => e.name === entry.name);
    if (i >= 0) list[i] = entry;
    else list.push(entry);
    list.sort((a, b) => b.points - a.points);
    localStorage.setItem(STORAGE_RANK, JSON.stringify(list.slice(0, 20)));
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
        registerDeath("Tempo excedido. Óbito inevitável.");
      }
    }, 1000);
  }

  function consumeTime(sec) {
    state.timer.remaining -= sec;
    $("caseTimer").textContent = formatTime(state.timer.remaining);
    if (state.timer.remaining <= 0) {
      registerDeath("Atraso crítico durante atendimento.");
    }
  }

  /* =========================
     PROGRESSÃO DE CARREIRA
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

  /* =========================
     CERTIFICAÇÃO
  ========================= */
  function getCertification() {
    const s = {
      cases: state.stats.cases,
      deaths: state.stats.deaths,
      dxAcc: state.stats.cases ? state.stats.dxCorrect / state.stats.cases : 0,
      condAcc: state.stats.cases ? state.stats.condCorrect / state.stats.cases : 0
    };

    let level = CERT_LEVELS[0];
    CERT_LEVELS.forEach(c => {
      if (c.criteria(s)) level = c;
    });
    return level;
  }

  function renderCertification() {
    const cert = getCertification();
    $("certName").textContent = state.doctor.name;
    $("certRank").textContent = state.doctor.rank;
    $("certLevel").textContent = cert.name;
    $("certId").textContent = state.doctor.certId;
    $("certDate").textContent = new Date().toLocaleDateString();
    $("certCases").textContent = state.stats.cases;
    $("certDeaths").textContent = state.stats.deaths;
    $("certDxAcc").textContent = Math.round(
      (state.stats.dxCorrect / Math.max(1, state.stats.cases)) * 100
    ) + "%";
    $("certCondAcc").textContent = Math.round(
      (state.stats.condCorrect / Math.max(1, state.stats.cases)) * 100
    ) + "%";
    $("certExamAvg").textContent = (
      state.stats.examsTotal / Math.max(1, state.stats.cases)
    ).toFixed(1);
    $("certPoints").textContent = state.stats.points;

    $("certCriteria").innerHTML = CERT_LEVELS.map(c =>
      `<div>${c.name}: ${c.desc}</div>`
    ).join("");
  }

  /* =========================
     GAME FLOW
  ========================= */
  function startCase() {
    updateRank();
    const diff = DIFFICULTY_BY_RANK[state.doctor.rank];

    const pool = state.data.cases.filter(c =>
      c.severity === "critica" ? Math.random() < diff.criticalChance : true
    );

    const c = pool[Math.floor(Math.random() * pool.length)];
    state.current = { case: c, exams: [], diagnosis: null, conduct: null, score: 0 };

    state.stats.cases++;
    $("uiCases").textContent = state.stats.cases;

    $("caseTitle").textContent = c.title;
    $("caseStatus").textContent = c.complaint + " — " + c.history;
    $("caseVitals").textContent = c.vitals.join(" • ");

    const base = c.timeLimitSec || 120;
    startTimer(Math.floor(base * diff.timeFactor));

    saveGame();
    showScreen("case");
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
        state.stats.examsTotal++;
        consumeTime(ex.timeSec);
        $("examResults").innerHTML += `<div class="caseCard">${ex.name}: resultado disponível</div>`;
        showScreen("results");
      };
      list.appendChild(b);
    });
    showScreen("exams");
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
      b.onclick = () => state.current.diagnosis = d;
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

    let score = 20;

    const dxOk = state.current.diagnosis === c.correctDiagnosis;
    const cdOk = state.current.conduct === c.correctConduct;

    if (dxOk) { score += 25; state.stats.dxCorrect++; }
    else score -= 15 * diff.penalty;

    if (cdOk) { score += 30; state.stats.condCorrect++; }
    else score -= 20 * diff.penalty;

    // Penalidade por excesso de exames
    if (state.current.exams.length > 2) {
      score -= (state.current.exams.length - 2) * 5;
    }

    // Bônus de tempo
    score += Math.floor(state.timer.remaining / 10);

    // Peso por gravidade
    if (c.severity === "critica") score += 10;

    score = Math.floor(score);
    state.current.score = score;
    state.stats.points = Math.max(0, state.stats.points + score);

    // Relatório
    $("reportSummary").textContent = c.title;
    $("reportDxChosen").textContent = state.current.diagnosis;
    $("reportDxCorrect").textContent = c.correctDiagnosis;
    $("reportConductChosen").textContent = state.current.conduct;
    $("reportConductCorrect").textContent = c.correctConduct;
    $("reportTime").textContent =
      `${formatTime(state.timer.initial)} → ${formatTime(state.timer.remaining)}`;
    $("reportExamsCount").textContent = state.current.exams.length;
    $("reportScore").textContent = `${score} pts`;
    $("reportFeedback").textContent = c.educationalFeedback || "Avaliação clínica conforme diretrizes.";

    const cert = getCertification();
    $("reportCert").textContent = cert.name;
    $("reportNextGoal").textContent = cert.desc;

    saveGame();
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
  $("btnExams").onclick = openExams;
  $("btnToDiagnosis").onclick = openDiagnosis;
  $("btnToDiagnosisFromResults").onclick = openDiagnosis;
  $("btnToConduct").onclick = openConduct;
  $("btnFinalizeCase").onclick = finalizeCase;

  $("btnReportContinue").onclick = () => showScreen("office");
  $("btnReportCertification").onclick = () => { renderCertification(); showScreen("cert"); };
  $("btnOfficeCertification").onclick = () => { renderCertification(); showScreen("cert"); };
  $("btnCertBack").onclick = () => showScreen("office");

  $("btnBackOffice").onclick = () => showScreen("office");

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

    updateRank();
    $("uiCertLevel").textContent = getCertification().name;

    showScreen("home");
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
