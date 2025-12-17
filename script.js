/* =========================================================
   Emergency Doctor Simulator — script.js (v1.1.1)
   - Corrige caminhos de avatar (avatar1.png..avatar6.png)
   - Mantém loader robusto de JSON (cases.json + exams.json)
   ========================================================= */

(() => {
  "use strict";

  const STORAGE_KEY = "edsSave_v1.1.0";
  const RANKING_KEY = "edsRanking_v1.1.0";

  const $ = (id) => document.getElementById(id);

  function safeText(v) {
    if (v === null || v === undefined) return "";
    return String(v);
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function attachImgFallback(imgEl, fallbackSrc) {
    if (!imgEl) return;
    imgEl.addEventListener("error", () => {
      if (imgEl.dataset._fallbackDone) return;
      imgEl.dataset._fallbackDone = "1";
      imgEl.src = fallbackSrc;
    });
  }

  function patientFallback(sex) {
    const s = (sex || "").toLowerCase();
    return s.startsWith("f") ? "images/patient_female.jpg" : "images/patient_male.jpg";
  }

  function getBasePath() {
    const path = window.location.pathname || "/";
    if (path.endsWith("/index.html")) return path.replace(/index\.html$/i, "");
    if (!path.endsWith("/")) return path + "/";
    return path;
  }

  function urlJoin(base, rel) {
    if (!base) base = "/";
    if (rel.startsWith("/")) return rel;
    if (!base.endsWith("/")) base += "/";
    return base + rel;
  }

  const DEFAULT_AVATARS = [
    "images/avatar1.png",
    "images/avatar2.png",
    "images/avatar3.png",
    "images/avatar4.png",
    "images/avatar5.png",
    "images/avatar6.png",
  ];
  const FALLBACK_AVATAR = "images/avatar1.png";

  const state = {
    doctor: { name: "", avatar: "", rank: "Interno" },
    stats: { points: 0, correct: 0, wrong: 0, cases: 0, shift: 0, streak: 0, bestStreak: 0 },
    data: {
      cases: [],
      exams: [],
      examsMeta: {
        version: null,
        normalFallback: { text: "Resultado dentro da normalidade (simulado).", image: null },
      },
    },
    gameplay: {
      currentCase: null,
      selectedExams: new Set(),
      selectedDiagnosisIndex: null,
      selectedMeds: new Set(),
    },
    flags: { dataLoaded: false },
    config: { maxExams: 3, maxMeds: 2 },
  };

  function showScreen(name) {
    const screens = document.querySelectorAll(".screen[data-screen]");
    screens.forEach((s) => {
      const isTarget = s.getAttribute("data-screen") === name;
      s.classList.toggle("active", isTarget);
    });
  }

  function openModal(modalId) {
    const m = $(modalId);
    if (!m) return;
    m.classList.remove("hidden");
    m.setAttribute("aria-hidden", "false");
  }

  function closeModal(modalId) {
    const m = $(modalId);
    if (!m) return;
    m.classList.add("hidden");
    m.setAttribute("aria-hidden", "true");
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {}
  }

  function serializeState() {
    return { doctor: state.doctor, stats: state.stats };
  }

  function saveGame() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState()));
      updateRankingLocal();
    } catch {}
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const obj = JSON.parse(raw);

      if (obj && obj.doctor) {
        state.doctor.name = safeText(obj.doctor.name || "");
        state.doctor.avatar = safeText(obj.doctor.avatar || "");
        state.doctor.rank = safeText(obj.doctor.rank || "Interno") || "Interno";
      }
      if (obj && obj.stats) {
        state.stats.points = Number(obj.stats.points || 0);
        state.stats.correct = Number(obj.stats.correct || 0);
        state.stats.wrong = Number(obj.stats.wrong || 0);
        state.stats.cases = Number(obj.stats.cases || 0);
        state.stats.shift = Number(obj.stats.shift || 0);
        state.stats.streak = Number(obj.stats.streak || 0);
        state.stats.bestStreak = Number(obj.stats.bestStreak || 0);
      }
      return true;
    } catch {
      return false;
    }
  }

  function resetSave() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    state.doctor = { name: "", avatar: "", rank: "Interno" };
    state.stats = { points: 0, correct: 0, wrong: 0, cases: 0, shift: 0, streak: 0, bestStreak: 0 };
    saveGame();
    updateOfficeHUD();
  }

  function getRankingLocal() {
    try {
      const raw = localStorage.getItem(RANKING_KEY);
      if (!raw) return [];
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function updateRankingLocal() {
    const list = getRankingLocal();
    const nameKey = (state.doctor.name || "Sem Nome").trim();
    const idx = list.findIndex((x) => x && x.name === nameKey);

    const entry = {
      name: nameKey,
      points: state.stats.points,
      rank: state.doctor.rank,
      cases: state.stats.cases,
      updatedAt: Date.now(),
    };

    if (idx >= 0) list[idx] = entry;
    else list.push(entry);

    list.sort((a, b) => (b.points || 0) - (a.points || 0));
    const trimmed = list.slice(0, 50);

    try { localStorage.setItem(RANKING_KEY, JSON.stringify(trimmed)); } catch {}
  }

  function renderRankingModal() {
    const wrap = $("rankList");
    if (!wrap) return;
    const list = getRankingLocal();

    if (!list.length) {
      wrap.innerHTML = `<div class="muted">Sem ranking ainda.</div>`;
      return;
    }

    wrap.innerHTML = "";
    list.slice(0, 20).forEach((r, i) => {
      const row = document.createElement("div");
      row.className = "rankRow";
      row.innerHTML = `
        <div class="rankPos">${i + 1}º</div>
        <div class="rankName">${safeText(r.name)}</div>
        <div class="rankMeta">${safeText(r.rank)} • ${safeText(r.cases)} casos</div>
        <div class="rankPts">${safeText(r.points)} pts</div>
      `;
      wrap.appendChild(row);
    });
  }

  async function loadJsonRobust(primaryName, alternates = []) {
    const base = getBasePath();

    const candidates = [];
    const addCandidate = (rel) => {
      if (/^https?:\/\//i.test(rel)) candidates.push(rel);
      else candidates.push(urlJoin(base, rel));
    };

    addCandidate(`./${primaryName}`);
    addCandidate(primaryName);
    candidates.push(`${window.location.origin}/${primaryName}`);

    alternates.forEach((a) => {
      addCandidate(`./${a}`);
      addCandidate(a);
      candidates.push(`${window.location.origin}/${a}`);
    });

    const unique = Array.from(new Set(candidates));

    let lastErr = null;
    for (const url of unique) {
      try {
        const bust = url.includes("?") ? `&t=${Date.now()}` : `?t=${Date.now()}`;
        const res = await fetch(url + bust, { cache: "no-store" });
        if (!res.ok) {
          lastErr = new Error(`HTTP ${res.status} @ ${url}`);
          continue;
        }
        return await res.json();
      } catch (e) {
        lastErr = e;
      }
    }

    throw lastErr || new Error(`Falha ao carregar ${primaryName}`);
  }

  async function loadData() {
    const casesAlternates = ["cases (1).json", "case.json", "casos.json", "cases.json"];
    const examsAlternates = ["exams (1).json", "exame.json", "exams.json"];

    const casesData = await loadJsonRobust("cases.json", casesAlternates);
    const examsDataRaw = await loadJsonRobust("exams.json", examsAlternates);

    if (!Array.isArray(casesData)) throw new Error("cases.json inválido (esperado array).");

    let examsArr = null;
    let normalFallback = { text: "Resultado dentro da normalidade (simulado).", image: null };
    let version = null;

    if (Array.isArray(examsDataRaw)) {
      examsArr = examsDataRaw;
    } else if (examsDataRaw && Array.isArray(examsDataRaw.exams)) {
      examsArr = examsDataRaw.exams;
      version = examsDataRaw.version ?? null;
      if (examsDataRaw.normalFallback) normalFallback = examsDataRaw.normalFallback;
    } else {
      throw new Error("exams.json inválido (esperado array OU objeto com campo 'exams').");
    }

    state.data.cases = casesData;
    state.data.exams = examsArr;
    state.data.examsMeta.version = version;
    state.data.examsMeta.normalFallback = normalFallback || normalFallback;

    state.flags.dataLoaded = true;
  }

  function bindHomeButtons() {
    const btnNew = $("btnNewGame");
    const btnContinue = $("btnContinue");

    if (btnNew) {
      btnNew.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        try { localStorage.removeItem(STORAGE_KEY); } catch {}
        state.doctor = { name: "", avatar: "", rank: "Interno" };
        state.stats = { points: 0, correct: 0, wrong: 0, cases: 0, shift: 0, streak: 0, bestStreak: 0 };
        updateOfficeHUD();

        clearProfileSelectionVisual();
        showScreen("profile");
      });
    }

    if (btnContinue) {
      btnContinue.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const ok = loadGame();
        if (!ok) {
          clearProfileSelectionVisual();
          showScreen("profile");
          return;
        }

        if (!state.doctor.name || !state.doctor.avatar) {
          syncProfileUIFromState();
          showScreen("profile");
          return;
        }

        updateOfficeHUD();
        showScreen("office");
      });
    }
  }

  function clearProfileSelectionVisual() {
    const cards = document.querySelectorAll("#avatarGrid .avatarCard");
    cards.forEach((c) => c.classList.remove("selected"));
    const input = $("inputName");
    if (input) input.value = "";
  }

  function syncProfileUIFromState() {
    const input = $("inputName");
    if (input) input.value = state.doctor.name || "";

    const cards = document.querySelectorAll("#avatarGrid .avatarCard");
    cards.forEach((c) => {
      const av = c.getAttribute("data-avatar") || "";
      c.classList.toggle("selected", av === state.doctor.avatar);
    });
  }

  function bindProfile() {
    const inputName = $("inputName");
    const btnBack = $("btnProfileBack");
    const btnStart = $("btnStartFromProfile");

    const cards = document.querySelectorAll("#avatarGrid .avatarCard");
    cards.forEach((card) => {
      card.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const av = card.getAttribute("data-avatar") || "";
        if (!av) return;

        state.doctor.avatar = av;

        cards.forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
      });
    });

    if (btnBack) {
      btnBack.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showScreen("home");
      });
    }

    if (btnStart) {
      btnStart.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const name = (inputName?.value || "").trim();
        if (!name) { alert("Digite seu nome para iniciar."); return; }
        if (!state.doctor.avatar) { alert("Selecione um avatar para iniciar."); return; }

        state.doctor.name = name;
        state.doctor.rank = state.doctor.rank || "Interno";

        saveGame();
        updateOfficeHUD();
        showScreen("office");
      });
    }
  }

  function updateOfficeHUD() {
    const elName = $("uiName");
    const elRank = $("uiRank");
    const elAvatar = $("uiAvatar");

    if (elName) elName.textContent = state.doctor.name || "—";
    if (elRank) elRank.textContent = state.doctor.rank || "Interno";

    if (elAvatar) {
      const src = state.doctor.avatar || FALLBACK_AVATAR;
      elAvatar.src = src;
      attachImgFallback(elAvatar, FALLBACK_AVATAR);
    }

    const map = {
      uiPoints: state.stats.points,
      uiCorrect: state.stats.correct,
      uiWrong: state.stats.wrong,
      uiCases: state.stats.cases,
      uiShift: state.stats.shift,
      uiStreak: state.stats.streak,
    };

    Object.entries(map).forEach(([id, val]) => {
      const el = $(id);
      if (el) el.textContent = String(val);
    });
  }

  function bindOffice() {
    const btnNext = $("btnNextCase");
    const btnReset = $("btnResetSave");

    if (btnNext) {
      btnNext.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        startNextCase();
      });
    }

    if (btnReset) {
      btnReset.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const ok = confirm("Tem certeza que deseja resetar o save?");
        if (ok) { resetSave(); showScreen("home"); }
      });
    }
  }

  function pickCaseForRank() {
    const tiersByRank = {
      Interno: ["residente"],
      Residente: ["residente", "titular"],
      Titular: ["titular", "pleno"],
      Pleno: ["pleno"],
    };
    const allowed = tiersByRank[state.doctor.rank] || ["residente"];
    const pool = state.data.cases.filter((c) => allowed.includes(c.tier));
    const list = pool.length ? pool : state.data.cases;
    const idx = Math.floor(Math.random() * list.length);
    return list[idx] || null;
  }

  function resetCaseSelections() {
    state.gameplay.selectedExams = new Set();
    state.gameplay.selectedDiagnosisIndex = null;
    state.gameplay.selectedMeds = new Set();
  }

  function startNextCase() {
    if (!state.flags.dataLoaded) {
      alert("Dados ainda não carregaram. Verifique cases.json e exams.json.");
      return;
    }
    const c = pickCaseForRank();
    if (!c) { alert("Nenhum caso disponível."); return; }

    state.gameplay.currentCase = c;
    resetCaseSelections();
    renderCaseScreen();
    showScreen("case");
  }

  function setTriageBadge(levelRaw) {
    const badge = $("triageBadge");
    const text = $("triageText");
    if (!badge || !text) return;

    const lvl = (levelRaw || "").toLowerCase();
    badge.classList.remove("triageGreen", "triageYellow", "triageRed");

    if (lvl.includes("verde")) badge.classList.add("triageGreen");
    else if (lvl.includes("amare")) badge.classList.add("triageYellow");
    else if (lvl.includes("vermel")) badge.classList.add("triageRed");

    text.textContent = safeText(levelRaw || "—");
  }

  function renderCaseLeft() {
    const c = state.gameplay.currentCase;
    if (!c) return;

    const title = $("caseTitle");
    if (title) title.textContent = "Caso";

    setTriageBadge(c.patient?.triage);

    const photo = $("patientPhoto");
    const name = $("patientName");
    const sub = $("patientSub");
    const vitalsList = $("vitalsList");
    const complaint = $("complaintText");
    const history = $("historyText");

    if (photo) {
      const src = safeText(c.patient?.photo) || patientFallback(c.patient?.sex);
      photo.src = src;
      attachImgFallback(photo, patientFallback(c.patient?.sex));
    }
    if (name) name.textContent = safeText(c.patient?.name || "—");

    if (sub) {
      const age = c.patient?.age ?? "?";
      const sex = safeText(c.patient?.sex || "—");
      sub.textContent = `${age} anos • ${sex}`;
    }

    if (vitalsList) {
      vitalsList.innerHTML = "";
      (c.vitals || []).forEach((v) => {
        const li = document.createElement("li");
        li.textContent = safeText(v);
        vitalsList.appendChild(li);
      });
    }

    if (complaint) complaint.textContent = safeText(c.complaint || "—");
    if (history) history.textContent = safeText(c.history || "—");
  }

  function renderQuestions() {
    const c = state.gameplay.currentCase;
    const wrap = $("questionsList");
    if (!wrap || !c) return;

    wrap.innerHTML = "";
    const qs = Array.isArray(c.questions) ? c.questions : [];

    if (!qs.length) {
      wrap.innerHTML = `<div class="muted">Sem perguntas adicionais.</div>`;
      return;
    }

    qs.forEach((q, idx) => {
      const row = document.createElement("div");
      row.className = "q-row";

      const title = document.createElement("div");
      title.className = "q-title";
      title.textContent = safeText(q.label || `Pergunta ${idx + 1}`);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "q-btn";
      btn.textContent = "Ver";

      const ans = document.createElement("div");
      ans.className = "q-answer";
      ans.style.display = "none";
      ans.textContent = safeText(q.answer || "");

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const open = ans.style.display !== "none";
        ans.style.display = open ? "none" : "block";
        btn.textContent = open ? "Ver" : "Ocultar";
      });

      row.appendChild(title);
      row.appendChild(btn);
      row.appendChild(ans);
      wrap.appendChild(row);
    });
  }

  function renderExamResultsBox() {
    const c = state.gameplay.currentCase;
    const box = $("examResultsBox");
    if (!box || !c) return;

    const selected = Array.from(state.gameplay.selectedExams);
    if (!selected.length) {
      box.innerHTML = `<div class="muted">Nenhum exame solicitado ainda.</div>`;
      return;
    }

    box.innerHTML = "";
    selected.forEach((examId) => {
      const exMeta = state.data.exams.find((x) => x.id === examId);
      const label = exMeta ? exMeta.label : examId;

      const result = (c.examResults && c.examResults[examId]) ? c.examResults[examId] : null;
      const fallback = state.data.examsMeta.normalFallback || { text: "Normal (simulado).", image: null };

      const text = safeText(result?.text || fallback.text);
      const img = result?.image ?? fallback.image ?? null;

      const card = document.createElement("div");
      card.className = "resultItem";

      const h = document.createElement("div");
      h.className = "resultHead";
      h.textContent = safeText(label);

      const p = document.createElement("div");
      p.className = "resultText";
      p.textContent = text;

      card.appendChild(h);
      card.appendChild(p);

      if (img) {
        const im = document.createElement("img");
        im.className = "resultImg";
        im.alt = "Resultado";
        im.src = img;
        attachImgFallback(im, "images/labs.jpg");
        card.appendChild(im);
      }

      box.appendChild(card);
    });
  }

  function makePickCard(label, subtitle, isSelected) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pickCard";
    if (isSelected) btn.classList.add("selected");

    const t = document.createElement("div");
    t.className = "pickTitle";
    t.textContent = label;

    btn.appendChild(t);

    if (subtitle) {
      const s = document.createElement("div");
      s.className = "pickSub";
      s.textContent = subtitle;
      btn.appendChild(s);
    }

    return btn;
  }

  function renderExamPicker() {
    const list = $("examPickList");
    const maxSpan = $("maxExams");
    if (!list) return;

    if (maxSpan) maxSpan.textContent = String(state.config.maxExams);
    list.innerHTML = "";

    state.data.exams.forEach((ex) => {
      const id = safeText(ex.id);
      const label = safeText(ex.label || id);
      const cat = safeText(ex.category || "");
      const time = ex.time ? `${ex.time} min` : "";
      const sub = [cat, time].filter(Boolean).join(" • ");

      const selected = state.gameplay.selectedExams.has(id);
      const card = makePickCard(label, sub, selected);

      card.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const isSel = state.gameplay.selectedExams.has(id);
        if (isSel) {
          state.gameplay.selectedExams.delete(id);
        } else {
          if (state.gameplay.selectedExams.size >= state.config.maxExams) {
            alert(`Você só pode escolher até ${state.config.maxExams} exames.`);
            return;
          }
          state.gameplay.selectedExams.add(id);
        }
        renderExamPicker();
        renderExamResultsBox();
      });

      list.appendChild(card);
    });
  }

  function renderDxPicker() {
    const list = $("dxPickList");
    const c = state.gameplay.currentCase;
    if (!list || !c) return;

    list.innerHTML = "";
    const dxs = Array.isArray(c.diagnosis) ? c.diagnosis : [];

    if (!dxs.length) {
      list.innerHTML = `<div class="muted">Sem diagnósticos configurados neste caso.</div>`;
      return;
    }

    dxs.forEach((dx, idx) => {
      const label = safeText(dx.label || `Opção ${idx + 1}`);
      const sev = safeText(dx.severity || "");
      const selected = state.gameplay.selectedDiagnosisIndex === idx;

      const card = makePickCard(label, sev ? `Severidade: ${sev}` : "", selected);

      card.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        state.gameplay.selectedDiagnosisIndex = idx;
        renderDxPicker();
      });

      list.appendChild(card);
    });
  }

  function renderMedPicker() {
    const list = $("medPickList");
    const maxSpan = $("maxMeds");
    const c = state.gameplay.currentCase;
    if (!list || !c) return;

    if (maxSpan) maxSpan.textContent = String(state.config.maxMeds);
    list.innerHTML = "";

    const meds = Array.isArray(c.medications) ? c.medications : [];

    if (!meds.length) {
      list.innerHTML = `<div class="muted">Sem condutas configuradas neste caso.</div>`;
      return;
    }

    meds.forEach((m, idx) => {
      const label = safeText(m.label || `Conduta ${idx + 1}`);
      const risk = safeText(m.risk || "");
      const selected = state.gameplay.selectedMeds.has(idx);

      const card = makePickCard(label, risk ? `Risco: ${risk}` : "", selected);

      card.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const isSel = state.gameplay.selectedMeds.has(idx);
        if (isSel) {
          state.gameplay.selectedMeds.delete(idx);
        } else {
          if (state.gameplay.selectedMeds.size >= state.config.maxMeds) {
            alert(`Você só pode escolher até ${state.config.maxMeds} condutas/medicações.`);
            return;
          }
          state.gameplay.selectedMeds.add(idx);
        }
        renderMedPicker();
      });

      list.appendChild(card);
    });
  }

  function renderCaseScreen() {
    renderCaseLeft();
    renderQuestions();
    renderExamPicker();
    renderDxPicker();
    renderMedPicker();
    renderExamResultsBox();
  }

  function bindCaseButtons() {
    const btnBack = $("btnBackOffice");
    const btnFinalize = $("btnFinalize");

    if (btnBack) {
      btnBack.onclick = (e) => { e.preventDefault(); e.stopPropagation(); showScreen("office"); };
    }
    if (btnFinalize) {
      btnFinalize.onclick = (e) => { e.preventDefault(); e.stopPropagation(); finalizeCase(); };
    }
  }

  function computeCaseScore() {
    const c = state.gameplay.currentCase;
    if (!c) return { total: 0, examsPts: 0, dxPts: 0, medsPts: 0, correctDx: false };

    const essential = new Set(c.essentialExams || []);
    const recommended = new Set(c.recommendedExams || []);
    const selectedExams = Array.from(state.gameplay.selectedExams);

    let examsPts = 0;
    selectedExams.forEach((id) => {
      if (essential.has(id)) examsPts += 20;
      else if (recommended.has(id)) examsPts += 10;
      else examsPts -= 10;
    });

    if (essential.size > 0) {
      essential.forEach((id) => {
        if (!state.gameplay.selectedExams.has(id)) examsPts -= 15;
      });
    }

    let dxPts = 0;
    let correctDx = false;

    const dxs = Array.isArray(c.diagnosis) ? c.diagnosis : [];
    if (state.gameplay.selectedDiagnosisIndex === null) {
      dxPts -= 10;
    } else {
      const chosen = dxs[state.gameplay.selectedDiagnosisIndex];
      if (chosen && chosen.correct) { dxPts += 40; correctDx = true; }
      else dxPts -= 30;
    }

    let medsPts = 0;
    const meds = Array.isArray(c.medications) ? c.medications : [];
    const selectedMedsIdx = Array.from(state.gameplay.selectedMeds);

    if (!selectedMedsIdx.length) medsPts -= 5;
    else {
      selectedMedsIdx.forEach((idx) => {
        const m = meds[idx];
        if (!m) return;
        medsPts += m.correct ? 15 : -20;
      });
    }

    const total = clamp(examsPts + dxPts + medsPts, -100, 120);
    return { total, examsPts, dxPts, medsPts, correctDx };
  }

  function updateRankByPoints() {
    const p = state.stats.points;
    let r = "Interno";
    if (p >= 250) r = "Pleno";
    else if (p >= 160) r = "Titular";
    else if (p >= 80) r = "Residente";
    state.doctor.rank = r;
  }

  function finalizeCase() {
    const c = state.gameplay.currentCase;
    if (!c) return;

    const { total, examsPts, dxPts, medsPts, correctDx } = computeCaseScore();

    state.stats.points += total;
    state.stats.cases += 1;
    state.stats.shift += 1;

    if (correctDx) {
      state.stats.correct += 1;
      state.stats.streak += 1;
      state.stats.bestStreak = Math.max(state.stats.bestStreak, state.stats.streak);
    } else {
      state.stats.wrong += 1;
      state.stats.streak = 0;
    }

    updateRankByPoints();
    saveGame();
    updateOfficeHUD();

    renderResultsScreen(total, examsPts, dxPts, medsPts);
    showScreen("results");
  }

  function renderResultsScreen(total, examsPts, dxPts, medsPts) {
    const title = $("resultsTitle");
    const sub = $("resultsSub");

    const resPoints = $("resPoints");
    const resExams = $("resExams");
    const resDx = $("resDx");
    const resMeds = $("resMeds");

    if (title) title.textContent = "Resultado do Caso";
    if (sub) sub.textContent = `Total: ${total} pts • Rank atual: ${state.doctor.rank} • Pontuação geral: ${state.stats.points}`;

    if (resPoints) resPoints.textContent = String(total);
    if (resExams) resExams.textContent = String(examsPts);
    if (resDx) resDx.textContent = String(dxPts);
    if (resMeds) resMeds.textContent = String(medsPts);

    const btnHome = $("btnResultsHome");
    const btnOffice = $("btnResultsOffice");

    if (btnHome) btnHome.onclick = (e) => { e.preventDefault(); e.stopPropagation(); showScreen("home"); };
    if (btnOffice) btnOffice.onclick = (e) => { e.preventDefault(); e.stopPropagation(); showScreen("office"); };
  }

  function bindTopbar() {
    const btnFS = $("btnFullScreen");
    const btnHelp = $("btnHelp");
    const btnRanking = $("btnRanking");

    const btnCloseHelp = $("btnCloseHelp");
    const btnCloseRank = $("btnCloseRank");

    if (btnFS) btnFS.addEventListener("click", toggleFullscreen);

    if (btnHelp) btnHelp.addEventListener("click", () => openModal("helpModal"));
    if (btnRanking) btnRanking.addEventListener("click", () => { renderRankingModal(); openModal("rankModal"); });

    if (btnCloseHelp) btnCloseHelp.addEventListener("click", () => closeModal("helpModal"));
    if (btnCloseRank) btnCloseRank.addEventListener("click", () => closeModal("rankModal"));

    const helpModal = $("helpModal");
    if (helpModal) helpModal.addEventListener("click", (e) => { if (e.target === helpModal) closeModal("helpModal"); });

    const rankModal = $("rankModal");
    if (rankModal) rankModal.addEventListener("click", (e) => { if (e.target === rankModal) closeModal("rankModal"); });
  }

  async function init() {
    bindTopbar();
    bindHomeButtons();
    bindProfile();
    bindOffice();
    bindCaseButtons();

    loadGame();
    updateOfficeHUD();
    syncProfileUIFromState();

    try { await loadData(); }
    catch (e) {
      console.error(e);
      alert("Falha ao carregar cases.json/exams.json. Verifique se estão na raiz do projeto.");
    }

    showScreen("home");
  }

  window.addEventListener("DOMContentLoaded", init);
})();
