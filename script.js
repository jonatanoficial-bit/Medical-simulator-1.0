(() => {
  "use strict";

  const SAVE_KEY = "medical_simulator_save_v2";
  const CASES_URL = "cases.json";
  const EXAMS_URL = "exams.json";

  const $ = (id) => document.getElementById(id);
  const qsa = (sel) => Array.from(document.querySelectorAll(sel));
  const qs = (sel) => document.querySelector(sel);

  function showScreen(id){
    qsa(".screen").forEach(s => s.classList.remove("active"));
    const el = $(id);
    if (el) el.classList.add("active");
    window.scrollTo(0,0);
  }

  function requestFullscreen(){
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(()=>{});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  }

  function typewriter(el, text, speed=14){
    if (!el) return;
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
    if (score < 800) return "Médico Titular";
    return "Médico Pleno";
  }

  function saveGame(){
    state.rank = computeRank(state.score || 0);
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
  if (btnHelp && helpModal) btnHelp.addEventListener("click", () => helpModal.classList.add("show"));
  if (btnHelpClose && helpModal) btnHelpClose.addEventListener("click", () => helpModal.classList.remove("show"));
  if (helpModal) helpModal.addEventListener("click", (e) => { if (e.target === helpModal) helpModal.classList.remove("show"); });

  function updateContinueButton(){
    if (!btnContinue) return;
    btnContinue.style.display = localStorage.getItem(SAVE_KEY) ? "inline-block" : "none";
  }

  function updateHUD(){
    state.rank = computeRank(state.score || 0);

    if (hudAvatar) hudAvatar.src = state.avatar || "images/avatar1.png";
    if (hudName) hudName.textContent = state.name || "Médico(a)";
    if (hudRank) hudRank.textContent = state.rank;

    if (hudScore) hudScore.textContent = String(state.score || 0);
    if (hudCases) hudCases.textContent = String(state.casesResolved || 0);
    if (hudHits) hudHits.textContent = String(state.hits || 0);
    if (hudErrors) hudErrors.textContent = String(state.errors || 0);
    if (hudDeaths) hudDeaths.textContent = String(state.deaths || 0);

    const prestige = Math.max(0, Math.min(100, Math.round((state.score || 0) / 12)));
    const total = (state.hits || 0) + (state.errors || 0) + (state.deaths || 0);
    const perf = total > 0 ? Math.max(0, Math.min(100, Math.round(((state.hits || 0) / total) * 100))) : 0;

    if (hudPrestige) hudPrestige.style.width = prestige + "%";
    if (hudPrestigeTxt) hudPrestigeTxt.textContent = prestige + "%";

    if (hudPerf) hudPerf.style.width = perf + "%";
    if (hudPerfTxt) hudPerfTxt.textContent = perf + "%";
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

  // ===== Exam handling =====
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
    if (examResultsEl) examResultsEl.innerHTML = html;
  }

  // ===== Render case =====
  function renderCase(c){
    state.currentCaseId = c.id;
    state.usedExams = [];
    state.usedQuestions = [];

    if (patientPhoto) patientPhoto.src = c.patient.photo;
    if (patientName) patientName.textContent = c.patient.name;
    if (patientDemo) patientDemo.textContent = `${c.patient.age} anos • ${c.patient.sex}`;
    if (patientTriage) patientTriage.textContent = c.patient.triage;
    if (patientComplaint) patientComplaint.textContent = c.complaint;
    if (patientHistory) patientHistory.textContent = c.history;
    if (vitalsEl) vitalsEl.innerHTML = (c.vitals || []).map(v => `<div>• ${v}</div>`).join("");

    // Perguntas (por caso)
    if (questionsEl) questionsEl.innerHTML = "";
    if (qaEl) qaEl.textContent = "Selecione uma pergunta para ver a resposta.";
    (c.questions || []).forEach((qq, idx) => {
      const b = document.createElement("button");
      b.className = "chip";
      b.textContent = qq.label;
      b.addEventListener("click", () => {
        state.usedQuestions.push(idx);
        b.classList.add("used");
        if (qaEl) qaEl.textContent = qq.answer;
      });
      questionsEl?.appendChild(b);
    });

    // Exames (fixos do catálogo)
    if (examsEl) examsEl.innerHTML = "";
    if (examResultsEl) examResultsEl.textContent = "Solicite exames para ver resultados.";
    EXAMS.exams.forEach((exm) => {
      const b = document.createElement("button");
      b.className = "chip";
      b.textContent = `${exm.label} • ${exm.time} min`;
      b.addEventListener("click", () => {
        if (!state.usedExams.includes(exm.id)) state.usedExams.push(exm.id);
        b.classList.add("used");
        showExamResult(c, exm.id);
      });
      examsEl?.appendChild(b);
    });

    // Diagnóstico (radio)
    if (diagnosisEl) diagnosisEl.innerHTML = "";
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
      diagnosisEl?.appendChild(row);
    });

    // Condutas/Medicações (checkbox)
    if (medicationsEl) medicationsEl.innerHTML = "";
    (c.medications || []).forEach((m, i) => {
      const row = document.createElement("div");
      row.className = "opt";
      row.innerHTML = `
        <input type="checkbox" id="med_${i}" value="${i}">
        <label for="med_${i}">
          <strong>${m.label}</strong>
          <small>Impacto simulado • risco: ${m.risk}</small>
        </label>
      `;
      medicationsEl?.appendChild(row);
    });
  }

  // ===== Pontuação AAA (corrigida/mais difícil) =====
  function severityPenalty(sev){
    if (sev === "leve") return 18;
    if (sev === "grave") return 55;
    return 95; // crítico
  }

  function medPenalty(risk){
    if (risk === "baixa") return 12;
    if (risk === "media") return 30;
    return 70; // alta
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
    if (!selectedDx){
      alert("Selecione um diagnóstico.");
      return;
    }

    const dxPick = c.diagnosis[Number(selectedDx.value)];
    const medChecks = qsa('#medications input[type="checkbox"]:checked');
    const medsChosen = medChecks.map(ch => c.medications[Number(ch.value)]);

    const dxCorrect = !!dxPick.correct;
    const triage = c.patient.triage;
    const isRed = triage === "Vermelho";

    let delta = 0;
    let death = false;

    // 1) Diagnóstico (peso maior)
    if (dxCorrect){
      delta += tierBase(c.tier);
      state.hits += 1;
    } else {
      delta -= severityPenalty(dxPick.severity);
      state.errors += 1;
    }

    // 2) Exames (AAA)
    // - essentialExams: NÃO pedir => penalidade grande
    // - recommendedExams: pedir => bônus moderado
    // - pedir exame inútil => penalidade (com “normal”)
    const rec = new Set([...(c.recommendedExams || [])]);
    const ess = new Set([...(c.essentialExams || [])]);
    const used = new Set([...(state.usedExams || [])]);

    // penaliza exame inútil
    used.forEach(exId => {
      if (rec.has(exId) || ess.has(exId)) delta += 10;
      else delta -= 12;
    });

    // penaliza deixar de pedir essencial
    let missedEssential = 0;
    ess.forEach(exId => {
      if (!used.has(exId)) missedEssential++;
    });
    if (missedEssential > 0){
      delta -= (isRed ? 45 : 28) * missedEssential;
    }

    // 3) Condutas/Medicações (AAA)
    // - correto: +12
    // - incorreto: - (por risco)
    // - polifarmácia: se selecionar >5 condutas, -6 por extra
    // - erro crítico: med incorreta de risco ALTA em caso vermelho => penalidade extra
    let wrongCount = 0;
    let wrongHighRisk = false;

    medsChosen.forEach(m => {
      if (m.correct){
        delta += 12;
      } else {
        wrongCount++;
        const pen = medPenalty(m.risk);
        delta -= pen;
        if (m.risk === "alta") wrongHighRisk = true;
      }
    });

    // Polifarmácia / excesso de conduta
    if (medsChosen.length > 5){
      delta -= (medsChosen.length - 5) * 6;
    }

    // “Stack” de erros: se escolheu muita coisa errada, pune adicionalmente
    if (wrongCount >= 4) delta -= 18;
    if (wrongCount >= 6) delta -= 28;

    // Erro crítico em caso vermelho
    if (isRed && wrongHighRisk){
      delta -= 55;
    }

    // 4) Óbito evitável (determinístico e mais realista)
    // Condições típicas para óbito evitável:
    // - caso vermelho e (diagnóstico errado + erro crítico) OU (perdeu exame essencial + erro crítico) OU delta muito negativo
    if (isRed && (
      (!dxCorrect && wrongHighRisk) ||
      (missedEssential > 0 && wrongHighRisk) ||
      (delta <= -120)
    )){
      death = true;
      state.deaths += 1;
    }

    // Aplica resultado
    state.score += delta;
    state.casesResolved += 1;
    state.rank = computeRank(state.score);
    saveGame();
    updateHUD();

    // Tela de resultado
    let summary = "Atendimento concluído";
    let detail = "Evolução simulada conforme suas decisões.";

    if (death){
      summary = "Óbito evitável";
      detail = "Cenário crítico com erro grave/atraso e conduta inadequada (simulado).";
    } else if (dxCorrect && delta >= 90){
      summary = "Atendimento bem-sucedido";
      detail = "Diagnóstico correto, exames coerentes e conduta adequada (simulado).";
    } else if (dxCorrect || delta > 0){
      summary = "Atendimento parcialmente correto";
      detail = "Acertos com excesso de exames/condutas ou lacunas importantes (simulado).";
    } else {
      summary = "Atendimento inadequado";
      detail = "Decisões incoerentes aumentaram risco de complicações (simulado).";
    }

    if (resultSummary) resultSummary.textContent = summary;
    if (resultDetail) resultDetail.textContent = detail;
    if (resultScore) resultScore.textContent = `Caso: ${delta >= 0 ? "+" : ""}${delta} | Total: ${state.score} | Rank: ${state.rank}`;

    showScreen("screen-result");
  }

  // ===== Avatar selection =====
  let selectedAvatar = null;
  if (avatarGrid){
    avatarGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".avatar-card");
      if (!btn) return;
      qsa(".avatar-card").forEach(x => x.classList.remove("selected"));
      btn.classList.add("selected");
      selectedAvatar = btn.getAttribute("data-avatar");
    });
  }

  // ===== Buttons =====
  if (btnNew){
    btnNew.addEventListener("click", () => {
      requestFullscreen();
      resetGame();
      updateContinueButton();
      showScreen("screen-profile");
    });
  }

  if (btnContinue){
    btnContinue.addEventListener("click", () => {
      requestFullscreen();
      if (loadGame()){
        updateHUD();
        showScreen("screen-office");
      } else {
        alert("Nenhum save encontrado.");
      }
    });
  }

  if (btnProfileNext){
    btnProfileNext.addEventListener("click", () => {
      requestFullscreen();
      const name = inputName?.value?.trim() || "";
      if (!name) return alert("Digite seu nome.");
      if (!selectedAvatar) return alert("Selecione um avatar.");

      state.name = name;
      state.avatar = selectedAvatar;
      saveGame();
      updateContinueButton();

      const msg =
`Bem-vindo(a), ${state.name}.

Exames são fixos e sempre disponíveis.
Se você solicitar exames sem sentido para o caso, o resultado virá normal e isso reduzirá sua pontuação.
As condutas têm alternativas corretas e incorretas — e erros graves em casos críticos podem levar a óbito evitável (simulado).

Assuma seu posto agora.`;

      typewriter(briefingText, msg, 14);
      showScreen("screen-briefing");
    });
  }

  if (btnGoOffice){
    btnGoOffice.addEventListener("click", () => {
      requestFullscreen();
      updateHUD();
      showScreen("screen-office");
    });
  }

  if (btnNextCase){
    btnNextCase.addEventListener("click", () => {
      const c = pickCase();
      renderCase(c);
      showScreen("screen-case");
    });
  }

  if (btnBackOffice) btnBackOffice.addEventListener("click", () => showScreen("screen-office"));
  if (btnFinish) btnFinish.addEventListener("click", finishCase);
  if (btnResultOffice) btnResultOffice.addEventListener("click", () => showScreen("screen-office"));

  if (btnSave){
    btnSave.addEventListener("click", () => {
      saveGame();
      alert("Jogo salvo.");
    });
  }

  if (btnReset){
    btnReset.addEventListener("click", () => {
      if (confirm("Resetar apagará seu progresso. Continuar?")){
        resetGame();
        updateContinueButton();
        showScreen("screen-start");
      }
    });
  }

  // ===== Init =====
  (async () => {
    try {
      await loadData();
      updateContinueButton();
      updateHUD();
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar cases.json/exams.json. Verifique se os arquivos existem na raiz do projeto.");
    }
  })();
})();
