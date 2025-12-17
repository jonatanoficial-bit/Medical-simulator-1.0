/* =========================================================
   Emergency Doctor Simulator — script.js (v3.2.0)
   =========================================================
   ✔ Intro com typewriter
   ✔ Consultório (hub) + HUD
   ✔ Casos via cases.json
   ✔ Exames via exams.json
   ✔ Tela de exames + resultados
   ✔ Cronômetro: caso + consumo por exame
   ✔ Óbito automático (tempo/estouro)
   ✔ Persistência total (save)
   ✔ Ranking Top 20
   ✔ Progressão de cargo
   ========================================================= */

(() => {
  "use strict";

  /* =========================
     CONFIG
  ========================= */
  const APP_VERSION = "3.2.0";

  const STORAGE_SAVE = "eds_save_v3_2";
  const STORAGE_RANK = "eds_rank_v3_2";

  const CASE_TIME_DEFAULT = 120;

  // mínima “avaliação” antes de permitir finalizar (ex.: pelo menos 1 exame)
  const MIN_EXAMS_TO_FINISH = 1;

  /* =========================
     HELPERS
  ========================= */
  const $ = (id) => document.getElementById(id);
  const qs = (sel) => document.querySelector(sel);

  function showScreen(name) {
    document.querySelectorAll(".screen").forEach((s) => {
      s.classList.toggle("active", s.dataset.screen === name);
    });
  }

  function safeText(v) {
    if (v === null || v === undefined) return "";
    return String(v);
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function nowTs() {
    return Date.now();
  }

  function formatTime(sec) {
    sec = Math.max(0, Math.floor(sec));
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function isActiveScreen(name) {
    return qs(".screen.active")?.dataset?.screen === name;
  }

  function trySetText(id, text) {
    const el = $(id);
    if (el) el.textContent = safeText(text);
  }

  /* =========================
     STATE
  ========================= */
  const state = {
    doctor: {
      name: "",
      avatar: "",
      rank: "Interno",
      createdAt: null,
      introSeen: false,
    },
    stats: {
      points: 0,
      cases: 0,
      deaths: 0,
      correct: 0,
      wrong: 0,
      streak: 0,
      bestStreak: 0,
      examsRequestedTotal: 0,
    },
    timer: {
      max: CASE_TIME_DEFAULT,
      remaining: 0,
      interval: null,
      startedAt: null,
    },
    data: {
      cases: [],
      exams: [],
    },
    gameplay: {
      currentCase: null,
      requestedExams: [],     // ids
      examResults: [],        // { examId, name, resultText, timeSec, atTs }
    },
    typewriter: {
      running: false,
      skip: false,
    },
  };

  /* =========================
     SAVE / LOAD
  ========================= */
  function serializeSave() {
    return {
      v: APP_VERSION,
      doctor: state.doctor,
      stats: state.stats,
    };
  }

  function saveGame() {
    try {
      localStorage.setItem(STORAGE_SAVE, JSON.stringify(serializeSave()));
    } catch (e) {}
    updateRanking();
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem(STORAGE_SAVE);
      if (!raw) return false;
      const obj = JSON.parse(raw);
      if (!obj || typeof obj !== "object") return false;

      if (obj.doctor) {
        state.doctor.name = safeText(obj.doctor.name || "");
        state.doctor.avatar = safeText(obj.doctor.avatar || "");
        state.doctor.rank = safeText(obj.doctor.rank || "Interno") || "Interno";
        state.doctor.createdAt = obj.doctor.createdAt ?? null;
        state.doctor.introSeen = !!obj.doctor.introSeen;
      }
      if (obj.stats) {
        const s = obj.stats;
        state.stats.points = Number(s.points || 0);
        state.stats.cases = Number(s.cases || 0);
        state.stats.deaths = Number(s.deaths || 0);
        state.stats.correct = Number(s.correct || 0);
        state.stats.wrong = Number(s.wrong || 0);
        state.stats.streak = Number(s.streak || 0);
        state.stats.bestStreak = Number(s.bestStreak || 0);
        state.stats.examsRequestedTotal = Number(s.examsRequestedTotal || 0);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function hasProfile() {
    return !!(state.doctor.name && state.doctor.avatar);
  }

  function resetGame() {
    state.doctor = { name: "", avatar: "", rank: "Interno", createdAt: null, introSeen: false };
    state.stats = { points: 0, cases: 0, deaths: 0, correct: 0, wrong: 0, streak: 0, bestStreak: 0, examsRequestedTotal: 0 };
    state.gameplay.currentCase = null;
    state.gameplay.requestedExams = [];
    state.gameplay.examResults = [];
    clearTimer();
    saveGame();
  }

  /* =========================
     RANKING (Top 20)
  ========================= */
  function getRanking() {
    try {
      const raw = localStorage.getItem(STORAGE_RANK);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function setRanking(arr) {
    try {
      localStorage.setItem(STORAGE_RANK, JSON.stringify(arr));
    } catch (e) {}
  }

  function updateRanking() {
    if (!hasProfile()) return;

    const list = getRanking();
    const nameKey = state.doctor.name.trim();

    const entry = {
      name: nameKey,
      rank: state.doctor.rank,
      points: state.stats.points,
      cases: state.stats.cases,
      deaths: state.stats.deaths,
      bestStreak: state.stats.bestStreak,
      examsRequestedTotal: state.stats.examsRequestedTotal,
      updatedAt: nowTs(),
    };

    const idx = list.findIndex((x) => x && x.name === nameKey);
    if (idx >= 0) list[idx] = entry;
    else list.push(entry);

    list.sort((a, b) =>
      (b.points || 0) - (a.points || 0) ||
      (b.bestStreak || 0) - (a.bestStreak || 0) ||
      (b.examsRequestedTotal || 0) - (a.examsRequestedTotal || 0)
    );

    setRanking(list.slice(0, 20));
  }

  function renderRanking() {
    const listWrap = $("rankingList");
    if (!listWrap) return;

    const list = getRanking();
    if (!list.length) {
      listWrap.innerHTML = `<div style="opacity:.75;padding:8px 0;">Sem ranking ainda.</div>`;
      return;
    }

    listWrap.innerHTML = "";
    list.forEach((r, i) => {
      const row = document.createElement("div");
      row.className = "rankRow";
      row.innerHTML = `
        <div class="rankPos">${i + 1}º</div>
        <div class="rankName">${safeText(r.name)}</div>
        <div class="rankMeta">${safeText(r.rank)} • ${safeText(r.cases)} casos • ${safeText(r.deaths)} óbitos</div>
        <div class="rankPts">${safeText(r.points)} pts</div>
      `;
      listWrap.appendChild(row);
    });
  }

  function openRanking() {
    renderRanking();
    $("rankingModal")?.classList.remove("hidden");
  }
  function closeRanking() {
    $("rankingModal")?.classList.add("hidden");
  }

  /* =========================
     HELP MODAL
  ========================= */
  function openHelp() { $("helpModal")?.classList.remove("hidden"); }
  function closeHelp() { $("helpModal")?.classList.add("hidden"); }

  /* =========================
     PROGRESSÃO DE CARGO
  ========================= */
  function updateRank() {
    const p = state.stats.points;
    let rank = "Interno";
    if (p >= 200) rank = "Pleno";
    else if (p >= 110) rank = "Titular";
    else if (p >= 50) rank = "Residente";
    state.doctor.rank = rank;
  }

  /* =========================
     HUD
  ========================= */
  function updateOfficeHUD() {
    trySetText("uiName", state.doctor.name || "—");
    trySetText("uiRank", state.doctor.rank || "Interno");
    const av = $("uiAvatar");
    if (av) av.src = state.doctor.avatar || "images/avatar1.png";

    trySetText("uiPoints", state.stats.points);
    trySetText("uiCases", state.stats.cases);
    trySetText("uiDeaths", state.stats.deaths);

    // timer no consultório fica 00:00
    if ($("caseTimer")) {
      $("caseTimer").textContent = state.timer.interval ? formatTime(state.timer.remaining) : "00:00";
    }
  }

  function setCaseUI(c) {
    if (!c) return;

    const title = c.title ? `${c.title}` : "Paciente em atendimento";
    const patient = c.patient || {};
    const vitals = Array.isArray(c.vitals) ? c.vitals.join(" • ") : "—";

    const resumo =
      `Paciente: ${safeText(patient.name || "—")} (${safeText(patient.age ?? "—")} anos, ${safeText(patient.sex || "—")}). ` +
      `Queixa: ${safeText(c.complaint || "—")}. ` +
      (c.history ? `História: ${safeText(c.history)}.` : "");

    trySetText("caseTitle", title);
    trySetText("caseStatus", resumo);
    trySetText("caseVitals", vitals);
  }

  function setDeathReason(text) {
    trySetText("deathReason", text || "O paciente não resistiu.");
  }

  /* =========================
     DATA LOAD
  ========================= */
  async function loadCases() {
    const url = `cases.json?v=${encodeURIComponent(APP_VERSION)}&t=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Falha ao carregar cases.json (HTTP ${res.status})`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("cases.json inválido (esperado array).");
    state.data.cases = data;
  }

  async function loadExams() {
    const url = `exams.json?v=${encodeURIComponent(APP_VERSION)}&t=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Falha ao carregar exams.json (HTTP ${res.status})`);
    const data = await res.json();
    const arr = data?.exams;
    if (!Array.isArray(arr)) throw new Error("exams.json inválido (esperado { exams: [] }).");
    state.data.exams = arr;
  }

  function getRandomCase() {
    const list = state.data.cases || [];
    if (!list.length) return null;
    const idx = Math.floor(Math.random() * list.length);
    return list[idx] || null;
  }

  /* =========================
     TIMER / ÓBITO
  ========================= */
  function clearTimer() {
    if (state.timer.interval) {
      clearInterval(state.timer.interval);
      state.timer.interval = null;
    }
  }

  function syncTimerUI() {
    if ($("caseTimer")) $("caseTimer").textContent = formatTime(state.timer.remaining);
  }

  function startTimer(seconds) {
    clearTimer();
    state.timer.max = seconds;
    state.timer.remaining = seconds;
    state.timer.startedAt = nowTs();

    syncTimerUI();

    state.timer.interval = setInterval(() => {
      state.timer.remaining--;
      syncTimerUI();

      if (state.timer.remaining <= 0) {
        clearTimer();
        registerDeath("Tempo esgotado. O paciente não resistiu.");
      }
    }, 1000);
  }

  // Consome tempo imediatamente (exames, ações)
  function consumeTime(seconds, reason) {
    const s = Number(seconds || 0);
    if (!Number.isFinite(s) || s <= 0) return;

    state.timer.remaining -= s;
    syncTimerUI();

    if (state.timer.remaining <= 0) {
      clearTimer();
      registerDeath(reason || "Tempo esgotado durante o atendimento. O paciente não resistiu.");
    }
  }

  /* =========================
     INTRO TYPEWRITER
  ========================= */
  async function runTypewriter(text) {
    const box = $("directorText");
    if (!box) return;

    state.typewriter.running = true;
    state.typewriter.skip = false;
    box.textContent = "";

    for (let i = 0; i < text.length; i++) {
      if (state.typewriter.skip) {
        box.textContent = text;
        break;
      }
      box.textContent += text[i];
      await new Promise((r) => setTimeout(r, 18));
    }

    state.typewriter.running = false;
  }

  function skipTypewriter() {
    state.typewriter.skip = true;
  }

  function introText() {
    const name = state.doctor.name || "Doutor(a)";
    return (
`Bem-vindo(a), ${name}.

Você está iniciando seu plantão no pronto-socorro.
Aqui, tempo e decisões corretas salvam vidas.

Regras do plantão:
• Cada caso possui um cronômetro.
• Solicitar exames consome tempo.
• Óbitos reduzem sua pontuação.
• Suba de cargo: Interno → Residente → Titular → Pleno.

Quando estiver pronto(a), vá ao consultório e inicie o atendimento.`
    );
  }

  async function goIntro() {
    showScreen("intro");
    await runTypewriter(introText());
  }

  /* =========================
     MAPEAMENTO CLÍNICO
     - Conecta case.id/tema ao "cenário" do exams.json
     - Evita o erro clássico: texto do diagnóstico não bater com chave do JSON
  ========================= */
  function scenarioKeyFromCase(c) {
    const id = safeText(c?.id || "").toUpperCase();
    const title = safeText(c?.title || "").toLowerCase();
    const likely = safeText(c?.notesForGame?.likelyDiagnosis || "").toLowerCase();

    // Prioriza prefixos do ID do seu cases.json
    if (id.startsWith("MI_")) return "iam";
    if (id.startsWith("STROKE_")) return "stroke";
    if (id.startsWith("DKA_")) return "dka";
    if (id.startsWith("SEPSIS_")) return "sepsis";
    if (id.startsWith("UGIB_")) return "bleeding";
    if (id.startsWith("TENSION_PTX_")) return "pneumothorax";
    if (id.startsWith("OPIOID_")) return "resp_failure";
    if (id.startsWith("MENING_")) return "infection";
    if (id.startsWith("ECTOPIC_")) return "positive";
    if (id.startsWith("USG_FAST_")) return "trauma";

    // Fallback por pistas textuais
    if (likely.includes("coronar")) return "iam";
    if (likely.includes("avc")) return "stroke";
    if (likely.includes("cetoac")) return "dka";
    if (likely.includes("sepse")) return "sepsis";
    if (title.includes("pneumotórax") || title.includes("pneumotorax")) return "pneumothorax";
    if (title.includes("mening")) return "infection";

    // padrão
    return "normal";
  }

  function computeExamResultText(exam, c) {
    const scenario = scenarioKeyFromCase(c);

    // Algumas chaves são exame-específicas (ex.: Beta-hCG)
    // Se for ECTOPIC e Beta-hCG, usamos "positive"
    if (exam.id === "BETA_HCG") {
      return (scenario === "positive") ? exam.results.positive : exam.results.negative;
    }

    // Glicemia: DKA tende a hiperglicemia
    if (exam.id === "GLICEMIA") {
      if (scenario === "dka") return exam.results.hyper || exam.results.normal;
      return exam.results.normal || "Sem alterações.";
    }

    // Default: usa chave do cenário, senão normal
    return exam.results[scenario] || exam.results.normal || "Resultado inconclusivo.";
  }

  /* =========================
     EXAMES UI
  ========================= */
  function renderExamList() {
    const wrap = $("examList");
    if (!wrap) return;

    wrap.innerHTML = "";

    // Lista de botões de exames
    state.data.exams.forEach((ex) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn";

      const already = state.gameplay.requestedExams.includes(ex.id);
      btn.disabled = already;

      btn.textContent = `${ex.name} (+${ex.timeSec}s)${already ? " ✓" : ""}`;

      btn.addEventListener("click", () => requestExam(ex.id));
      wrap.appendChild(btn);
    });

    if (!state.data.exams.length) {
      wrap.innerHTML = `<div style="opacity:.75;">Nenhum exame carregado. Verifique exams.json na raiz.</div>`;
    }
  }

  function renderExamResults() {
    const wrap = $("examResults");
    if (!wrap) return;

    wrap.innerHTML = "";

    if (!state.gameplay.examResults.length) {
      wrap.innerHTML = `<div style="opacity:.75;">Nenhum resultado ainda.</div>`;
      return;
    }

    state.gameplay.examResults.forEach((r) => {
      const card = document.createElement("div");
      card.className = "caseCard";
      card.innerHTML = `<b>${safeText(r.name)}</b><br/>${safeText(r.resultText)}`;
      wrap.appendChild(card);
    });
  }

  function openExamsScreen() {
    if (!state.gameplay.currentCase) return;
    renderExamList();
    showScreen("exams");
  }

  function openResultsScreen() {
    renderExamResults();
    showScreen("results");
  }

  function requestExam(examId) {
    const c = state.gameplay.currentCase;
    if (!c) return;

    if (state.gameplay.requestedExams.includes(examId)) return;

    const exam = state.data.exams.find((x) => x.id === examId);
    if (!exam) {
      alert("Exame não encontrado. Verifique exams.json.");
      return;
    }

    // Marca como solicitado
    state.gameplay.requestedExams.push(examId);
    state.stats.examsRequestedTotal += 1;

    // Consome tempo (tempo do exame)
    consumeTime(Number(exam.timeSec || 0), `Tempo esgotado durante o exame: ${exam.name}. O paciente não resistiu.`);

    // Se morreu, aborta
    if (!state.gameplay.currentCase) return;

    // Gera resultado coerente
    const resultText = computeExamResultText(exam, c);

    state.gameplay.examResults.push({
      examId: exam.id,
      name: exam.name,
      resultText,
      timeSec: Number(exam.timeSec || 0),
      atTs: nowTs(),
    });

    saveGame();

    // Mostra resultados
    openResultsScreen();
  }

  /* =========================
     GAMEPLAY FLOW
  ========================= */
  function startCase() {
    if (!state.data.cases.length) {
      alert("cases.json não carregou. Confira se o arquivo está na raiz do projeto.");
      return;
    }

    const c = getRandomCase();
    if (!c) {
      alert("Nenhum caso disponível.");
      return;
    }

    state.gameplay.currentCase = c;
    state.gameplay.requestedExams = [];
    state.gameplay.examResults = [];

    state.stats.cases += 1;

    // tempo por caso vindo do JSON, senão default
    const caseTime = Number(c.timeLimitSec || CASE_TIME_DEFAULT);
    startTimer(caseTime);

    setCaseUI(c);

    updateRank();
    updateOfficeHUD();
    saveGame();

    showScreen("case");
  }

  function finalizeCase() {
    // Regras mínimas: não deixar “finalizar” sem avaliação
    if (state.gameplay.requestedExams.length < MIN_EXAMS_TO_FINISH) {
      alert("Antes de finalizar, solicite ao menos 1 exame.");
      return;
    }

    clearTimer();

    const c = state.gameplay.currentCase;
    if (!c) {
      updateOfficeHUD();
      showScreen("office");
      return;
    }

    // Pontuação (fase clínica 2):
    // - Base: +15
    // - Bônus tempo: +1 por 10s restantes
    // - Penalidade por muitos exames: -1 por exame após o 3º
    // - Casos de letalidade alta (expectedOutcome=death): reduz ganho
    const expected = safeText(c.expectedOutcome || "survive").toLowerCase();
    let gained = 15;

    const bonusTime = Math.floor(Math.max(0, state.timer.remaining) / 10);
    gained += bonusTime;

    const extraExams = Math.max(0, state.gameplay.requestedExams.length - 3);
    gained -= extraExams;

    if (expected === "death") {
      gained = Math.max(6, Math.floor(gained * 0.5));
      state.stats.wrong += 1;
      state.stats.streak = 0;
    } else {
      state.stats.correct += 1;
      state.stats.streak += 1;
      state.stats.bestStreak = Math.max(state.stats.bestStreak, state.stats.streak);
    }

    state.stats.points = clamp(state.stats.points + gained, 0, 999999);

    updateRank();
    updateOfficeHUD();
    saveGame();

    // encerra caso
    state.gameplay.currentCase = null;
    state.gameplay.requestedExams = [];
    state.gameplay.examResults = [];

    showScreen("office");
  }

  function registerDeath(reason) {
    clearTimer();

    state.stats.deaths += 1;
    state.stats.wrong += 1;
    state.stats.streak = 0;

    // penalidade por óbito
    state.stats.points = clamp(state.stats.points - 20, 0, 999999);

    updateRank();
    updateOfficeHUD();
    saveGame();

    state.gameplay.currentCase = null;
    state.gameplay.requestedExams = [];
    state.gameplay.examResults = [];

    setDeathReason(reason);
    showScreen("death");
  }

  /* =========================
     UI BINDINGS
  ========================= */
  function bindHome() {
    $("btnNewGame")?.addEventListener("click", () => {
      resetGame();
      document.querySelectorAll(".avatarCard").forEach((c) => c.classList.remove("selected"));
      const input = $("inputName");
      if (input) input.value = "";
      showScreen("profile");
    });

    $("btnContinue")?.addEventListener("click", () => {
      if (hasProfile()) {
        updateRank();
        updateOfficeHUD();
        if (!state.doctor.introSeen) goIntro();
        else showScreen("office");
      } else {
        showScreen("profile");
      }
    });
  }

  function bindProfile() {
    const input = $("inputName");
    const cards = document.querySelectorAll(".avatarCard");

    cards.forEach((card) => {
      card.addEventListener("click", () => {
        cards.forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
        state.doctor.avatar = card.dataset.avatar || "";
      });
    });

    // compatibilidade com index antigo/novo
    $("btnStartFromProfile")?.addEventListener("click", startFromProfile);
    $("btnStartGame")?.addEventListener("click", startFromProfile);

    $("btnProfileBack")?.addEventListener("click", () => showScreen("home"));

    function startFromProfile() {
      const name = (input?.value || "").trim();
      if (!name) {
        alert("Digite seu nome.");
        return;
      }
      if (!state.doctor.avatar) {
        alert("Selecione um avatar.");
        return;
      }

      state.doctor.name = name;
      if (!state.doctor.createdAt) state.doctor.createdAt = nowTs();

      updateRank();
      updateOfficeHUD();
      saveGame();

      goIntro();
    }
  }

  function bindIntro() {
    $("directorText")?.addEventListener("click", () => {
      if (state.typewriter.running) skipTypewriter();
    });

    $("btnIntroContinue")?.addEventListener("click", () => {
      state.doctor.introSeen = true;
      saveGame();
      updateOfficeHUD();
      showScreen("office");
    });

    $("btnIntroHelp")?.addEventListener("click", openHelp);

    document.addEventListener("keydown", (e) => {
      if (isActiveScreen("intro") && e.key === "Escape") skipTypewriter();
    });
  }

  function bindOffice() {
    $("btnNextCase")?.addEventListener("click", startCase);
    $("btnOfficeRanking")?.addEventListener("click", openRanking);
  }

  function bindCase() {
    $("btnExams")?.addEventListener("click", openExamsScreen);
    $("btnFinalize")?.addEventListener("click", finalizeCase);
  }

  function bindExamsAndResults() {
    $("btnBackCase")?.addEventListener("click", () => showScreen("case"));
    $("btnReturnCase")?.addEventListener("click", () => showScreen("case"));
  }

  function bindDeath() {
    $("btnBackOffice")?.addEventListener("click", () => {
      updateOfficeHUD();
      showScreen("office");
    });
  }

  function bindRanking() {
    $("btnRanking")?.addEventListener("click", openRanking);
    $("btnCloseRanking")?.addEventListener("click", closeRanking);

    $("rankingModal")?.addEventListener("click", (e) => {
      if (e.target && e.target.id === "rankingModal") closeRanking();
    });
  }

  function bindHelp() {
    $("btnHelp")?.addEventListener("click", openHelp);
    $("btnCloseHelp")?.addEventListener("click", closeHelp);

    $("helpModal")?.addEventListener("click", (e) => {
      if (e.target && e.target.id === "helpModal") closeHelp();
    });
  }

  function bindFullscreenIfExists() {
    $("btnFullScreen")?.addEventListener("click", async () => {
      try {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
        else await document.exitFullscreen();
      } catch (e) {}
    });
  }

  /* =========================
     BOOT
  ========================= */
  async function boot() {
    bindHome();
    bindProfile();
    bindIntro();
    bindOffice();
    bindCase();
    bindExamsAndResults();
    bindDeath();
    bindRanking();
    bindHelp();
    bindFullscreenIfExists();

    const ok = loadGame();
    updateRank();
    updateOfficeHUD();
    if (ok) updateRanking();

    try {
      await loadCases();
    } catch (err) {
      console.error(err);
      alert("Não foi possível carregar cases.json. Confirme: arquivo na raiz e nome correto.");
    }

    try {
      await loadExams();
    } catch (err) {
      console.error(err);
      alert("Não foi possível carregar exams.json. Confirme: arquivo na raiz e nome correto.");
    }

    showScreen("home");
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
