/* =========================================================
   Emergency Doctor Simulator — script.js (FULL)
   Fixes:
   - Robust loading of cases.json + exams.json on GitHub Pages subpath and Vercel
   - Home buttons (Novo Jogo / Continuar) wired
   - Full Atendimento (screenCase) rendering + scoring
   - Fallbacks if a requested exam has no result in the case
   ========================================================= */

(() => {
  "use strict";

  // =========================
  // CONFIG
  // =========================
  const STORAGE_KEY = "eds_save_v1";
  const RANKING_KEY = "eds_ranking_v1"; // local ranking (offline)

  // GitHub Pages often runs under /<repo-name>/ ; Vercel usually under /
  function getBasePath() {
    const p = window.location.pathname || "/";
    // If ends with .html => base is folder
    if (p.endsWith(".html")) return p.slice(0, p.lastIndexOf("/") + 1);
    // If ends with / => base is itself
    if (p.endsWith("/")) return p;
    // Otherwise base folder
    return p + "/";
  }

  const BASE = getBasePath();

  // Try multiple URL candidates (covers GH Pages + Vercel + SW cache issues)
  async function loadJsonSmart(fileName) {
    const cacheBust = `v=${Date.now()}`;
    const candidates = [
      `${fileName}?${cacheBust}`,                 // relative (works in most cases)
      `./${fileName}?${cacheBust}`,
      `${BASE}${fileName}?${cacheBust}`,          // explicit base (GH Pages safe)
      `${BASE.replace(/\/+$/, "")}/${fileName}?${cacheBust}`,
    ];

    const tried = [];
    for (const url of candidates) {
      try {
        tried.push(url);
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) continue;
        const txt = await res.text();
        return JSON.parse(txt);
      } catch (_) {
        // continue
      }
    }

    const err = new Error(
      `Falha ao carregar ${fileName}. Tentativas:\n- ${tried.join("\n- ")}`
    );
    err.tried = tried;
    throw err;
  }

  // =========================
  // DOM HELPERS
  // =========================
  const $ = (id) => document.getElementById(id);

  function showScreen(screenId) {
    const screens = document.querySelectorAll(".screen");
    screens.forEach((s) => s.classList.remove("active"));
    const target = $(screenId);
    if (target) target.classList.add("active");
    window.scrollTo(0, 0);
  }

  function setText(id, text) {
    const el = $(id);
    if (el) el.textContent = text ?? "";
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function safeLower(s) {
    return String(s || "").toLowerCase();
  }

  function formatTriage(t) {
    const v = safeLower(t);
    if (v.includes("vermel")) return { label: "VERMELHO", cls: "triageRed" };
    if (v.includes("amarel")) return { label: "AMARELO", cls: "triageYellow" };
    return { label: "VERDE", cls: "triageGreen" };
  }

  // =========================
  // STATE
  // =========================
  let CASES = [];
  let EXAMS = []; // normalized array: [{id,label,category,timeMin,desc,normalText,image}]
  let EXAMS_MAP = new Map();

  const defaultState = {
    player: {
      name: "",
      avatar: "images/avatars/doc1.jpg",
    },
    stats: {
      points: 0,
      casesDone: 0,
      correctDx: 0,
      streak: 0,
      rank: "Interno",
    },
    progress: {
      currentCaseId: null,
      usedCaseIds: [],
    },
    lastCase: null,
  };

  let state = structuredClone(defaultState);

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const obj = JSON.parse(raw);
      if (!obj || typeof obj !== "object") return false;
      state = { ...structuredClone(defaultState), ...obj };
      // merge nested with safety
      state.player = { ...structuredClone(defaultState.player), ...(obj.player || {}) };
      state.stats = { ...structuredClone(defaultState.stats), ...(obj.stats || {}) };
      state.progress = { ...structuredClone(defaultState.progress), ...(obj.progress || {}) };
      return true;
    } catch {
      return false;
    }
  }

  function clearState() {
    state = structuredClone(defaultState);
    localStorage.removeItem(STORAGE_KEY);
  }

  // =========================
  // RANK / PROGRESSION
  // =========================
  function computeRank(points) {
    // You can tune later (upgrade #3)
    if (points >= 900) return "Chefe de Plantão";
    if (points >= 650) return "Médico Sênior";
    if (points >= 420) return "Plantonista";
    if (points >= 250) return "Residente";
    return "Interno";
  }

  function tierForRank(rank) {
    // Controls which cases appear more (but still mixed)
    const r = safeLower(rank);
    if (r.includes("chefe") || r.includes("sênior")) return "pleno";
    if (r.includes("plantonista")) return "titular";
    if (r.includes("residente")) return "residente";
    return "residente";
  }

  function updateHud() {
    const pts = state.stats.points | 0;
    state.stats.rank = computeRank(pts);

    setText("uiName", state.player.name || "—");
    const avatarImg = $("uiAvatar");
    if (avatarImg) avatarImg.src = state.player.avatar;

    setText("uiRank", state.stats.rank);
    setText("uiScore", String(pts));
    setText("uiCases", String(state.stats.casesDone | 0));
    setText("uiStreak", String(state.stats.streak | 0));

    const homeContinue = $("btnContinue");
    if (homeContinue) homeContinue.disabled = !localStorage.getItem(STORAGE_KEY);

    // Update home buttons visually if CSS uses disabled styles
  }

  // =========================
  // DATA NORMALIZATION
  // =========================
  function normalizeExams(raw) {
    // Accept formats:
    // 1) { exams: [...] }
    // 2) { version, exams: [...], normalFallback: {...} }
    // 3) [...] direct
    let list = [];
    let normalFallback = null;

    if (Array.isArray(raw)) {
      list = raw;
    } else if (raw && typeof raw === "object") {
      if (Array.isArray(raw.exams)) list = raw.exams;
      if (raw.normalFallback) normalFallback = raw.normalFallback;
    }

    const normalized = list.map((e) => {
      const id = e.id || e.key || e.slug;
      const label = e.label || e.name || id;
      const category = e.category || e.type || "Laboratório";
      const timeMin = Number(e.timeMin ?? e.time ?? 30);
      const desc = e.desc || e.description || "";
      const normalText =
        e.normalText ||
        (normalFallback && normalFallback.text) ||
        "Sem alterações relevantes (simulado).";
      const image =
        e.image ||
        (normalFallback && normalFallback.image) ||
        null;

      return { id, label, category, timeMin, desc, normalText, image };
    }).filter((x) => !!x.id);

    return normalized;
  }

  // =========================
  // CASE PICKING
  // =========================
  function caseMatchesTier(c, desiredTier) {
    const t = safeLower(c.tier);
    if (!desiredTier) return true;
    if (desiredTier === "residente") return t.includes("residente");
    if (desiredTier === "titular") return t.includes("titular");
    if (desiredTier === "pleno") return t.includes("pleno");
    return true;
  }

  function pickNextCase() {
    // Prefer cases not used yet; if all used, reset used list.
    const desiredTier = tierForRank(state.stats.rank);

    const unused = CASES.filter((c) => !state.progress.usedCaseIds.includes(c.id));
    let pool = unused.filter((c) => caseMatchesTier(c, desiredTier));

    // Keep variety: if pool empty, relax tier filter
    if (pool.length === 0) pool = unused.length ? unused : CASES.slice();

    if (!pool.length) return null;

    // Weighted variety: sprinkle harder cases
    const roll = Math.random();
    if (roll < 0.18) {
      const harder = pool.filter((c) => safeLower(c.tier).includes("pleno"));
      if (harder.length) pool = harder;
    } else if (roll < 0.38) {
      const mid = pool.filter((c) => safeLower(c.tier).includes("titular"));
      if (mid.length) pool = mid;
    }

    const picked = pool[Math.floor(Math.random() * pool.length)];
    return picked || null;
  }

  // =========================
  // ATENDIMENTO (SCREEN CASE)
  // =========================
  let activeCase = null;
  let selectedExams = new Set();
  let selectedDx = null;
  let selectedMeds = new Set();

  function resetSelections() {
    selectedExams = new Set();
    selectedDx = null;
    selectedMeds = new Set();
  }

  function renderCaseHeader(c) {
    setText("caseTitle", c.title || "Atendimento");
    setText("caseSub", `${c.patient?.name || "Paciente"} • ${c.patient?.age ?? "—"} anos • ${c.patient?.sex || "—"}`);

    // Triage badge
    const tri = formatTriage(c.patient?.triage || "Verde");
    setText("caseTriageLabel", tri.label);
    const triBar = $("caseTriageBar");
    if (triBar) {
      triBar.classList.remove("triageRed", "triageYellow", "triageGreen");
      triBar.classList.add(tri.cls);
    }

    // Vitals
    const vitalsBox = $("caseVitals");
    if (vitalsBox) {
      vitalsBox.innerHTML = "";
      (c.vitals || []).forEach((v) => {
        const pill = document.createElement("div");
        pill.className = "pill";
        pill.textContent = v;
        vitalsBox.appendChild(pill);
      });
    }

    setText("caseComplaint", c.complaint || "—");
    setText("caseHistory", c.history || "—");
  }

  function renderQuestions(c) {
    const box = $("caseQuestions");
    if (!box) return;
    box.innerHTML = "";

    const qs = Array.isArray(c.questions) ? c.questions : [];
    if (!qs.length) {
      box.innerHTML = `<div class="muted">Sem perguntas adicionais neste caso.</div>`;
      return;
    }

    qs.forEach((q, idx) => {
      const row = document.createElement("div");
      row.className = "qRow";

      const left = document.createElement("div");
      left.className = "qLeft";
      left.innerHTML = `<div class="qLabel">${q.label || `Pergunta ${idx + 1}`}</div>`;

      const right = document.createElement("div");
      right.className = "qRight";

      const btn = document.createElement("button");
      btn.className = "btn small";
      btn.textContent = "Ver resposta";

      const ans = document.createElement("div");
      ans.className = "qAnswer hidden";
      ans.textContent = q.answer || "—";

      btn.addEventListener("click", () => {
        const hidden = ans.classList.contains("hidden");
        if (hidden) {
          ans.classList.remove("hidden");
          btn.textContent = "Ocultar";
        } else {
          ans.classList.add("hidden");
          btn.textContent = "Ver resposta";
        }
      });

      right.appendChild(btn);
      right.appendChild(ans);

      row.appendChild(left);
      row.appendChild(right);
      box.appendChild(row);
    });
  }

  function renderExamPicker() {
    const list = $("examPickList");
    if (!list) return;
    list.innerHTML = "";

    // Show all exams (AAA requirement: user must choose among all)
    EXAMS.forEach((exam) => {
      const item = document.createElement("button");
      item.className = "pickItem";
      item.type = "button";
      item.dataset.examId = exam.id;

      const isSelected = selectedExams.has(exam.id);
      if (isSelected) item.classList.add("selected");

      item.innerHTML = `
        <div class="pickTop">
          <div class="pickName">${exam.label}</div>
          <div class="pickMeta">Tempo: ${exam.timeMin} min • ${exam.category}</div>
        </div>
        ${exam.desc ? `<div class="pickDesc">${exam.desc}</div>` : ""}
      `;

      item.addEventListener("click", () => toggleExam(exam.id));
      list.appendChild(item);
    });

    renderExamResults();
  }

  function getExamResultText(examId) {
    const e = EXAMS_MAP.get(examId);
    const caseHas = activeCase?.examResults && activeCase.examResults[examId];

    if (caseHas && typeof caseHas === "object") {
      const txt = caseHas.text || caseHas.result || "Resultado indisponível (simulado).";
      return { text: txt, image: caseHas.image ?? e?.image ?? null };
    }

    // Not provided by case => normal fallback
    return { text: e?.normalText || "Sem alterações relevantes (simulado).", image: e?.image || null };
  }

  function toggleExam(examId) {
    if (!activeCase) return;

    if (selectedExams.has(examId)) selectedExams.delete(examId);
    else selectedExams.add(examId);

    renderExamPicker(); // re-render to update selected style
  }

  function renderExamResults() {
    const box = $("examResultsBox");
    if (!box) return;
    box.innerHTML = "";

    const chosen = Array.from(selectedExams);
    if (!chosen.length) {
      box.innerHTML = `<div class="muted">Nenhum exame solicitado ainda.</div>`;
      return;
    }

    chosen.forEach((examId) => {
      const e = EXAMS_MAP.get(examId);
      const r = getExamResultText(examId);

      const card = document.createElement("div");
      card.className = "resultInlineCard";
      card.innerHTML = `
        <div class="resultInlineTop">
          <div class="resultInlineName">${e ? e.label : examId}</div>
          <div class="resultInlineMeta">${e ? `${e.category} • ${e.timeMin} min` : ""}</div>
        </div>
        <div class="resultInlineText">${r.text}</div>
      `;

      // Optional image
      if (r.image) {
        const img = document.createElement("img");
        img.className = "resultInlineImg";
        img.alt = e ? e.label : "Imagem do exame";
        img.src = r.image;
        card.appendChild(img);
      }

      box.appendChild(card);
    });
  }

  function renderDxPicker() {
    const list = $("dxPickList");
    if (!list) return;
    list.innerHTML = "";

    const dx = Array.isArray(activeCase?.diagnosis) ? activeCase.diagnosis : [];
    dx.forEach((d, idx) => {
      const btn = document.createElement("button");
      btn.className = "pickItem";
      btn.type = "button";
      btn.dataset.dxIndex = String(idx);

      const chosen = selectedDx === idx;
      if (chosen) btn.classList.add("selected");

      const sev = safeLower(d.severity || "leve");
      const sevLabel = sev.includes("crit") ? "Crítico" : sev.includes("grav") ? "Grave" : "Leve";

      btn.innerHTML = `
        <div class="pickTop">
          <div class="pickName">${d.label || "Diagnóstico"}</div>
          <div class="pickMeta">Severidade: ${sevLabel}</div>
        </div>
      `;

      btn.addEventListener("click", () => {
        selectedDx = idx;
        renderDxPicker();
      });

      list.appendChild(btn);
    });
  }

  function renderMedPicker() {
    const list = $("medPickList");
    if (!list) return;
    list.innerHTML = "";

    const meds = Array.isArray(activeCase?.medications) ? activeCase.medications : [];
    meds.forEach((m, idx) => {
      const btn = document.createElement("button");
      btn.className = "pickItem";
      btn.type = "button";
      btn.dataset.medIndex = String(idx);

      const chosen = selectedMeds.has(idx);
      if (chosen) btn.classList.add("selected");

      const risk = safeLower(m.risk || "baixa");
      const riskLabel = risk.includes("alta") ? "Risco ALTO" : risk.includes("media") ? "Risco MÉDIO" : "Risco BAIXO";

      btn.innerHTML = `
        <div class="pickTop">
          <div class="pickName">${m.label || "Conduta"}</div>
          <div class="pickMeta">${riskLabel}</div>
        </div>
      `;

      btn.addEventListener("click", () => {
        if (selectedMeds.has(idx)) selectedMeds.delete(idx);
        else selectedMeds.add(idx);
        renderMedPicker();
      });

      list.appendChild(btn);
    });
  }

  function startCase(c) {
    activeCase = c;
    resetSelections();
    state.progress.currentCaseId = c.id;
    saveState();

    renderCaseHeader(c);
    renderQuestions(c);

    renderExamPicker();
    renderDxPicker();
    renderMedPicker();

    // Case CTA
    const btnFinalize = $("btnFinalizeCase");
    if (btnFinalize) {
      btnFinalize.disabled = false;
    }

    showScreen("screenCase");
  }

  // =========================
  // SCORING
  // =========================
  function computeExamScore(c) {
    // Essential = must pick. Recommended = good. Unnecessary = penalty.
    const essential = new Set((c.essentialExams || []).filter(Boolean));
    const recommended = new Set((c.recommendedExams || []).filter(Boolean));

    let score = 0;
    let good = 0;
    let bad = 0;

    // reward selected essentials + recommended
    for (const id of selectedExams) {
      if (essential.has(id)) {
        score += 8; good++;
      } else if (recommended.has(id)) {
        score += 4; good++;
      } else {
        score -= 3; bad++;
      }
    }

    // penalty for missing essentials
    for (const id of essential) {
      if (!selectedExams.has(id)) score -= 6;
    }

    // clamp to avoid extremes
    score = clamp(score, -20, 30);
    return { score, good, bad, essentialCount: essential.size };
  }

  function computeDxScore(c) {
    const dx = Array.isArray(c.diagnosis) ? c.diagnosis : [];
    const chosen = (typeof selectedDx === "number") ? dx[selectedDx] : null;
    if (!chosen) return { score: -8, correct: false, label: "Nenhum diagnóstico selecionado" };

    const sev = safeLower(chosen.severity || "leve");
    const sevMult = sev.includes("crit") ? 1.3 : sev.includes("grav") ? 1.1 : 1.0;

    if (chosen.correct) {
      const s = Math.round(22 * sevMult);
      return { score: s, correct: true, label: chosen.label || "Correto" };
    }
    // wrong dx is worse when the correct dx is severe (case-dependent not known), keep stable:
    const s = Math.round(-14 * sevMult);
    return { score: s, correct: false, label: chosen.label || "Incorreto" };
  }

  function riskPenalty(risk) {
    const r = safeLower(risk);
    if (r.includes("alta")) return 12;
    if (r.includes("media")) return 7;
    return 4;
  }

  function computeMedScore(c) {
    const meds = Array.isArray(c.medications) ? c.medications : [];
    let score = 0;
    let good = 0;
    let bad = 0;

    // reward/penalize selected meds
    selectedMeds.forEach((idx) => {
      const m = meds[idx];
      if (!m) return;
      if (m.correct) {
        score += 8; good++;
      } else {
        score -= riskPenalty(m.risk); bad++;
      }
    });

    // small penalty if selected none and case has at least 1 correct option
    const hasCorrect = meds.some((m) => m && m.correct);
    if (selectedMeds.size === 0 && hasCorrect) score -= 6;

    score = clamp(score, -25, 30);
    return { score, good, bad };
  }

  function finalizeCase() {
    if (!activeCase) return;

    const ex = computeExamScore(activeCase);
    const dx = computeDxScore(activeCase);
    const med = computeMedScore(activeCase);

    const total = ex.score + dx.score + med.score;

    // Update global stats
    state.stats.points = (state.stats.points | 0) + total;
    state.stats.casesDone = (state.stats.casesDone | 0) + 1;

    if (dx.correct) {
      state.stats.correctDx = (state.stats.correctDx | 0) + 1;
      state.stats.streak = (state.stats.streak | 0) + 1;
    } else {
      state.stats.streak = 0;
    }

    state.stats.rank = computeRank(state.stats.points);

    // Mark case as used
    if (activeCase.id && !state.progress.usedCaseIds.includes(activeCase.id)) {
      state.progress.usedCaseIds.push(activeCase.id);
    }
    state.progress.currentCaseId = null;

    // Save last case summary (for "Continuar" and results)
    state.lastCase = {
      id: activeCase.id,
      title: activeCase.title || "Caso",
      patient: activeCase.patient,
      points: total,
      breakdown: { exams: ex, dx, meds: med },
      selected: {
        exams: Array.from(selectedExams),
        dxIndex: selectedDx,
        medIdx: Array.from(selectedMeds),
      },
      ts: Date.now(),
    };

    saveState();
    updateHud();
    renderResults(state.lastCase);

    // Also update local ranking
    upsertLocalRanking();

    showScreen("screenResults");
  }

  // =========================
  // RESULTS SCREEN
  // =========================
  function renderResults(last) {
    if (!last) return;

    setText("resultsTitle", last.title || "Resumo do caso");
    const p = last.patient || {};
    setText("resultsSub", `${p.name || "Paciente"} • ${p.age ?? "—"} anos • ${p.triage || "—"}`);

    setText("resPoints", String(last.points | 0));
    setText("resExams", String(last.breakdown?.exams?.score ?? 0));
    setText("resDx", String(last.breakdown?.dx?.score ?? 0));
    setText("resMeds", String(last.breakdown?.meds?.score ?? 0));

    // small narrative
    const note = $("resultsNote");
    if (note) {
      const ok = !!last.breakdown?.dx?.correct;
      note.textContent = ok
        ? "Diagnóstico correto. Boa condução (simulado)."
        : "Diagnóstico incorreto. Revise hipóteses e critérios (simulado).";
    }
  }

  // =========================
  // RANKING (OFFLINE)
  // =========================
  function getLocalRanking() {
    try {
      const raw = localStorage.getItem(RANKING_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function setLocalRanking(arr) {
    localStorage.setItem(RANKING_KEY, JSON.stringify(arr));
  }

  function upsertLocalRanking() {
    const name = (state.player.name || "").trim();
    if (!name) return;

    const arr = getLocalRanking();
    const idx = arr.findIndex((x) => x && x.name === name);
    const entry = {
      name,
      points: state.stats.points | 0,
      rank: state.stats.rank,
      casesDone: state.stats.casesDone | 0,
      ts: Date.now(),
    };

    if (idx >= 0) arr[idx] = entry;
    else arr.push(entry);

    // sort desc by points
    arr.sort((a, b) => (b.points | 0) - (a.points | 0));
    setLocalRanking(arr);
  }

  function renderRanking() {
    const box = $("rankList");
    if (!box) return;

    const arr = getLocalRanking();
    if (!arr.length) {
      box.innerHTML = `<div class="muted">Sem ranking ainda. Jogue alguns casos para registrar.</div>`;
      return;
    }

    box.innerHTML = "";
    arr.slice(0, 50).forEach((r, i) => {
      const row = document.createElement("div");
      row.className = "rankRow";
      row.innerHTML = `
        <div class="rankPos">${i + 1}</div>
        <div class="rankMain">
          <div class="rankName">${r.name}</div>
          <div class="rankSub">${r.rank} • Casos: ${r.casesDone}</div>
        </div>
        <div class="rankPts">${r.points}</div>
      `;
      box.appendChild(row);
    });
  }

  // =========================
  // PROFILE / AVATARS
  // =========================
  function renderAvatars() {
    const grid = $("avatarGrid");
    if (!grid) return;
    grid.innerHTML = "";

    const avatars = [
      "images/avatars/doc1.jpg",
      "images/avatars/doc2.jpg",
      "images/avatars/doc3.jpg",
      "images/avatars/doc4.jpg",
      "images/avatars/doc5.jpg",
      "images/avatars/doc6.jpg",
    ];

    avatars.forEach((src) => {
      const item = document.createElement("button");
      item.className = "avatarTile";
      item.type = "button";

      if (state.player.avatar === src) item.classList.add("selected");

      item.innerHTML = `
        <div class="avatarFrame">
          <img src="${src}" alt="Avatar" loading="lazy" />
        </div>
      `;

      item.addEventListener("click", () => {
        state.player.avatar = src;
        saveState();
        renderAvatars();
      });

      grid.appendChild(item);
    });
  }

  function confirmProfileAndGoOffice() {
    const nameInput = $("inputName");
    const name = (nameInput ? nameInput.value : "").trim();

    if (!name) {
      alert("Digite seu nome para iniciar.");
      return;
    }

    state.player.name = name;
    saveState();
    updateHud();
    showScreen("screenOffice");
  }

  // =========================
  // OFFICE
  // =========================
  function renderOffice() {
    updateHud();
    const last = state.lastCase;
    const lastBox = $("officeLast");
    if (lastBox) {
      if (!last) {
        lastBox.innerHTML = `<div class="muted">Nenhum caso finalizado ainda.</div>`;
      } else {
        lastBox.innerHTML = `
          <div class="lastCard">
            <div class="lastTop">
              <div class="lastTitle">${last.title || "Último caso"}</div>
              <div class="lastPts">${last.points | 0} pts</div>
            </div>
            <div class="lastSub">${last.patient?.name || "Paciente"} • ${last.patient?.triage || "—"}</div>
          </div>
        `;
      }
    }
  }

  // =========================
  // HELP / FULLSCREEN
  // =========================
  function setupTopButtons() {
    const btnFs = $("btnFullscreen");
    if (btnFs) {
      btnFs.addEventListener("click", async () => {
        try {
          if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
          } else {
            await document.exitFullscreen();
          }
        } catch {
          // ignore
        }
      });
    }

    const btnHelp = $("btnHelp");
    if (btnHelp) {
      btnHelp.addEventListener("click", () => {
        alert(
          "Emergency Doctor Simulator\n\n" +
          "Objetivo: selecionar exames, diagnóstico e condutas adequadas (simulado).\n" +
          "Pontuação: escolhas corretas somam; escolhas inadequadas subtraem.\n\n" +
          "Aviso: simulação educacional. Não é orientação médica real."
        );
      });
    }

    const btnRanking = $("btnRanking");
    if (btnRanking) {
      btnRanking.addEventListener("click", () => {
        renderRanking();
        showScreen("screenRanking");
      });
    }

    const btnBackFromRanking = $("btnBackFromRanking");
    if (btnBackFromRanking) {
      btnBackFromRanking.addEventListener("click", () => {
        // return to office if we have profile; else home
        if (state.player?.name) showScreen("screenOffice");
        else showScreen("screenHome");
      });
    }
  }

  // =========================
  // BOOTSTRAP / EVENTS
  // =========================
  async function initData() {
    // Try load JSON. If fails, keep app usable but warn.
    try {
      const [casesRaw, examsRaw] = await Promise.all([
        loadJsonSmart("cases.json"),
        loadJsonSmart("exams.json"),
      ]);

      // cases should be array
      CASES = Array.isArray(casesRaw) ? casesRaw : (casesRaw?.cases || []);
      if (!Array.isArray(CASES)) CASES = [];

      EXAMS = normalizeExams(examsRaw);
      EXAMS_MAP = new Map(EXAMS.map((e) => [e.id, e]));

      if (!CASES.length || !EXAMS.length) {
        alert(
          "Arquivos JSON carregaram, mas parecem vazios.\n" +
          "Verifique se cases.json é um ARRAY e se exams.json contém exams[]."
        );
      }
    } catch (e) {
      console.error(e);
      alert(
        "Erro ao carregar cases.json/exams.json. Verifique se os arquivos existem na raiz do projeto.\n\n" +
        (e && e.message ? e.message : "")
      );
      // Keep minimal fallbacks so UI still opens
      CASES = [];
      EXAMS = [];
      EXAMS_MAP = new Map();
    }
  }

  function wireHome() {
    const btnNew = $("btnNewGame");
    const btnContinue = $("btnContinue");

    if (btnNew) {
      btnNew.addEventListener("click", () => {
        // keep ranking, but reset game state (fresh)
        clearState();
        // preselect avatar and empty name
        saveState();
        renderAvatars();
        updateHud();
        showScreen("screenProfile");
      });
    }

    if (btnContinue) {
      btnContinue.addEventListener("click", () => {
        const ok = loadState();
        updateHud();
        if (ok && state.player?.name) {
          renderOffice();
          showScreen("screenOffice");
        } else {
          renderAvatars();
          showScreen("screenProfile");
        }
      });
    }
  }

  function wireProfile() {
    const btnStart = $("btnStartProfile");
    if (btnStart) btnStart.addEventListener("click", confirmProfileAndGoOffice);

    const btnBack = $("btnBackProfile");
    if (btnBack) btnBack.addEventListener("click", () => showScreen("screenHome"));

    const input = $("inputName");
    if (input) {
      input.addEventListener("input", () => {
        // live store, but do not force until confirm
        state.player.name = input.value;
        saveState();
      });
    }
  }

  function wireOffice() {
    const btnStartCase = $("btnStartCase");
    if (btnStartCase) {
      btnStartCase.addEventListener("click", () => {
        if (!CASES.length) {
          alert("Sem casos carregados. Verifique cases.json.");
          return;
        }
        const c = pickNextCase();
        if (!c) {
          alert("Não foi possível selecionar um caso.");
          return;
        }
        startCase(c);
      });
    }

    const btnReset = $("btnResetSave");
    if (btnReset) {
      btnReset.addEventListener("click", () => {
        const sure = confirm("Reiniciar progresso? Isso zera pontuação e casos.");
        if (!sure) return;
        clearState();
        saveState();
        updateHud();
        showScreen("screenHome");
      });
    }
  }

  function wireCase() {
    const btnBack = $("btnBackCase");
    if (btnBack) btnBack.addEventListener("click", () => {
      activeCase = null;
      resetSelections();
      state.progress.currentCaseId = null;
      saveState();
      renderOffice();
      showScreen("screenOffice");
    });

    const btnFinalize = $("btnFinalizeCase");
    if (btnFinalize) btnFinalize.addEventListener("click", () => finalizeCase());
  }

  function wireResults() {
    const btnNext = $("btnNextCase");
    if (btnNext) {
      btnNext.addEventListener("click", () => {
        if (!CASES.length) {
          renderOffice();
          showScreen("screenOffice");
          return;
        }
        const c = pickNextCase();
        if (!c) {
          renderOffice();
          showScreen("screenOffice");
          return;
        }
        startCase(c);
      });
    }

    const btnOffice = $("btnBackOffice");
    if (btnOffice) {
      btnOffice.addEventListener("click", () => {
        renderOffice();
        showScreen("screenOffice");
      });
    }
  }

  // =========================
  // START
  // =========================
  async function bootstrap() {
    setupTopButtons();

    // Load state first (so UI doesn’t flash wrong)
    loadState();
    updateHud();

    // Data load (cases/exams)
    await initData();

    // Wire events
    wireHome();
    wireProfile();
    wireOffice();
    wireCase();
    wireResults();

    // Render profile UI
    const nameInput = $("inputName");
    if (nameInput) nameInput.value = state.player.name || "";

    renderAvatars();
    renderOffice();

    // Start screen:
    // If player exists => home; user chooses Continue or New Game.
    showScreen("screenHome");
  }

  document.addEventListener("DOMContentLoaded", bootstrap);
})();
