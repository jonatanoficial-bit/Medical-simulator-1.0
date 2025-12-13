(() => {
  "use strict";

  const SAVE_KEY = "medical_simulator_save_v3";
  const CASES_URL = "cases.json";
  const EXAMS_URL = "exams.json";

  const $ = (id) => document.getElementById(id);
  const qsa = (sel) => Array.from(document.querySelectorAll(sel));
  const qs = (sel) => document.querySelector(sel);

  function showScreen(id){
    qsa(".screen").forEach(s => s.classList.remove("active"));
    $(id).classList.add("active");
    window.scrollTo(0,0);
  }

  function requestFullscreen(){
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(()=>{});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  }

  function typewriter(el, text, speed=14){
    el.textContent = "";
    let i = 0;
    const t = setInterval(() => {
      el.textContent += text[i] ?? "";
      i++;
      if (i >= text.length) clearInterval(t);
    }, speed);
  }

  // ===== State =====
  let state = {
    name: "",
    avatar: "",
    score: 0,
    casesResolved: 0,
    hits: 0,
    errors: 0,
    deaths: 0,
    rank: "Médico Residente",
    currentCaseId: null,
    usedExams: [],
    usedQuestions: []
  };

  function computeRank(score){
    if (score < 250) return "Médico Residente";
    if (score < 900) return "Médico Titular";
    return "Médico Pleno";
  }

  function saveGame(){
    state.rank = computeRank(state.score);
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }

  function loadGame(){
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      state = JSON.parse(raw);
      state.rank = computeRank(state.score || 0);
      return true;
    } catch {
      return false;
    }
  }

  function resetGame(){
    localStorage.removeItem(SAVE_KEY);
    state = {
      name: "",
      avatar: "",
      score: 0,
      casesResolved: 0,
      hits: 0,
      errors: 0,
      deaths: 0,
      rank: "Médico Residente",
      currentCaseId: null,
      usedExams: [],
      usedQuestions: []
    };
  }

  // ===== UI refs =====
  const btnHelp = $("btnHelp");
  const helpModal = $("helpModal");
  const btnHelpClose = $("btnHelpClose");

  const btnNew = $("btnNew");
  const btnContinue = $("btnContinue");

  const inputName = $("inputName");
  const avatarGrid = $("avatarGrid");
  const btnProfileNext = $("btnProfileNext");

  const briefingText = $("briefingText");
  const btnGoOffice = $("btnGoOffice");

  const hudAvatar = $("hudAvatar");
  const hudName = $("hudName");
  const hudRank = $("hudRank");
  const hudScore = $("hudScore");
  const hudCases = $("hudCases");
  const hudHits = $("hudHits");
  const hudErrors = $("hudErrors");
  const hudDeaths = $("hudDeaths");
  const hudPrestige = $("hudPrestige");
  const hudPrestigeTxt = $("hudPrestigeTxt");
  const hudPerf = $("hudPerf");
  const hudPerfTxt = $("hudPerfTxt");

  const btnNextCase = $("btnNextCase");
  const btnSave = $("btnSave");
  const btnReset = $("btnReset");

  const patientPhoto = $("patientPhoto");
  const patientName = $("patientName");
  const patientDemo = $("patientDemo");
  const patientTriage = $("patientTriage");
  const patientComplaint = $("patientComplaint");
  const patientHistory = $("patientHistory");
  const vitalsEl = $("vitals");

  const questionsEl = $("questions");
  const qaEl = $("qa");
  const examsEl = $("exams");
  const examResultsEl = $("examResults");
  const diagnosisEl = $("diagnosis");
  const medicationsEl = $("medications");

  const btnFinish = $("btnFinish");
  const btnBackOffice = $("btnBackOffice");

  const resultSummary = $("resultSummary");
  const resultDetail = $("resultDetail");
  const resultScore = $("resultScore");
  const btnResultOffice = $("btnResultOffice");

  // ===== Modal =====
  btnHelp.addEventListener("click", () => helpModal.classList.add("show"));
  btnHelpClose.addEventListener("click", () => helpModal.classList.remove("show"));
  helpModal.addEventListener("click", (e) => { if (e.target === helpModal) helpModal.classList.remove("show"); });

  function updateContinueButton(){
    btnContinue.style.display = localStorage.getItem(SAVE_KEY) ? "inline-block" : "none";
  }

  function updateHUD(){
    state.rank = computeRank(state.score);

    hudAvatar.src = state.avatar || "images/avatar1.png";
    hudName.textContent = state.name || "Médico(a)";
    hudRank.textContent = state.rank;

    hudScore.textContent = String(state.score || 0);
    hudCases.textContent = String(state.casesResolved || 0);
    hudHits.textContent = String(state.hits || 0);
    hudErrors.textContent = String(state.errors || 0);
    hudDeaths.textContent = String(state.deaths || 0);

    const prestige = Math.max(0, Math.min(100, Math.round((state.score || 0) / 14)));
    const total = (state.hits || 0) + (state.errors || 0) + (state.deaths || 0);
    const perf = total > 0 ? Math.max(0, Math.min(100, Math.round(((state.hits || 0) / total) * 100))) : 0;

    hudPrestige.style.width = prestige + "%";
    hudPrestigeTxt.textContent = prestige + "%";

    hudPerf.style.width = perf + "%";
    hudPerfTxt.textContent = perf + "%";
  }

  // ===== Data-driven content =====
  let EXAMS = null;
  let CASES = [];

  async function loadData(){
    const [examsResp, casesResp] = await Promise.all([
      fetch(EXAMS_URL, { cache: "no-store" }),
      fetch(CASES_URL, { cache: "no-store" })
    ]);
    if (!examsResp.ok) throw new Error("Falha ao carregar exams.json");
    if (!casesResp.ok) throw new Error("Falha ao carregar cases.json");

    EXAMS = await examsResp.json();
    const casesJson = await casesResp.json();

    if (!EXAMS?.exams?.length) throw new Error("exams.json inválido");
    if (!casesJson?.cases?.length) throw new Error("cases.json sem casos");

    CASES = casesJson.cases;
  }

  function tierAllowed(){
    const r = computeRank(state.score || 0);
    if (r === "Médico Residente") return "residente";
    if (r === "Médico Titular") return "titular";
    return "pleno";
  }

  function pickCase(){
    const tier = tierAllowed();
    const pool = CASES.filter(c => c.tier === tier);
    const finalPool = pool.length ? pool : CASES;
    return finalPool[Math.floor(Math.random() * finalPool.length)];
  }

  // ===== Exams (fixed buttons, case-specific result or normal fallback) =====
  function examLabel(examId){
    const e = EXAMS.exams.find(x => x.id === examId);
    return e ? e.label : examId;
  }

  function showExamResult(caseObj, examId){
    const map = caseObj.examResults || {};
    const found = map[examId];
    const fallback = EXAMS.normalFallback || { text: "Resultado normal simulado.", image: null };

    const text = (found?.text) ? found.text : fallback.text;
    const image = (found?.image ?? fallback.image);

    let html = `<div><strong>${examLabel(examId)}</strong> — ${text}</div>`;
    if (image) html += `<img class="exam-image" src="${image}" alt="${examLabel(examId)}">`;
    examResultsEl.innerHTML = html;
  }

  // ===== Render case =====
  function renderCase(c){
    state.currentCaseId = c.id;
    state.usedExams = [];
    state.usedQuestions = [];

    patientPhoto.src = c.patient.photo;
    patientName.textContent = c.patient.name;
    patientDemo.textContent = `${c.patient.age} anos • ${c.patient.sex}`;
    patientTriage.textContent = c.patient.triage;
    patientComplaint.textContent = c.complaint;
    patientHistory.textContent = c.history;
    vitalsEl.innerHTML = (c.vitals || []).map(v => `<div>• ${v}</div>`).join("");

    // Perguntas
    questionsEl.innerHTML = "";
    qaEl.textContent = "Selecione uma pergunta para ver a resposta.";
    (c.questions || []).forEach((qq, idx) => {
      const b = document.createElement("button");
      b.className = "chip";
      b.textContent = qq.label;
      b.addEventListener("click", () => {
        state.usedQuestions.push(idx);
        b.classList.add("used");
        qaEl.textContent = qq.answer;
      });
      questionsEl.appendChild(b);
    });

    // Exames fixos
    examsEl.innerHTML = "";
    examResultsEl.textContent = "Solicite exames para ver resultados.";
    EXAMS.exams.forEach((exm) => {
      const b = document.createElement("button");
      b.className = "chip";
      b.textContent = `${exm.label} • ${exm.time} min`;
      b.addEventListener("click", () => {
        if (!state.usedExams.includes(exm.id)) state.usedExams.push(exm.id);
        b.classList.add("used");
        showExamResult(c, exm.id);
      });
      examsEl.appendChild(b);
    });

    // Diagnóstico
    diagnosisEl.innerHTML = "";
    (c.diagnosis || []).forEach((d, i) => {
      const row = document.createElement("div");
      row.className = "opt";
      row.innerHTML = `
        <input type="radio" id="dx_${i}" name="dx" value="${i}">
        <label for="dx_${i}">
          <strong>${d.label}</strong>
          <small>Diagnóstico diferencial (simulado)</small>
        </label>
      `;
      diagnosisEl.appendChild(row);
    });

    // Medicações/condutas
    medicationsEl.innerHTML = "";
    (c.medications || []).forEach((m, i) => {
      const row = document.createElement("div");
      row.className = "opt";
      const tag = m.essential ? " (ESSENCIAL)" : (m.critical ? " (ERRO CRÍTICO)" : "");
      row.innerHTML = `
        <input type="checkbox" id="med_${i}" value="${i}">
        <label for="med_${i}">
          <strong>${m.label}${tag}</strong>
          <small>Impacto simulado • risco: ${m.risk}</small>
        </label>
      `;
      medicationsEl.appendChild(row);
    });
  }

  // ===== Scoring (AAA) =====
  function severityPenalty(sev){
    if (sev === "leve") return 20;
    if (sev === "grave") return 55;
    return 110; // crítico
  }
  function medPenalty(risk){
    if (risk === "baixa") return 12;
    if (risk === "media") return 30;
    return 65;
  }
  function tierBase(tier){
    if (tier === "pleno") return 160;
    if (tier === "titular") return 110;
    return 70;
  }

  function finishCase(){
    const c = CASES.find(x => x.id === state.currentCaseId);
    if (!c) return;

    const selectedDx = qs('input[name="dx"]:checked');
    if (!selectedDx){ alert("Selecione um diagnóstico."); return; }

    const dxPick = c.diagnosis[Number(selectedDx.value)];
    const medChecks = qsa('#medications input[type="checkbox"]:checked');
    const medsChosen = medChecks.map(ch => c.medications[Number(ch.value)]);

    let delta = 0;
    let death = false;

    const isRed = c.patient.triage === "Vermelho";

    // 1) Diagnóstico
    if (dxPick.correct){
      delta += tierBase(c.tier);
      state.hits += 1;
    } else {
      delta -= severityPenalty(dxPick.severity);
      state.errors += 1;
    }

    // 2) Exames (AAA)
    // - recommendedExams: se pedir -> +10
    // - essentialExams: se NÃO pedir -> -30 cada
    // - exame fora do contexto -> -12 cada (penaliza “atirar pra todo lado”)
    const rec = new Set([...(c.recommendedExams || [])]);
    const ess = new Set([...(c.essentialExams || [])]);
    const used = new Set([...(state.usedExams || [])]);

    used.forEach(exId => {
      if (rec.has(exId) || ess.has(exId)) delta += 10;
      else delta -= 12;
    });
    ess.forEach(exId => {
      if (!used.has(exId)) delta -= 30;
    });

    // 3) Medicações/condutas (AAA)
    // - corretas: +12
    // - erradas: - (por risco)
    // - erradas críticas: -120 e pode gerar óbito evitável em caso vermelho
    // - essenciais não feitas: -40 cada
    // - polifarmácia (excesso): acima de 4 escolhas -> -8 por item extra
    const essentialMeds = (c.medications || []).filter(m => m.essential);
    const chosenSet = new Set(medsChosen.map(m => m.label));

    medsChosen.forEach(m => {
      if (m.correct) delta += 12;
      else {
        let p = medPenalty(m.risk);
        if (m.critical) p += 120;
        delta -= p;
        if (isRed && m.critical) death = true;
      }
    });

    essentialMeds.forEach(m => {
      if (!chosenSet.has(m.label)) delta -= 40;
    });

    if (medsChosen.length > 4){
      delta -= (medsChosen.length - 4) * 8;
    }

    // 4) Óbito evitável (AAA)
    // - caso vermelho + dx errado + pontuação muito negativa => óbito
    if (isRed && !dxPick.correct && delta <= -140){
      death = true;
    }

    if (death){
      state.deaths += 1;
      // punição adicional para reforçar gravidade
      delta -= 80;
    }

    // Atualiza estado
    state.score += delta;
    state.casesResolved += 1;
    state.rank = computeRank(state.score);
    saveGame();
    updateHUD();

    // Resultado
    let summary = "Atendimento concluído";
    let detail = "Evolução simulada conforme suas decisões.";
    if (death){
      summary = "Óbito evitável";
      detail = "Erro crítico/atraso em cenário de alto risco (simulado).";
    } else if (dxPick.correct && delta >= 90){
      summary = "Atendimento bem-sucedido";
      detail = "Diagnóstico/conduta coerentes, com exames adequados (simulado).";
    } else if (dxPick.correct || delta > 0){
      summary = "Atendimento parcialmente correto";
      detail = "Houve acertos, mas com excesso/falta de exames ou conduta incompleta (simulado).";
    } else {
      summary = "Atendimento inadequado";
      detail = "Decisões incoerentes aumentaram risco de complicações (simulado).";
    }

    resultSummary.textContent = summary;
    resultDetail.textContent = detail;
    resultScore.textContent = `Caso: ${delta >= 0 ? "+" : ""}${delta} | Total: ${state.score} | Rank: ${state.rank}`;
    showScreen("screen-result");
  }

  // ===== Avatar selection =====
  let selectedAvatar = null;
  avatarGrid.addEventListener("click", (e) => {
    const btn = e.target.closest(".avatar-card");
    if (!btn) return;
    qsa(".avatar-card").forEach(x => x.classList.remove("selected"));
    btn.classList.add("selected");
    selectedAvatar = btn.getAttribute("data-avatar");
  });

  // ===== Buttons =====
  btnNew.addEventListener("click", () => {
    requestFullscreen();
    resetGame();
    updateContinueButton();
    showScreen("screen-profile");
  });

  btnContinue.addEventListener("click", () => {
    requestFullscreen();
    if (loadGame()){
      updateHUD();
      showScreen("screen-office");
    } else alert("Nenhum save encontrado.");
  });

  btnProfileNext.addEventListener("click", () => {
    requestFullscreen();
    const name = inputName.value.trim();
    if (!name) return alert("Digite seu nome.");
    if (!selectedAvatar) return alert("Selecione um avatar.");

    state.name = name;
    state.avatar = selectedAvatar;
    saveGame();
    updateContinueButton();

    const msg =
`Bem-vindo(a), ${state.name}.

Os exames ficam fixos e sempre disponíveis.
Pedir exame sem sentido retorna resultado normal e reduz pontuação.
As medicações/condutas incluem opções incorretas e erros críticos.

Assuma seu posto imediatamente.`;

    typewriter(briefingText, msg, 14);
    showScreen("screen-briefing");
  });

  btnGoOffice.addEventListener("click", () => { requestFullscreen(); updateHUD(); showScreen("screen-office"); });

  btnNextCase.addEventListener("click", () => {
    const c = pickCase();
    renderCase(c);
    showScreen("screen-case");
  });

  btnBackOffice.addEventListener("click", () => showScreen("screen-office"));
  btnFinish.addEventListener("click", finishCase);
  btnResultOffice.addEventListener("click", () => showScreen("screen-office"));

  btnSave.addEventListener("click", () => { saveGame(); alert("Jogo salvo."); });
  btnReset.addEventListener("click", () => {
    if (confirm("Resetar apagará seu progresso. Continuar?")){
      resetGame();
      updateContinueButton();
      showScreen("screen-start");
    }
  });

  // ===== Init =====
  (async () => {
    try{
      await loadData();
      updateContinueButton();
      updateHUD();
    } catch(err){
      console.error(err);
      alert("Erro ao carregar cases.json/exams.json. Verifique se os arquivos existem na raiz do projeto.");
    }
  })();
})();
