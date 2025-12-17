/* =========================================================
   Emergency Doctor Simulator — script.js (v1.1.0)
   Fixes:
   - IDs casados com o index.html enviado (btnNewGame/btnContinue etc.)
   - GitHub Pages + Vercel base-path robusto
   - Fluxo completo: Home -> Profile -> Office -> Case -> Results
   - Modais Ajuda/Ranking
   - Sistema de save estável
   ========================================================= */

(() => {
  "use strict";

  const SAVE_KEY = "eds_save_v1";
  const RANK_KEY = "eds_rank_v1";

  const $ = (id) => document.getElementById(id);

  function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    const el = $(id);
    if (el) el.classList.add("active");
    window.scrollTo(0, 0);
  }

  function getBasePath() {
    // GitHub Pages: https://user.github.io/<repo>/
    // Vercel: /
    if (!location.hostname.includes("github.io")) return "";
    const parts = location.pathname.split("/").filter(Boolean);
    // first segment is repo
    return parts.length ? `/${parts[0]}` : "";
  }

  const BASE = getBasePath();

  async function fetchJsonSmart(file) {
    const bust = `v=${Date.now()}`;
    const candidates = [
      `${BASE}/${file}?${bust}`,
      `./${file}?${bust}`,
      `${file}?${bust}`
    ];

    let lastErr = null;
    for (const url of candidates) {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) continue;
        return await res.json();
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error(`Falha ao carregar ${file}`);
  }

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function safeLower(s) { return String(s || "").toLowerCase(); }

  // =========================
  // STATE
  // =========================
  const defaultState = {
    player: { name: "", avatar: "images/doctor_1.jpg" },
    stats: { points: 0, correct: 0, wrong: 0, cases: 0, shift: 0, streak: 0, rank: "Interno" },
    progress: { used: [] },
    last: null
  };

  let state = structuredClone(defaultState);

  let CASES = [];
  let EXAMS = []; // normalized list
  let EXAMS_MAP = new Map();

  let activeCase = null;
  let selectedExams = new Set();
  let selectedDxIndex = null;
  let selectedMeds = new Set();

  function save() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const obj = JSON.parse(raw);
      state = structuredClone(defaultState);
      state.player = { ...state.player, ...(obj.player || {}) };
      state.stats = { ...state.stats, ...(obj.stats || {}) };
      state.progress = { ...state.progress, ...(obj.progress || {}) };
      state.last = obj.last || null;
      return true;
    } catch {
      return false;
    }
  }

  function clearSave() {
    localStorage.removeItem(SAVE_KEY);
    state = structuredClone(defaultState);
  }

  function computeRank(points) {
    if (points >= 900) return "Chefe de Plantão";
    if (points >= 650) return "Médico Sênior";
    if (points >= 420) return "Plantonista";
    if (points >= 250) return "Residente";
    return "Interno";
  }

  function updateHud() {
    state.stats.rank = computeRank(state.stats.points);

    const uiAvatar = $("uiAvatar");
    if (uiAvatar) uiAvatar.src = state.player.avatar;

    const setText = (id, v) => { const el = $(id); if (el) el.textContent = String(v ?? ""); };

    setText("uiName", state.player.name || "—");
    setText("uiRank", state.stats.rank);
    setText("uiPoints", state.stats.points | 0);
    setText("uiCorrect", state.stats.correct | 0);
    setText("uiWrong", state.stats.wrong | 0);
    setText("uiCases", state.stats.cases | 0);
    setText("uiShift", state.stats.shift | 0);
    setText("uiStreak", state.stats.streak | 0);

    const btnContinue = $("btnContinue");
    if (btnContinue) btnContinue.disabled = !localStorage.getItem(SAVE_KEY);
  }

  // =========================
  // EXAMS normalize
  // =========================
  function normalizeExams(raw) {
    let list = [];
    if (Array.isArray(raw)) list = raw;
    else if (raw && Array.isArray(raw.exams)) list = raw.exams;

    return list.map(e => {
      const id = e.id || e.key || e.slug;
      return {
        id,
        label: e.label || e.name || id,
        category: e.category || e.type || "Exame",
        timeMin: Number(e.timeMin ?? e.time ?? 30),
        desc: e.desc || e.description || "",
        normalText: e.normalText || "Sem alterações relevantes (simulado).",
        image: e.image || null
      };
    }).filter(x => !!x.id);
  }

  // =========================
  // HOME / PROFILE
  // =========================
  function bindProfileAvatarGrid() {
    const grid = $("avatarGrid");
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll(".avatarCard"));
    const setSelected = () => {
      cards.forEach(btn => {
        const a = btn.getAttribute("data-avatar");
        btn.classList.toggle("selected", a === state.player.avatar);
      });
    };

    cards.forEach(btn => {
      btn.addEventListener("click", () => {
        const a = btn.getAttribute("data-avatar");
        if (!a) return;
        state.player.avatar = a;
        save();
        setSelected();
      });
    });

    setSelected();
  }

  // =========================
  // CASE rendering
  // =========================
  function triageClass(tri) {
    const t = safeLower(tri);
    if (t.includes("vermel")) return "triageRed";
    if (t.includes("amarel")) return "triageYellow";
    return "triageGreen";
  }

  function setTriage(triText, timeText) {
    const badge = $("triageBadge");
    if (badge) {
      badge.classList.remove("triageRed", "triageYellow", "triageGreen");
      badge.classList.add(triageClass(triText));
    }
    const t = $("triageText");
    if (t) t.textContent = timeText ? `${triText} • ${timeText}` : (triText || "—");
  }

  function formatTime(sec) {
    const s = Math.max(0, sec|0);
    const mm = String(Math.floor(s/60)).padStart(2,"0");
    const ss = String(s%60).padStart(2,"0");
    return `${mm}:${ss}`;
  }

  function renderCase(c) {
    activeCase = c;
    selectedExams = new Set();
    selectedDxIndex = null;
    selectedMeds = new Set();

    $("caseTitle").textContent = c.title || "Caso";
    $("patientName").textContent = c.patient?.name || "—";
    $("patientSub").textContent = `${c.patient?.age ?? "—"} anos • ${c.patient?.sex || "—"}`;
    const photo = $("patientPhoto");
    if (photo) photo.src = c.patient?.photo || "images/patient_male.jpg";

    $("complaintText").textContent = c.complaint || "—";
    $("historyText").textContent = c.history || "—";

    // vitals
    const vitals = $("vitalsList");
    vitals.innerHTML = "";
    (c.vitals || []).forEach(v => {
      const li = document.createElement("li");
      li.textContent = v;
      vitals.appendChild(li);
    });

    // questions
    const qBox = $("questionsList");
    qBox.innerHTML = "";
    const qs = Array.isArray(c.questions) ? c.questions : [];
    if (!qs.length) {
      qBox.innerHTML = `<div class="muted">Sem perguntas adicionais.</div>`;
    } else {
      qs.forEach((q) => {
        const row = document.createElement("div");
        row.className = "qaRow";
        row.innerHTML = `
          <div class="qaTop">
            <div class="qaLabel">${q.label || "Pergunta"}</div>
            <button class="qaBtn" type="button">Ver</button>
          </div>
          <div class="qaAns hidden">${q.answer || "—"}</div>
        `;
        const btn = row.querySelector(".qaBtn");
        const ans = row.querySelector(".qaAns");
        btn.addEventListener("click", () => {
          const hid = ans.classList.contains("hidden");
          ans.classList.toggle("hidden", !hid);
          btn.textContent = hid ? "Ocultar" : "Ver";
        });
        qBox.appendChild(row);
      });
    }

    // limits
    const maxEx = $("maxExams");
    const maxMd = $("maxMeds");
    const maxExams = maxEx ? parseInt(maxEx.textContent, 10) || 3 : 3;
    const maxMeds = maxMd ? parseInt(maxMd.textContent, 10) || 2 : 2;

    renderExamPick(maxExams);
    renderDxPick();
    renderMedPick(maxMeds);

    // reset results box
    $("examResultsBox").innerHTML = `<div class="muted">Nenhum exame solicitado ainda.</div>`;

    // triage + timer placeholder (timer upgrade vem após “start” funcionar)
    setTriage(c.patient?.triage || "Verde", null);

    showScreen("screenCase");
  }

  function getCaseExamResult(examId) {
    const caseHas = activeCase?.examResults && activeCase.examResults[examId];
    const e = EXAMS_MAP.get(examId);

    if (caseHas && typeof caseHas === "object") {
      return { text: caseHas.text || "Resultado indisponível (simulado).", image: caseHas.image ?? e?.image ?? null };
    }
    return { text: e?.normalText || "Sem alterações relevantes (simulado).", image: e?.image || null };
  }

  function renderExamResults() {
    const box = $("examResultsBox");
    const chosen = Array.from(selectedExams);
    if (!chosen.length) {
      box.innerHTML = `<div class="muted">Nenhum exame solicitado ainda.</div>`;
      return;
    }
    box.innerHTML = "";
    chosen.forEach(examId => {
      const e = EXAMS_MAP.get(examId);
      const r = getCaseExamResult(examId);

      const card = document.createElement("div");
      card.className = "resultInlineCard";
      card.innerHTML = `
        <div class="resultInlineName">${e ? e.label : examId}</div>
        <div class="resultInlineMeta">${e ? `${e.category} • ${e.timeMin} min` : ""}</div>
        <div class="resultInlineText">${r.text}</div>
      `;
      if (r.image) {
        const img = document.createElement("img");
        img.className = "resultInlineImg";
        img.alt = e ? e.label : "Exame";
        img.src = r.image;
        card.appendChild(img);
      }
      box.appendChild(card);
    });
  }

  function renderExamPick(maxExams) {
    const list = $("examPickList");
    list.innerHTML = "";

    EXAMS.forEach(ex => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pickItem";
      if (selectedExams.has(ex.id)) btn.classList.add("selected");
      btn.innerHTML = `
        <div class="pickName">${ex.label}</div>
        <div class="pickMeta">${ex.category} • ${ex.timeMin} min</div>
        ${ex.desc ? `<div class="pickDesc">${ex.desc}</div>` : ""}
      `;

      btn.addEventListener("click", () => {
        const has = selectedExams.has(ex.id);
        if (has) selectedExams.delete(ex.id);
        else {
          if (selectedExams.size >= maxExams) return;
          selectedExams.add(ex.id);
        }
        renderExamPick(maxExams);
        renderExamResults();
      });

      list.appendChild(btn);
    });
  }

  function renderDxPick() {
    const list = $("dxPickList");
    list.innerHTML = "";
    const dx = Array.isArray(activeCase?.diagnosis) ? activeCase.diagnosis : [];
    dx.forEach((d, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pickItem";
      if (selectedDxIndex === idx) btn.classList.add("selected");
      btn.innerHTML = `
        <div class="pickName">${d.label || "Diagnóstico"}</div>
        <div class="pickMeta">Severidade: ${d.severity || "leve"}</div>
      `;
      btn.addEventListener("click", () => {
        selectedDxIndex = idx;
        renderDxPick();
      });
      list.appendChild(btn);
    });
  }

  function renderMedPick(maxMeds) {
    const list = $("medPickList");
    list.innerHTML = "";
    const meds = Array.isArray(activeCase?.medications) ? activeCase.medications : [];
    meds.forEach((m, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pickItem";
      if (selectedMeds.has(idx)) btn.classList.add("selected");
      btn.innerHTML = `
        <div class="pickName">${m.label || "Conduta"}</div>
        <div class="pickMeta">Risco: ${m.risk || "baixa"}</div>
      `;
      btn.addEventListener("click", () => {
        const has = selectedMeds.has(idx);
        if (has) selectedMeds.delete(idx);
        else {
          if (selectedMeds.size >= maxMeds) return;
          selectedMeds.add(idx);
        }
        renderMedPick(maxMeds);
      });
      list.appendChild(btn);
    });
  }

  // =========================
  // SCORING (sem cronômetro ainda)
  // =========================
  function scoreExams() {
    const essential = new Set((activeCase.essentialExams || []).filter(Boolean));
    const recommended = new Set((activeCase.recommendedExams || []).filter(Boolean));

    let s = 0;

    for (const id of selectedExams) {
      if (essential.has(id)) s += 8;
      else if (recommended.has(id)) s += 4;
      else s -= 3;
    }

    for (const id of essential) {
      if (!selectedExams.has(id)) s -= 6;
    }

    return clamp(s, -20, 30);
  }

  function scoreDx() {
    const dx = Array.isArray(activeCase.diagnosis) ? activeCase.diagnosis : [];
    const chosen = (typeof selectedDxIndex === "number") ? dx[selectedDxIndex] : null;
    if (!chosen) return { score: -8, correct: false };

    if (chosen.correct) return { score: 22, correct: true };
    return { score: -14, correct: false };
  }

  function scoreMeds() {
    const meds = Array.isArray(activeCase.medications) ? activeCase.medications : [];
    let s = 0;

    if (!selectedMeds.size && meds.some(x => x && x.correct)) s -= 6;

    selectedMeds.forEach(idx => {
      const m = meds[idx];
      if (!m) return;
      if (m.correct) s += 8;
      else {
        const r = safeLower(m.risk);
        s -= r.includes("alta") ? 12 : r.includes("media") ? 7 : 4;
      }
    });

    return clamp(s, -25, 30);
  }

  function finalizeCase() {
    if (!activeCase) return;

    const ex = scoreExams();
    const dx = scoreDx();
    const md = scoreMeds();
    const total = ex + dx.score + md;

    state.stats.points = (state.stats.points|0) + total;
    state.stats.cases = (state.stats.cases|0) + 1;
    state.stats.shift = (state.stats.shift|0) + 1;

    if (dx.correct) {
      state.stats.correct = (state.stats.correct|0) + 1;
      state.stats.streak = (state.stats.streak|0) + 1;
    } else {
      state.stats.wrong = (state.stats.wrong|0) + 1;
      state.stats.streak = 0;
    }

    if (activeCase.id && !state.progress.used.includes(activeCase.id)) {
      state.progress.used.push(activeCase.id);
    }

    state.last = {
      title: activeCase.title || "Caso",
      patient: activeCase.patient || {},
      points: total,
      breakdown: { exams: ex, dx: dx.score, meds: md }
    };

    save();
    updateHud();
    renderResults();
    upsertRanking();

    showScreen("screenResults");
  }

  function renderResults() {
    if (!state.last) return;
    $("resultsTitle").textContent = state.last.title;
    const p = state.last.patient || {};
    $("resultsSub").textContent = `${p.name || "Paciente"} • ${p.age ?? "—"} anos • ${p.triage || "—"}`;

    $("resPoints").textContent = String(state.last.points|0);
    $("resExams").textContent = String(state.last.breakdown.exams|0);
    $("resDx").textContent = String(state.last.breakdown.dx|0);
    $("resMeds").textContent = String(state.last.breakdown.meds|0);
  }

  // =========================
  // CASE PICK
  // =========================
  function pickNextCase() {
    if (!CASES.length) return null;

    const unused = CASES.filter(c => !state.progress.used.includes(c.id));
    const pool = unused.length ? unused : CASES;

    return pool[Math.floor(Math.random() * pool.length)];
  }

  // =========================
  // RANKING (local)
  // =========================
  function getRank() {
    try {
      const raw = localStorage.getItem(RANK_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function setRank(arr) {
    localStorage.setItem(RANK_KEY, JSON.stringify(arr));
  }

  function upsertRanking() {
    const name = (state.player.name || "").trim();
    if (!name) return;

    const arr = getRank();
    const idx = arr.findIndex(x => x && x.name === name);
    const entry = {
      name,
      points: state.stats.points|0,
      rank: state.stats.rank,
      cases: state.stats.cases|0,
      ts: Date.now()
    };
    if (idx >= 0) arr[idx] = entry;
    else arr.push(entry);

    arr.sort((a,b) => (b.points|0) - (a.points|0));
    setRank(arr);
  }

  function renderRankingModal() {
    const list = $("rankList");
    const arr = getRank();
    if (!arr.length) {
      list.innerHTML = `<div class="muted">Sem ranking ainda. Finalize casos para registrar.</div>`;
      return;
    }
    list.innerHTML = "";
    arr.slice(0, 50).forEach((r, i) => {
      const row = document.createElement("div");
      row.className = "rankRow";
      row.innerHTML = `
        <div class="rankPos">${i+1}</div>
        <div class="rankMain">
          <div class="rankName">${r.name}</div>
          <div class="rankSub">${r.rank} • Casos: ${r.cases}</div>
        </div>
        <div class="rankPts">${r.points}</div>
      `;
      list.appendChild(row);
    });
  }

  // =========================
  // MODALS / TOP ACTIONS
  // =========================
  function openModal(id) {
    const m = $(id);
    if (!m) return;
    m.classList.remove("hidden");
    m.setAttribute("aria-hidden", "false");
  }

  function closeModal(id) {
    const m = $(id);
    if (!m) return;
    m.classList.add("hidden");
    m.setAttribute("aria-hidden", "true");
  }

  function bindTopbar() {
    const btnFS = $("btnFullScreen");
    btnFS?.addEventListener("click", async () => {
      try {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
        else await document.exitFullscreen();
      } catch {}
    });

    $("btnHelp")?.addEventListener("click", () => openModal("helpModal"));
    $("btnCloseHelp")?.addEventListener("click", () => closeModal("helpModal"));

    $("btnRanking")?.addEventListener("click", () => {
      renderRankingModal();
      openModal("rankModal");
    });
    $("btnCloseRank")?.addEventListener("click", () => closeModal("rankModal"));
  }

  // =========================
  // DATA LOAD
  // =========================
  async function initData() {
    try {
      const [casesRaw, examsRaw] = await Promise.all([
        fetchJsonSmart("cases.json"),
        fetchJsonSmart("exams.json")
      ]);

      CASES = Array.isArray(casesRaw) ? casesRaw : (casesRaw?.cases || []);
      EXAMS = normalizeExams(examsRaw);
      EXAMS_MAP = new Map(EXAMS.map(e => [e.id, e]));

      // segurança: se vier vazio, mantém jogável
      if (!Array.isArray(CASES) || !CASES.length) CASES = [];
      if (!Array.isArray(EXAMS) || !EXAMS.length) EXAMS = [];

    } catch (e) {
      // fallback mínimo para não travar
      CASES = [];
      EXAMS = [];
      EXAMS_MAP = new Map();
    }
  }

  // =========================
  // WIRES
  // =========================
  function bindHome() {
    $("btnNewGame")?.addEventListener("click", () => {
      clearSave();
      save();
      updateHud();
      const input = $("inputName");
      if (input) input.value = "";
      bindProfileAvatarGrid();
      showScreen("screenProfile");
    });

    $("btnContinue")?.addEventListener("click", () => {
      const ok = load();
      updateHud();
      if (ok && state.player.name) {
        showScreen("screenOffice");
      } else {
        bindProfileAvatarGrid();
        showScreen("screenProfile");
      }
    });
  }

  function bindProfile() {
    $("btnProfileBack")?.addEventListener("click", () => showScreen("screenHome"));

    $("btnStartFromProfile")?.addEventListener("click", () => {
      const name = ($("inputName")?.value || "").trim();
      if (!name) return alert("Digite seu nome para iniciar.");
      state.player.name = name;
      save();
      updateHud();
      showScreen("screenOffice");
    });
  }

  function bindOffice() {
    $("btnNextCase")?.addEventListener("click", () => {
      if (!CASES.length) return alert("cases.json não carregou ou está vazio.");
      if (!EXAMS.length) return alert("exams.json não carregou ou está vazio.");
      const c = pickNextCase();
      if (!c) return alert("Não foi possível selecionar um caso.");
      renderCase(c);
    });

    $("btnResetSave")?.addEventListener("click", () => {
      if (!confirm("Resetar progresso e pontuação?")) return;
      clearSave();
      save();
      updateHud();
      showScreen("screenHome");
    });
  }

  function bindCase() {
    $("btnBackOffice")?.addEventListener("click", () => {
      activeCase = null;
      showScreen("screenOffice");
    });

    $("btnFinalize")?.addEventListener("click", () => finalizeCase());
  }

  function bindResults() {
    $("btnResultsHome")?.addEventListener("click", () => showScreen("screenHome"));
    $("btnResultsOffice")?.addEventListener("click", () => showScreen("screenOffice"));
  }

  // =========================
  // BOOT
  // =========================
  async function boot() {
    bindTopbar();
    bindHome();
    bindProfile();
    bindOffice();
    bindCase();
    bindResults();

    load();
    updateHud();
    bindProfileAvatarGrid();

    await initData();

    showScreen("screenHome");
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
