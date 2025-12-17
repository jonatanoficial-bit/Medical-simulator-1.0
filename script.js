/* =========================================================
   Emergency Doctor Simulator — script.js (FULL)
   - Fix: boot não trava botões
   - Fix: carregamento robusto de JSON (GitHub Pages/Vercel)
   - Fix: avatares/imagens com fallback e sem quebrar UI
   ========================================================= */

(() => {
  "use strict";

  // =========================
  // CONFIG / VERSÃO
  // =========================
  const APP_VERSION = "1.0.0-fixed-boot-json-paths";
  const STORAGE_KEY = "eds_save_v1";
  const RANKING_KEY = "eds_ranking_v1";

  // IMPORTANTÍSSIMO:
  // Ajuste os nomes aqui para os ARQUIVOS QUE EXISTEM no seu repo.
  // (O loader também tenta alguns alternativos automaticamente.)
  const DEFAULT_AVATARS = [
    "images/doctor_1.jpg",
    "images/doctor_2.jpg",
    "images/doctor_3.jpg",
    "images/doctor_4.jpg",
    "images/doctor_5.jpg",
    "images/doctor_6.jpg",
  ];

  const FALLBACK_PATIENT_MALE = "images/patient_male.jpg";
  const FALLBACK_PATIENT_FEMALE = "images/patient_female.jpg";

  // =========================
  // ESTADO
  // =========================
  const state = {
    doctor: {
      name: "",
      avatar: "",
      rank: "Interno",
    },
    stats: {
      points: 0,
      correct: 0,
      wrong: 0,
      cases: 0,
      shift: 0,
      streak: 0,
      bestStreak: 0,
    },
    data: {
      cases: [],
      exams: [],
    },
    gameplay: {
      currentCase: null,
      selectedExams: new Set(),
      shownQuestions: new Set(),
      selectedDiagnosis: null,
      selectedConduct: null, // (medications no JSON)
      results: [],
    },
    flags: {
      dataLoaded: false,
    },
  };

  // =========================
  // HELPERS
  // =========================
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function safeText(s) {
    return (s ?? "").toString();
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function getBasePath() {
    // Base do diretório onde o index está.
    // Ex: https://jonatanoficial-bit.github.io/Medical-simulator-1.0/
    // new URL('.', location.href) resolve corretamente.
    return new URL(".", window.location.href).toString();
  }

  function urlJoin(base, rel) {
    return new URL(rel, base).toString();
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // =========================
  // IMAGENS: fallback (não quebra UI)
  // =========================
  function attachImgFallback(imgEl, fallbackSrc) {
    if (!imgEl) return;
    imgEl.addEventListener(
      "error",
      () => {
        if (imgEl.dataset.fallbackApplied === "1") return;
        imgEl.dataset.fallbackApplied = "1";
        imgEl.src = fallbackSrc;
      },
      { once: true }
    );
  }

  function patientFallback(sex) {
    return sex === "Feminino" ? FALLBACK_PATIENT_FEMALE : FALLBACK_PATIENT_MALE;
  }

  // =========================
  // UI: telas
  // =========================
  function showScreen(name) {
    const screens = $$("[data-screen]");
    screens.forEach((el) => {
      el.classList.toggle("is-active", el.dataset.screen === name);
      el.style.display = el.dataset.screen === name ? "" : "none";
    });
  }

  function toast(msg) {
    // Se você tiver componente de toast no CSS, use.
    // Caso não, fallback em alert leve.
    console.log("[EDS]", msg);
  }

  // =========================
  // STORAGE
  // =========================
  function saveGame() {
    const payload = {
      version: APP_VERSION,
      savedAt: nowISO(),
      doctor: state.doctor,
      stats: state.stats,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function loadGame() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    try {
      const payload = JSON.parse(raw);
      if (!payload || typeof payload !== "object") return false;

      state.doctor = {
        name: safeText(payload.doctor?.name),
        avatar: safeText(payload.doctor?.avatar),
        rank: safeText(payload.doctor?.rank || "Interno"),
      };

      state.stats = {
        points: Number(payload.stats?.points || 0),
        correct: Number(payload.stats?.correct || 0),
        wrong: Number(payload.stats?.wrong || 0),
        cases: Number(payload.stats?.cases || 0),
        shift: Number(payload.stats?.shift || 0),
        streak: Number(payload.stats?.streak || 0),
        bestStreak: Number(payload.stats?.bestStreak || 0),
      };

      return true;
    } catch (e) {
      console.warn("loadGame parse error", e);
      return false;
    }
  }

  function resetSave() {
    localStorage.removeItem(STORAGE_KEY);
    // Mantém ranking (se quiser apagar ranking também, apague RANKING_KEY).
    state.doctor = { name: "", avatar: "", rank: "Interno" };
    state.stats = { points: 0, correct: 0, wrong: 0, cases: 0, shift: 0, streak: 0, bestStreak: 0 };
    state.gameplay = {
      currentCase: null,
      selectedExams: new Set(),
      shownQuestions: new Set(),
      selectedDiagnosis: null,
      selectedConduct: null,
      results: [],
    };
    updateOfficeHUD();
    showScreen("home");
  }

  // =========================
  // RANKING (local)
  // =========================
  function pushRankingEntry() {
    const entry = {
      name: state.doctor.name || "Sem nome",
      points: state.stats.points,
      correct: state.stats.correct,
      wrong: state.stats.wrong,
      cases: state.stats.cases,
      bestStreak: state.stats.bestStreak,
      at: nowISO(),
    };

    const raw = localStorage.getItem(RANKING_KEY);
    let list = [];
    try {
      list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];
    } catch {
      list = [];
    }

    list.push(entry);
    list.sort((a, b) => (b.points || 0) - (a.points || 0));
    list = list.slice(0, 50);

    localStorage.setItem(RANKING_KEY, JSON.stringify(list));
  }

  // =========================
  // JSON LOADER ROBUSTO
  // =========================
  async function loadJsonRobust(primaryName, alternates = []) {
    const base = getBasePath();

    // Estratégia: tentar:
    // 1) relativo ao base (./file)
    // 2) direto no base sem ./ (file)
    // 3) absoluto a partir do host (/file) — útil em Vercel
    // 4) (alternates) inclusive com espaços/parenteses
    const candidates = [];

    const addCandidate = (rel) => {
      // se rel já é URL absoluta, usa direto
      if (/^https?:\/\//i.test(rel)) {
        candidates.push(rel);
      } else {
        candidates.push(urlJoin(base, rel));
      }
    };

    addCandidate(`./${primaryName}`);
    addCandidate(primaryName);
    candidates.push(`${window.location.origin}/${primaryName}`); // absoluto no host

    alternates.forEach((a) => {
      addCandidate(`./${a}`);
      addCandidate(a);
      candidates.push(`${window.location.origin}/${a}`);
    });

    // remove duplicados
    const unique = Array.from(new Set(candidates));

    let lastErr = null;
    for (const url of unique) {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          lastErr = new Error(`HTTP ${res.status} @ ${url}`);
          continue;
        }
        const data = await res.json();
        return data;
      } catch (e) {
        lastErr = e;
      }
    }

    throw lastErr || new Error(`Falha ao carregar ${primaryName}`);
  }

  async function loadData() {
    // IMPORTANTÍSSIMO:
    // Se no seu repo os arquivos estão com nomes tipo "cases (8).json",
    // esta função ainda consegue carregar.
    const casesAlternates = [
      "cases (8).json",
      "cases (7).json",
      "cases (6).json",
      "cases.json",
    ];
    const examsAlternates = [
      "exams (2).json",
      "exams (1).json",
      "exams.json",
    ];

    const casesData = await loadJsonRobust("cases.json", casesAlternates);
    const examsData = await loadJsonRobust("exams.json", examsAlternates);

    // validações mínimas
    if (!Array.isArray(casesData)) throw new Error("cases.json inválido (esperado array).");
    if (!Array.isArray(examsData)) throw new Error("exams.json inválido (esperado array).");

    state.data.cases = casesData;
    state.data.exams = examsData;
    state.flags.dataLoaded = true;
  }

  // =========================
  // UI: HOME (Novo / Continuar)
  // =========================
  function bindHomeButtons() {
    const btnNew = $("#btnNewGame");
    const btnContinue = $("#btnContinue");

    if (btnNew) {
      btnNew.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Novo jogo sempre vai para profile, e limpa save
        localStorage.removeItem(STORAGE_KEY);
        state.doctor = { name: "", avatar: "", rank: "Interno" };
        state.stats = { points: 0, correct: 0, wrong: 0, cases: 0, shift: 0, streak: 0, bestStreak: 0 };
        state.gameplay = {
          currentCase: null,
          selectedExams: new Set(),
          shownQuestions: new Set(),
          selectedDiagnosis: null,
          selectedConduct: null,
          results: [],
        };
        updateOfficeHUD();
        renderProfileAvatars();
        showScreen("profile");
      });
    }

    if (btnContinue) {
      btnContinue.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const ok = loadGame();
        if (!ok) {
          toast("Sem save. Iniciando novo jogo.");
          renderProfileAvatars();
          showScreen("profile");
          return;
        }
        // Se tem save mas falta nome/avatar, volta profile
        if (!state.doctor.name || !state.doctor.avatar) {
          renderProfileAvatars();
          showScreen("profile");
          return;
        }
        updateOfficeHUD();
        showScreen("office");
      });
    }
  }

  // =========================
  // PROFILE (nome + avatar)
  // =========================
  function renderProfileAvatars() {
    const grid = $("#avatarGrid");
    if (!grid) return;

    grid.innerHTML = "";
    const avatars = DEFAULT_AVATARS;

    avatars.forEach((src, idx) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "avatar-card";
      card.dataset.avatar = src;

      const img = document.createElement("img");
      img.alt = `Avatar ${idx + 1}`;
      img.src = src;
      img.loading = "lazy";
      img.decoding = "async";
      attachImgFallback(img, "images/avatar_fallback.png"); // opcional (se existir)

      const label = document.createElement("div");
      label.className = "avatar-label";
      label.textContent = `Avatar ${idx + 1}`;

      card.appendChild(img);
      card.appendChild(label);

      card.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        $$(".avatar-card", grid).forEach((c) => c.classList.remove("is-selected"));
        card.classList.add("is-selected");
        state.doctor.avatar = src;
        updateProfileStartButton();
      });

      grid.appendChild(card);
    });

    // se já tinha avatar no state, marca
    if (state.doctor.avatar) {
      const sel = grid.querySelector(`.avatar-card[data-avatar="${CSS.escape(state.doctor.avatar)}"]`);
      if (sel) sel.classList.add("is-selected");
    }

    updateProfileStartButton();
  }

  function updateProfileStartButton() {
    const btnStart = $("#btnProfileStart");
    const name = $("#doctorName")?.value?.trim() || state.doctor.name.trim();
    const ok = Boolean(name) && Boolean(state.doctor.avatar);

    if (btnStart) {
      btnStart.disabled = !ok;
      btnStart.classList.toggle("is-disabled", !ok);
    }
  }

  function bindProfile() {
    const inputName = $("#doctorName");
    const btnStart = $("#btnProfileStart");
    const btnBack = $("#btnProfileBack");

    if (inputName) {
      inputName.addEventListener("input", () => {
        state.doctor.name = inputName.value.trim();
        updateProfileStartButton();
      });
    }

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
        const name = inputName?.value?.trim() || "";
        if (!name || !state.doctor.avatar) return;

        state.doctor.name = name;
        // rank inicial
        state.doctor.rank = "Interno";

        saveGame();
        updateOfficeHUD();
        showScreen("office");
      });
    }
  }

  // =========================
  // OFFICE (consultório)
  // =========================
  function updateOfficeHUD() {
    const elName = $("#hudName");
    const elRank = $("#hudRank");
    const elAvatar = $("#hudAvatar");

    if (elName) elName.textContent = state.doctor.name || "Doutor(a)";
    if (elRank) elRank.textContent = state.doctor.rank || "Interno";

    if (elAvatar && state.doctor.avatar) {
      elAvatar.src = state.doctor.avatar;
      attachImgFallback(elAvatar, "images/avatar_fallback.png"); // opcional
    }

    const map = {
      hudPoints: state.stats.points,
      hudCorrect: state.stats.correct,
      hudWrong: state.stats.wrong,
      hudCases: state.stats.cases,
      hudShift: state.stats.shift,
      hudStreak: state.stats.streak,
    };

    Object.entries(map).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(val);
    });
  }

  function bindOffice() {
    const btnNext = $("#btnNextCase");
    const btnReset = $("#btnResetSave");

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
        resetSave();
      });
    }
  }

  // =========================
  // CASE FLOW
  // =========================
  function pickCaseForRank() {
    // MVP: escolhe aleatório filtrando tier aproximado
    // tiers no seu JSON: residente / titular / pleno
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
    state.gameplay.shownQuestions = new Set();
    state.gameplay.selectedDiagnosis = null;
    state.gameplay.selectedConduct = null;
    state.gameplay.results = [];
  }

  function startNextCase() {
    if (!state.flags.dataLoaded) {
      // Mesmo sem dados, não trava UI (apenas avisa)
      alert("Dados ainda não carregaram. Verifique cases.json e exams.json no projeto.");
      return;
    }

    const c = pickCaseForRank();
    if (!c) {
      alert("Nenhum caso disponível.");
      return;
    }

    state.gameplay.currentCase = c;
    resetCaseSelections();

    renderCaseScreen();
    showScreen("case");
  }

  function renderCaseScreen() {
    const c = state.gameplay.currentCase;
    if (!c) return;

    // LEFT: patient
    const elPatientName = $("#casePatientName");
    const elPatientMeta = $("#casePatientMeta");
    const elPatientPhoto = $("#casePatientPhoto");
    const elTriage = $("#caseTriage");
    const elVitals = $("#caseVitals");
    const elComplaint = $("#caseComplaint");
    const elHistory = $("#caseHistory");

    if (elPatientName) elPatientName.textContent = safeText(c.patient?.name);
    if (elPatientMeta) elPatientMeta.textContent = `${c.patient?.age ?? "?"} anos • ${safeText(c.patient?.sex)}`;

    if (elPatientPhoto) {
      const src = safeText(c.patient?.photo) || patientFallback(c.patient?.sex);
      elPatientPhoto.src = src;
      attachImgFallback(elPatientPhoto, patientFallback(c.patient?.sex));
    }

    if (elTriage) {
      elTriage.textContent = `TRIAGEM ${safeText(c.patient?.triage || "N/A")}`;
      elTriage.dataset.level = safeText(c.patient?.triage || "").toLowerCase();
    }

    if (elVitals) {
      elVitals.innerHTML = "";
      (c.vitals || []).forEach((v) => {
        const li = document.createElement("li");
        li.textContent = v;
        elVitals.appendChild(li);
      });
    }

    if (elComplaint) elComplaint.textContent = safeText(c.complaint);
    if (elHistory) elHistory.textContent = safeText(c.history);

    // MID: questions + results
    renderQuestions();
    renderSelectedExamResults();
    renderExamPicker();
    bindCaseButtons();
  }

  function renderQuestions() {
    const c = state.gameplay.currentCase;
    const wrap = $("#questionsList");
    if (!wrap) return;

    wrap.innerHTML = "";
    (c.questions || []).forEach((q, idx) => {
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
      ans.textContent = safeText(q.answer);

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

  function renderExamPicker() {
    const list = $("#examList");
    const c = state.gameplay.currentCase;
    if (!list) return;

    list.innerHTML = "";

    // Mostra TODOS os exames do exams.json para o usuário escolher (como você pediu).
    state.data.exams.forEach((ex) => {
      const id = safeText(ex.id);
      const card = document.createElement("button");
      card.type = "button";
      card.className = "exam-card";
      card.dataset.examId = id;

      const name = document.createElement("div");
      name.className = "exam-name";
      name.textContent = safeText(ex.name);

      const meta = document.createElement("div");
      meta.className = "exam-meta";
      meta.textContent = `${safeText(ex.category)} • ${safeText(ex.time)}`;

      card.appendChild(name);
      card.appendChild(meta);

      const isSelected = state.gameplay.selectedExams.has(id);
      card.classList.toggle("is-selected", isSelected);

      card.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        // regra atual (MVP): até 3 exames
        if (state.gameplay.selectedExams.has(id)) {
          state.gameplay.selectedExams.delete(id);
        } else {
          if (state.gameplay.selectedExams.size >= 3) return;
          state.gameplay.selectedExams.add(id);
        }

        renderExamPicker();
        renderSelectedExamResults();
      });

      list.appendChild(card);
    });
  }

  function renderSelectedExamResults() {
    const c = state.gameplay.currentCase;
    const wrap = $("#examResults");
    if (!wrap) return;

    wrap.innerHTML = "";

    const selected = Array.from(state.gameplay.selectedExams);
    if (!selected.length) {
      wrap.textContent = "Nenhum exame solicitado ainda.";
      return;
    }

    selected.forEach((examId) => {
      const box = document.createElement("div");
      box.className = "exam-result";

      const h = document.createElement("div");
      h.className = "exam-result-title";
      const ex = state.data.exams.find((x) => x.id === examId);
      h.textContent = ex ? ex.name : examId;

      const result = c.examResults?.[examId];
      const p = document.createElement("div");
      p.className = "exam-result-text";

      if (result?.text) {
        p.textContent = result.text;
      } else {
        // exame fora do caso → "normal" (e pode tirar ponto)
        p.textContent = "Resultado: dentro da normalidade (simulado).";
      }

      box.appendChild(h);
      box.appendChild(p);

      if (result?.image) {
        const img = document.createElement("img");
        img.className = "exam-result-img";
        img.alt = "Imagem do exame";
        img.src = result.image;
        attachImgFallback(img, "images/exam_fallback.png"); // opcional
        box.appendChild(img);
      }

      wrap.appendChild(box);
    });
  }

  function bindCaseButtons() {
    const btnBack = $("#btnBackOffice");
    const btnFinalize = $("#btnFinalizeCase");

    if (btnBack) {
      btnBack.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        showScreen("office");
      };
    }

    if (btnFinalize) {
      btnFinalize.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        finalizeCase();
      };
    }
  }

  function finalizeCase() {
    const c = state.gameplay.currentCase;
    if (!c) return;

    // Pontuação: essencial certo +5, recomendado certo +2, exame desnecessário -2
    // Diagnóstico e conduta (medications) ainda entram em "results" screen no seu HTML,
    // mas aqui já computamos a base pelos exames (AAA step 0).
    let delta = 0;
    let criticalFail = false;

    const selected = Array.from(state.gameplay.selectedExams);

    const essential = new Set(c.essentialExams || []);
    const recommended = new Set(c.recommendedExams || []);

    // faltou essencial? penaliza
    essential.forEach((id) => {
      if (!selected.includes(id)) delta -= 3;
    });

    selected.forEach((id) => {
      if (essential.has(id)) delta += 5;
      else if (recommended.has(id)) delta += 2;
      else delta -= 2;
    });

    // (placeholder) se escolher algo “grave” errado futuramente => criticalFail = true

    // Atualiza stats
    state.stats.cases += 1;
    state.stats.shift += 1;

    if (delta > 0) {
      state.stats.correct += 1;
      state.stats.streak += 1;
      state.stats.bestStreak = Math.max(state.stats.bestStreak, state.stats.streak);
    } else {
      state.stats.wrong += 1;
      state.stats.streak = 0;
    }

    state.stats.points = Math.max(0, state.stats.points + delta);

    // Rank básico (placeholder) — você pediu progressão automática nos próximos upgrades.
    // MVP: sobe a cada 50 pontos.
    const p = state.stats.points;
    if (p >= 150) state.doctor.rank = "Pleno";
    else if (p >= 100) state.doctor.rank = "Titular";
    else if (p >= 50) state.doctor.rank = "Residente";
    else state.doctor.rank = "Interno";

    saveGame();
    updateOfficeHUD();

    // Ranking local
    pushRankingEntry();

    // Render results screen simples
    renderResultsScreen(delta, criticalFail);
    showScreen("results");
  }

  function renderResultsScreen(delta, criticalFail) {
    const c = state.gameplay.currentCase;
    const elTitle = $("#resultsTitle");
    const elSummary = $("#resultsSummary");
    const elDelta = $("#resultsDelta");

    if (elTitle) elTitle.textContent = "Resumo do Caso";
    if (elSummary) {
      const triage = safeText(c?.patient?.triage || "");
      elSummary.textContent =
        `Paciente: ${safeText(c?.patient?.name)} • Triagem: ${triage}\n` +
        `Escolhas de exames foram avaliadas (simulado).`;
    }
    if (elDelta) {
      elDelta.textContent = `Pontuação neste caso: ${delta >= 0 ? "+" : ""}${delta}`;
      elDelta.classList.toggle("is-bad", delta < 0 || criticalFail);
    }

    const btnNext = $("#btnResultsNext");
    const btnOffice = $("#btnResultsOffice");

    if (btnNext) {
      btnNext.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        startNextCase();
      };
    }

    if (btnOffice) {
      btnOffice.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        showScreen("office");
      };
    }
  }

  // =========================
  // FULLSCREEN + HELP + RANKING modal
  // =========================
  function bindTopBar() {
    const btnFS = $("#btnFullscreen");
    const btnHelp = $("#btnHelp");
    const btnRanking = $("#btnRanking");

    if (btnFS) {
      btnFS.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
          } else {
            await document.exitFullscreen();
          }
        } catch (err) {
          console.warn("fullscreen err", err);
        }
      });
    }

    if (btnHelp) {
      btnHelp.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        alert(
          "Emergency Doctor Simulator\n\n" +
            "• Jogo educacional (simulado)\n" +
            "• Escolha exames (até 3), finalize, e acompanhe pontuação.\n" +
            "• Futuras etapas: cronômetro/pressão/óbito, progressão, ranking online e PWA."
        );
      });
    }

    if (btnRanking) {
      btnRanking.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showRanking();
      });
    }
  }

  function showRanking() {
    const raw = localStorage.getItem(RANKING_KEY);
    let list = [];
    try {
      list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];
    } catch {
      list = [];
    }

    const top = list.slice(0, 10);
    const lines = top.map((x, i) => `${i + 1}. ${x.name} — ${x.points} pts (casos ${x.cases}, best ${x.bestStreak})`);
    alert("Ranking (local)\n\n" + (lines.join("\n") || "Sem dados ainda."));
  }

  // =========================
  // BOOT (NÃO TRAVA UI)
  // =========================
  async function boot() {
    // 1) Bind de UI primeiro (para botões funcionarem mesmo se JSON falhar)
    bindTopBar();
    bindHomeButtons();
    bindProfile();
    bindOffice();

    // Tenta carregar save (não obriga)
    loadGame();

    // 2) Render inicial
    renderProfileAvatars();
    updateOfficeHUD();
    showScreen("home");

    // 3) Carrega dados em paralelo — se falhar, não mata o app
    try {
      await loadData();
      console.log("[EDS] data loaded:", state.data.cases.length, "cases,", state.data.exams.length, "exams");
    } catch (e) {
      console.warn("Data load failed:", e);
      alert(
        "Erro ao carregar cases.json/exams.json.\n" +
          "Verifique se os arquivos existem na mesma pasta do index.html (root do projeto).\n\n" +
          "Dica: no GitHub Pages, eles devem estar em: /Medical-simulator-1.0/cases.json e /Medical-simulator-1.0/exams.json"
      );
      // NÃO retorna; mantém botões funcionando.
    }

    // 4) Atualiza botão continuar (habilita fluxo)
    // Se já tem save com doctor ok, pode deixar pronto para ir office
    // (mas a navegação continua pelo botão continuar)
  }

  // =========================
  // START
  // =========================
  document.addEventListener("DOMContentLoaded", () => {
    boot();
  });
})();
